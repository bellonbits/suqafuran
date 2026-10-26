"""Best-effort account-security email alerts triggered from real request handlers."""

import base64
import datetime
import json
import logging
import re
from typing import Optional, Tuple, Dict
import urllib.request
from fastapi import Request, BackgroundTasks
from sqlmodel import Session, select
from app.models.user import User

logger = logging.getLogger(__name__)

# Common ISO 3166-1 alpha-2 country codes to human-readable names
COUNTRY_NAMES: Dict[str, str] = {
    "KE": "Kenya",
    "SO": "Somalia",
    "ET": "Ethiopia",
    "UG": "Uganda",
    "TZ": "Tanzania",
    "RW": "Rwanda",
    "DJ": "Djibouti",
    "AE": "United Arab Emirates",
    "SA": "Saudi Arabia",
    "US": "United States",
    "GB": "United Kingdom",
    "CA": "Canada",
    "DE": "Germany",
    "FR": "France",
    "TR": "Turkey",
    "ZA": "South Africa",
    "NG": "Nigeria",
    "EG": "Egypt",
    "IN": "India",
    "CN": "China",
    "QA": "Qatar",
    "OM": "Oman",
    "KW": "Kuwait",
    "BH": "Bahrain",
    "SE": "Sweden",
    "NO": "Norway",
    "NL": "Netherlands",
    "IT": "Italy",
    "ES": "Spain",
    "AU": "Australia",
}

# Common timezones to approximate geographic locations
TIMEZONE_LOCATIONS: Dict[str, str] = {
    "Africa/Nairobi": "Nairobi, Kenya",
    "Africa/Mogadishu": "Mogadishu, Somalia",
    "Africa/Addis_Ababa": "Addis Ababa, Ethiopia",
    "Africa/Kampala": "Kampala, Uganda",
    "Africa/Dar_es_Salaam": "Dar es Salaam, Tanzania",
    "Africa/Djibouti": "Djibouti",
    "Asia/Dubai": "Dubai, United Arab Emirates",
    "Asia/Riyadh": "Riyadh, Saudi Arabia",
    "Asia/Qatar": "Doha, Qatar",
    "Europe/London": "London, United Kingdom",
    "America/New_York": "New York, United States",
    "America/Chicago": "Chicago, United States",
    "America/Los_Angeles": "Los Angeles, United States",
    "America/Toronto": "Toronto, Canada",
    "Europe/Stockholm": "Stockholm, Sweden",
    "Europe/Amsterdam": "Amsterdam, Netherlands",
}

# In-memory IP geolocation cache to prevent repeated external lookups
_IP_GEO_CACHE: Dict[str, str] = {}


def is_private_ip(ip: Optional[str]) -> bool:
    """Check if an IP address belongs to private or loopback ranges."""
    if not ip:
        return True
    ip = ip.strip()
    if ip in ("127.0.0.1", "localhost", "::1", "0.0.0.0"):
        return True
    if ip.startswith("10.") or ip.startswith("192.168."):
        return True
    if ip.startswith("172."):
        try:
            second_octet = int(ip.split(".")[1])
            if 16 <= second_octet <= 31:
                return True
        except (IndexError, ValueError):
            pass
    return False


def get_real_client_ip(request: Request) -> Optional[str]:
    """Extract true client IP from Cloudflare, reverse proxy headers, or client socket."""
    # 1. Cloudflare edge header (highest fidelity when proxied)
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip and cf_ip.strip():
        return cf_ip.strip()

    # 2. X-Real-IP (forwarded by Nginx)
    real_ip = request.headers.get("x-real-ip")
    if real_ip and real_ip.strip():
        return real_ip.strip()

    # 3. X-Forwarded-For (first non-empty IP)
    xff = request.headers.get("x-forwarded-for")
    if xff and xff.strip():
        first_ip = xff.split(",")[0].strip()
        if first_ip:
            return first_ip

    # 4. Direct socket address
    if request.client and request.client.host:
        return request.client.host

    return None


def parse_user_agent_device(user_agent: Optional[str], fingerprint_b64: Optional[str] = None) -> str:
    """Parse raw User-Agent and device fingerprint into clean, human-readable description."""
    ua = user_agent or ""
    fp_meta = {}

    if fingerprint_b64:
        try:
            raw = base64.b64decode(fingerprint_b64).decode("utf-8", errors="ignore")
            fp_meta = json.loads(raw)
            if not ua and fp_meta.get("ua"):
                ua = fp_meta.get("ua")
        except Exception:
            pass

    if not ua or ua.strip().lower() in ("", "unknown", "unknown device"):
        plat = fp_meta.get("plat")
        if plat:
            return f"Web Browser on {plat}"
        return "Standard Web Browser"

    # Identify browser brand
    browser = "Web Browser"
    if "Edg/" in ua or "Edge/" in ua:
        browser = "Microsoft Edge"
    elif "OPR/" in ua or "Opera" in ua:
        browser = "Opera"
    elif "SamsungBrowser" in ua:
        browser = "Samsung Internet"
    elif "Brave" in ua:
        browser = "Brave Browser"
    elif "CriOS" in ua:
        browser = "Google Chrome (iOS)"
    elif "FxiOS" in ua:
        browser = "Mozilla Firefox (iOS)"
    elif "Chrome/" in ua and "Chromium" not in ua:
        browser = "Google Chrome"
    elif "Firefox/" in ua:
        browser = "Mozilla Firefox"
    elif "Safari/" in ua and "Chrome" not in ua and "Chromium" not in ua:
        browser = "Apple Safari"
    elif "Postman" in ua:
        browser = "Postman API Client"
    elif "curl" in ua:
        browser = "cURL"

    # Identify OS, device family, and form factor
    if "iPhone" in ua:
        return f"{browser} on Apple iPhone"
    elif "iPad" in ua:
        return f"{browser} on Apple iPad"
    elif "Android" in ua:
        model_match = re.search(r"\((Linux; Android [^;]+; ([^;)]+))\)", ua)
        if model_match and model_match.group(2).strip():
            raw_model = model_match.group(2).strip().split(" Build")[0].strip()
            return f"{browser} on {raw_model} (Android)"
        return f"{browser} on Android Device"
    elif "Macintosh" in ua or "Mac OS X" in ua:
        return f"{browser} on macOS (Mac Desktop)"
    elif "Windows NT 10.0" in ua or "Windows NT 11.0" in ua:
        return f"{browser} on Windows 10/11 (PC)"
    elif "Windows NT" in ua or "Windows" in ua:
        return f"{browser} on Windows PC"
    elif "Linux" in ua:
        return f"{browser} on Linux (Desktop)"
    elif "CrOS" in ua:
        return f"{browser} on Chromebook"

    return f"{browser} (Standard Client)"


def resolve_client_location(
    request: Request,
    ip: Optional[str] = None,
    user: Optional[User] = None,
    fingerprint_b64: Optional[str] = None
) -> str:
    """Resolve geographic location using Cloudflare edge headers, IP geo-lookup, or profile defaults."""
    # 1. Cloudflare edge geolocation headers (zero-latency edge data)
    cf_city = request.headers.get("cf-ipcity")
    cf_region = request.headers.get("cf-region")
    cf_country_code = request.headers.get("cf-ipcountry")

    if cf_city and cf_country_code:
        country_name = COUNTRY_NAMES.get(cf_country_code.upper(), cf_country_code.upper())
        city_clean = cf_city.strip()
        if cf_region and cf_region.strip() and cf_region.strip().lower() != city_clean.lower():
            return f"{city_clean}, {country_name}"
        return f"{city_clean}, {country_name}"

    if cf_country_code:
        country_name = COUNTRY_NAMES.get(cf_country_code.upper(), cf_country_code.upper())
        return country_name

    # 2. Timezone from client fingerprint or Cloudflare timezone header
    tz_from_fp = None
    if fingerprint_b64:
        try:
            raw = base64.b64decode(fingerprint_b64).decode("utf-8", errors="ignore")
            fp_data = json.loads(raw)
            tz_from_fp = fp_data.get("tz")
        except Exception:
            pass

    cf_tz = request.headers.get("cf-timezone") or tz_from_fp
    if cf_tz and cf_tz in TIMEZONE_LOCATIONS:
        return TIMEZONE_LOCATIONS[cf_tz]

    # 3. Fast cached IP geolocation lookup for public IPs
    target_ip = ip or get_real_client_ip(request)
    if target_ip and not is_private_ip(target_ip):
        if target_ip in _IP_GEO_CACHE:
            return _IP_GEO_CACHE[target_ip]

        try:
            url = f"http://ip-api.com/json/{target_ip}?fields=status,country,city,regionName"
            req = urllib.request.Request(url, headers={"User-Agent": "Suqafuran-LocationResolver/1.0"})
            with urllib.request.urlopen(req, timeout=1.2) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("status") == "success":
                    city = data.get("city")
                    country = data.get("country")
                    if city and country:
                        res = f"{city}, {country}"
                        _IP_GEO_CACHE[target_ip] = res
                        return res
                    elif country:
                        _IP_GEO_CACHE[target_ip] = country
                        return country
        except Exception as e:
            logger.debug(f"IP location lookup failed for {target_ip}: {e}")

    # 4. User profile saved location / market fallback
    if user:
        if user.location and user.location.strip():
            return user.location.strip()
        if user.market and user.market.strip():
            return f"{user.market.strip()}, Nairobi, Kenya"

    # 5. Local development fallback
    if is_private_ip(target_ip):
        return "Nairobi, Kenya"

    return "Unknown Location"


def _extract_client_signals(request: Request) -> Tuple[Optional[str], Optional[str], str]:
    ip = get_real_client_ip(request)
    fingerprint = request.headers.get("X-Device-Fingerprint")
    user_agent = request.headers.get("user-agent", "Unknown device")
    return ip, fingerprint, user_agent


def link_signup_device(db: Session, user: User, request: Request) -> None:
    """Record baseline device at registration to prevent false positives on first sign-in."""
    ip, fingerprint, user_agent = _extract_client_signals(request)
    if not fingerprint:
        return

    from app.services.security_service import security_service

    device_label = parse_user_agent_device(user_agent, fingerprint)
    location_label = resolve_client_location(request, ip=ip, user=user, fingerprint_b64=fingerprint)

    device = security_service.get_or_create_device(
        db,
        fingerprint,
        {
            "user_agent": user_agent,
            "device_label": device_label,
            "ip": ip,
            "location": location_label,
        }
    )
    security_service.link_user_to_device(db, user, device)


def notify_if_new_device(db: Session, user: User, request: Request, background_tasks: BackgroundTasks) -> None:
    """Alert the user when they sign in from an unrecognized device or location."""
    if not user.email or user.email.endswith("@suqafuran.local"):
        return

    ip, fingerprint, user_agent = _extract_client_signals(request)
    device_label = parse_user_agent_device(user_agent, fingerprint)
    location_label = resolve_client_location(request, ip=ip, user=user, fingerprint_b64=fingerprint)

    is_new_device = False

    if fingerprint:
        from app.models.device import UserDeviceLink
        from app.services.security_service import security_service

        device = security_service.get_or_create_device(
            db,
            fingerprint,
            {
                "user_agent": user_agent,
                "device_label": device_label,
                "ip": ip,
                "location": location_label,
            }
        )
        existing_link = db.exec(
            select(UserDeviceLink).where(
                UserDeviceLink.user_id == user.id,
                UserDeviceLink.device_id == device.id,
            )
        ).first()
        has_other_known_devices = db.exec(
            select(UserDeviceLink).where(UserDeviceLink.user_id == user.id)
        ).first() is not None

        if not existing_link and (has_other_known_devices or (user.last_ip and ip and user.last_ip != ip)):
            is_new_device = True

        security_service.link_user_to_device(db, user, device)
    elif user.last_ip and ip and user.last_ip != ip:
        # No fingerprint header on this request (unusual client) -- fall
        # back to a plain IP comparison against the last IP we saw.
        is_new_device = True

    if is_new_device and ip:
        from app.services.email_service import email_service

        timestamp = datetime.datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")
        background_tasks.add_task(
            email_service.send_new_device_login_alert,
            email=user.email,
            name=user.full_name or "Customer",
            device=device_label,
            location=location_label,
            timestamp=timestamp,
            ip=ip,
            user_id=user.id,
        )

    if ip and user.last_ip != ip:
        user.last_ip = ip
        db.add(user)
        db.commit()
