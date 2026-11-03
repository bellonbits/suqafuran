"""
3-Tier AI-Assisted Moderation and Fraud Detection Pipeline.

Classifies listings into:
- LOW_RISK (< 25): Eligible for automatic approval.
- MEDIUM_RISK (25 - 69): Held in pending queue for human moderator review.
- HIGH_RISK (>= 70): Quarantined on hold; requires human investigation.
"""

import enum
import re
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
from sqlmodel import Session, select, func
from app.models.listing import Listing
from app.models.user import User, UserVerifiedLevel
from app.models.report import ListingReport
from app.models.fraud import FraudEvent, FraudTargetType
from app.services.storage_service import calculate_phash


class ModerationDecisionTier(str, enum.Enum):
    LOW_RISK = "LOW_RISK"
    MEDIUM_RISK = "MEDIUM_RISK"
    HIGH_RISK = "HIGH_RISK"


# Patterns for prohibited goods, advance fee scams, and off-platform evasion
PROHIBITED_PATTERNS = [
    (r"\b(gun|firearm|ammo|ammunition|explosive|weapon)\b", "weapons_or_firearms"),
    (r"\b(counterfeit|fake\s*currency|replica\s*passport|fake\s*id)\b", "counterfeit_or_forgery"),
    (r"\b(cocaine|heroin|bhang|cannabis|weed|tramadol|prescription\s*drugs)\b", "illicit_substances"),
    (r"\b(stolen|lost\s*and\s*found\s*iphone|icloud\s*locked|bypass\s*icloud)\b", "potentially_stolen_goods"),
]

OFF_PLATFORM_PATTERNS = [
    (r"wa\.me/\S+|chat\.whatsapp\.com/\S+", "whatsapp_link"),
    (r"t\.me/\S+|telegram\.me/\S+", "telegram_link"),
    (r"http[s]?://\S+", "external_link"),
]

ADVANCE_DEPOSIT_PATTERNS = [
    (r"fare\s*(?:ya\s*kuja|first)", "advance_transport_fare"),
    (r"(?:send|tuma)\s*(?:deposit|advance|booking)", "advance_deposit_request"),
    (r"(?:pay|lipa)\s*(?:before|kwanza)", "upfront_payment_request"),
    (r"deliver(?:y)?\s*(?:fee|cash)\s*first", "advance_delivery_fee"),
    (r"mpesa\s*(?:kwanza|deposit|security)", "advance_mpesa_deposit"),
]

PHONE_PATTERNS = [
    (r"(?:\+?254|0)[17]\d(?:[\s.-]?\d){7}", "phone_number_in_text"),
    (r"zero\s*(?:seven|one)\s*(?:\d|\w)+", "obfuscated_phone_in_text"),
]


def evaluate_listing_moderation(
    listing_data: Dict[str, Any],
    seller: User,
    db: Session,
) -> Tuple[ModerationDecisionTier, int, List[str], str]:
    """
    Evaluates a listing against deterministic rules, price anomalies, seller history,
    and fraud patterns.

    Returns:
        (decision_tier, total_risk_score, triggered_flags, summary_reason)
    """
    risk_score = 0
    flags: List[str] = []

    title = f"{listing_data.get('title_en', '')} {listing_data.get('title_so', '')}".strip()
    description = f"{listing_data.get('description_en', '')} {listing_data.get('description_so', '')}".strip()
    full_text = f"{title} {description}".lower()
    price = float(listing_data.get("price", 0) or 0)
    category_id = listing_data.get("category_id")

    # 1. Prohibited items check (Immediate high severity)
    for pattern, reason in PROHIBITED_PATTERNS:
        if re.search(pattern, full_text):
            risk_score += 75
            flags.append(f"prohibited:{reason}")

    # 2. Advance payment scam indicators
    for pattern, reason in ADVANCE_DEPOSIT_PATTERNS:
        if re.search(pattern, full_text):
            risk_score += 45
            flags.append(f"advance_pay:{reason}")

    # 3. Contact info leakage & off-platform redirect in description
    for pattern, reason in PHONE_PATTERNS:
        if re.search(pattern, full_text):
            risk_score += 30
            flags.append(f"contact_leak:{reason}")

    for pattern, reason in OFF_PLATFORM_PATTERNS:
        if re.search(pattern, full_text):
            risk_score += 25
            flags.append(f"off_platform:{reason}")

    # 4. Pricing anomaly vs category median/average
    if category_id:
        avg_row = db.exec(
            select(func.avg(Listing.price))
            .where(Listing.category_id == category_id)
            .where(Listing.status == "active")
        ).first()

        avg_price = float(avg_row) if avg_row else 0.0
        if avg_price > 100:  # Only evaluate anomaly if established baseline exists
            if price > 0 and price < (avg_price * 0.20):
                # Suspiciously low price (likely deposit bait or counterfeit)
                risk_score += 35
                flags.append("price_anomaly:unrealistically_low")
            elif price > (avg_price * 5.0):
                # Suspiciously inflated price
                risk_score += 20
                flags.append("price_anomaly:unrealistically_high")

    # 5. Seller history & account trust factor
    if seller.is_suspended:
        risk_score += 100
        flags.append("seller:account_suspended")
    elif seller.is_flagged:
        risk_score += 40
        flags.append("seller:account_flagged")

    # Check seller previous report history
    reports_count = db.exec(
        select(func.count(ListingReport.id))
        .join(Listing, ListingReport.listing_id == Listing.id)
        .where(Listing.owner_id == seller.id)
    ).one() or 0

    if reports_count >= 3:
        risk_score += 30
        flags.append("seller:multiple_previous_reports")

    # Unverified new seller posting high-value item (> KES 50,000)
    if seller.verified_level == UserVerifiedLevel.guest and price > 50000:
        risk_score += 25
        flags.append("seller:unverified_high_value")

    # Final score normalization (0 to 100)
    final_score = min(100, max(0, risk_score))

    # Determine 3-tier outcome
    if final_score < 25:
        tier = ModerationDecisionTier.LOW_RISK
        summary = "Listing meets safety standards for automatic approval."
    elif final_score < 70:
        tier = ModerationDecisionTier.MEDIUM_RISK
        summary = f"Held for human review. Flags: {', '.join(flags)}"
    else:
        tier = ModerationDecisionTier.HIGH_RISK
        summary = f"Quarantined due to high risk score ({final_score}). Flags: {', '.join(flags)}"

    return tier, final_score, flags, summary

