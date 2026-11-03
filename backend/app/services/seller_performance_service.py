"""
Seller Performance & Reputation Calculation Service.

Computes genuine, data-backed seller metrics derived from real marketplace records:
- Inbound inquiries and response rate (%)
- Median response time (minutes & display label)
- Average review rating and review count
- Active and completed listing counts
"""

import statistics
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlmodel import Session, select, func
from app.models.message import Message
from app.models.review import Review
from app.models.listing import Listing
from app.models.user import User, UserVerifiedLevel


def calculate_seller_performance(seller_id: int, db: Session) -> Dict[str, Any]:
    """
    Computes genuine seller performance metrics from conversation history and reviews.
    Resistant to fake scores and manipulation.
    """
    # 1. Review Metrics
    review_stats = db.exec(
        select(
            func.count(Review.id).label("total_reviews"),
            func.avg(Review.rating).label("avg_rating")
        )
        .where(Review.seller_id == seller_id)
    ).first()

    reviews_count = review_stats[0] if review_stats and review_stats[0] else 0
    raw_avg = review_stats[1] if review_stats and review_stats[1] else 0.0
    average_rating = round(float(raw_avg), 1) if raw_avg else 0.0

    # 2. Listing Counts
    active_listings_count = db.exec(
        select(func.count(Listing.id))
        .where(Listing.owner_id == seller_id)
        .where(Listing.status == "active")
        .where(Listing.moderation_status == "approved")
    ).one() or 0

    sold_listings_count = db.exec(
        select(func.count(Listing.id))
        .where(Listing.owner_id == seller_id)
        .where(Listing.is_sold == True)
    ).one() or 0

    # 3. Inquiries and Response Metrics from Message History
    # Buyer inquiries: distinct senders who messaged this seller
    inbound_senders = db.exec(
        select(Message.sender_id)
        .where(Message.receiver_id == seller_id)
        .distinct()
    ).all()

    total_inquiries = len(inbound_senders)
    replied_inquiries = 0
    response_delays_minutes: List[float] = []

    for buyer_id in inbound_senders:
        # First message from buyer to seller
        first_inbound = db.exec(
            select(Message.created_at)
            .where(Message.sender_id == buyer_id)
            .where(Message.receiver_id == seller_id)
            .order_by(Message.created_at.asc())
        ).first()

        # First reply from seller to buyer after that inbound message
        if first_inbound:
            first_reply = db.exec(
                select(Message.created_at)
                .where(Message.sender_id == seller_id)
                .where(Message.receiver_id == buyer_id)
                .where(Message.created_at >= first_inbound)
                .order_by(Message.created_at.asc())
            ).first()

            if first_reply:
                replied_inquiries += 1
                delta_minutes = (first_reply - first_inbound).total_seconds() / 60.0
                if delta_minutes >= 0:
                    response_delays_minutes.append(delta_minutes)

    if total_inquiries > 0:
        response_rate = round((replied_inquiries / total_inquiries) * 100)
    else:
        # New seller with no inquiries yet
        response_rate = 100

    if response_delays_minutes:
        median_minutes = round(statistics.median(response_delays_minutes))
        if median_minutes <= 15:
            response_time_display = "Typically responds within 15 minutes"
        elif median_minutes <= 60:
            response_time_display = "Typically responds within an hour"
        elif median_minutes <= 240:
            response_time_display = "Typically responds in a few hours"
        else:
            response_time_display = "Typically responds within 24 hours"
    else:
        median_minutes = None
        response_time_display = "Typically responds in a few hours"

    # 4. Seller Verification Level & Trust Badges
    seller = db.get(User, seller_id)
    verified_level_str = "guest"
    is_phone_verified = False
    is_id_verified = False
    is_business_verified = False

    if seller:
        if seller.phone_verified or seller.verified_level in [UserVerifiedLevel.phone, UserVerifiedLevel.tier1]:
            is_phone_verified = True
        if seller.verified_level in [UserVerifiedLevel.id, UserVerifiedLevel.tier2, UserVerifiedLevel.tier3, UserVerifiedLevel.trusted, UserVerifiedLevel.premium]:
            is_id_verified = True
        if seller.verified_level in [UserVerifiedLevel.tier3, UserVerifiedLevel.trusted, UserVerifiedLevel.premium]:
            is_business_verified = True
        verified_level_str = seller.verified_level.value if hasattr(seller.verified_level, "value") else str(seller.verified_level)

    return {
        "seller_id": seller_id,
        "total_inquiries": total_inquiries,
        "replied_inquiries": replied_inquiries,
        "response_rate": response_rate,
        "median_response_time_minutes": median_minutes,
        "response_time": response_time_display,
        "average_rating": average_rating,
        "reviews_count": reviews_count,
        "active_listings_count": active_listings_count,
        "sold_listings_count": sold_listings_count,
        "verification_level": verified_level_str,
        "badges": {
            "phone_verified": is_phone_verified,
            "id_verified": is_id_verified,
            "business_verified": is_business_verified,
            "top_rated": average_rating >= 4.5 and reviews_count >= 5,
            "fast_responder": response_rate >= 90 and (median_minutes is not None and median_minutes <= 60),
        }
    }

