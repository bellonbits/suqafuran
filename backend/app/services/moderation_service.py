import re
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.fraud import FraudEvent, FraudTargetType
from app.services.security_service import security_service

class ModerationService:
    # Patterns to detect off-platform communication and common scam attempts
    PHONE_PATTERNS = [
        (r"(?:\+?254|0)[17]\d(?:[\s.-]?\d){7}", "kenyan_phone_number"),
        (r"zero\s*(?:seven|one)\s*(?:\d|\w)+", "obfuscated_phone_number"),
        (r"(?:\d[\s.-]?){9,13}", "generic_phone_digits"),
    ]

    OFF_PLATFORM_PATTERNS = [
        (r"wa\.me/\S+|chat\.whatsapp\.com/\S+", "whatsapp_link"),
        (r"t\.me/\S+|telegram\.me/\S+", "telegram_link"),
        (r"whatsapp", "whatsapp_mention"),
        (r"telegram", "telegram_mention"),
        (r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+", "external_link"),
    ]

    ADVANCE_PAY_PATTERNS = [
        (r"fare\s*(?:ya\s*kuja|first)", "advance_transport_fare"),
        (r"(?:send|tuma)\s*(?:deposit|advance|booking)", "advance_deposit_request"),
        (r"(?:pay|lipa)\s*(?:before|kwanza)", "upfront_payment_request"),
        (r"deliver(?:y)?\s*(?:fee|cash)\s*first", "advance_delivery_fee"),
        (r"mpesa\s*(?:kwanza|deposit|security)", "advance_mpesa_deposit"),
    ]

    SCAM_PATTERNS = ADVANCE_PAY_PATTERNS + OFF_PLATFORM_PATTERNS

    def analyze_message(self, db: Session, sender: User, content: str) -> Tuple[bool, str]:
        """
        Analyzes a message for off-platform leak and scam patterns.
        Returns (is_flagged, moderation_reason)
        """
        content_lower = content.lower()

        # 1. Check for phone number sharing attempts
        for pattern, reason in self.PHONE_PATTERNS:
            if re.search(pattern, content_lower):
                security_service.record_fraud_event(
                    db,
                    FraudTargetType.MESSAGE,
                    str(sender.id),
                    f"leak_{reason}",
                    risk_score=25,
                    confidence=0.9,
                    metadata={"content_snippet": content[:50]}
                )
                return True, "phone_number_sharing_restricted"

        # 2. Check for off-platform external links and social redirect
        for pattern, reason in self.OFF_PLATFORM_PATTERNS:
            if re.search(pattern, content_lower):
                security_service.record_fraud_event(
                    db,
                    FraudTargetType.MESSAGE,
                    str(sender.id),
                    f"leak_{reason}",
                    risk_score=25,
                    confidence=0.85,
                    metadata={"content_snippet": content[:50]}
                )
                return True, "off_platform_link_restricted"

        # 3. Check for advance payment / upfront deposit requests
        for pattern, reason in self.ADVANCE_PAY_PATTERNS:
            if re.search(pattern, content_lower):
                security_service.record_fraud_event(
                    db,
                    FraudTargetType.MESSAGE,
                    str(sender.id),
                    f"scam_{reason}",
                    risk_score=40,
                    confidence=0.95,
                    metadata={"content_snippet": content[:50]}
                )
                return True, "advance_payment_prohibited"

        return False, ""

    def analyze_listing(self, db: Session, owner: User, title: str, description: str, price: float) -> List[str]:
        """
        Analyzes a listing for common fraud signals.
        """
        flags = []
        
        # 1. Unrealistic Price Check (Heuristic: too low for title)
        # In a real system, this would use ML or historical averages
        if price < 10 and any(keyword in title.lower() for keyword in ["iphone", "toyota", "macbook", "land"]):
            flags.append("suspiciously_low_price")
            
        # 2. Description Content Analysis
        content = (title + " " + description).lower()
        for pattern, reason in self.SCAM_PATTERNS:
            if re.search(pattern, content):
                flags.append(f"suspicious_content_{reason}")
                
        if flags:
            security_service.record_fraud_event(
                db,
                FraudTargetType.LISTING,
                str(owner.id),
                "listing_fraud_signals",
                risk_score=len(flags) * 20,
                confidence=0.7,
                metadata={"flags": flags}
            )
            
        return flags

moderation_service = ModerationService()
