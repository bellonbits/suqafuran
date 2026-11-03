-- =============================================================================
-- SUQAFURAN SPRING BOOT BUSINESS SCHEMA MIGRATION V1
-- Covers Billing, Subscriptions, Entitlements, Promotions, Messaging, Marketing & Audit
-- =============================================================================

-- 1. BILLING & PAYMENTS
CREATE TABLE IF NOT EXISTS billing_payment (
    id UUID PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(30) NOT NULL DEFAULT 'MPESA',
    idempotency_key VARCHAR(100) NOT NULL,
    provider_transaction_id VARCHAR(100),
    phone_number VARCHAR(30),
    description VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_billing_payment_idempotency UNIQUE (idempotency_key, seller_id),
    CONSTRAINT uq_billing_payment_provider_ref UNIQUE (provider_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_payment_seller ON billing_payment(seller_id);
CREATE INDEX IF NOT EXISTS idx_billing_payment_status ON billing_payment(status);

-- 2. SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS subscription_plan (
    id SERIAL PRIMARY KEY,
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    duration_days INT NOT NULL DEFAULT 30,
    max_active_listings INT NOT NULL DEFAULT 10,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Standard Plans
INSERT INTO subscription_plan (plan_code, name, price, currency, duration_days, max_active_listings, features)
VALUES 
    ('FREE', 'Free Starter', 0.00, 'KES', 3650, 10, '["BASIC_SUPPORT"]'::jsonb),
    ('PRO', 'Pro Seller', 1999.00, 'KES', 30, 50, '["VERIFIED_BADGE", "TOP_SEARCH_BOOST", "ANALYTICS"]'::jsonb),
    ('BUSINESS', 'Enterprise Business', 4999.00, 'KES', 30, 200, '["VERIFIED_BADGE", "TOP_SEARCH_BOOST", "ADVANCED_ANALYTICS", "PRIORITY_SUPPORT", "SHOP_PAGE_BANNER"]'::jsonb)
ON CONFLICT (plan_code) DO NOTHING;

-- 3. SELLER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS seller_subscription (
    id UUID PRIMARY KEY,
    seller_id BIGINT NOT NULL UNIQUE,
    plan_code VARCHAR(50) NOT NULL REFERENCES subscription_plan(plan_code),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    grace_period_ends_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    last_payment_id UUID REFERENCES billing_payment(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seller_sub_status ON seller_subscription(status);
CREATE INDEX IF NOT EXISTS idx_seller_sub_expires ON seller_subscription(expires_at);

-- 4. SUBSCRIPTION LIFECYCLE AUDIT HISTORY
CREATE TABLE IF NOT EXISTS subscription_history (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. ENTITLEMENT GRANTS
CREATE TABLE IF NOT EXISTS entitlement_grant (
    id UUID PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    entitlement_key VARCHAR(100) NOT NULL,
    grant_value VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_seller_entitlement UNIQUE (seller_id, entitlement_key)
);

-- 6. PROMOTED LISTINGS & ADVERTISING
CREATE TABLE IF NOT EXISTS promoted_listing (
    id UUID PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    placement_type VARCHAR(50) NOT NULL DEFAULT 'FEATURED_PRODUCT',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    payment_id UUID REFERENCES billing_payment(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promoted_listing_active ON promoted_listing(is_active, ends_at);
CREATE INDEX IF NOT EXISTS idx_promoted_listing_listing ON promoted_listing(listing_id);

-- 7. MESSAGING ARCHITECTURE (Target Spring Boot Real-time Engine)
CREATE TABLE IF NOT EXISTS conversation (
    id UUID PRIMARY KEY,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    listing_id BIGINT,
    last_message_preview VARCHAR(255),
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_conversation_participants UNIQUE (buyer_id, seller_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_seller ON conversation(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversation_buyer ON conversation(buyer_id);

CREATE TABLE IF NOT EXISTS chat_message (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    attachment_url VARCHAR(500),
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_message(conversation_id, created_at);

-- 8. MARKETING AUTOMATION & REGULATORY CONSENT (KDPA)
CREATE TABLE IF NOT EXISTS campaign_consent (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    channel VARCHAR(20) NOT NULL, -- SMS, EMAIL, PUSH
    is_opted_in BOOLEAN NOT NULL DEFAULT TRUE,
    opted_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    opted_out_at TIMESTAMP WITH TIME ZONE,
    consent_source VARCHAR(100) NOT NULL DEFAULT 'SIGNUP_CHECKBOX',
    CONSTRAINT uq_user_channel_consent UNIQUE (user_id, channel)
);

CREATE TABLE IF NOT EXISTS marketing_campaign (
    id UUID PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    target_segment VARCHAR(50) NOT NULL,
    message_template TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    total_recipients INT DEFAULT 0,
    successful_deliveries INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. BUSINESS AUDIT LOG
CREATE TABLE IF NOT EXISTS business_audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_resource ON business_audit_log(resource_type, resource_id);

