"""Email background tasks."""
from celery import shared_task
from celery.utils.log import get_task_logger
from typing import Optional, Any, Dict

logger = get_task_logger(__name__)


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
