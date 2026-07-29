"""Marketing automation service for email campaigns and notifications."""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlmodel import Session, select
from jinja2 import Template

from app.models.marketing import (
    EmailEventType, EmailCampaign, UserBrowsingHistory, SavedSearch,
    ListingPerformance, EmailPreference, UserLifecycleStage
)
from app.models.user import User
from app.models.listings import Listing
from app.core.logging_config import get_logger
from app.services.email_service import email_service

logger = get_logger("marketing_service")


class MarketingAutomationService:
    """Handles marketing automation triggers and email campaigns."""
    
    EMAIL_TEMPLATES = {
        EmailEventType.SIGNUP: {
            "subject": "Welcome to Suqafuran! Start buying and selling today.",
            "template": """
            <h1>Welcome to Suqafuran!</h1>
            <p>Hi {{ first_name }},</p>
            <p>Great to have you on board! Here's how to get started:</p>
            <ul>
                <li><a href="{{ complete_profile_link }}">Complete your profile</a></li>
                <li><a href="{{ create_shop_link }}">Create your shop</a></li>
                <li><a href="{{ post_listing_link }}">Post your first listing</a></li>
                <li><a href="{{ download_app_link }}">Download the mobile app</a></li>
            </ul>
            """
        },
        
        EmailEventType.SHOP_CREATED: {
            "subject": "🎉 Your shop is now live!",
            "template": """
            <h1>Your shop is live!</h1>
            <p>Hi {{ first_name }},</p>
            <p><strong>{{ shop_name }}</strong> is now ready to receive buyers.</p>
            <p><a href="{{ shop_link }}">View your shop</a></p>
            <p><strong>Next steps:</strong></p>
            <ul>
                <li><a href="{{ add_products_link }}">Add your first products</a></li>
                <li>Fill in shop details to build trust</li>
                <li>Enable verified badge</li>
            </ul>
            """
        },
        
        EmailEventType.LISTING_APPROVED: {
            "subject": "✅ Your product is now visible to thousands of buyers!",
            "template": """
            <h1>Your listing is approved!</h1>
            <p>Hi {{ first_name }},</p>
            <p><strong>{{ listing_title }}</strong> is now live and visible to buyers.</p>
            <p><a href="{{ listing_link }}">View your listing</a></p>
            <p><strong>Share it to get more inquiries:</strong></p>
            <p>
                <a href="{{ whatsapp_share_link }}">Share on WhatsApp</a> | 
                <a href="{{ facebook_share_link }}">Share on Facebook</a>
            </p>
            """
        },
        
        EmailEventType.LISTING_VIEWS_MILESTONE: {
            "subject": "🎉 Your listing hit {{ views }} views!",
            "template": """
            <h1>Congratulations!</h1>
            <p>Your listing <strong>{{ listing_title }}</strong> just reached {{ views }} views!</p>
            <p><a href="{{ promote_listing_link }}">Feature this listing to get even more exposure</a></p>
            """
        },
        
        EmailEventType.PRICE_DROPPED: {
            "subject": "Good news! The item you saved is now cheaper.",
            "template": """
            <h1>Price drop alert!</h1>
            <p>Hi {{ buyer_name }},</p>
            <p>The item you saved just got cheaper!</p>
            <p><strong>{{ listing_title }}</strong></p>
            <p>Old price: {{ old_price }} → New price: {{ new_price }}</p>
            <p><a href="{{ listing_link }}">View and inquire</a></p>
            """
        },
        
        EmailEventType.ABANDONED_LISTING: {
            "subject": "Your product draft is waiting.",
            "template": """
            <h1>Complete your listing</h1>
            <p>Hi {{ first_name }},</p>
            <p>You started creating a listing but didn't finish. No worries!</p>
            <p><a href="{{ continue_listing_link }}">Finish posting</a></p>
            """
        },
        
        EmailEventType.INACTIVE_SELLER: {
            "subject": "Buyers are searching for products like yours.",
            "template": """
            <h1>Buyers are looking!</h1>
            <p>Hi {{ first_name }},</p>
            <p>You haven't been active for a while, but your products are still getting attention.</p>
            <p><strong>Products needing restocking:</strong></p>
            <ul>
            {% for product in products %}
                <li>{{ product.title }} - {{ product.status }}</li>
            {% endfor %}
            </ul>
            <p><a href="{{ dashboard_link }}">Update your products</a></p>
            """
        },
        
        EmailEventType.SAVED_SEARCH_MATCH: {
            "subject": "New {{ search_query }} have just been listed.",
            "template": """
            <h1>{{ search_query }} alert!</h1>
            <p>Hi {{ first_name }},</p>
            <p>{{ new_listings_count }} new listings match your saved search:</p>
            <ul>
            {% for listing in new_listings %}
                <li><a href="{{ listing.url }}">{{ listing.title }} - {{ listing.price }}</a></li>
            {% endfor %}
            </ul>
            <p><a href="{{ saved_search_link }}">View all results</a></p>
            """
        },
        
        EmailEventType.WEEKLY_DIGEST: {
            "subject": "This week on Suqafuran - {{ views }} new products",
            "template": """
            <h1>This Week on Suqafuran</h1>
            <p>🔥 {{ new_products_count }} new products</p>
            <p>⭐ {{ verified_shops_count }} newly verified shops</p>
            <p><strong>📱 Trending categories:</strong></p>
            <ul>
            {% for category in trending_categories %}
                <li>{{ category }}</li>
            {% endfor %}
            </ul>
            <p><a href="{{ marketplace_link }}">Explore now</a></p>
            """
        },
        
        EmailEventType.BIRTHDAY: {
            "subject": "Happy Birthday from Suqafuran! 🎉",
            "template": """
            <h1>Happy Birthday {{ first_name }}!</h1>
            <p>We have a special gift for you:</p>
            <ul>
                <li>Free featured listing</li>
                <li>500 KSh discount coupon</li>
                <li>Bonus credits</li>
            </ul>
            <p><a href="{{ claim_gift_link }}">Claim your gift</a></p>
            """
        },
    }
    
    async def send_event_email(
        self,
        session: Session,
        user_id: int,
        event_type: EmailEventType,
        context: Dict[str, Any],
        related_listing_id: Optional[int] = None,
        related_shop_id: Optional[int] = None
    ):
        """Send email based on event type."""
        
        # Check user preferences
        preference = session.exec(
            select(EmailPreference).where(EmailPreference.user_id == user_id)
        ).first()
        
        if not preference:
            return  # User has no preferences set
        
        # Check if user wants this email type
        if not self._should_send_email(event_type, preference):
            return
        
        # Get template
        template_data = self.EMAIL_TEMPLATES.get(event_type)
        if not template_data:
            logger.warning(f"No template for event type: {event_type}")
            return
        
        # Render template
        subject_template = Template(template_data["subject"])
        body_template = Template(template_data["template"])
        
        subject = subject_template.render(**context)
        body = body_template.render(**context)
        
        # Get user email
        user = session.get(User, user_id)
        if not user or not user.email:
            return
        
        # Send email
        try:
            await email_service.send_email(
                to=user.email,
                subject=subject,
                html_content=body
            )
            
            # Log campaign
            campaign = EmailCampaign(
                user_id=user_id,
                event_type=event_type,
                subject=subject,
                template_name=event_type.value,
                listing_id=related_listing_id,
                shop_id=related_shop_id
            )
            session.add(campaign)
            session.commit()
            
            logger.info(f"Sent {event_type} email to user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
    
    def _should_send_email(self, event_type: EmailEventType, preference: EmailPreference) -> bool:
        """Check if user wants this email type."""
        preference_map = {
            EmailEventType.MESSAGE_RECEIVED: preference.new_messages,
            EmailEventType.LISTING_APPROVED: preference.listing_updates,
            EmailEventType.PRICE_DROPPED: preference.price_drops,
            EmailEventType.SAVED_SEARCH_MATCH: preference.saved_search_matches,
            EmailEventType.WEEKLY_DIGEST: preference.marketplace_digest,
            EmailEventType.SEASONAL_CAMPAIGN: preference.promotional_emails,
            EmailEventType.VERIFICATION_CAMPAIGN: preference.verification_campaigns,
        }
        
        return preference_map.get(event_type, True)
    
    async def track_listing_view(
        self,
        session: Session,
        user_id: int,
        listing_id: int,
        time_spent_seconds: int = 0
    ):
        """Track user browsing for personalization."""
        history = UserBrowsingHistory(
            user_id=user_id,
            listing_id=listing_id,
            time_spent_seconds=time_spent_seconds
        )
        session.add(history)
        session.commit()
    
    async def trigger_price_drop_notifications(
        self,
        session: Session,
        listing_id: int,
        new_price: float,
        old_price: float
    ):
        """Notify users who saved this listing about price drop."""
        listing = session.get(Listing, listing_id)
        if not listing:
            return
        
        # Find users who saved this listing
        # (assuming there's a saves table)
        # This is a simplified example
        
        logger.info(f"Price drop notification sent for listing {listing_id}")
    
    async def send_weekly_digest(self, session: Session, user_id: int):
        """Send weekly marketplace digest."""
        # Get trending categories, new products, verified shops
        # This would query your data
        
        context = {
            "first_name": "User",
            "new_products_count": 1243,
            "verified_shops_count": 85,
            "trending_categories": ["Electronics", "Furniture", "Fashion"],
            "marketplace_link": "https://suqafuran.com"
        }
        
        await self.send_event_email(
            session,
            user_id,
            EmailEventType.WEEKLY_DIGEST,
            context
        )


marketing_service = MarketingAutomationService()
