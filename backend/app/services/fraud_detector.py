"""
Enhanced Fraud Pattern & Risk Detection Service for Suqafuran.

Extends the Phase 2 moderation pipeline with behavioral signals:
1. Posting velocity & spam burst detection (rapid listings creation).
2. Severe underpricing anomalies vs category/comparable median prices.
3. Cross-account image duplication & duplicate asset reuse.
4. Scam & deposit-bait phrases (advance fee, Western Union, M-Pesa deposit upfront).
5. Account credibility scoring and persistent FraudEvent audit trail.
"""

from typing import Dict, Any, List, Optional, Tuple
import re
from datetime import datetime, timedelta
from sqlmodel import Session, select, func
from app.models.listing import Listing
from app.models.user import User, UserVerifiedLevel
from app.models.fraud import FraudEvent, FraudTargetType, RiskHistory
from app.services.moderation_pipeline import (
    evaluate_listing_moderation,
    ModerationDecisionTier,
    ADVANCE_DEPOSIT_PATTERNS,
    PROHIBITED_PATTERNS,
    PHONE_PATTERNS,
    OFF_PLATFORM_PATTERNS,
)


def check_posting_velocity(
    seller_id: int,
    db: Session,
    window_minutes: int = 10,
    threshold: int = 3,
) -> Tuple[bool, int]:
    """
    Check if the user has posted a burst of listings in a short time window.
    Returns (is_burst, count_in_window).
    """
    cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
    count = db.exec(
        select(func.count(Listing.id))
        .where(Listing.owner_id == seller_id)
        .where(Listing.created_at >= cutoff)
    ).one() or 0

    return count >= threshold, count


def check_cross_account_duplicate_images(
    seller_id: int,
    image_urls: List[str],
    db: Session,
) -> Tuple[bool, List[str]]:
    """
    Detect if any of the provided image URLs were previously uploaded by a different seller.
    """
    if not image_urls:
        return False, []

    from sqlalchemy import String
    duplicated_urls = []
    for url in image_urls[:5]:
        if not url:
            continue
        existing = db.exec(
            select(Listing.id)
            .where(Listing.owner_id != seller_id)
            .where(func.cast(Listing.images, String).contains(url))
        ).first()

        if existing:
            duplicated_urls.append(url)

    return len(duplicated_urls) > 0, duplicated_urls


def assess_listing_risk(
    db: Session,
    listing_data: Dict[str, Any],
    seller: User,
    listing_id: Optional[int] = None,
    persist_fraud_event: bool = True,
) -> Dict[str, Any]:
    """
    Comprehensive multi-signal fraud and risk evaluation for listings.
    """
    # 1. Base moderation pipeline evaluation
    tier, base_score, flags, summary = evaluate_listing_moderation(listing_data, seller, db)
    risk_score = base_score

    # 2. Behavioral signal: Posting velocity check
    is_velocity_burst, recent_count = check_posting_velocity(seller.id, db)
    if is_velocity_burst and seller.verified_level == UserVerifiedLevel.guest:
        risk_score += 30
        flags.append(f"velocity:rapid_listing_burst_{recent_count}_in_10min")

    # 3. Behavioral signal: Cross-account image duplication
    images = listing_data.get("images", [])
    if isinstance(images, list) and images:
        has_dup_images, dup_urls = check_cross_account_duplicate_images(seller.id, images, db)
        if has_dup_images:
            risk_score += 35
            flags.append("duplication:reused_cross_account_images")

    # 4. Behavioral signal: Severe underpricing vs category median
    category_id = listing_data.get("category_id")
    price = float(listing_data.get("price", 0) or 0)
    if category_id and price > 0:
        median_query = select(func.avg(Listing.price)).where(
            Listing.category_id == category_id,
            Listing.status == "active",
            Listing.price > 0,
        )
        cat_median = db.exec(median_query).first()
        if cat_median and float(cat_median) > 1000:
            avg_p = float(cat_median)
            # If item is less than 15% of the average category price
            if price < (avg_p * 0.15):
                risk_score += 40
                flags.append("price_anomaly:severe_underpricing_scam_bait")

    # Normalize final score between 0 and 100
    final_score = min(100, max(0, risk_score))

    # Tier assignment
    if final_score < 25:
        decision_tier = ModerationDecisionTier.LOW_RISK
        action = "auto_approve"
        severity = "low"
        final_summary = "Listing meets all safety criteria for automatic approval."
    elif final_score < 70:
        decision_tier = ModerationDecisionTier.MEDIUM_RISK
        action = "review_queue"
        severity = "medium" if final_score < 50 else "high"
        final_summary = f"Flagged for human moderation review ({final_score}/100). Flags: {', '.join(flags)}"
    else:
        decision_tier = ModerationDecisionTier.HIGH_RISK
        action = "quarantine"
        severity = "critical"
        final_summary = f"Automatically quarantined due to severe risk ({final_score}/100). Flags: {', '.join(flags)}"

    # 5. Persistent FraudEvent logging for auditability if risk is elevated
    event_id = None
    if persist_fraud_event and final_score >= 25:
        try:
            fraud_event = FraudEvent(
                target_type=FraudTargetType.LISTING,
                target_id=str(listing_id or f"draft_{seller.id}_{int(datetime.utcnow().timestamp())}"),
                rule_name=flags[0] if flags else "risk_threshold_exceeded",
                risk_score=final_score,
                confidence=round(min(1.0, 0.5 + (final_score / 200.0)), 2),
                event_data={
                    "seller_id": seller.id,
                    "price": price,
                    "flags": flags,
                    "title": listing_data.get("title_en") or listing_data.get("title_so"),
                    "action_taken": action,
                },
                status="pending",
                created_at=datetime.utcnow(),
            )
            db.add(fraud_event)
            db.commit()
            db.refresh(fraud_event)
            event_id = fraud_event.id
        except Exception:
            db.rollback()

    return {
        "decision_tier": decision_tier.value,
        "risk_score": final_score,
        "risk_level": severity,
        "triggered_flags": flags,
        "summary": final_summary,
        "action_recommended": action,
        "event_id": event_id,
        "evaluated_at": datetime.utcnow().isoformat(),
    }
