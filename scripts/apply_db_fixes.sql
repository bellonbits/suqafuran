-- Fix missing monitoring tables and order table schema in production

-- 1. Alert Rules table
CREATE TABLE IF NOT EXISTS alert_rules (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metric VARCHAR(255) NOT NULL,
    threshold NUMERIC NOT NULL,
    comparison_operator VARCHAR(10) NOT NULL,
    evaluation_window_minutes INTEGER NOT NULL DEFAULT 5,
    aggregation_function VARCHAR(50) DEFAULT 'avg',
    metric_filter JSONB,
    notification_channel VARCHAR(255),
    notification_target VARCHAR(255),
    enabled BOOLEAN DEFAULT true,
    severity VARCHAR(50) NOT NULL DEFAULT 'warning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_alert_rules_metric ON alert_rules(metric);

-- 2. Alert History table
CREATE TABLE IF NOT EXISTS alert_history (
    id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT REFERENCES alert_rules(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    fired_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    value NUMERIC,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_history_rule_id ON alert_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_status ON alert_history(status);
CREATE INDEX IF NOT EXISTS idx_alert_history_fired_at ON alert_history(fired_at DESC);

-- 3. Notification Log table
CREATE TABLE IF NOT EXISTS notification_log (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    correlation_id VARCHAR(255) NOT NULL,
    trace_id VARCHAR(255),
    event_type VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    user_id BIGINT REFERENCES "user"(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    dispatched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Missing columns on "order" table
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES "user"(id);
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS business_id VARCHAR(255);
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(50) DEFAULT 'delivery';
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS address_id INTEGER REFERENCES savedaddress(id);
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS pickup_notes TEXT;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS rider_id INTEGER REFERENCES "user"(id);
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS delivery_id INTEGER REFERENCES delivery(id);
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS subtotal FLOAT DEFAULT 0;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS service_fee FLOAT DEFAULT 0;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS delivery_fee FLOAT DEFAULT 0;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS courier_tip FLOAT DEFAULT 0;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS discount_amount FLOAT DEFAULT 0;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS tax_amount FLOAT DEFAULT 0;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS total_amount FLOAT DEFAULT 0;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS extra_info JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_order_seller_id ON "order"(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_delivered_at ON "order"(delivered_at);
