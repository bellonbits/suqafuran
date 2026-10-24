"""
Updates active marketing templates in the database email_template table
with the new Suqafuran branded email designs, and deactivates obsolete
campaign templates (e.g. legacy Flash Sale Frenzy).

Preserves all historical logs, consent records, and transactional email templates.
"""

import json
from sqlalchemy import create_engine, text
from app.core.config import settings
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
from sqlmodel import Session

engine = create_engine(settings.DATABASE_URL)

with Session(engine) as db:
    categories = get_active_categories(db, limit=8)
    sample_listings = get_discovery_listings(db, limit=4)

# 1. Generate new branded templates with sample placeholders
templates_to_update = [
    {
        "event_type": "onboarding_welcome",
        "name": "Welcome to Suqafuran",
        "rendered": render_welcome_template("{{name}}", categories=categories),
        "description": "Karibu Suqafuran — welcome email for new users exploring marketplace listings.",
        "variables": ["name"],
    },
    {
        "event_type": "retention_recommendations",
        "name": "Product Discovery",
        "rendered": render_product_discovery_template("{{name}}", listings=sample_listings, categories=categories),
        "description": "Kuna kitu poa unatafuta? — features genuine active listings or category exploration.",
        "variables": ["name"],
    },
    {
        "event_type": "retention_weekly_digest",
        "name": "Weekly Marketplace Roundup",
        "rendered": render_weekly_roundup_template("{{name}}", listings=sample_listings, categories=categories, location="Nairobi"),
        "description": "Your Suqafuran marketplace roundup — weekly digest of marketplace picks in Kenyan English.",
        "variables": ["name", "location"],
    },
    {
        "event_type": "seller_growth_tips",
        "name": "Seller Promotion and Listing Tips",
        "rendered": render_seller_tips_template("{{name}}"),
        "description": "Make your listings easier to discover — actionable seller tips on titles, photos, pricing, and responsiveness.",
        "variables": ["name"],
    },
    {
        "event_type": "retention_category_interest",
        "name": "Category Discovery",
        "rendered": render_category_discovery_template("{{name}}", categories=categories),
        "description": "What are you looking for today? — guides users to explore active marketplace categories.",
        "variables": ["name"],
    },
    {
        "event_type": "seasonal_campaign",
        "name": "Seasonal or Special Campaign",
        "rendered": render_seasonal_campaign_template(
            "{{name}}",
            subject_line="Special Marketplace Deals on Suqafuran",
            headline="Seasonal Marketplace Highlights ✨",
            body_text="Discover curated marketplace picks and special highlights from verified local sellers.",
            discount_badge="Verified Promotion",
            campaign_dates="Limited Marketplace Event",
            listings=sample_listings,
            cta_text="Explore campaign deals",
        ),
        "description": "Seasonal or special promotion campaign — configurable headline, dates, badges, and genuine listing cards.",
        "variables": ["name", "headline", "body_text", "discount_badge", "campaign_dates"],
    },
    {
        "event_type": "retention_reengagement",
        "name": "Re-engagement",
        "rendered": render_reengagement_template("{{name}}", listings=sample_listings, categories=categories),
        "description": "See what’s available on Suqafuran — friendly, non-pressuring message for inactive users.",
        "variables": ["name"],
    },
]

with engine.begin() as conn:
    # Deactivate obsolete/vestigial marketing templates so active systems cannot select them
    obsolete_types = ["promotional"]
    deactivated = conn.execute(
        text("UPDATE email_template SET is_active = false, updated_at = now() WHERE event_type = ANY(:types)"),
        {"types": obsolete_types},
    )
    print(f"Deactivated {deactivated.rowcount} obsolete marketing template(s): {', '.join(obsolete_types)}")

    updated_count = 0
    inserted_count = 0

    for t in templates_to_update:
        r = t["rendered"]
        existing = conn.execute(
            text("SELECT id FROM email_template WHERE event_type = :event_type"),
            {"event_type": t["event_type"]},
        ).first()

        if existing:
            conn.execute(
                text("""
                    UPDATE email_template
                    SET name = :name,
                        subject = :subject,
                        html_content = :html_content,
                        text_content = :text_content,
                        description = :description,
                        variables = :variables,
                        is_active = true,
                        updated_at = now()
                    WHERE event_type = :event_type
                """),
                {
                    "event_type": t["event_type"],
                    "name": t["name"],
                    "subject": r["subject"],
                    "html_content": r["html"],
                    "text_content": r["text"],
                    "description": t["description"],
                    "variables": json.dumps(t["variables"]),
                }
            )
            updated_count += 1
            print(f"Updated template '{t['event_type']}' ({t['name']})")
        else:
            conn.execute(
                text("""
                    INSERT INTO email_template (event_type, name, subject, html_content, text_content, is_active, description, variables, created_at, updated_at)
                    VALUES (:event_type, :name, :subject, :html_content, :text_content, true, :description, :variables, now(), now())
                """),
                {
                    "event_type": t["event_type"],
                    "name": t["name"],
                    "subject": r["subject"],
                    "html_content": r["html"],
                    "text_content": r["text"],
                    "description": t["description"],
                    "variables": json.dumps(t["variables"]),
                }
            )
            inserted_count += 1
            print(f"Inserted new template '{t['event_type']}' ({t['name']})")

print(f"\nMigration complete: {updated_count} updated, {inserted_count} inserted.")
