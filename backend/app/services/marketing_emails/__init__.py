"""Suqafuran Branded Marketing Email System.

Provides 7 production-ready, mobile-responsive ecommerce marketing templates
inspired by African marketplace patterns with Suqafuran's official brand identity
(#00BFFF primary, #0095D4 secondary, KSh formatting, and authentic marketplace data).
"""

from app.services.marketing_emails.components import (
    render_email_shell,
    render_header,
    render_footer,
    render_hero_banner,
    render_button,
    render_product_card,
    render_product_grid,
    render_category_chips,
    render_seller_tips_section,
    render_trust_strip,
    html_to_plain_text,
    format_ksh,
    sanitize,
    BRAND_PRIMARY,
    BRAND_SECONDARY,
    MARKETPLACE_URL,
    PHYSICAL_ADDRESS,
    SUPPORT_EMAIL,
)

from app.services.marketing_emails.templates import (
    render_welcome_template,
    render_product_discovery_template,
    render_weekly_roundup_template,
    render_seller_tips_template,
    render_category_discovery_template,
    render_seasonal_campaign_template,
    render_reengagement_template,
    render_marketing_template_preview,
    MARKETING_TEMPLATE_REGISTRY,
)

from app.services.marketing_emails.data import (
    resolve_recipient_name,
    get_active_categories,
    get_discovery_listings,
    get_weekly_roundup_listings,
    get_reengagement_listings,
)

from app.services.marketing_emails.sender import (
    check_marketing_consent,
    generate_tracking_token,
    get_unsubscribe_url,
    get_list_unsubscribe_headers,
    send_branded_marketing_email,
)

__all__ = [
    "render_email_shell",
    "render_header",
    "render_footer",
    "render_hero_banner",
    "render_button",
    "render_product_card",
    "render_product_grid",
    "render_category_chips",
    "render_seller_tips_section",
    "render_trust_strip",
    "html_to_plain_text",
    "format_ksh",
    "sanitize",
    "BRAND_PRIMARY",
    "BRAND_SECONDARY",
    "MARKETPLACE_URL",
    "PHYSICAL_ADDRESS",
    "SUPPORT_EMAIL",
    "render_welcome_template",
    "render_product_discovery_template",
    "render_weekly_roundup_template",
    "render_seller_tips_template",
    "render_category_discovery_template",
    "render_seasonal_campaign_template",
    "render_reengagement_template",
    "render_marketing_template_preview",
    "MARKETING_TEMPLATE_REGISTRY",
    "resolve_recipient_name",
    "get_active_categories",
    "get_discovery_listings",
    "get_weekly_roundup_listings",
    "get_reengagement_listings",
    "check_marketing_consent",
    "generate_tracking_token",
    "get_unsubscribe_url",
    "get_list_unsubscribe_headers",
    "send_branded_marketing_email",
]
