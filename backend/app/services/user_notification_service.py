"""Service to send user notifications via email for marketplace events."""

import logging
from typing import Optional
from sqlmodel import Session
from app.models.user import User
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


class UserNotificationService:
    """Send email notifications to users for marketplace events."""

    def __init__(self):
        self.email_service = email_service

    def _should_send_email(self, user: Optional[User]) -> bool:
        """Check if user exists and has email notifications enabled."""
        if not user:
            return False
        return user.email_notifications is not False

    def notify_new_message(
        self,
        receiver: User,
        sender_name: str,
        message_content: str,
        listing_title: Optional[str] = None,
    ) -> bool:
        """Send email when user receives a message."""
        if not self._should_send_email(receiver):
            return False

        try:
            preview = message_content[:100]
            chat_url = "https://app.suqafuran.com/messages"

            return self.email_service.send_message_notification(
                email=receiver.email,
                name=receiver.full_name or "User",
                sender_name=sender_name,
                message_excerpt=preview,
                chat_url=chat_url,
                user_id=receiver.id,
            )
        except Exception as e:
            logger.error(f"Failed to send message notification to {receiver.email}: {e}")
            return False

    def notify_new_offer(
        self,
        seller: User,
        item_title: str,
        offer_amount: str,
        offer_id: int,
    ) -> bool:
        """Send email when seller receives an offer."""
        if not self._should_send_email(seller):
            return False

        try:
            offer_url = f"https://app.suqafuran.com/offers/{offer_id}"

            return self.email_service.send_offer_received(
                email=seller.email,
                name=seller.full_name or "User",
                item_title=item_title,
                offer_amount=offer_amount,
                offer_url=offer_url,
                user_id=seller.id,
            )
        except Exception as e:
            logger.error(f"Failed to send offer notification to {seller.email}: {e}")
            return False

    def notify_price_drop(
        self,
        user: User,
        item_title: str,
        old_price: str,
        new_price: str,
        listing_id: int,
        image_url: Optional[str] = None,
    ) -> bool:
        """Send email when watched item price drops."""
        if not self._should_send_email(user):
            return False

        try:
            return self.email_service.send_price_drop_alert(
                email=user.email,
                name=user.full_name or "User",
                listing_title=item_title,
                old_price=old_price,
                new_price=new_price,
                listing_id=listing_id,
                image_url=image_url,
                user_id=user.id,
            )
        except Exception as e:
            logger.error(f"Failed to send price drop notification to {user.email}: {e}")
            return False

    def notify_saved_search_matches(
        self,
        user: User,
        search_query: str,
        matched_listings: list,
    ) -> bool:
        """Send email when new listings match saved search."""
        if not self._should_send_email(user):
            return False

        try:
            # Convert listings to dict format
            items = [
                {
                    "id": item.id,
                    "title": item.title_en,
                    "price": f"{item.price:,.0f}",
                    "location": item.location,
                    "image_url": item.images[0] if item.images else None,
                }
                for item in matched_listings[:5]
            ]

            return self.email_service.send_saved_search_alert(
                email=user.email,
                name=user.full_name or "User",
                search_query=search_query,
                matched_listings=items,
                user_id=user.id,
            )
        except Exception as e:
            logger.error(f"Failed to send search match notification to {user.email}: {e}")
            return False

    def notify_order_status_update(
        self,
        user: User,
        order_id: str,
        item_title: str,
        status: str,
        delivery_estimate: str = "2-3 business days",
    ) -> bool:
        """Send email when order status updates."""
        if not self._should_send_email(user):
            return False

        try:
            return self.email_service.send_order_confirmation(
                email=user.email,
                name=user.full_name or "User",
                order_id=order_id,
                item_title=item_title,
                seller_name="Suqafuran Seller",
                delivery_estimate=delivery_estimate,
                user_id=user.id,
            )
        except Exception as e:
            logger.error(f"Failed to send order update notification to {user.email}: {e}")
            return False


# Global instance
user_notification_service = UserNotificationService()
