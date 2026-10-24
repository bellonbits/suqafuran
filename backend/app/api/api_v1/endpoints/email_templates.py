"""Admin endpoints for managing email templates."""

from typing import Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from jinja2 import Template
import json
import re

from app.api import deps
from app.models.user import User
from app.models.email_template import (
    EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate, EmailTemplateRead
)
from app.core.logging_config import get_logger

logger = get_logger("email_templates")

router = APIRouter()


class EmailTemplatePreviewRequest(BaseModel):
    html_content: str
    variables: dict[str, str]


def _check_admin_permission(current_user: User):
    """Verify user has admin permission."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage email templates"
        )


def _extract_template_variables(content: str) -> list[str]:
    """Extract Jinja2 template variables from content."""
    try:
        # Find all {{ variable }} patterns
        pattern = r'\{\{(?:\s*)([a-zA-Z_][a-zA-Z0-9_.]*)(?:\s*)\}\}'
        matches = set(re.findall(pattern, content))
        return sorted(list(matches))
    except Exception as e:
        logger.warning(f"Failed to extract variables: {e}")
        return []


@router.get("/", response_model=list[EmailTemplateRead])
def list_email_templates(
    event_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List email templates with optional filtering."""
    _check_admin_permission(current_user)

    query = select(EmailTemplate)

    if event_type:
        query = query.where(EmailTemplate.event_type == event_type)
    if is_active is not None:
        query = query.where(EmailTemplate.is_active == is_active)

    templates = db.exec(query.order_by(EmailTemplate.event_type)).all()
    return templates


@router.get("/{template_id}", response_model=EmailTemplateRead)
def get_email_template(
    template_id: int,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get a specific email template."""
    _check_admin_permission(current_user)

    template = db.get(EmailTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return template


@router.post("/", response_model=EmailTemplateRead)
def create_email_template(
    template_in: EmailTemplateCreate,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a new email template."""
    _check_admin_permission(current_user)

    # Check if template for this event_type already exists
    existing = db.exec(
        select(EmailTemplate).where(EmailTemplate.event_type == template_in.event_type)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Template for event type '{template_in.event_type}' already exists"
        )

    # Extract variables from templates
    variables = _extract_template_variables(template_in.html_content)
    if template_in.text_content:
        variables.extend(_extract_template_variables(template_in.text_content))
    variables = sorted(list(set(variables)))

    template = EmailTemplate(
        **template_in.dict(exclude={"variables"}),
        variables=json.dumps(variables),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    logger.info(f"Created email template: {template.event_type} (ID: {template.id})")
    return template


@router.put("/{template_id}", response_model=EmailTemplateRead)
def update_email_template(
    template_id: int,
    template_in: EmailTemplateUpdate,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update an email template."""
    _check_admin_permission(current_user)

    template = db.get(EmailTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Update fields
    update_data = template_in.dict(exclude_unset=True)

    # Re-extract variables if content changed
    if "html_content" in update_data or "text_content" in update_data:
        html = update_data.get("html_content", template.html_content)
        text = update_data.get("text_content", template.text_content)

        variables = _extract_template_variables(html)
        if text:
            variables.extend(_extract_template_variables(text))
        variables = sorted(list(set(variables)))

        update_data["variables"] = json.dumps(variables)

    update_data["updated_at"] = datetime.utcnow()
    update_data["updated_by"] = current_user.id

    for field, value in update_data.items():
        setattr(template, field, value)

    db.add(template)
    db.commit()
    db.refresh(template)

    logger.info(f"Updated email template: {template.event_type} (ID: {template.id})")
    return template


@router.delete("/{template_id}")
def delete_email_template(
    template_id: int,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete an email template (soft delete by marking inactive)."""
    _check_admin_permission(current_user)

    template = db.get(EmailTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Soft delete by marking inactive
    template.is_active = False
    template.updated_at = datetime.utcnow()
    template.updated_by = current_user.id
    db.add(template)
    db.commit()

    logger.info(f"Deactivated email template: {template.event_type} (ID: {template.id})")
    return {"status": "deleted", "id": template_id}


@router.post("/{template_id}/preview")
def preview_email_template(
    template_id: int,
    preview_data: EmailTemplatePreviewRequest,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Preview email template with sample data."""
    _check_admin_permission(current_user)

    try:
        # Render template with provided variables
        html_template = Template(preview_data.html_content)
        rendered_html = html_template.render(**preview_data.variables)

        return {
            "status": "success",
            "html": rendered_html,
            "variables_used": list(preview_data.variables.keys())
        }
    except Exception as e:
        logger.error(f"Failed to render template preview: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template rendering failed: {str(e)}"
        )


@router.post("/{template_id}/restore")
def restore_email_template(
    template_id: int,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Restore a deactivated email template."""
    _check_admin_permission(current_user)

    template = db.get(EmailTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    template.is_active = True
    template.updated_at = datetime.utcnow()
    template.updated_by = current_user.id
    db.add(template)
    db.commit()
    db.refresh(template)

    logger.info(f"Restored email template: {template.event_type} (ID: {template.id})")
    return template


# ─────────────────────────────────────────────────────────────
# Marketing Email Campaign System Endpoints
# ─────────────────────────────────────────────────────────────

class MarketingPreviewRequest(BaseModel):
    template_key: str
    recipient_name: Optional[str] = "Abdi"
    subject: Optional[str] = None
    headline: Optional[str] = None
    body_text: Optional[str] = None
    discount_badge: Optional[str] = None
    campaign_dates: Optional[str] = None
    hero_image_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    include_sample_listings: bool = True
    view_mode: str = "desktop"  # desktop or mobile


class MarketingTestSendRequest(BaseModel):
    template_key: str
    test_email: str
    recipient_name: Optional[str] = "Admin Tester"
    subject: Optional[str] = None
    headline: Optional[str] = None
    body_text: Optional[str] = None
    discount_badge: Optional[str] = None
    campaign_dates: Optional[str] = None
    hero_image_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    include_sample_listings: bool = True


@router.get("/marketing/catalog")
def get_marketing_catalog(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List the 7 active branded marketing email campaign templates and their configurations."""
    _check_admin_permission(current_user)

    catalog = [
        {
            "key": "welcome",
            "name": "Welcome to Suqafuran",
            "default_subject": "Karibu Suqafuran — discover something you’ll love",
            "default_preview_text": "Explore listings, discover local sellers, and find what you need.",
            "description": "Welcomes verified users who opted in to marketing updates. Introduces the marketplace and categories.",
            "supports_listings": False,
            "supports_categories": True,
        },
        {
            "key": "product_discovery",
            "name": "Product Discovery",
            "default_subject": "Kuna kitu poa unatafuta?",
            "default_preview_text": "Explore available listings and see what catches your eye.",
            "description": "Features 2 to 4 real active listings with prices in KSh and locations; gracefully falls back to categories if empty.",
            "supports_listings": True,
            "supports_categories": True,
        },
        {
            "key": "weekly_roundup",
            "name": "Weekly Marketplace Roundup",
            "default_subject": "Your Suqafuran marketplace roundup",
            "default_preview_text": "Take a look at listings available on Suqafuran this week.",
            "description": "Weekly digest of fresh marketplace picks written in simple Kenyan English.",
            "supports_listings": True,
            "supports_categories": True,
        },
        {
            "key": "seller_tips",
            "name": "Seller Promotion and Listing Tips",
            "default_subject": "Make your listings easier to discover",
            "default_preview_text": "A few simple ways to improve your product listings.",
            "description": "Practical advice for sellers on titles, natural photography, honest pricing in KSh, and prompt replies.",
            "supports_listings": False,
            "supports_categories": False,
        },
        {
            "key": "category_discovery",
            "name": "Category Discovery",
            "default_subject": "What are you looking for today?",
            "default_preview_text": "Browse categories and discover available products.",
            "description": "Introduces users to marketplace categories that actually exist on Suqafuran.",
            "supports_listings": False,
            "supports_categories": True,
        },
        {
            "key": "seasonal_campaign",
            "name": "Seasonal or Special Campaign",
            "default_subject": "Special Marketplace Deals on Suqafuran",
            "default_preview_text": "Discover verified picks and special marketplace highlights.",
            "description": "Fully configurable template for future holidays, celebrations, or verified promotions without hardcoded fake discounts.",
            "supports_listings": True,
            "supports_categories": False,
        },
        {
            "key": "reengagement",
            "name": "Re-engagement",
            "default_subject": "See what’s available on Suqafuran",
            "default_preview_text": "Explore listings and see what you might find.",
            "description": "Friendly, non-pressuring message inviting inactive users to see what is new.",
            "supports_listings": True,
            "supports_categories": True,
        },
    ]
    return {"templates": catalog, "total": len(catalog)}


@router.post("/marketing/preview")
def preview_marketing_template(
    payload: MarketingPreviewRequest,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Generate desktop and mobile HTML and plain-text previews of any marketing campaign."""
    _check_admin_permission(current_user)

    from app.services.marketing_emails import (
        render_welcome_template,
        render_product_discovery_template,
        render_weekly_roundup_template,
        render_seller_tips_template,
        render_category_discovery_template,
        render_seasonal_campaign_template,
        render_reengagement_template,
        get_active_categories,
        get_discovery_listings,
    )

    cats = get_active_categories(db, limit=8)
    listings = get_discovery_listings(db, limit=4) if payload.include_sample_listings else []

    key = payload.template_key.lower().strip()
    name = payload.recipient_name or "there"

    if key in ["welcome", "onboarding_welcome"]:
        rendered = render_welcome_template(recipient_name=name, categories=cats)
    elif key in ["product_discovery"]:
        rendered = render_product_discovery_template(recipient_name=name, listings=listings, categories=cats)
    elif key in ["weekly_roundup", "weekly_digest", "retention_weekly_digest"]:
        rendered = render_weekly_roundup_template(recipient_name=name, listings=listings, categories=cats)
    elif key in ["seller_tips", "seller_growth_tips"]:
        rendered = render_seller_tips_template(recipient_name=name)
    elif key in ["category_discovery", "retention_category_interest"]:
        rendered = render_category_discovery_template(recipient_name=name, categories=cats)
    elif key in ["seasonal_campaign"]:
        rendered = render_seasonal_campaign_template(
            recipient_name=name,
            subject_line=payload.subject,
            headline=payload.headline,
            body_text=payload.body_text,
            hero_image_url=payload.hero_image_url,
            discount_badge=payload.discount_badge,
            campaign_dates=payload.campaign_dates,
            listings=listings,
            cta_text=payload.cta_text or "Explore campaign deals",
            cta_url=payload.cta_url,
        )
    elif key in ["reengagement", "retention_reengagement", "promotional_reengagement"]:
        rendered = render_reengagement_template(recipient_name=name, listings=listings, categories=cats)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown template key '{key}'. Valid keys: welcome, product_discovery, weekly_roundup, seller_tips, category_discovery, seasonal_campaign, reengagement."
        )

    # Optional overrides for subject
    if payload.subject and key != "seasonal_campaign":
        rendered["subject"] = payload.subject

    return {
        "status": "success",
        "template_key": key,
        "name": rendered["name"],
        "subject": rendered["subject"],
        "preview_text": rendered["preview_text"],
        "html": rendered["html"],
        "text": rendered["text"],
        "view_mode": payload.view_mode,
        "sample_item_count": len(listings),
    }


@router.post("/marketing/send-test")
def send_test_marketing_email(
    payload: MarketingTestSendRequest,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Send a safe test marketing email to an explicitly specified test address."""
    _check_admin_permission(current_user)

    target_email = payload.test_email.strip().lower()
    if not target_email or "@" not in target_email:
        raise HTTPException(status_code=400, detail="A valid test recipient email address is required")

    from app.services.marketing_emails import (
        render_welcome_template,
        render_product_discovery_template,
        render_weekly_roundup_template,
        render_seller_tips_template,
        render_category_discovery_template,
        render_seasonal_campaign_template,
        render_reengagement_template,
        get_active_categories,
        get_discovery_listings,
        generate_tracking_token,
        get_unsubscribe_url,
    )
    from app.services.email_service import email_service

    cats = get_active_categories(db, limit=8)
    listings = get_discovery_listings(db, limit=4) if payload.include_sample_listings else []

    key = payload.template_key.lower().strip()
    name = payload.recipient_name or "Admin Tester"

    token = generate_tracking_token()
    unsub_url = get_unsubscribe_url(token)

    if key in ["welcome", "onboarding_welcome"]:
        rendered = render_welcome_template(recipient_name=name, categories=cats, unsubscribe_url=unsub_url)
    elif key in ["product_discovery"]:
        rendered = render_product_discovery_template(recipient_name=name, listings=listings, categories=cats, unsubscribe_url=unsub_url)
    elif key in ["weekly_roundup", "weekly_digest", "retention_weekly_digest"]:
        rendered = render_weekly_roundup_template(recipient_name=name, listings=listings, categories=cats, unsubscribe_url=unsub_url)
    elif key in ["seller_tips", "seller_growth_tips"]:
        rendered = render_seller_tips_template(recipient_name=name, unsubscribe_url=unsub_url)
    elif key in ["category_discovery", "retention_category_interest"]:
        rendered = render_category_discovery_template(recipient_name=name, categories=cats, unsubscribe_url=unsub_url)
    elif key in ["seasonal_campaign"]:
        rendered = render_seasonal_campaign_template(
            recipient_name=name,
            subject_line=payload.subject,
            headline=payload.headline,
            body_text=payload.body_text,
            hero_image_url=payload.hero_image_url,
            discount_badge=payload.discount_badge,
            campaign_dates=payload.campaign_dates,
            listings=listings,
            cta_text=payload.cta_text or "Explore campaign deals",
            cta_url=payload.cta_url,
            unsubscribe_url=unsub_url,
        )
    elif key in ["reengagement", "retention_reengagement", "promotional_reengagement"]:
        rendered = render_reengagement_template(recipient_name=name, listings=listings, categories=cats, unsubscribe_url=unsub_url)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown template key '{key}'")

    test_subject = f"[TEST] {payload.subject or rendered['subject']}"

    # Send using email_service with preferred_provider="brevo"
    success = email_service._send_and_log(
        email=target_email,
        subject=test_subject,
        html_body=rendered["html"],
        email_type=f"test_marketing_{key}",
        user_id=current_user.id,
        campaign_id=f"test_{key}",
        metadata={"is_test": True, "template_key": key, "list_unsubscribe_url": unsub_url},
        preferred_provider="brevo",
    )

    return {
        "status": "success" if success else "failed",
        "recipient": target_email,
        "template_key": key,
        "subject": test_subject,
        "message": f"Test email sent to {target_email}" if success else "Provider send failed (check logs)",
    }

