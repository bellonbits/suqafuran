"""Email background tasks."""
from celery import shared_task
from celery.utils.log import get_task_logger
from typing import Optional, Any, Dict

logger = get_task_logger(__name__)

# Maps dispatch_growth_email_task's email_type keys to the EmailTemplate rows
# seeded from these same methods (see seed_email_templates.py), so an admin
# edit in /admin-dashboard/email-templates actually changes what gets sent.
#
# Deliberately excludes types whose original method renders a dynamic list of
# items in a loop (saved_search, trending, weekly_digest, reengagement,
# recommended, category_interest, market_summary, receipt) — the simple
# {{variable}} Jinja2 substitution here can't reproduce a per-item loop, so
# those always fall through to the hardcoded method below.
DB_TEMPLATE_EVENT_TYPES = {
    "welcome": "onboarding_welcome",
    "complete_profile": "onboarding_complete_profile",
    "first_action": "onboarding_first_action",
    "new_listing": "activity_new_listing",
    "price_drop": "activity_price_drop",
    "message": "transaction_message",
    "offer_received": "transaction_offer",
    "offer_response": "transaction_offer_response",
    "deal_update": "transaction_deal_update",
    "payment": "transaction_payment",
    "order_confirmation": "transaction_order_confirmation",
    "suspicious": "safety_suspicious_login",
    "scam_warning": "safety_scam_warning",
    "account_protection": "safety_protection",
    "password_change": "safety_password_change",
    "new_device": "safety_new_device",
    "abandoned_action": "retention_abandoned_action",
    "seller_tips": "seller_growth_tips",
    "listing_performance": "seller_growth_listing_performance",
    "boost_listing": "seller_growth_boost_listing",
    "ai_pricing": "seller_growth_ai_pricing",
    "seller_milestone": "seller_growth_milestone",
    "system_alert": "admin_system_alert",
    "system_status": "admin_system_status",
    "fraud_report": "admin_fraud_report",
    "moderation_alert": "admin_moderation_alert",
}


def _try_send_from_db_template(email_type: str, email: str, context: Dict[str, Any], user_id: Optional[int], campaign_id: Optional[str]) -> bool:
    """Render + send an active admin-edited EmailTemplate for this event_type,
    if one exists. Returns True if it handled the send (caller should skip the
    hardcoded fallback), False if there's no template to use."""
    event_type = DB_TEMPLATE_EVENT_TYPES.get(email_type)
    if not event_type:
        return False

    from sqlmodel import Session, select
    from app.db.session import engine
    from app.models.email_template import EmailTemplate
    from app.services.email_service import email_service
    from jinja2 import Template
    import datetime

    with Session(engine) as db:
        template = db.exec(
            select(EmailTemplate).where(
                EmailTemplate.event_type == event_type,
                EmailTemplate.is_active == True,
            )
        ).first()

    if not template:
        return False

    render_ctx = {**context, "email": email, "date": datetime.date.today().strftime("%B %d, %Y")}
    try:
        subject = Template(template.subject).render(**render_ctx)
        html_body = Template(template.html_content).render(**render_ctx)
    except Exception as exc:
        logger.warning(f"DB template render failed for '{event_type}' (id={template.id}): {exc} — falling back to hardcoded email")
        return False

    email_service._send_and_log(email, subject, html_body, event_type, user_id, campaign_id=campaign_id)
    logger.info(f"Sent '{email_type}' using admin-edited DB template (id={template.id})")
    return True


@shared_task(name="app.tasks.email_tasks.send_verification_email", bind=True, max_retries=2)
def send_verification_email_task(self, email: str, code: str):
    from app.services.email_service import email_service
    try:
        email_service.send_verification_code(email)
        logger.info(f"Verification email sent to {email}")
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


@shared_task(name="app.tasks.email_tasks.send_password_reset", bind=True, max_retries=2)
def send_password_reset_task(self, email: str, code: str):
    from app.services.email_service import email_service
    try:
        email_service.send_reset_code(email, code)
        logger.info(f"Password reset email sent to {email}")
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


@shared_task(name="app.tasks.email_tasks.dispatch_growth_email", bind=True, max_retries=3)
def dispatch_growth_email_task(
    self,
    email_type: str,
    email: str,
    context: Dict[str, Any],
    user_id: Optional[int] = None,
    campaign_id: Optional[str] = None
):
    """
    Highly scalable, asynchronous Celery task routing to dispatch any of the 30+
    Suqafuran growth, marketing, transactional, or moderation email campaigns.
    """
    from app.services.email_service import email_service
    logger.info(f"Dispatching async email type '{email_type}' to '{email}'")

    if _try_send_from_db_template(email_type, email, context, user_id, campaign_id):
        return

    try:
        # 1. Onboarding & Activation
        if email_type == "welcome":
            email_service.send_welcome_email(email, name=context["name"], user_id=user_id)
        elif email_type == "complete_profile":
            email_service.send_complete_profile_email(email, name=context["name"], user_id=user_id)
        elif email_type == "first_action":
            email_service.send_first_action_prompt_email(
                email, name=context["name"], user_type=context["user_type"], user_id=user_id
            )

        # 2. Marketplace Activity & Growth
        elif email_type == "new_listing":
            email_service.send_new_listing_alert(
                email,
                name=context["name"],
                listing_title=context["listing_title"],
                price=context["price"],
                location=context["location"],
                category=context["category"],
                listing_id=context["listing_id"],
                image_url=context.get("image_url"),
                user_id=user_id
            )
        elif email_type == "saved_search":
            email_service.send_saved_search_alert(
                email,
                name=context["name"],
                search_query=context["search_query"],
                matched_listings=context["matched_listings"],
                user_id=user_id
            )
        elif email_type == "price_drop":
            email_service.send_price_drop_alert(
                email,
                name=context["name"],
                listing_title=context["listing_title"],
                old_price=context["old_price"],
                new_price=context["new_price"],
                listing_id=context["listing_id"],
                image_url=context.get("image_url"),
                user_id=user_id
            )
        elif email_type == "trending":
            email_service.send_trending_items_email(
                email,
                name=context["name"],
                location=context["location"],
                listings=context["listings"],
                user_id=user_id
            )

        # 3. Transactional
        elif email_type == "message":
            email_service.send_message_notification(
                email,
                name=context["name"],
                sender_name=context["sender_name"],
                message_excerpt=context["message_excerpt"],
                chat_url=context["chat_url"],
                user_id=user_id
            )
        elif email_type == "offer_received":
            email_service.send_offer_received(
                email,
                name=context["name"],
                item_title=context["item_title"],
                offer_amount=context["offer_amount"],
                offer_url=context["offer_url"],
                user_id=user_id
            )
        elif email_type == "offer_response":
            email_service.send_offer_response(
                email,
                name=context["name"],
                item_title=context["item_title"],
                response_status=context["response_status"],
                response_amount=context.get("response_amount"),
                user_id=user_id
            )
        elif email_type == "deal_update":
            email_service.send_deal_update(
                email,
                name=context["name"],
                item_title=context["item_title"],
                status=context["status"],
                user_id=user_id
            )
        elif email_type == "payment":
            email_service.send_payment_status(
                email,
                name=context["name"],
                amount=context["amount"],
                status=context["status"],
                tx_ref=context["tx_ref"],
                user_id=user_id
            )
        elif email_type == "receipt":
            email_service.send_receipt_email(
                email,
                name=context["name"],
                items=context["items"],
                total_amount=context["total_amount"],
                tx_ref=context["tx_ref"],
                payment_method=context["payment_method"],
                user_id=user_id
            )
        elif email_type == "order_confirmation":
            email_service.send_order_confirmation(
                email,
                name=context["name"],
                order_id=context["order_id"],
                item_title=context["item_title"],
                seller_name=context["seller_name"],
                delivery_estimate=context["delivery_estimate"],
                user_id=user_id
            )

        # 4. Trust & Safety
        elif email_type == "suspicious":
            email_service.send_suspicious_activity_alert(
                email,
                name=context["name"],
                ip=context["ip"],
                device=context["device"],
                timestamp=context["timestamp"],
                user_id=user_id
            )
        elif email_type == "scam_warning":
            email_service.send_scam_warning_alert(
                email,
                name=context["name"],
                reason=context["reason"],
                user_id=user_id
            )
        elif email_type == "account_protection":
            email_service.send_account_protection_alert(
                email,
                name=context["name"],
                action=context["action"],
                user_id=user_id
            )
        elif email_type == "password_change":
            email_service.send_password_change_alert(
                email,
                name=context["name"],
                timestamp=context["timestamp"],
                ip=context["ip"],
                user_id=user_id
            )
        elif email_type == "new_device":
            email_service.send_new_device_login_alert(
                email,
                name=context["name"],
                device=context["device"],
                location=context["location"],
                timestamp=context["timestamp"],
                ip=context["ip"],
                user_id=user_id
            )

        # 5. Engagement & Retention
        elif email_type == "weekly_digest":
            email_service.send_weekly_digest(
                email,
                name=context["name"],
                location=context["location"],
                items=context["items"],
                categories=context["categories"],
                user_id=user_id
            )
        elif email_type == "reengagement":
            email_service.send_reengagement_email(
                email,
                name=context["name"],
                reason=context["reason"],
                featured_items=context["featured_items"],
                user_id=user_id
            )
        elif email_type == "abandoned_action":
            email_service.send_abandoned_action_email(
                email,
                name=context["name"],
                action=context["action"],
                user_id=user_id
            )
        elif email_type == "recommended":
            email_service.send_recommended_items_email(
                email,
                name=context["name"],
                items=context["items"],
                user_id=user_id
            )
        elif email_type == "category_interest":
            email_service.send_category_interest_email(
                email,
                name=context["name"],
                category_name=context["category_name"],
                items=context["items"],
                user_id=user_id
            )
        elif email_type == "market_summary":
            email_service.send_market_summary_email(
                email,
                name=context["name"],
                location=context["location"],
                average_price_change=context["average_price_change"],
                popular_keywords=context["popular_keywords"],
                user_id=user_id
            )

        # 6. Seller Growth
        elif email_type == "seller_tips":
            email_service.send_seller_tips(email, name=context["name"], user_id=user_id)
        elif email_type == "listing_performance":
            email_service.send_listing_performance_email(
                email,
                name=context["name"],
                listing_title=context["listing_title"],
                views=context["views"],
                clicks=context["clicks"],
                inquiries=context["inquiries"],
                user_id=user_id
            )
        elif email_type == "boost_listing":
            email_service.send_boost_listing_email(
                email,
                name=context["name"],
                listing_title=context["listing_title"],
                listing_id=context["listing_id"],
                current_views=context["current_views"],
                boost_multiplier=context.get("boost_multiplier", 10),
                user_id=user_id
            )
        elif email_type == "ai_pricing":
            email_service.send_ai_pricing_suggestion_email(
                email,
                name=context["name"],
                listing_title=context["listing_title"],
                current_price=context["current_price"],
                suggested_price=context["suggested_price"],
                price_difference=context["price_difference"],
                confidence_score=context["confidence_score"],
                user_id=user_id
            )
        elif email_type == "seller_milestone":
            email_service.send_seller_milestone_email(
                email,
                name=context["name"],
                milestone_type=context["milestone_type"],
                badge_earned=context["badge_earned"],
                reward_detail=context["reward_detail"],
                user_id=user_id
            )

        # 7. Admin & Platform
        elif email_type == "system_alert":
            email_service.send_system_alert(
                email,
                subject=context["subject"],
                body=context["body"],
                user_id=user_id
            )
        elif email_type == "system_status":
            email_service.system_status_email(
                email,
                component=context["component"],
                status=context["status"],
                details=context["details"],
                user_id=user_id
            )
        elif email_type == "fraud_report":
            email_service.fraud_report_summary(
                email,
                report_count=context["report_count"],
                pending_reviews=context["pending_reviews"],
                active_suspensions=context["active_suspensions"],
                user_id=user_id
            )
        elif email_type == "moderation_alert":
            email_service.moderation_alert_email(
                email,
                name=context["name"],
                listing_title=context["listing_title"],
                violation_reason=context["violation_reason"],
                listing_id=context["listing_id"],
                user_id=user_id
            )
        elif email_type == "analytics_summary":
            email_service.analytics_summary_email(
                email,
                active_users=context["active_users"],
                listings_created=context["listings_created"],
                transactions_completed=context["transactions_completed"],
                open_rate=context["open_rate"],
                user_id=user_id
            )
        elif email_type == "crm_manual":
            email_service.send_custom_manual_email(
                email,
                subject=context["subject"],
                title=context["title"],
                subtitle=context.get("subtitle"),
                content_html=context["content_html"],
                action_text=context.get("action_text"),
                action_url=context.get("action_url"),
                campaign_id=campaign_id,
                user_id=user_id
            )
        else:
            logger.error(f"Unknown async email_type: '{email_type}' requested.")

    except Exception as exc:
        logger.error(f"Task failed for email_type '{email_type}': {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(name="app.tasks.email_tasks.send_marketing_broadcast", bind=True, max_retries=0)
def send_marketing_broadcast(self, subject: str, html_content: str, campaign_id: str):
    """
    Send a marketing email to every user who hasn't opted out of
    promotional emails. Runs in the background since a full-platform send
    can take a while -- this is not something an HTTP request should block
    on. A per-send delay keeps this well under Resend's rate limit rather
    than firing hundreds of requests at once.

    Opt-out model: EmailPreference.promotional_emails defaults to True on
    the model itself, and the row is only ever created lazily the first
    time a user opens notification settings (see marketing.py's
    get_email_preferences) -- so most users have no row at all. Treating
    "no row" as opted-in (not opted-out, unlike send_event_email's stricter
    per-event check) is the correct read of that default for a broadcast
    like this; only an explicit promotional_emails=False should exclude
    someone.
    """
    import time
    from sqlmodel import Session, select
    from app.db.session import engine
    from app.models.user import User
    from app.models.marketing import EmailPreference
    from app.services.email_service import email_service

    sent = 0
    failed = 0
    skipped = 0

    with Session(engine) as session:
        opted_out_ids = set(
            session.exec(
                select(EmailPreference.user_id).where(EmailPreference.promotional_emails == False)  # noqa: E712
            ).all()
        )

        users = session.exec(
            select(User).where(User.email != None, User.email != "")  # noqa: E711
        ).all()

        total = len(users)
        logger.info(f"Marketing broadcast '{campaign_id}': {total} users, {len(opted_out_ids)} opted out")

        for i, user in enumerate(users):
            if user.id in opted_out_ids:
                skipped += 1
                continue

            try:
                ok = email_service.send_email(
                    to=user.email,
                    subject=subject,
                    html_content=html_content,
                    user_id=user.id,
                )
                if ok:
                    sent += 1
                else:
                    failed += 1
            except Exception as e:
                failed += 1
                logger.error(f"Broadcast send failed for user {user.id}: {e}")

            # ~6/sec -- comfortably under typical provider rate limits for a
            # background job with no user waiting on it.
            time.sleep(0.15)

            if (i + 1) % 200 == 0:
                logger.info(f"Marketing broadcast '{campaign_id}': {i + 1}/{total} processed")

    logger.info(
        f"Marketing broadcast '{campaign_id}' complete: "
        f"{sent} sent, {failed} failed, {skipped} opted out (of {total} users)"
    )
    return {"sent": sent, "failed": failed, "skipped": skipped, "total": total}
