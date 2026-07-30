"""Celery tasks for marketing automation and scheduled emails."""

from datetime import datetime, timedelta
from celery import shared_task
from sqlmodel import Session, select, func
from app.core.config import settings
from app.db import engine
from app.models.marketing import (
    EmailCampaign, EmailEventType, EmailPreference, UserBrowsingHistory,
    SavedSearch, ListingPerformance, UserLifecycleStage
)
from app.models.user import User
from app.models.listing import Listing
from app.services.marketing_service import marketing_service
from app.core.logging_config import get_logger

logger = get_logger("marketing_tasks")


@shared_task(bind=True, max_retries=3)
def send_weekly_digest_task(self):
    """Send weekly digest emails to active users."""
    try:
        with Session(engine) as session:
            # Get active users with weekly digest enabled
            users = session.exec(
                select(User).join(EmailPreference).where(
                    EmailPreference.marketplace_digest == True,
                    EmailPreference.digest_frequency == 'weekly'
                )
            ).all()

            for user in users:
                try:
                    # Get trending listings from past 7 days
                    week_ago = datetime.utcnow() - timedelta(days=7)
                    trending = session.exec(
                        select(Listing).where(
                            Listing.created_at >= week_ago,
                            Listing.approval_status == 'approved'
                        ).order_by(Listing.views.desc()).limit(5)
                    ).all()

                    # Get user's browsing history for personalization
                    recent_views = session.exec(
                        select(UserBrowsingHistory).where(
                            UserBrowsingHistory.user_id == user.id
                        ).order_by(UserBrowsingHistory.viewed_at.desc()).limit(10)
                    ).all()

                    # Build context
                    context = {
                        "first_name": user.full_name.split()[0] if user.full_name else "User",
                        "trending_items": [
                            {
                                "title": item.title_en or item.title,
                                "price": item.price,
                                "currency": item.currency,
                                "link": f"{settings.FRONTEND_URL}/listings/{item.id}",
                                "shop_name": session.get(User, item.owner_id).full_name if item.owner_id else "Unknown"
                            }
                            for item in trending[:5]
                        ],
                        "week_summary": f"{len(trending)} new items this week",
                        "unsubscribe_link": f"{settings.FRONTEND_URL}/settings/notifications"
                    }

                    # Send email
                    import asyncio
                    asyncio.run(marketing_service.send_event_email(
                        session=session,
                        user_id=user.id,
                        event_type=EmailEventType.WEEKLY_DIGEST,
                        context=context
                    ))
                except Exception as e:
                    logger.warning(f"Failed to send weekly digest to user {user.id}: {e}")
                    continue

            logger.info(f"Sent weekly digest emails to {len(users)} users")

    except Exception as e:
        logger.error(f"Weekly digest task failed: {e}")
        raise self.retry(exc=e, countdown=300)  # Retry in 5 minutes


@shared_task(bind=True, max_retries=3)
def send_daily_digest_task(self):
    """Send daily digest emails to active users."""
    try:
        with Session(engine) as session:
            # Get active users with daily digest enabled
            users = session.exec(
                select(User).join(EmailPreference).where(
                    EmailPreference.marketplace_digest == True,
                    EmailPreference.digest_frequency == 'daily'
                )
            ).all()

            logger.info(f"Sending daily digest to {len(users)} users")

            for user in users:
                try:
                    # Get listings from past 24 hours
                    day_ago = datetime.utcnow() - timedelta(days=1)
                    new_listings = session.exec(
                        select(Listing).where(
                            Listing.created_at >= day_ago,
                            Listing.approval_status == 'approved'
                        ).order_by(Listing.created_at.desc()).limit(10)
                    ).all()

                    context = {
                        "first_name": user.full_name.split()[0] if user.full_name else "User",
                        "new_items_count": len(new_listings),
                        "new_items": [
                            {
                                "title": item.title_en or item.title,
                                "price": item.price,
                                "currency": item.currency,
                                "link": f"{settings.FRONTEND_URL}/listings/{item.id}"
                            }
                            for item in new_listings[:5]
                        ],
                        "unsubscribe_link": f"{settings.FRONTEND_URL}/settings/notifications"
                    }

                    import asyncio
                    asyncio.run(marketing_service.send_event_email(
                        session=session,
                        user_id=user.id,
                        event_type=EmailEventType.WEEKLY_DIGEST,  # Reuse digest template
                        context=context
                    ))
                except Exception as e:
                    logger.warning(f"Failed to send daily digest to user {user.id}: {e}")
                    continue

    except Exception as e:
        logger.error(f"Daily digest task failed: {e}")
        raise self.retry(exc=e, countdown=300)


@shared_task(bind=True, max_retries=3)
def check_abandoned_listings_task(self):
    """Send reminder emails for incomplete/draft listings."""
    try:
        with Session(engine) as session:
            # Get listings in draft status older than 3 days
            three_days_ago = datetime.utcnow() - timedelta(days=3)
            abandoned = session.exec(
                select(Listing).where(
                    Listing.approval_status == 'pending',
                    Listing.created_at <= three_days_ago
                )
            ).all()

            logger.info(f"Found {len(abandoned)} abandoned listings")

            for listing in abandoned:
                try:
                    seller = session.get(User, listing.owner_id)
                    if not seller:
                        continue

                    # Check if user opted in for listing updates
                    pref = session.exec(
                        select(EmailPreference).where(
                            EmailPreference.user_id == seller.id
                        )
                    ).first()

                    if pref and not pref.listing_updates:
                        continue

                    context = {
                        "first_name": seller.full_name.split()[0] if seller.full_name else "Seller",
                        "listing_title": listing.title_en or listing.title,
                        "days_pending": (datetime.utcnow() - listing.created_at).days,
                        "complete_link": f"{settings.FRONTEND_URL}/dashboard/listings/{listing.id}/edit",
                        "help_link": f"{settings.FRONTEND_URL}/help/create-listing"
                    }

                    import asyncio
                    asyncio.run(marketing_service.send_event_email(
                        session=session,
                        user_id=seller.id,
                        event_type=EmailEventType.ABANDONED_LISTING,
                        context=context
                    ))
                except Exception as e:
                    logger.warning(f"Failed to send abandoned listing email for listing {listing.id}: {e}")
                    continue

    except Exception as e:
        logger.error(f"Abandoned listings task failed: {e}")
        raise self.retry(exc=e, countdown=300)


@shared_task(bind=True, max_retries=3)
def check_inactive_sellers_task(self):
    """Re-engagement emails for inactive sellers."""
    try:
        with Session(engine) as session:
            # Get sellers inactive for 14+ days
            fourteen_days_ago = datetime.utcnow() - timedelta(days=14)
            # Get users who have active listings (sellers)
            seller_ids = session.exec(
                select(func.distinct(Listing.owner_id)).where(
                    Listing.approval_status == 'approved'
                )
            ).all()
            seller_ids_set = set(sid for sid in seller_ids if sid)

            inactive_sellers = [
                u for u in session.exec(
                    select(User).where(User.last_login <= fourteen_days_ago)
                ).all()
                if u.id in seller_ids_set
            ]

            logger.info(f"Found {len(inactive_sellers)} inactive sellers")

            for seller in inactive_sellers:
                try:
                    # Check if already sent re-engagement email recently
                    recent_email = session.exec(
                        select(EmailCampaign).where(
                            EmailCampaign.user_id == seller.id,
                            EmailCampaign.event_type == EmailEventType.REENGAGEMENT,
                            EmailCampaign.sent_at >= datetime.utcnow() - timedelta(days=7)
                        )
                    ).first()

                    if recent_email:
                        continue

                    # Count their active listings
                    active_listings = session.exec(
                        select(Listing).where(
                            Listing.owner_id == seller.id,
                            Listing.approval_status == 'approved'
                        )
                    ).all()

                    context = {
                        "first_name": seller.full_name.split()[0] if seller.full_name else "Seller",
                        "active_listings": len(active_listings),
                        "dashboard_link": f"{settings.FRONTEND_URL}/dashboard",
                        "create_listing_link": f"{settings.FRONTEND_URL}/dashboard/listings/create",
                        "support_link": f"{settings.FRONTEND_URL}/support"
                    }

                    import asyncio
                    asyncio.run(marketing_service.send_event_email(
                        session=session,
                        user_id=seller.id,
                        event_type=EmailEventType.REENGAGEMENT,
                        context=context
                    ))
                except Exception as e:
                    logger.warning(f"Failed to send re-engagement email to seller {seller.id}: {e}")
                    continue

    except Exception as e:
        logger.error(f"Inactive sellers task failed: {e}")
        raise self.retry(exc=e, countdown=300)


@shared_task(bind=True, max_retries=3)
def check_saved_searches_task(self):
    """Check for new listings matching saved searches."""
    try:
        with Session(engine) as session:
            # Get all active saved searches
            saved_searches = session.exec(select(SavedSearch)).all()

            logger.info(f"Checking {len(saved_searches)} saved searches")

            for search in saved_searches:
                try:
                    user = session.get(User, search.user_id)
                    if not user:
                        continue

                    # Check if user opted in for saved search emails
                    pref = session.exec(
                        select(EmailPreference).where(
                            EmailPreference.user_id == user.id
                        )
                    ).first()

                    if pref and not pref.saved_search_matches:
                        continue

                    # Find new listings matching the search (from past 24 hours)
                    day_ago = datetime.utcnow() - timedelta(days=1)

                    query = select(Listing).where(
                        Listing.created_at >= day_ago,
                        Listing.approval_status == 'approved',
                        Listing.title.icontains(search.query)
                    )

                    if search.min_price:
                        query = query.where(Listing.price >= search.min_price)
                    if search.max_price:
                        query = query.where(Listing.price <= search.max_price)

                    matching_listings = session.exec(query).all()

                    if not matching_listings:
                        continue

                    # Send email with matching listings
                    context = {
                        "first_name": user.full_name.split()[0] if user.full_name else "User",
                        "search_query": search.query,
                        "results_count": len(matching_listings),
                        "results": [
                            {
                                "title": item.title_en or item.title,
                                "price": item.price,
                                "currency": item.currency,
                                "link": f"{settings.FRONTEND_URL}/listings/{item.id}",
                                "shop_name": session.get(User, item.owner_id).full_name if item.owner_id else "Unknown"
                            }
                            for item in matching_listings[:10]
                        ],
                        "all_results_link": f"{settings.FRONTEND_URL}/search?q={search.query}"
                    }

                    import asyncio
                    asyncio.run(marketing_service.send_event_email(
                        session=session,
                        user_id=user.id,
                        event_type=EmailEventType.SAVED_SEARCH_MATCH,
                        context=context
                    ))
                except Exception as e:
                    logger.warning(f"Failed to check saved search {search.id}: {e}")
                    continue

    except Exception as e:
        logger.error(f"Saved searches task failed: {e}")
        raise self.retry(exc=e, countdown=300)


@shared_task(bind=True, max_retries=3)
def send_birthday_emails_task(self):
    """Send birthday offer emails."""
    try:
        with Session(engine) as session:
            today = datetime.utcnow()
            # Get users with birthday today (across all years)
            # Note: This assumes birth_date field exists in User model
            users_today = session.exec(
                select(User).where(
                    User.birth_date.isnot(None)
                )
            ).all()

            birthday_users = [
                u for u in users_today
                if u.birth_date and u.birth_date.month == today.month and u.birth_date.day == today.day
            ]

            logger.info(f"Found {len(birthday_users)} users with birthdays today")

            for user in birthday_users:
                try:
                    # Check if user opted in for birthday emails
                    pref = session.exec(
                        select(EmailPreference).where(
                            EmailPreference.user_id == user.id
                        )
                    ).first()

                    # For now, send to all (no specific birthday email toggle yet)
                    context = {
                        "first_name": user.full_name.split()[0] if user.full_name else "User",
                        "special_offer_link": f"{settings.FRONTEND_URL}/deals/birthday",
                        "discount_code": "BIRTHDAY20"  # Example, should be dynamic
                    }

                    import asyncio
                    asyncio.run(marketing_service.send_event_email(
                        session=session,
                        user_id=user.id,
                        event_type=EmailEventType.BIRTHDAY,
                        context=context
                    ))
                except Exception as e:
                    logger.warning(f"Failed to send birthday email to user {user.id}: {e}")
                    continue

    except Exception as e:
        logger.error(f"Birthday emails task failed: {e}")
        raise self.retry(exc=e, countdown=300)
