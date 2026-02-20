"""add production indexes and full-text search

Revision ID: prod_indexes_001
Revises: 
Create Date: 2026-02-20
"""
from alembic import op
import sqlalchemy as sa

revision = 'prod_indexes_001'
down_revision = '3b4c5d6e7f8a'
branch_labels = None
depends_on = None


def upgrade():
    # ── Listings (most queried table) ──────────────────────────────────────
    op.create_index("ix_listing_category_id",     "listing", ["category_id"])
    op.create_index("ix_listing_status",           "listing", ["status"])
    op.create_index("ix_listing_owner_id",         "listing", ["owner_id"])
    op.create_index("ix_listing_boost_level",      "listing", ["boost_level"])
    op.create_index("ix_listing_created_at",       "listing", ["created_at"])
    op.create_index("ix_listing_boost_expires_at", "listing", ["boost_expires_at"])

    # Composite index — the homepage feed query pattern
    op.create_index(
        "ix_listing_feed",
        "listing",
        ["status", "boost_level", "created_at"],
    )

    # Full-text search (PostgreSQL only)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='listing' AND column_name='search_vector'
            ) THEN
                ALTER TABLE listing
                    ADD COLUMN search_vector tsvector
                    GENERATED ALWAYS AS (
                        to_tsvector('english',
                            coalesce(title, '') || ' ' || coalesce(description, '')
                        )
                    ) STORED;
            END IF;
        END $$;
    """)
    op.create_index(
        "ix_listing_fts",
        "listing",
        ["search_vector"],
        postgresql_using="gin",
    )

    # ── Promotions ──────────────────────────────────────────────────────────
    op.create_index("ix_promotion_status",      "promotion", ["status"])
    op.create_index("ix_promotion_listing_id",  "promotion", ["listing_id"])
    op.create_index("ix_promotion_lipana_tx_id","promotion", ["lipana_tx_id"])

    # ── Mobile transactions ─────────────────────────────────────────────────
    # Unique index on reference — enforces idempotency at DB level too
    op.create_index(
        "ix_mobiletransaction_reference",
        "mobiletransaction",
        ["reference"],
        unique=True,
    )
    op.create_index("ix_mobiletransaction_is_linked", "mobiletransaction", ["is_linked"])

    # ── Favorites + Notifications ───────────────────────────────────────────
    op.create_index("ix_favorite_user_id",      "favorite",     ["user_id"])
    op.create_index("ix_notification_user_read","notification",  ["user_id", "is_read"])

    # ── Wallet ──────────────────────────────────────────────────────────────
    op.create_index("ix_wallet_user_id",        "wallet",       ["user_id"])
    op.create_index("ix_transaction_wallet_id", "transaction",  ["wallet_id"])

    # ── Audit log ───────────────────────────────────────────────────────────
    op.create_index("ix_auditlog_user_id",      "auditlog",     ["user_id"])
    op.create_index("ix_auditlog_created_at",   "auditlog",     ["created_at"])


def downgrade():
    op.drop_index("ix_listing_fts",             "listing")
    op.execute("ALTER TABLE listing DROP COLUMN IF EXISTS search_vector")
    op.drop_index("ix_listing_feed",            "listing")
    op.drop_index("ix_listing_boost_expires_at","listing")
    op.drop_index("ix_listing_created_at",      "listing")
    op.drop_index("ix_listing_boost_level",     "listing")
    op.drop_index("ix_listing_owner_id",        "listing")
    op.drop_index("ix_listing_status",          "listing")
    op.drop_index("ix_listing_category_id",     "listing")
    op.drop_index("ix_promotion_lipana_tx_id",  "promotion")
    op.drop_index("ix_promotion_listing_id",    "promotion")
    op.drop_index("ix_promotion_status",        "promotion")
    op.drop_index("ix_mobiletransaction_reference",  "mobiletransaction")
    op.drop_index("ix_mobiletransaction_is_linked",  "mobiletransaction")
    op.drop_index("ix_favorite_user_id",        "favorite")
    op.drop_index("ix_notification_user_read",  "notification")
    op.drop_index("ix_wallet_user_id",          "wallet")
    op.drop_index("ix_transaction_wallet_id",   "transaction")
    op.drop_index("ix_auditlog_user_id",        "auditlog")
    op.drop_index("ix_auditlog_created_at",     "auditlog")
