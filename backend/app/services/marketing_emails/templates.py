"""The 7 branded Suqafuran marketing email templates.

Each template provides:
1. Dynamic, production-grade responsive HTML email rendering using Suqafuran branding.
2. Synchronized plain-text alternative.
3. Clean parameter validation and genuine data integration with fallbacks.
"""

from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.services.marketing_emails.components import (
    render_email_shell,
    render_hero_banner,
    render_button,
    render_product_grid,
    render_category_chips,
    render_seller_tips_section,
    render_trust_strip,
    html_to_plain_text,
    sanitize,
    BRAND_PRIMARY,
    COLOR_BG_CARD,
    COLOR_BG_NEUTRAL,
    COLOR_BORDER,
    COLOR_TEXT_MAIN,
    COLOR_TEXT_BODY,
    COLOR_TEXT_MUTED,
    COLOR_ACCENT_BG,
    MARKETPLACE_URL,
)
from app.services.marketing_emails.data import FALLBACK_CATEGORIES


# ─────────────────────────────────────────────────────────────
# 1. Welcome to Suqafuran
# ─────────────────────────────────────────────────────────────
def render_welcome_template(
    recipient_name: str = "there",
    categories: Optional[List[Dict[str, Any]]] = None,
    unsubscribe_url: Optional[str] = None
) -> Dict[str, str]:
    """Email 1: Welcome to Suqafuran.
    
    Welcomes new users who opted in to marketing updates.
    Introduces marketplace features, categories, and simple discovery.
    """
    subject = "Karibu Suqafuran — discover something you’ll love"
    preview_text = "Explore listings, discover local sellers, and find what you need."
    name = sanitize(recipient_name or "there")
    cats = categories or FALLBACK_CATEGORIES

    content_html = f"""
    <!-- Welcome Intro -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top: 24px;">
      <tr>
        <td align="center" style="padding-bottom: 20px;">
          <div style="display: inline-block; background-color: {COLOR_ACCENT_BG}; color: #0284C7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 14px; border-radius: 20px; border: 1px solid #BAE6FD;">
            Karibu Suqafuran
          </div>
          <h1 style="margin: 12px 0 8px 0; font-size: 26px; line-height: 1.3; font-weight: 800; color: {COLOR_TEXT_MAIN}; letter-spacing: -0.4px;">
            Karibu Suqafuran, {name}! 👋
          </h1>
          <p style="margin: 0 auto; max-width: 480px; font-size: 15px; line-height: 1.6; color: {COLOR_TEXT_BODY};">
            Discover thousands of listings from verified local sellers across Kenya. Whether you're looking for everyday tech, fashion, or home essentials, find what you need right here.
          </p>
        </td>
      </tr>
    </table>

    <!-- Highlights Grid -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 8px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 16px; background-color: {COLOR_BG_NEUTRAL}; border: 1px solid {COLOR_BORDER}; border-radius: 12px;">
          <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="36" valign="top" style="font-size: 20px; line-height: 1;">🛍️</td>
              <td style="padding-left: 10px;">
                <div style="font-weight: 700; font-size: 14px; color: {COLOR_TEXT_MAIN};">Explore Genuine Listings</div>
                <div style="font-size: 13px; color: {COLOR_TEXT_BODY}; margin-top: 2px;">Find verified products with real photos, transparent prices in KSh, and clear descriptions.</div>
              </td>
            </tr>
            <tr><td height="12"></td></tr>
            <tr>
              <td width="36" valign="top" style="font-size: 20px; line-height: 1;">💬</td>
              <td style="padding-left: 10px;">
                <div style="font-weight: 700; font-size: 14px; color: {COLOR_TEXT_MAIN};">Connect Directly with Sellers</div>
                <div style="font-size: 13px; color: {COLOR_TEXT_BODY}; margin-top: 2px;">Chat in real-time, ask questions, negotiate terms, and agree on convenient meetups.</div>
              </td>
            </tr>
            <tr><td height="12"></td></tr>
            <tr>
              <td width="36" valign="top" style="font-size: 20px; line-height: 1;">🛡️</td>
              <td style="padding-left: 10px;">
                <div style="font-weight: 700; font-size: 14px; color: {COLOR_TEXT_MAIN};">Safe Local Transactions</div>
                <div style="font-size: 13px; color: {COLOR_TEXT_BODY}; margin-top: 2px;">Meet safely in public spots, inspect the item first, and pay upon satisfaction.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Primary CTA -->
    <div style="text-align: center; margin: 24px 0 16px 0;">
      {render_button(text="Explore listings", url=f"{MARKETPLACE_URL}/search", variant="primary")}
    </div>

    <!-- Category Discovery Chips -->
    {render_category_chips(categories=cats, title="Popular Categories to Explore")}

    {render_trust_strip()}
    """

    html = render_email_shell(
        title=subject,
        preheader_text=preview_text,
        content_html=content_html,
        unsubscribe_url=unsubscribe_url
    )
    text = html_to_plain_text(html)

    return {
        "key": "welcome",
        "name": "Welcome to Suqafuran",
        "subject": subject,
        "preview_text": preview_text,
        "html": html,
        "text": text,
    }


# ─────────────────────────────────────────────────────────────
# 2. Product Discovery
# ─────────────────────────────────────────────────────────────
def render_product_discovery_template(
    recipient_name: str = "there",
    listings: Optional[List[Dict[str, Any]]] = None,
    categories: Optional[List[Dict[str, Any]]] = None,
    unsubscribe_url: Optional[str] = None
) -> Dict[str, str]:
    """Email 2: Product Discovery.
    
    Helps users discover relevant listings with cards, pricing, and locations.
    Gracefully falls back to category discovery if listings are unavailable.
    """
    subject = "Kuna kitu poa unatafuta?"
    preview_text = "Explore available listings and see what catches your eye."
    name = sanitize(recipient_name or "there")
    items = listings or []
    cats = categories or FALLBACK_CATEGORIES

    if len(items) >= 2:
        products_section = f"""
        <div style="margin-top: 16px; margin-bottom: 8px;">
          <h2 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 800; color: {COLOR_TEXT_MAIN};">
            Today's Marketplace Picks
          </h2>
          <p style="margin: 0; font-size: 13px; color: {COLOR_TEXT_MUTED};">
            Verified items currently available from local sellers near you.
          </p>
        </div>
        {render_product_grid(items, max_items=4)}
        """
    else:
        # Graceful fallback: If listings are unavailable or insufficient, display category discovery
        products_section = f"""
        <div style="padding: 16px 0;">
          {render_category_chips(categories=cats, title="Browse Popular Categories")}
        </div>
        """

    content_html = f"""
    <!-- Discovery Header -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top: 24px;">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <div style="display: inline-block; background-color: {COLOR_ACCENT_BG}; color: #0284C7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 14px; border-radius: 20px; border: 1px solid #BAE6FD;">
            Discover on Suqafuran
          </div>
          <h1 style="margin: 12px 0 8px 0; font-size: 26px; line-height: 1.3; font-weight: 800; color: {COLOR_TEXT_MAIN}; letter-spacing: -0.4px;">
            Kuna kitu poa unatafuta?
          </h1>
          <p style="margin: 0 auto; max-width: 480px; font-size: 15px; line-height: 1.6; color: {COLOR_TEXT_BODY};">
            Hello {name}, local sellers have uploaded fresh listings on Suqafuran today. Angalia what's available and see what catches your eye.
          </p>
        </td>
      </tr>
    </table>

    {products_section}

    <div style="text-align: center; margin: 24px 0 12px 0;">
      {render_button(text="Explore listings", url=f"{MARKETPLACE_URL}/search", variant="primary")}
    </div>

    {render_trust_strip()}
    """

    html = render_email_shell(
        title=subject,
        preheader_text=preview_text,
        content_html=content_html,
        unsubscribe_url=unsubscribe_url
    )
    text = html_to_plain_text(html)

    return {
        "key": "product_discovery",
        "name": "Product Discovery",
        "subject": subject,
        "preview_text": preview_text,
        "html": html,
        "text": text,
    }


# ─────────────────────────────────────────────────────────────
# 3. Weekly Marketplace Roundup
# ─────────────────────────────────────────────────────────────
def render_weekly_roundup_template(
    recipient_name: str = "there",
    listings: Optional[List[Dict[str, Any]]] = None,
    categories: Optional[List[Dict[str, Any]]] = None,
    location: str = "Kenya",
    unsubscribe_url: Optional[str] = None
) -> Dict[str, str]:
    """Email 3: Weekly Marketplace Roundup.
    
    Digest of genuine marketplace listings in simple Kenyan English.
    """
    subject = "Your Suqafuran marketplace roundup"
    preview_text = "Take a look at listings available on Suqafuran this week."
    name = sanitize(recipient_name or "there")
    loc = sanitize(location or "Kenya")
    items = listings or []
    cats = categories or FALLBACK_CATEGORIES

    product_content = render_product_grid(items, max_items=6) if items else ""

    content_html = f"""
    <!-- Weekly Roundup Header -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top: 24px;">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <div style="display: inline-block; background-color: {COLOR_ACCENT_BG}; color: #0284C7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 14px; border-radius: 20px; border: 1px solid #BAE6FD;">
            Weekly Digest
          </div>
          <h1 style="margin: 12px 0 8px 0; font-size: 26px; line-height: 1.3; font-weight: 800; color: {COLOR_TEXT_MAIN}; letter-spacing: -0.4px;">
            Your Suqafuran marketplace roundup
          </h1>
          <p style="margin: 0 auto; max-width: 480px; font-size: 15px; line-height: 1.6; color: {COLOR_TEXT_BODY};">
            Hello {name}, take a look at listings available on Suqafuran this week in {loc}. Discover authentic deals from local sellers.
          </p>
        </td>
      </tr>
    </table>

    <div style="margin-top: 12px;">
      {product_content}
    </div>

    <div style="text-align: center; margin: 24px 0 16px 0;">
      {render_button(text="Explore more listings", url=f"{MARKETPLACE_URL}/search", variant="primary")}
    </div>

    {render_category_chips(categories=cats, title="Shop by Category")}

    {render_trust_strip()}
    """

    html = render_email_shell(
        title=subject,
        preheader_text=preview_text,
        content_html=content_html,
        unsubscribe_url=unsubscribe_url
    )
    text = html_to_plain_text(html)

    return {
        "key": "weekly_roundup",
        "name": "Weekly Marketplace Roundup",
        "subject": subject,
        "preview_text": preview_text,
        "html": html,
        "text": text,
    }


# ─────────────────────────────────────────────────────────────
# 4. Seller Promotion and Listing Tips
# ─────────────────────────────────────────────────────────────
def render_seller_tips_template(
    recipient_name: str = "there",
    seller_dashboard_url: Optional[str] = None,
    manage_listings_url: Optional[str] = None,
    unsubscribe_url: Optional[str] = None
) -> Dict[str, str]:
    """Email 4: Seller Promotion and Listing Tips.
    
    Helps sellers understand how to present listings effectively without false promises.
    """
    subject = "Make your listings easier to discover"
    preview_text = "A few simple ways to improve your product listings."
    name = sanitize(recipient_name or "there")
    cta_destination = manage_listings_url or seller_dashboard_url or f"{MARKETPLACE_URL}/post"

    content_html = f"""
    <!-- Seller Tips Header -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top: 24px;">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <div style="display: inline-block; background-color: {COLOR_ACCENT_BG}; color: #0284C7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 14px; border-radius: 20px; border: 1px solid #BAE6FD;">
            Seller Guide
          </div>
          <h1 style="margin: 12px 0 8px 0; font-size: 26px; line-height: 1.3; font-weight: 800; color: {COLOR_TEXT_MAIN}; letter-spacing: -0.4px;">
            Make your listings easier to discover
          </h1>
          <p style="margin: 0 auto; max-width: 480px; font-size: 15px; line-height: 1.6; color: {COLOR_TEXT_BODY};">
            Hello {name}, presenting your products clearly makes a real difference. Here are four practical ways to connect with serious buyers on Suqafuran:
          </p>
        </td>
      </tr>
    </table>

    {render_seller_tips_section()}

    <!-- Manage Listings CTA -->
    <div style="text-align: center; margin: 28px 0 16px 0;">
      {render_button(text="Manage your listings", url=cta_destination, variant="primary")}
    </div>

    <!-- Seller Reminder -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 20px; background-color: {COLOR_BG_NEUTRAL}; border-radius: 10px; border: 1px solid {COLOR_BORDER};">
      <tr>
        <td style="padding: 16px 20px; text-align: center; font-size: 13px; color: {COLOR_TEXT_MUTED}; line-height: 1.6;">
          💡 <em>Pro-tip:</em> Keep your listings up to date. If an item is sold, marking it sold keeps your seller rating high.
        </td>
      </tr>
    </table>
    """

    html = render_email_shell(
        title=subject,
        preheader_text=preview_text,
        content_html=content_html,
        unsubscribe_url=unsubscribe_url
    )
    text = html_to_plain_text(html)

    return {
        "key": "seller_tips",
        "name": "Seller Promotion and Listing Tips",
        "subject": subject,
        "preview_text": preview_text,
        "html": html,
        "text": text,
    }


# ─────────────────────────────────────────────────────────────
# 5. Category Discovery
# ─────────────────────────────────────────────────────────────
def render_category_discovery_template(
    recipient_name: str = "there",
    categories: Optional[List[Dict[str, Any]]] = None,
    unsubscribe_url: Optional[str] = None
) -> Dict[str, str]:
    """Email 5: Category Discovery.
    
    Introduces users to marketplace categories that actually exist on Suqafuran.
    """
    subject = "What are you looking for today?"
    preview_text = "Browse categories and discover available products."
    name = sanitize(recipient_name or "there")
    cats = categories or FALLBACK_CATEGORIES

    # Category Grid Cards
    cards_html = ""
    for c in cats[:8]:
        cat_name = sanitize(c.get("name_en") or c.get("name") or "Category")
        slug = sanitize(c.get("slug") or str(c.get("id") or ""))
        cat_url = f"{MARKETPLACE_URL}/search?category={slug}"

        cards_html += f"""
        <td class="stack-column" width="50%" valign="top" style="padding: 6px;">
          <a href="{cat_url}" target="_blank" style="display: block; text-decoration: none; background-color: {COLOR_BG_NEUTRAL}; border: 1px solid {COLOR_BORDER}; border-radius: 10px; padding: 18px 16px; text-align: center;">
            <div style="font-weight: 700; font-size: 14px; color: {COLOR_TEXT_MAIN}; margin-bottom: 4px;">
              {cat_name}
            </div>
            <div style="font-size: 12px; color: #0284C7; font-weight: 600;">
              Browse listings &rarr;
            </div>
          </a>
        </td>
        """

    # Wrap cards in rows of 2
    row_chunks = ""
    col_items = [cards_html.split("</td>")[i] + "</td>" for i in range(len(cards_html.split("</td>")) - 1)]
    for i in range(0, len(col_items), 2):
        c1 = col_items[i]
        c2 = col_items[i+1] if i+1 < len(col_items) else '<td class="stack-column" width="50%"></td>'
        row_chunks += f"<tr>{c1}{c2}</tr>"

    content_html = f"""
    <!-- Category Discovery Header -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top: 24px;">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <div style="display: inline-block; background-color: {COLOR_ACCENT_BG}; color: #0284C7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 14px; border-radius: 20px; border: 1px solid #BAE6FD;">
            Marketplace Categories
          </div>
          <h1 style="margin: 12px 0 8px 0; font-size: 26px; line-height: 1.3; font-weight: 800; color: {COLOR_TEXT_MAIN}; letter-spacing: -0.4px;">
            What are you looking for today?
          </h1>
          <p style="margin: 0 auto; max-width: 480px; font-size: 15px; line-height: 1.6; color: {COLOR_TEXT_BODY};">
            Hello {name}, browse categories and discover verified products listed by trusted sellers across Kenya.
          </p>
        </td>
      </tr>
    </table>

    <!-- Category Grid -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 12px; margin-bottom: 16px;">
      {row_chunks}
    </table>

    <div style="text-align: center; margin: 24px 0 16px 0;">
      {render_button(text="Explore all listings", url=f"{MARKETPLACE_URL}/search", variant="primary")}
    </div>

    {render_trust_strip()}
    """

    html = render_email_shell(
        title=subject,
        preheader_text=preview_text,
        content_html=content_html,
        unsubscribe_url=unsubscribe_url
    )
    text = html_to_plain_text(html)

    return {
        "key": "category_discovery",
        "name": "Category Discovery",
        "subject": subject,
        "preview_text": preview_text,
        "html": html,
        "text": text,
    }


# ─────────────────────────────────────────────────────────────
# 6. Seasonal or Special Campaign
# ─────────────────────────────────────────────────────────────
def render_seasonal_campaign_template(
    recipient_name: str = "there",
    subject_line: Optional[str] = None,
    preview_text_line: Optional[str] = None,
    headline: Optional[str] = None,
    body_text: Optional[str] = None,
    hero_image_url: Optional[str] = None,
    discount_badge: Optional[str] = None,
    campaign_dates: Optional[str] = None,
    listings: Optional[List[Dict[str, Any]]] = None,
    cta_text: str = "Explore campaign deals",
    cta_url: Optional[str] = None,
    unsubscribe_url: Optional[str] = None
) -> Dict[str, str]:
    """Email 6: Seasonal or Special Campaign.
    
    Supports holiday, marketplace events, or verified promotional campaigns.
    Configurable headline, body, hero, dates, and optional product section.
    Displays discount only when verified campaign data provides it.
    """
    subject = subject_line or "Special Marketplace Highlights on Suqafuran"
    preview_text = preview_text_line or "Discover verified picks and special marketplace highlights."
    name = sanitize(recipient_name or "there")
    
    title_display = headline or "Special Marketplace Highlights"
    body_display = body_text or f"Hello {name}, discover curated marketplace picks from verified sellers on Suqafuran."
    button_url = cta_url or f"{MARKETPLACE_URL}/search"

    promo_badge_html = ""
    if discount_badge:
        promo_badge_html = f"""
        <div style="display: inline-block; background-color: #FEF3C7; border: 1px solid #FDE68A; color: #92400E; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 14px; border-radius: 20px; margin-bottom: 12px;">
          🏷️ {sanitize(discount_badge)}
        </div>
        """

    dates_html = ""
    if campaign_dates:
        dates_html = f"""
        <div style="margin-top: 10px; font-size: 13px; color: {COLOR_TEXT_MUTED}; font-weight: 600;">
          &#128197; {sanitize(campaign_dates)}
        </div>
        """

    hero_img_html = ""
    if hero_image_url:
        hero_img_html = f"""
        <div style="margin-bottom: 20px;">
          <img src="{sanitize(hero_image_url)}" alt="{sanitize(title_display)}" width="560" style="width: 100%; max-width: 560px; height: auto; border-radius: 12px; display: block; border: 0;" />
        </div>
        """

    product_section_html = ""
    if listings and len(listings) > 0:
        product_section_html = f"""
        <div style="margin-top: 24px; margin-bottom: 8px;">
          <h2 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 800; color: {COLOR_TEXT_MAIN};">
            Featured in this Campaign
          </h2>
        </div>
        {render_product_grid(listings, max_items=4)}
        """

    content_html = f"""
    <!-- Campaign Header -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top: 24px;">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          {promo_badge_html}
          {hero_img_html}
          <h1 style="margin: 8px 0; font-size: 26px; line-height: 1.3; font-weight: 800; color: {COLOR_TEXT_MAIN}; letter-spacing: -0.4px;">
            {sanitize(title_display)}
          </h1>
          <p style="margin: 0 auto; max-width: 480px; font-size: 15px; line-height: 1.6; color: {COLOR_TEXT_BODY};">
            {sanitize(body_display)}
          </p>
          {dates_html}
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 16px 0 20px 0;">
      {render_button(text=cta_text, url=button_url, variant="primary")}
    </div>

    {product_section_html}

    {render_trust_strip()}
    """

    html = render_email_shell(
        title=subject,
        preheader_text=preview_text,
        content_html=content_html,
        unsubscribe_url=unsubscribe_url
    )
    text = html_to_plain_text(html)

    return {
        "key": "seasonal_campaign",
        "name": "Seasonal or Special Campaign",
        "subject": subject,
        "preview_text": preview_text,
        "html": html,
        "text": text,
    }


# ─────────────────────────────────────────────────────────────
# 7. Re-engagement
# ─────────────────────────────────────────────────────────────
def render_reengagement_template(
    recipient_name: str = "there",
    listings: Optional[List[Dict[str, Any]]] = None,
    categories: Optional[List[Dict[str, Any]]] = None,
    unsubscribe_url: Optional[str] = None
) -> Dict[str, str]:
    """Email 7: Re-engagement.
    
    Invites inactive users to revisit the marketplace using a friendly,
    non-pressuring tone without false urgency or shame.
    """
    subject = "See what’s available on Suqafuran"
    preview_text = "Explore listings and see what you might find."
    name = sanitize(recipient_name or "there")
    items = listings or []
    cats = categories or FALLBACK_CATEGORIES

    product_content = ""
    if items and len(items) >= 2:
        product_content = f"""
        <div style="margin-top: 16px; margin-bottom: 8px;">
          <h2 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 800; color: {COLOR_TEXT_MAIN};">
            Recently Added on Suqafuran
          </h2>
          <p style="margin: 0; font-size: 13px; color: {COLOR_TEXT_MUTED};">
            Here are a few verified listings available right now.
          </p>
        </div>
        {render_product_grid(items, max_items=4)}
        """
    else:
        product_content = f"""
        <div style="padding: 12px 0;">
          {render_category_chips(categories=cats, title="Browse Popular Categories")}
        </div>
        """

    content_html = f"""
    <!-- Re-engagement Header -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="padding-top: 24px;">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <div style="display: inline-block; background-color: {COLOR_ACCENT_BG}; color: #0284C7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 14px; border-radius: 20px; border: 1px solid #BAE6FD;">
            Suqafuran Updates
          </div>
          <h1 style="margin: 12px 0 8px 0; font-size: 26px; line-height: 1.3; font-weight: 800; color: {COLOR_TEXT_MAIN}; letter-spacing: -0.4px;">
            See what’s available on Suqafuran
          </h1>
          <p style="margin: 0 auto; max-width: 480px; font-size: 15px; line-height: 1.6; color: {COLOR_TEXT_BODY};">
            Hello {name}, it's been a little while! Angalia what's available — verified local sellers add new listings every day, and we're here whenever you're ready to find what you need.
          </p>
        </td>
      </tr>
    </table>

    {product_content}

    <div style="text-align: center; margin: 24px 0 16px 0;">
      {render_button(text="Explore listings", url=f"{MARKETPLACE_URL}/search", variant="primary")}
    </div>

    {render_trust_strip()}
    """

    html = render_email_shell(
        title=subject,
        preheader_text=preview_text,
        content_html=content_html,
        unsubscribe_url=unsubscribe_url
    )
    text = html_to_plain_text(html)

    return {
        "key": "reengagement",
        "name": "Re-engagement",
        "subject": subject,
        "preview_text": preview_text,
        "html": html,
        "text": text,
    }


# Template registry mapping event types / template keys to their render functions
MARKETING_TEMPLATE_REGISTRY = {
    "welcome": render_welcome_template,
    "onboarding_welcome": render_welcome_template,
    "product_discovery": render_product_discovery_template,
    "retention_recommendations": render_product_discovery_template,
    "weekly_roundup": render_weekly_roundup_template,
    "weekly_digest": render_weekly_roundup_template,
    "retention_weekly_digest": render_weekly_roundup_template,
    "seller_tips": render_seller_tips_template,
    "seller_growth_tips": render_seller_tips_template,
    "category_discovery": render_category_discovery_template,
    "retention_category_interest": render_category_discovery_template,
    "seasonal_campaign": render_seasonal_campaign_template,
    "reengagement": render_reengagement_template,
    "retention_reengagement": render_reengagement_template,
    "promotional_reengagement": render_reengagement_template,
}


def render_marketing_template_preview(
    template_id: str,
    recipient_name: str = "Preview User",
    sample_listings: Optional[List[Dict[str, Any]]] = None,
    sample_categories: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Render a comprehensive preview of any marketing template with sample data."""
    func = MARKETING_TEMPLATE_REGISTRY.get(template_id.lower().strip())
    if not func:
        raise ValueError(f"Unknown marketing template key: {template_id}")

    unsub_url = f"{MARKETPLACE_URL}/email/unsubscribe?preview=true"

    if template_id in ["welcome", "onboarding_welcome"]:
        rendered = func(recipient_name=recipient_name, categories=sample_categories, unsubscribe_url=unsub_url)
    elif template_id in ["product_discovery"]:
        rendered = func(recipient_name=recipient_name, listings=sample_listings, categories=sample_categories, unsubscribe_url=unsub_url)
    elif template_id in ["weekly_roundup", "weekly_digest", "retention_weekly_digest"]:
        rendered = func(recipient_name=recipient_name, listings=sample_listings, categories=sample_categories, unsubscribe_url=unsub_url)
    elif template_id in ["seller_tips", "seller_growth_tips"]:
        rendered = func(recipient_name=recipient_name, unsubscribe_url=unsub_url)
    elif template_id in ["category_discovery", "retention_category_interest"]:
        rendered = func(recipient_name=recipient_name, categories=sample_categories, unsubscribe_url=unsub_url)
    elif template_id in ["seasonal_campaign"]:
        rendered = func(
            recipient_name=recipient_name,
            subject_line="Marketplace Seasonal Campaign",
            headline="Special Verified Deals",
            body_text="Discover quality items from top-rated local Kenyan sellers.",
            cta_text="Explore Deals",
            cta_url=f"{MARKETPLACE_URL}/search",
            campaign_dates="Limited Time",
            discount_badge="Special Offer",
            listings=sample_listings,
            unsubscribe_url=unsub_url,
        )
    else:
        rendered = func(recipient_name=recipient_name, listings=sample_listings, categories=sample_categories, unsubscribe_url=unsub_url)

    return {
        "template_id": template_id,
        "name": rendered.get("name", template_id),
        "subject": rendered["subject"],
        "preview_text": rendered.get("preview_text", ""),
        "html": rendered["html"],
        "plain_text": rendered.get("text", ""),
        "desktop_preview_url": f"/api/v1/email-templates/marketing/preview?template={template_id}&view=desktop",
        "mobile_preview_url": f"/api/v1/email-templates/marketing/preview?template={template_id}&view=mobile",
    }

