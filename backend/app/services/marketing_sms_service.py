"""
Personalized Marketing SMS Recommendation Service.

Dispatches personalized product recommendation SMS messages to users 2-3 times per week
based on their saved searches, browsing patterns, and favorited categories.
Enforces a 48-hour cooldown per user and a 3-SMS-per-week frequency cap.
"""

import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select, func, col

from app.core.config import settings
from app.core.logging_config import get_logger
from app.models.user import User
from app.models.listing import Listing
from app.models.marketing import SavedSearch, UserBrowsingHistory
from app.models.favorite import Favorite
from app.models.campaign_send_log import CampaignSendLog
from app.services.sms_service import SMSService
from app.services.africastalking_service import africastalking_service

logger = get_logger("marketing_sms")

CAMPAIGN_TYPE = "sms_recommendation"
MAX_SMS_PER_WEEK = 3
MIN_HOURS_BETWEEN_SMS = 48  # Enforces 2-3 times per week ceiling

# 15 Rotating SMS Headlines for African Marketplace Personalization
SMS_HEADLINE_TEMPLATES = [
    "Hi {name}, deals matching your search on Suqafuran: {deals}. See all: {link} Reply STOP to opt out",
    "Fresh on Suqafuran, {name}! Top picks for you: {deals}. Browse more: {link} Reply STOP to opt out",
    "Looking for deals, {name}? Just listed: {deals}. Check them out: {link} Reply STOP to opt out",
    "Hi {name}, new price updates on items you like: {deals}. View now: {link} Reply STOP to opt out",
    "Hot picks near you, {name}: {deals}. See today's arrivals: {link} Reply STOP to opt out",
    "Habari {name}! Great deals today on Suqafuran: {deals}. Explore: {link} Reply STOP to opt out",
    "Kusoo dhowow {name}, fresh items on Suqafuran: {deals}. View here: {link} Reply STOP to opt out",
    "Marketplace update, {name}: Hand-picked for your interests: {deals}. Link: {link} Reply STOP to opt out",
    "{name}, sellers just posted items you might like: {deals}. See details: {link} Reply STOP to opt out",
    "Weekend picks for {name}! Popular deals: {deals}. Take a look: {link} Reply STOP to opt out",
    "Hi {name}, don't miss these top-rated listings: {deals}. Browse: {link} Reply STOP to opt out",
    "Direct from verified sellers, {name}: {deals}. View on Suqafuran: {link} Reply STOP to opt out",
    "Quick alert {name}: High-demand items in your category: {deals}. Link: {link} Reply STOP to opt out",
    "{name}, check out today's top picks: {deals}. Explore more: {link} Reply STOP to opt out",
    "Special deals for {name} on Suqafuran: {deals}. Check now: {link} Reply STOP to opt out",
]


class MarketingSMSService:
    def __init__(self):
        self.sms_client = SMSService()

    def get_user_interest_profile(self, db: Session, user_id: int) -> Dict[str, Any]:
        """
        Analyze user's search queries, viewed categories, and favorited listings
        to build an affinity profile.
        """
        # 1. Extract saved searches & explicit search queries
        saved_searches = db.exec(
            select(SavedSearch)
            .where(SavedSearch.user_id == user_id)
            .order_by(SavedSearch.created_at.desc())
            .limit(5)
        ).all()

        search_keywords = [
            s.search_query.strip().lower()
            for s in saved_searches
            if s.search_query and len(s.search_query.strip()) > 2
        ]
        search_category_ids = [s.category_id for s in saved_searches if s.category_id]

        # 2. Extract top browsed categories in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        browsed = db.exec(
            select(UserBrowsingHistory.category_id, func.count(UserBrowsingHistory.id).label("views"))
            .where(
                UserBrowsingHistory.user_id == user_id,
                UserBrowsingHistory.category_id.isnot(None),
                UserBrowsingHistory.viewed_at >= thirty_days_ago,
            )
            .group_by(UserBrowsingHistory.category_id)
            .order_by(func.count(UserBrowsingHistory.id).desc())
            .limit(3)
        ).all()
        browsed_category_ids = [b[0] for b in browsed if b[0] is not None]

        # 3. Extract favorited listing categories
        favorited_categories = db.exec(
            select(Listing.category_id)
            .join(Favorite, Favorite.listing_id == Listing.id)
            .where(Favorite.user_id == user_id, Listing.category_id.isnot(None))
            .limit(5)
        ).all()

        combined_categories = list(dict.fromkeys(search_category_ids + browsed_category_ids + favorited_categories))

        return {
            "keywords": search_keywords,
            "category_ids": combined_categories,
        }

    def get_recently_sent_listing_ids(self, db: Session, user_id: int, days: int = 21) -> set:
        """Find listing IDs recently sent to this user to avoid repeats."""
        since = datetime.utcnow() - timedelta(days=days)
        logs = db.exec(
            select(CampaignSendLog.listing_ids)
            .where(
                CampaignSendLog.user_id == user_id,
                CampaignSendLog.campaign_type == CAMPAIGN_TYPE,
                CampaignSendLog.sent_at >= since,
            )
        ).all()

        sent_ids = set()
        for log_entry in logs:
            if not log_entry:
                continue
            try:
                ids = json.loads(log_entry)
                if isinstance(ids, list):
                    sent_ids.update(ids)
            except Exception:
                pass
        return sent_ids

    def find_recommendations(self, db: Session, user: User, limit: int = 2) -> List[Listing]:
        """
        Find personalized listings matching the user's search and browsing patterns.
        Falls back to top trending active marketplace listings if user is new.
        """
        profile = self.get_user_interest_profile(db, user.id)
        already_sent_ids = self.get_recently_sent_listing_ids(db, user.id)

        recommendations: List[Listing] = []
        rec_ids: set = set()

        # Strategy 1: Match keywords from user's search history
        if profile["keywords"]:
            for kw in profile["keywords"]:
                if len(recommendations) >= limit:
                    break
                pattern = f"%{kw}%"
                matches = db.exec(
                    select(Listing)
                    .where(
                        Listing.status == "active",
                        Listing.owner_id != user.id,
                        col(Listing.title_en).ilike(pattern) | col(Listing.title_so).ilike(pattern),
                    )
                    .order_by(Listing.created_at.desc())
                    .limit(limit)
                ).all()

                for item in matches:
                    if item.id not in already_sent_ids and item.id not in rec_ids:
                        recommendations.append(item)
                        rec_ids.add(item.id)
                        if len(recommendations) >= limit:
                            break

        # Strategy 2: Match top categories from browsing & favorites
        if len(recommendations) < limit and profile["category_ids"]:
            category_matches = db.exec(
                select(Listing)
                .where(
                    Listing.status == "active",
                    Listing.owner_id != user.id,
                    col(Listing.category_id).in_(profile["category_ids"]),
                )
                .order_by(Listing.views.desc(), Listing.created_at.desc())
                .limit(limit * 2)
            ).all()

            for item in category_matches:
                if item.id not in already_sent_ids and item.id not in rec_ids:
                    recommendations.append(item)
                    rec_ids.add(item.id)
                    if len(recommendations) >= limit:
                        break

        # Strategy 3: Cold-start fallback — top verified / trending active listings
        if len(recommendations) < limit:
            fallback_items = db.exec(
                select(Listing)
                .where(
                    Listing.status == "active",
                    Listing.owner_id != user.id,
                )
                .order_by(Listing.views.desc(), Listing.created_at.desc())
                .limit(limit * 3)
            ).all()

            for item in fallback_items:
                if item.id not in already_sent_ids and item.id not in rec_ids:
                    recommendations.append(item)
                    rec_ids.add(item.id)
                    if len(recommendations) >= limit:
                        break

        return recommendations[:limit]

    def get_prior_send_count(self, db: Session, user_id: int) -> int:
        """Count total SMS recommendation campaigns previously dispatched to this user."""
        return db.exec(
            select(func.count(CampaignSendLog.id))
            .where(
                CampaignSendLog.user_id == user_id,
                CampaignSendLog.campaign_type == CAMPAIGN_TYPE,
            )
        ).one() or 0

    def compose_sms(self, user: User, recommendations: List[Listing], send_sequence: int = 0) -> str:
        """
        Compose a concise, engaging SMS recommendation (under 160-320 chars)
        rotating across 15 distinct headline templates based on user ID and prior sends.
        """
        first_name = (user.full_name or "there").strip().split()[0].title()
        site_url = settings.FRONTEND_URL.rstrip("/")

        if not recommendations:
            return f"Hi {first_name}, discover hot deals on Suqafuran: {site_url}/listings. Reply STOP to opt out."

        # Format items: e.g. "iPhone 13 ($520) & Toyota Vitz ($4,200)"
        item_snippets = []
        for item in recommendations[:2]:
            title = (item.title_en or item.title_so or "Item").strip()
            # Truncate title if long
            if len(title) > 24:
                title = title[:22] + ".."
            currency = item.currency or "$"
            price_str = f"{item.price:,.0f}" if item.price is not None else ""
            item_snippets.append(f"{title} ({currency} {price_str})")

        deals_text = " & ".join(item_snippets)
        primary_link = f"{site_url}/listings?utm_source=rec_sms"

        # Rotate across the 15 headline templates
        variant_idx = (user.id + send_sequence) % len(SMS_HEADLINE_TEMPLATES)
        template = SMS_HEADLINE_TEMPLATES[variant_idx]
        return template.format(name=first_name, deals=deals_text, link=primary_link)

    def is_opted_out(self, db: Session, user: User) -> bool:
        """Check if user has explicitly opted out of marketing SMS."""
        # 1. Check if logged as opted out in CampaignSendLog
        opt_out_log = db.exec(
            select(CampaignSendLog.id).where(
                CampaignSendLog.user_id == user.id,
                CampaignSendLog.campaign_type == "sms_opt_out",
            )
        ).first()
        if opt_out_log:
            return True

        return False

    def is_eligible_for_sms(
        self,
        db: Session,
        user: User,
        require_opt_in: bool = False,
    ) -> bool:
        """
        Verify user has a valid phone, has not opted out, and is within the
        2-3 times per week frequency cap (minimum 48h cooldown, max 3/week).
        """
        if not user.phone or len(user.phone.strip()) < 8:
            return False

        if not user.is_active:
            return False

        # If strict opt-in is required, check user.sms_notifications
        if require_opt_in and not user.sms_notifications:
            return False

        # Check explicit opt-out
        if self.is_opted_out(db, user):
            return False

        now = datetime.utcnow()
        min_cooldown = now - timedelta(hours=MIN_HOURS_BETWEEN_SMS)
        one_week_ago = now - timedelta(days=7)

        # Check 48-hour cooldown
        recent_send = db.exec(
            select(CampaignSendLog.id)
            .where(
                CampaignSendLog.user_id == user.id,
                CampaignSendLog.campaign_type == CAMPAIGN_TYPE,
                CampaignSendLog.sent_at >= min_cooldown,
            )
        ).first()
        if recent_send:
            return False

        # Check max 3 SMS per rolling 7 days
        weekly_sends = db.exec(
            select(func.count(CampaignSendLog.id))
            .where(
                CampaignSendLog.user_id == user.id,
                CampaignSendLog.campaign_type == CAMPAIGN_TYPE,
                CampaignSendLog.sent_at >= one_week_ago,
            )
        ).one()
        if weekly_sends >= MAX_SMS_PER_WEEK:
            return False

        return True

    def opt_out_phone(self, db: Session, raw_phone: str) -> Dict[str, Any]:
        """
        Blacklist and opt out a phone number from receiving marketing SMS.
        """
        clean_phone = raw_phone.strip()
        try:
            norm_phone = africastalking_service.normalize_phone(clean_phone)
        except Exception:
            norm_phone = clean_phone

        users = db.exec(
            select(User).where(
                (col(User.phone) == norm_phone) | (col(User.phone) == clean_phone)
            )
        ).all()

        updated_users = []
        for u in users:
            u.sms_notifications = False
            db.add(u)
            # Log opt-out to permanently prevent sends even if user table changes
            db.add(CampaignSendLog(
                user_id=u.id,
                campaign_type="sms_opt_out",
                subject_variant="opt_out_stop",
                template_event_type="sms_opt_out",
            ))
            updated_users.append(u.id)

        db.commit()
        return {
            "phone": norm_phone,
            "opted_out_user_ids": updated_users,
            "count": len(updated_users),
        }

    def process_recommendation_batch(
        self,
        db: Session,
        batch_limit: int = 150,
        require_opt_in: bool = False,
    ) -> Dict[str, Any]:
        """
        Batch process marketing SMS recommendations for eligible users.
        Runs 2-3 times per week via Celery Beat or manual trigger.
        """
        # Find candidates with phone numbers
        query = select(User).where(
            User.is_active == True,
            User.phone.isnot(None),
        )
        if require_opt_in:
            query = query.where(User.sms_notifications == True)

        candidates = db.exec(query.limit(batch_limit * 3)).all()

        sent_count = 0
        skipped_count = 0
        failed_count = 0
        results = []

        for user in candidates:
            if sent_count >= batch_limit:
                break

            if not self.is_eligible_for_sms(db, user, require_opt_in=require_opt_in):
                skipped_count += 1
                continue

            try:
                # 1. Normalize phone to E.164 (+252 / +254)
                normalized_phone = africastalking_service.normalize_phone(user.phone)
            except Exception:
                skipped_count += 1
                continue

            # 2. Find personalized recommendations
            recommendations = self.find_recommendations(db, user, limit=2)
            if not recommendations:
                skipped_count += 1
                continue

            # 3. Compose message with rotating headline
            prior_sends = self.get_prior_send_count(db, user.id)
            message = self.compose_sms(user, recommendations, send_sequence=prior_sends)

            # 4. Dispatch SMS
            try:
                sms_res = self.sms_client.send_sms(
                    to_number=normalized_phone,
                    message=message,
                    campaign_id=901,  # 901 = weekly personalized recommendations
                )

                if sms_res.get("status") in ("sent", "delivered", "disabled"):
                    sent_count += 1
                    rec_ids_json = json.dumps([r.id for r in recommendations])
                    category_id = recommendations[0].category_id if recommendations else None

                    # Log to database for cooldown and frequency cap enforcement
                    db.add(CampaignSendLog(
                        user_id=user.id,
                        campaign_type=CAMPAIGN_TYPE,
                        subject_variant="recommendations_v1",
                        category_id=category_id,
                        listing_ids=rec_ids_json,
                        template_event_type="sms_recommendations",
                    ))
                    db.commit()

                    results.append({
                        "user_id": user.id,
                        "phone": normalized_phone[:6] + "****",
                        "listings": [r.id for r in recommendations],
                        "status": "sent",
                    })
                else:
                    failed_count += 1
                    logger.warning(f"SMS send unsuccessful for user {user.id}: {sms_res}")
            except Exception as e:
                failed_count += 1
                logger.error(f"Failed to dispatch recommendation SMS to user {user.id}: {e}")

        logger.info(
            f"[Marketing SMS] Finished batch: {sent_count} sent, "
            f"{skipped_count} skipped, {failed_count} failed."
        )

        return {
            "sent": sent_count,
            "skipped": skipped_count,
            "failed": failed_count,
            "details": results,
        }


marketing_sms_service = MarketingSMSService()
