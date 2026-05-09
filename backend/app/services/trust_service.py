from typing import Optional
from sqlmodel import Session, select, func
from app.models.user import User, TrustLevel
from app.models.meeting_deal import Deal
from app.models.trust import Report
from datetime import datetime, timedelta

def calculate_trust_score(user_id: int, db: Session) -> int:
    """
    Calculates the trust score for a user based on the Suqafuran formula.
    Base Score: 100
    Verified Deal: +20
    Unique Counterparty Bonus: +5
    Time Decay: Recent transactions have higher weight.
    """
    score = 100
    
    # 1. Verified Transactions (+20 each)
    # Only count deals where both parties confirmed
    verified_deals = db.exec(
        select(Deal).where(
            (Deal.buyer_id == user_id) | (Deal.seller_id == user_id),
            Deal.buyer_confirmed == True,
            Deal.seller_confirmed == True,
            Deal.outcome == "bought"
        )
    ).all()
    
    unique_counterparties = set()
    for deal in verified_deals:
        # Time Decay Logic
        days_ago = (datetime.utcnow() - deal.created_at).days
        weight = 1.0
        if days_ago <= 30: weight = 3.0
        elif days_ago <= 90: weight = 1.5
        elif days_ago <= 180: weight = 0.75
        elif days_ago <= 365: weight = 0.5
        else: weight = 0.1
        
        score += int(20 * weight)
        
        # Unique counterparty bonus
        other_party = deal.seller_id if deal.buyer_id == user_id else deal.buyer_id
        if other_party not in unique_counterparties:
            score += 5
            unique_counterparties.add(other_party)

    # 2. Negative Weights
    # Unresolved Disputes / Reports
    reports = db.exec(
        select(Report).where(Report.reported_user_id == user_id, Report.status != "dismissed")
    ).all()
    
    for report in reports:
        if report.status == "suspended":
            score -= 300 # Instant suspension weight
        else:
            score -= 10 # Reported unconfirmed
            
    # Cap score between 0 and 1000
    return max(0, min(1000, score))

def update_user_trust(user: User, db: Session):
    """Updates a user's trust score and level."""
    new_score = calculate_trust_score(user.id, db)
    user.trust_score = new_score
    
    # Update Trust Level
    if new_score >= 800:
        user.trust_level = TrustLevel.TRUSTED # Platinum
    elif new_score >= 600:
        user.trust_level = TrustLevel.VERIFIED # Gold
    elif new_score >= 400:
        user.trust_level = TrustLevel.ESTABLISHED # Silver
    else:
        user.trust_level = TrustLevel.NEW # Bronze
        
    db.add(user)
    db.commit()
    db.refresh(user)
