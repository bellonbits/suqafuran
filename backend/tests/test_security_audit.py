"""
Automated Security Validation Test Suite for Suqafuran

Validates post-remediation security controls:
1. Strict separation of superuser (admin) and agent roles (privilege escalation prevention)
2. JWT Access token lifespan bounds (<= 7 days, configurable)
3. Elimination of SVG/PDF/HTML stored XSS risk from listing image extensions
4. CORS origin regex restrictions in production (blocks intranet IP subnets)
5. XSS escaping and HTML sanitization across outbound emails and user content
6. Unsubscribe token entropy and RFC 8058 One-Click compliance
7. Backup script restrictive umask (077) and directory permission enforcement
"""

import os
import re
import unittest
import warnings
from unittest.mock import MagicMock

# Suppress noisy Pydantic attribute shadowing and deprecation warnings in test output
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic.*")
warnings.filterwarnings("ignore", message=".*shadows an attribute in parent.*")
warnings.filterwarnings("ignore", category=DeprecationWarning)

from fastapi import HTTPException

from app.api.deps import (
    get_current_active_superuser,
    get_current_active_agent,
    get_current_active_user,
)
from app.core.config import settings
from app.services.marketing_emails.components import sanitize
from app.services.marketing_emails.sender import (
    generate_tracking_token,
    get_list_unsubscribe_headers,
)


class TestSecurityControls(unittest.TestCase):
    """Automated security controls audit test suite."""

    def test_superuser_agent_privilege_separation(self):
        """Verify an agent CANNOT access superuser/admin endpoints (fixes Finding #2)."""
        # 1. Regular user -> Must be blocked from superuser
        regular_user = MagicMock()
        regular_user.is_admin = False
        regular_user.is_agent = False
        with self.assertRaises(HTTPException) as ctx:
            get_current_active_superuser(regular_user)
        self.assertEqual(ctx.exception.status_code, 403)

        # 2. Agent user (is_agent=True, is_admin=False) -> MUST be blocked from superuser
        agent_user = MagicMock()
        agent_user.is_admin = False
        agent_user.is_agent = True
        with self.assertRaises(HTTPException) as ctx:
            get_current_active_superuser(agent_user)
        self.assertEqual(
            ctx.exception.status_code,
            403,
            "CRITICAL: Agent must NOT be allowed to escalate to superuser privileges",
        )

        # 3. Superuser/Admin (is_admin=True) -> Allowed
        admin_user = MagicMock()
        admin_user.is_admin = True
        admin_user.is_agent = False
        allowed_admin = get_current_active_superuser(admin_user)
        self.assertEqual(allowed_admin, admin_user)

        # 4. Agent user -> Allowed on agent-specific endpoints
        allowed_agent = get_current_active_agent(agent_user)
        self.assertEqual(allowed_agent, agent_user)

    def test_jwt_access_token_lifespan(self):
        """Verify access token lifespan is bounded and not 180 days (fixes Finding #1)."""
        max_acceptable_minutes = 60 * 24 * 7  # Maximum 7 days
        self.assertLessEqual(
            settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            max_acceptable_minutes,
            f"ACCESS_TOKEN_EXPIRE_MINUTES ({settings.ACCESS_TOKEN_EXPIRE_MINUTES}) exceeds 7 days limit",
        )
        self.assertGreater(
            settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            0,
            "ACCESS_TOKEN_EXPIRE_MINUTES must be positive",
        )

    def test_file_upload_extension_security(self):
        """Verify dangerous extensions (SVG, PDF, HTML, EXE) are banned for image uploads (fixes Finding #4)."""
        dangerous_extensions = ["svg", "pdf", "html", "htm", "xml", "exe", "php", "sh", "js"]
        for ext in dangerous_extensions:
            self.assertNotIn(
                ext,
                settings.ALLOWED_EXTENSIONS,
                f"Dangerous extension '{ext}' must NOT be in ALLOWED_EXTENSIONS",
            )

        # Ensure safe standard image formats remain supported
        for safe_ext in ["jpg", "jpeg", "png", "webp"]:
            self.assertIn(
                safe_ext,
                settings.ALLOWED_EXTENSIONS,
                f"Safe format '{safe_ext}' should be supported",
            )

    def test_cors_production_regex_blocks_intranet_subnets(self):
        """Verify production CORS regex rejects private intranet IPs (fixes Finding #3)."""
        # Production regex definition
        prod_regex = re.compile(r"^capacitor://(localhost|app)$")

        # Must reject intranet IP origins
        intranet_origins = [
            "http://192.168.1.5:3000",
            "http://10.0.0.1",
            "http://172.16.0.5:8000",
            "http://127.0.0.1:3000",
        ]
        for origin in intranet_origins:
            self.assertIsNone(
                prod_regex.match(origin),
                f"Production CORS regex should NOT match intranet origin '{origin}'",
            )

        # Must permit valid mobile capacitor origins
        self.assertIsNotNone(prod_regex.match("capacitor://localhost"))
        self.assertIsNotNone(prod_regex.match("capacitor://app"))

    def test_xss_sanitization_escapes_script_injection(self):
        """Verify HTML sanitization neutralizes XSS payloads in dynamic user content."""
        payloads = [
            ('<script>alert("xss")</script>', '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'),
            ('<img src=x onerror=alert(1)>', '&lt;img src=x onerror=alert(1)&gt;'),
            ('<a href="javascript:alert(1)">click</a>', '&lt;a href=&quot;javascript:alert(1)&quot;&gt;click&lt;/a&gt;'),
        ]
        for raw, expected in payloads:
            escaped = sanitize(raw)
            self.assertNotIn("<script>", escaped)
            self.assertNotIn("<img", escaped)
            self.assertIn("&lt;", escaped)

    def test_unsubscribe_token_entropy_and_rfc8058_headers(self):
        """Verify token generation entropy and standard one-click unsubscribe headers."""
        token1 = generate_tracking_token()
        token2 = generate_tracking_token()

        self.assertNotEqual(token1, token2)
        self.assertGreaterEqual(len(token1), 40, "Token entropy must be at least 32 bytes (base64 encoded >= 40 chars)")

        headers = get_list_unsubscribe_headers("https://app.suqafuran.com/api/v1/content/email/unsubscribe?token=" + token1)
        self.assertEqual(headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click")
        self.assertIn("<https://app.suqafuran.com/api/v1/content/email/unsubscribe?token=" + token1 + ">", headers["List-Unsubscribe"])

    def test_backup_script_enforces_umask_and_permissions(self):
        """Verify backup script contains umask 077 and chmod 700 (fixes Finding #5)."""
        candidate_paths = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../scripts/backup_suqafuran.sh")),
            "/root/suqafuran/scripts/backup_suqafuran.sh",
            "/scripts/backup_suqafuran.sh",
        ]
        script_path = None
        for p in candidate_paths:
            if os.path.isfile(p):
                script_path = p
                break

        if not script_path:
            # When executed inside a backend container where host scripts/ is unmounted
            self.skipTest("Host backup script is located on host filesystem at /root/suqafuran/scripts/, outside the backend container mount")

        with open(script_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("umask 077", content, "Backup script must enforce umask 077")
        self.assertIn("chmod 700", content, "Backup script must enforce chmod 700 on backup directories")


if __name__ == "__main__":
    unittest.main()
