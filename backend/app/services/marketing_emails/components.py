"""Reusable email design system components for Suqafuran marketing campaigns.

Implements email-safe, table-based responsive layouts inspired by leading
African ecommerce marketplaces (e.g. Jumia) while using Suqafuran's official
brand identity (#00BFFF primary, #0095D4 secondary).
"""

import html
import re
from typing import Any, Dict, List, Optional
from app.core.config import settings

# ─────────────────────────────────────────────────────────────
# Brand Design Tokens
# ─────────────────────────────────────────────────────────────
BRAND_PRIMARY = "#00BFFF"       # Suqafuran deep sky blue
BRAND_SECONDARY = "#0095D4"     # Darker cerulean accent
COLOR_TEXT_MAIN = "#0F172A"     # Deep slate for headlines
COLOR_TEXT_BODY = "#334155"     # Slate for readable body
COLOR_TEXT_MUTED = "#64748B"    # Muted secondary text
COLOR_BG_SHELL = "#F4F6F8"      # Email client outer background
COLOR_BG_CARD = "#FFFFFF"       # White content card
COLOR_BG_NEUTRAL = "#F8FAFC"    # Soft neutral for sections/product cards
COLOR_BORDER = "#E2E8F0"        # Subtle border
COLOR_ACCENT_BG = "#E0F7FF"     # Very soft brand tint
COLOR_PRICE = "#0095D4"         # Vibrant price color

BRAND_NAME = "Suqafuran"
LOGO_URL = "https://suqafuran.com/icon1.png"
BRAND_LOGO_URL = LOGO_URL
LOGO_FALLBACK_URL = "https://suqafuran.com/logo.png"

PHYSICAL_ADDRESS = "Suqafuran Limited, Muthaiga Business Center, Pangani, Nairobi, Kenya"
SUPPORT_EMAIL = "support@suqafuran.com"
MARKETPLACE_URL = settings.FRONTEND_URL or "https://suqafuran.com"


def format_ksh(amount: Any) -> str:
    """Format an amount consistently in KSh (e.g. KSh 1,500)."""
    try:
        val = float(amount)
        if val.is_integer():
            return f"KSh {int(val):,}"
        return f"KSh {val:,.2f}"
    except (ValueError, TypeError):
        clean = str(amount or "").strip().replace("KES", "").replace("KSh", "").replace("ksh", "").strip()
        try:
            val = float(clean.replace(",", ""))
            return f"KSh {int(val):,}" if val.is_integer() else f"KSh {val:,.2f}"
        except Exception:
            return f"KSh {html.escape(str(amount or '0'))}"


def sanitize(text: Optional[str]) -> str:
    """HTML-escape dynamic user or listing text to prevent injection."""
    if not text:
        return ""
    return html.escape(str(text))


def render_button(
    text: str,
    url: str,
    variant: str = "primary",
    align: str = "center",
    full_width: bool = False
) -> str:
    """Bulletproof email CTA button compatible with Outlook, Apple Mail, and Gmail."""
    bg_color = BRAND_PRIMARY if variant == "primary" else BRAND_SECONDARY
    text_color = "#FFFFFF"
    
    width_attr = 'width="100%"' if full_width else ''
    cell_align = f'align="{align}"'

    return f"""
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" {width_attr} style="margin: 0 auto;">
      <tr>
        <td {cell_align} style="padding: 12px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" bgcolor="{bg_color}" style="border-radius: 8px; background-color: {bg_color};">
                <a href="{sanitize(url)}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; color: {text_color}; text-decoration: none; border-radius: 8px; line-height: 1.2; letter-spacing: 0.2px;">
                  {sanitize(text)} &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    """


def render_header(show_tagline: bool = True) -> str:
    """Branded top header with official Suqafuran logo."""
    tagline_html = f'<p style="margin: 6px 0 0 0; font-size: 12px; color: {COLOR_TEXT_MUTED}; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">The Trusted Marketplace</p>' if show_tagline else ""
    return f"""
    <!-- Header -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: {COLOR_BG_CARD}; border-bottom: 1px solid {COLOR_BORDER};">
      <tr>
        <td align="center" style="padding: 24px 20px 20px 20px;">
          <a href="{MARKETPLACE_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img src="{LOGO_URL}" alt="Suqafuran" width="150" height="auto" style="display: block; max-width: 150px; height: auto; border: 0; margin: 0 auto;" />
          </a>
          {tagline_html}
        </td>
      </tr>
    </table>
    """


def render_hero_banner(
    headline: str,
    subtitle: str,
    badge_text: Optional[str] = None,
    cta_text: Optional[str] = None,
    cta_url: Optional[str] = None,
    hero_image_url: Optional[str] = None,
) -> str:
    """Hero section with vibrant marketplace appeal."""
    badge_html = ""
    if badge_text:
        badge_html = f"""
        <div style="display: inline-block; background-color: {COLOR_ACCENT_BG}; border: 1px solid #BAE6FD; color: #0284C7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 6px 14px; border-radius: 20px; margin-bottom: 16px;">
          {sanitize(badge_text)}
        </div>
        """

    image_html = ""
    if hero_image_url:
        image_html = f"""
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
          <tr>
            <td align="center">
              <img src="{sanitize(hero_image_url)}" alt="{sanitize(headline)}" width="560" style="width: 100%; max-width: 560px; height: auto; border-radius: 12px; display: block; border: 0;" />
            </td>
          </tr>
        </table>
        """

    cta_html = ""
    if cta_text and cta_url:
        cta_html = f"""
        <div style="margin-top: 20px;">
          {render_button(text=cta_text, url=cta_url, variant="primary", align="center")}
        </div>
        """

    return f"""
    <!-- Hero Banner -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: {COLOR_BG_CARD};">
      <tr>
        <td style="padding: 32px 24px 24px 24px; text-align: center;">
          {badge_html}
          {image_html}
          <h1 style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; line-height: 1.3; font-weight: 800; color: {COLOR_TEXT_MAIN}; letter-spacing: -0.4px;">
            {sanitize(headline)}
          </h1>
          <p style="margin: 0 auto; max-width: 480px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: {COLOR_TEXT_BODY};">
            {sanitize(subtitle)}
          </p>
          {cta_html}
        </td>
      </tr>
    </table>
    """


def render_product_card(listing: Dict[str, Any]) -> str:
    """Render a single product card for listing discovery."""
    title = sanitize(listing.get("title_en") or listing.get("title") or "Item on Suqafuran")
    raw_price = listing.get("price", 0)
    price_formatted = format_ksh(raw_price)
    location = sanitize(listing.get("location") or "Kenya")
    listing_id = listing.get("id") or 0
    url = listing.get("url") or f"{MARKETPLACE_URL}/listing/{listing_id}"
    
    images = listing.get("images") or []
    image_url = listing.get("image_url") or (images[0] if isinstance(images, list) and images else None)
    
    image_tag = f"""
    <div style="background-color: #E2E8F0; width: 100%; height: 180px; overflow: hidden; border-radius: 8px 8px 0 0; text-align: center;">
      <img src="{sanitize(image_url)}" alt="{title}" width="260" height="180" style="width: 100%; height: 180px; object-fit: cover; display: block; border: 0;" />
    </div>
    """ if image_url else f"""
    <div style="background-color: {COLOR_ACCENT_BG}; width: 100%; height: 140px; border-radius: 8px 8px 0 0; display: table;">
      <div style="display: table-cell; vertical-align: middle; text-align: center; color: #0284C7; font-weight: 700; font-size: 13px;">
        Suqafuran Listing
      </div>
    </div>
    """

    compare_at = listing.get("compare_at_price")
    compare_at_html = ""
    if compare_at and float(compare_at) > float(raw_price or 0):
        compare_at_html = f'<span style="font-size: 12px; color: {COLOR_TEXT_MUTED}; text-decoration: line-through; margin-left: 6px;">{format_ksh(compare_at)}</span>'

    return f"""
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: {COLOR_BG_CARD}; border: 1px solid {COLOR_BORDER}; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
      <tr>
        <td>
          <a href="{sanitize(url)}" target="_blank" style="text-decoration: none; display: block;">
            {image_tag}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 14px 16px 14px;">
          <a href="{sanitize(url)}" target="_blank" style="text-decoration: none; color: inherit; display: block;">
            <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: {COLOR_TEXT_MAIN}; line-height: 1.4; height: 38px; overflow: hidden;">
              {title}
            </h3>
          </a>
          <div style="margin-top: 8px;">
            <span style="font-size: 16px; font-weight: 800; color: {COLOR_PRICE};">
              {price_formatted}
            </span>
            {compare_at_html}
          </div>
          <div style="margin-top: 6px; font-size: 12px; color: {COLOR_TEXT_MUTED};">
            &#128205; {location}
          </div>
          <div style="margin-top: 12px;">
            <a href="{sanitize(url)}" target="_blank" style="display: block; text-align: center; background-color: {COLOR_ACCENT_BG}; color: #0284C7; font-size: 13px; font-weight: 700; padding: 8px 12px; border-radius: 6px; text-decoration: none; border: 1px solid #BAE6FD;">
              View Deal &rarr;
            </a>
          </div>
        </td>
      </tr>
    </table>
    """


def render_product_grid(listings: List[Dict[str, Any]], max_items: int = 4) -> str:
    """Render a responsive 2-column product grid with mobile stacking."""
    if not listings:
        return ""
    
    items = listings[:max_items]
    rows_html = ""
    
    # Process in pairs
    for i in range(0, len(items), 2):
        col1 = render_product_card(items[i])
        col2 = render_product_card(items[i + 1]) if i + 1 < len(items) else ""
        
        col2_td = f"""
        <td class="stack-column column-padding-left" width="50%" valign="top" style="padding-left: 8px;">
          {col2}
        </td>
        """ if col2 else '<td class="stack-column" width="50%" valign="top" style="padding-left: 8px;"></td>'

        rows_html += f"""
        <tr>
          <td class="stack-column column-padding-right" width="50%" valign="top" style="padding-right: 8px; padding-bottom: 16px;">
            {col1}
          </td>
          {col2_td}
        </tr>
        """

    return f"""
    <!-- Product Grid -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 12px; margin-bottom: 8px;">
      {rows_html}
    </table>
    """


def render_category_chips(categories: List[Dict[str, Any]], title: str = "Explore Categories") -> str:
    """Render category discovery links/cards."""
    if not categories:
        return ""
    
    chips_html = ""
    for cat in categories[:6]:
        name = sanitize(cat.get("name_en") or cat.get("name") or "Category")
        slug = cat.get("slug") or cat.get("id") or ""
        url = f"{MARKETPLACE_URL}/search?category={slug}" if slug else f"{MARKETPLACE_URL}/search"
        
        chips_html += f"""
        <a href="{sanitize(url)}" target="_blank" style="display: inline-block; background-color: {COLOR_BG_NEUTRAL}; border: 1px solid {COLOR_BORDER}; color: {COLOR_TEXT_BODY}; font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 20px; text-decoration: none; margin: 4px;">
          {name} &rarr;
        </a>
        """

    return f"""
    <!-- Category Discovery Section -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: {COLOR_BG_CARD}; margin-top: 16px;">
      <tr>
        <td style="padding: 24px 20px; background-color: {COLOR_BG_NEUTRAL}; border-radius: 12px; border: 1px solid {COLOR_BORDER}; text-align: center;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 800; color: {COLOR_TEXT_MAIN};">
            {sanitize(title)}
          </h3>
          <div style="line-height: 2.2;">
            {chips_html}
          </div>
        </td>
      </tr>
    </table>
    """


def render_seller_tips_section() -> str:
    """Render practical seller growth tips cards in Kenyan English."""
    tips = [
        ("1. Clear, Descriptive Titles", "Use exact brand and model names (e.g. 'Samsung Galaxy A15 128GB' instead of 'phone'). Serious buyers search for exact models.", "🎯"),
        ("2. Clean, Bright Photos", "Take photos in natural daylight from 3-4 angles. Real, clear pictures build instant trust with local buyers.", "📸"),
        ("3. Fair, Competitive Pricing", "Check what similar items sell for on Suqafuran and price fairly in KSh. Competitive prices sell 3x faster.", "💰"),
        ("4. Respond Promptly", "Serious buyers message multiple sellers. Answering inquiries quickly helps you close deals before anyone else.", "⚡"),
    ]
    
    cards_html = ""
    for title, desc, icon in tips:
        cards_html += f"""
        <tr>
          <td style="padding: 12px 14px; background-color: {COLOR_BG_CARD}; border: 1px solid {COLOR_BORDER}; border-radius: 8px; margin-bottom: 10px;">
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td width="36" valign="top" style="font-size: 20px; line-height: 1;">
                  {icon}
                </td>
                <td style="padding-left: 10px;">
                  <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: {COLOR_TEXT_MAIN};">
                    {sanitize(title)}
                  </h4>
                  <p style="margin: 0; font-size: 13px; color: {COLOR_TEXT_BODY}; line-height: 1.5;">
                    {sanitize(desc)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td height="10"></td></tr>
        """

    return f"""
    <!-- Seller Tips Section -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
      {cards_html}
    </table>
    """


def render_trust_strip() -> str:
    """Marketplace trust assurance strip."""
    return f"""
    <!-- Trust Strip -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 24px; background-color: {COLOR_BG_NEUTRAL}; border-radius: 10px; border: 1px solid {COLOR_BORDER};">
      <tr>
        <td style="padding: 16px 20px; text-align: center; font-size: 12px; color: {COLOR_TEXT_MUTED}; line-height: 1.6;">
          <strong>Direct local trading:</strong> Chat directly with sellers, inspect items in person, and pay safely upon handover.
        </td>
      </tr>
    </table>
    """


def render_footer(unsubscribe_url: Optional[str] = None) -> str:
    """Compliance footer with contact info, physical address, and unsubscribe link."""
    unsub_link = unsubscribe_url or f"{MARKETPLACE_URL}/settings/notifications"
    
    return f"""
    <!-- Footer -->
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: {COLOR_BG_NEUTRAL}; border-top: 1px solid {COLOR_BORDER};">
      <tr>
        <td style="padding: 32px 20px 24px 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <!-- Social Icons -->
          <div style="margin-bottom: 20px;">
            <a href="https://www.instagram.com/suqafuran/" target="_blank" style="margin: 0 8px; text-decoration: none; display: inline-block;">
              <img src="https://suqafuran.com/icons/instagram.png" alt="Instagram" width="22" height="22" style="display: inline-block; border: 0;" />
            </a>
            <a href="https://x.com/suqafuran" target="_blank" style="margin: 0 8px; text-decoration: none; display: inline-block;">
              <img src="https://suqafuran.com/icons/twitter.png" alt="X" width="22" height="22" style="display: inline-block; border: 0;" />
            </a>
            <a href="https://www.tiktok.com/@suqafuran_" target="_blank" style="margin: 0 8px; text-decoration: none; display: inline-block;">
              <img src="https://suqafuran.com/icons/tiktok.png" alt="TikTok" width="22" height="22" style="display: inline-block; border: 0;" />
            </a>
            <a href="https://www.facebook.com/suqafuran" target="_blank" style="margin: 0 8px; text-decoration: none; display: inline-block;">
              <img src="https://suqafuran.com/icons/facebook.png" alt="Facebook" width="22" height="22" style="display: inline-block; border: 0;" />
            </a>
          </div>

          <!-- Business Details -->
          <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: {COLOR_TEXT_MAIN};">
            Suqafuran Limited
          </p>
          <p style="margin: 0 0 12px 0; font-size: 12px; color: {COLOR_TEXT_MUTED}; line-height: 1.5;">
            {PHYSICAL_ADDRESS}<br>
            Customer Support: <a href="mailto:{SUPPORT_EMAIL}" style="color: {BRAND_SECONDARY}; text-decoration: none; font-weight: 600;">{SUPPORT_EMAIL}</a>
          </p>

          <p style="margin: 16px 0 0 0; font-size: 11px; color: {COLOR_TEXT_MUTED}; line-height: 1.5;">
            You are receiving this email because you opted in to marketing and marketplace updates from Suqafuran.<br>
            <a href="{sanitize(unsub_link)}" style="color: {COLOR_TEXT_MUTED}; text-decoration: underline; font-weight: 600;">
              Manage email preferences or unsubscribe
            </a>
          </p>

          <p style="margin: 16px 0 0 0; font-size: 11px; color: #94A3B8;">
            &copy; 2026 Suqafuran. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
    """


def render_email_shell(
    title: str = "Suqafuran",
    preheader_text: Optional[str] = None,
    content_html: str = "",
    unsubscribe_url: Optional[str] = None,
    preview_text: Optional[str] = None,
) -> str:
    """Complete responsive email shell wrapping content in modern HTML structure."""
    effective_preheader = preheader_text or preview_text or ""
    
    # 150 whitespace characters to ensure preheader does not pull body text into email inbox preview
    preview_padding = "&zwnj;&nbsp;" * 35

    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>{sanitize(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    html, body {{
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: {COLOR_BG_SHELL};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }}
    * {{
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }}
    table, td {{
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }}
    table {{
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }}
    img {{
      -ms-interpolation-mode: bicubic;
      max-width: 100%;
    }}
    a {{
      text-decoration: none;
    }}
    @media only screen and (max-width: 620px) {{
      .email-container {{
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
      }}
      .stack-column {{
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        direction: ltr !important;
        box-sizing: border-box !important;
      }}
      .column-padding-left {{
        padding-left: 0 !important;
        padding-top: 14px !important;
      }}
      .column-padding-right {{
        padding-right: 0 !important;
      }}
      .mobile-padding {{
        padding-left: 16px !important;
        padding-right: 16px !important;
      }}
      .mobile-center {{
        text-align: center !important;
      }}
    }}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: {COLOR_BG_SHELL};">
  <!-- Preheader text hidden in body, visible in inbox preview -->
  <div style="display: none; font-size: 1px; color: {COLOR_BG_SHELL}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    {sanitize(effective_preheader)}
    {preview_padding}
  </div>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: {COLOR_BG_SHELL};">
    <tr>
      <td align="center" style="padding: 24px 8px 32px 8px;">
        <!-- Email Container -->
        <table role="presentation" class="email-container" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: {COLOR_BG_CARD}; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid {COLOR_BORDER};">
          <tr>
            <td>
              {render_header(show_tagline=True)}
              
              <!-- Content Body -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="mobile-padding" style="padding: 0 24px 28px 24px;">
                    {content_html}
                  </td>
                </tr>
              </table>

              {render_footer(unsubscribe_url=unsubscribe_url)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def html_to_plain_text(html_content: str) -> str:
    """Convert HTML email to clean, human-readable plain text."""
    if not html_content:
        return ""
    
    # Strip style and script blocks
    text = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)

    # Format links: <a href="url">text</a> -> text (url)
    def link_repl(match):
        url = match.group(1).strip()
        label = re.sub(r'<[^>]+>', '', match.group(2)).strip()
        if not label or label == url:
            return url
        return f"{label} ({url})"
    text = re.sub(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', link_repl, text, flags=re.DOTALL | re.IGNORECASE)

    # Headings to UPPERCASE with spacing
    text = re.sub(r'<h[1-2][^>]*>(.*?)</h[1-2]>', r'\n\n=== \1 ===\n', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<h[3-6][^>]*>(.*?)</h[3-6]>', r'\n\n--- \1 ---\n', text, flags=re.DOTALL | re.IGNORECASE)

    # Paragraphs and line breaks
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</p>', '\n\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</li>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<li[^>]*>', '• ', text, flags=re.IGNORECASE)

    # Strip remaining HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)

    # Decode HTML entities
    text = html.unescape(text)

    # Normalize whitespace
    lines = [re.sub(r'\s+', ' ', line).strip() for line in text.splitlines()]
    result = []
    prev_empty = False
    for line in lines:
        if not line:
            if not prev_empty:
                result.append("")
                prev_empty = True
        else:
            result.append(line)
            prev_empty = False

    return "\n".join(result).strip()
