"""Add Row Level Security (RLS) policies for user data isolation

Revision ID: 20261112_add_row_level_security
Revises: 20260825_deal_confirm
Create Date: 2026-11-12 16:50:00.000000

Enforces PostgreSQL Row Level Security (RLS) on all user-sensitive tables:
- user
- saved_addresses
- notifications
- notification_preferences
- device_tokens
- orders & order_items
- marketplace_conversation & conversation
- message
- favorites
- saved_searches & price_alerts
- cart
- sellers (public read, authenticated owner write)
- withdrawals

Connects to application session context via current_setting('app.current_user_id', true)
and current_setting('app.is_admin', true).
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20261112_add_row_level_security'
down_revision = '20260825_deal_confirm'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create helper functions for RLS session context
    op.execute("""
    CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS text AS $$
    BEGIN
        RETURN NULLIF(current_setting('app.current_user_id', true), '');
    END;
    $$ LANGUAGE plpgsql STABLE;

    CREATE OR REPLACE FUNCTION is_app_admin() RETURNS boolean AS $$
    BEGIN
        RETURN COALESCE(current_setting('app.is_admin', true) = 'true', false);
    END;
    $$ LANGUAGE plpgsql STABLE;
    """)

    # 2. Enable RLS and create policies on user
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user') THEN
            ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS user_isolation_policy ON "user";
            CREATE POLICY user_isolation_policy ON "user"
                FOR ALL
                USING (is_app_admin() OR current_app_user_id() IS NULL OR id::text = current_app_user_id());
        END IF;
    END $$;
    """)

    # 3. Enable RLS and create policies on saved_addresses / user_addresses
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_addresses') THEN
            ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS saved_addresses_isolation_policy ON saved_addresses;
            CREATE POLICY saved_addresses_isolation_policy ON saved_addresses
                FOR ALL
                USING (is_app_admin() OR current_app_user_id() IS NULL OR user_id::text = current_app_user_id());
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_addresses') THEN
            ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS user_addresses_isolation_policy ON user_addresses;
            CREATE POLICY user_addresses_isolation_policy ON user_addresses
                FOR ALL
                USING (is_app_admin() OR current_app_user_id() IS NULL OR user_id::text = current_app_user_id());
        END IF;
    END $$;
    """)

    # 4. Enable RLS and create policies on notifications & preferences
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
            ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS notifications_isolation_policy ON notifications;
            CREATE POLICY notifications_isolation_policy ON notifications
                FOR ALL
                USING (is_app_admin() OR current_app_user_id() IS NULL OR user_id::text = current_app_user_id());
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_preferences') THEN
            ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS notif_pref_isolation_policy ON notification_preferences;
            CREATE POLICY notif_pref_isolation_policy ON notification_preferences
                FOR ALL
                USING (is_app_admin() OR current_app_user_id() IS NULL OR user_id::text = current_app_user_id());
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'device_tokens') THEN
            ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS device_tokens_isolation_policy ON device_tokens;
            CREATE POLICY device_tokens_isolation_policy ON device_tokens
                FOR ALL
                USING (is_app_admin() OR current_app_user_id() IS NULL OR user_id::text = current_app_user_id());
        END IF;
    END $$;
    """)

    # 5. Enable RLS and create policies on orders & order_items
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
            ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS orders_isolation_policy ON orders;
            CREATE POLICY orders_isolation_policy ON orders
                FOR ALL
                USING (
                    is_app_admin() 
                    OR current_app_user_id() IS NULL 
                    OR user_id::text = current_app_user_id()
                    OR (
                        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sellers')
                        AND seller_id::text IN (SELECT id::text FROM sellers WHERE user_id::text = current_app_user_id())
                    )
                );
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
            ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS order_items_isolation_policy ON order_items;
            CREATE POLICY order_items_isolation_policy ON order_items
                FOR ALL
                USING (
                    is_app_admin() 
                    OR current_app_user_id() IS NULL 
                    OR order_id::text IN (
                        SELECT id::text FROM orders 
                        WHERE user_id::text = current_app_user_id()
                    )
                );
        END IF;
    END $$;
    """)

    # 6. Enable RLS and create policies on conversations & messages
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketplace_conversation') THEN
            ALTER TABLE marketplace_conversation ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS marketplace_conv_isolation_policy ON marketplace_conversation;
            CREATE POLICY marketplace_conv_isolation_policy ON marketplace_conversation
                FOR ALL
                USING (
                    is_app_admin() 
                    OR current_app_user_id() IS NULL 
                    OR buyer_id::text = current_app_user_id() 
                    OR seller_id::text = current_app_user_id()
                );
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation') THEN
            ALTER TABLE conversation ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS conv_isolation_policy ON conversation;
            CREATE POLICY conv_isolation_policy ON conversation
                FOR ALL
                USING (
                    is_app_admin() 
                    OR current_app_user_id() IS NULL 
                    OR buyer_id::text = current_app_user_id() 
                    OR seller_id::text = current_app_user_id()
                );
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'message') THEN
            ALTER TABLE message ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS message_isolation_policy ON message;
            CREATE POLICY message_isolation_policy ON message
                FOR ALL
                USING (
                    is_app_admin() 
                    OR current_app_user_id() IS NULL 
                    OR sender_id::text = current_app_user_id() 
                    OR receiver_id::text = current_app_user_id()
                );
        END IF;
    END $$;
    """)

    # 7. Enable RLS and create policies on favorites, saved_searches, price_alerts, cart
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
            ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS favorites_isolation_policy ON favorites;
            CREATE POLICY favorites_isolation_policy ON favorites
                FOR ALL
                USING (is_app_admin() OR current_app_user_id() IS NULL OR user_id::text = current_app_user_id());
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_searches') THEN
            ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS saved_searches_isolation_policy ON saved_searches;
            CREATE POLICY saved_searches_isolation_policy ON saved_searches
                FOR ALL
                USING (is_app_admin() OR current_app_user_id() IS NULL OR user_id::text = current_app_user_id());
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'price_alerts') THEN
            ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS price_alerts_isolation_policy ON price_alerts;
            CREATE POLICY price_alerts_isolation_policy ON price_alerts
                FOR ALL
                USING (is_app_admin() OR current_app_user_id() IS NULL OR user_id::text = current_app_user_id());
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cart') THEN
            ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS cart_isolation_policy ON cart;
            CREATE POLICY cart_isolation_policy ON cart
                FOR ALL
                USING (is_app_admin() OR current_app_user_id() IS NULL OR user_id::text = current_app_user_id());
        END IF;
    END $$;
    """)

    # 8. Enable RLS and create policies on sellers & withdrawals
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sellers') THEN
            ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS sellers_select_policy ON sellers;
            CREATE POLICY sellers_select_policy ON sellers
                FOR SELECT
                USING (true); -- Public storefront reading

            DROP POLICY IF EXISTS sellers_modify_policy ON sellers;
            CREATE POLICY sellers_modify_policy ON sellers
                FOR ALL
                USING (is_app_admin() OR current_app_user_id() IS NULL OR user_id::text = current_app_user_id())
                WITH CHECK (is_app_admin() OR current_app_user_id() IS NULL OR user_id::text = current_app_user_id());
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'withdrawals') THEN
            ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS withdrawals_isolation_policy ON withdrawals;
            CREATE POLICY withdrawals_isolation_policy ON withdrawals
                FOR ALL
                USING (
                    is_app_admin() 
                    OR current_app_user_id() IS NULL 
                    OR seller_id::text IN (SELECT id::text FROM sellers WHERE user_id::text = current_app_user_id())
                );
        END IF;
    END $$;
    """)


def downgrade():
    op.execute("""
    DO $$
    DECLARE
        tbl text;
        tables text[] := ARRAY[
            'user', 'saved_addresses', 'user_addresses', 'notifications',
            'notification_preferences', 'device_tokens', 'orders', 'order_items',
            'marketplace_conversation', 'conversation', 'message', 'favorites',
            'saved_searches', 'price_alerts', 'cart', 'sellers', 'withdrawals'
        ];
    BEGIN
        FOREACH tbl IN ARRAY tables LOOP
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
                EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', tbl);
            END IF;
        END LOOP;
    END $$;

    DROP FUNCTION IF EXISTS current_app_user_id();
    DROP FUNCTION IF EXISTS is_app_admin();
    """)
