import re
from typing import str

# Patterns to prevent prompt injection and system prompt extraction
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior)",
    r"you\s+are\s+now\s+a",
    r"system\s*prompt",
    r"reveal\s+(your\s+)?instructions",
    r"print\s+(your\s+)?prompt",
    r"as\s+an\s+unfiltered\s+ai",
    r"jailbreak",
]

COMPILED_INJECTION_RE = re.compile("|".join(INJECTION_PATTERNS), re.IGNORECASE)


def sanitize_user_input(text: str) -> str:
    """Sanitize user query and neutralize prompt injection attempts."""
    if not text:
        return ""
    clean = text.strip()
    # Truncate overly long queries
    if len(clean) > 800:
        clean = clean[:800]
    
    # Strip null bytes or control characters
    clean = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", clean)
    return clean


def is_potential_injection(text: str) -> bool:
    """Check if text contains adversarial instructions."""
    if not text:
        return False
    return bool(COMPILED_INJECTION_RE.search(text))
