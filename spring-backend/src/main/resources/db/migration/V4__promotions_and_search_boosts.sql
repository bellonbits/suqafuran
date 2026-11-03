-- =============================================================================
-- SUQAFURAN SPRING BOOT BUSINESS SCHEMA MIGRATION V4
-- Promotions, Search Boost Packages & Performance Telemetry
-- =============================================================================

-- 1. Extend promoted_listing with telemetry and boost levels
ALTER TABLE promoted_listing
    ADD COLUMN IF NOT EXISTS package_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS boost_level INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS impressions_count BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS clicks_count BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) DEFAULT 0.00;

-- 2. Promotion Packages Catalog
CREATE TABLE IF NOT EXISTS promotion_package (
    package_code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    placement_type VARCHAR(50) NOT NULL,
    boost_level INT NOT NULL DEFAULT 1,
    duration_days INT NOT NULL DEFAULT 7,
    price NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed standard boost packages
INSERT INTO promotion_package (package_code, name, placement_type, boost_level, duration_days, price, currency, description)
VALUES
    ('BOOST_3_DAYS', '3-Day Quick Boost', 'TOP_SEARCH_BOOST', 1, 3, 299.00, 'KES', 'Bump listing to the top of search for 3 days'),
    ('BOOST_7_DAYS', '7-Day Popular Boost', 'TOP_SEARCH_BOOST', 1, 7, 599.00, 'KES', 'Top search placement for a full week with high exposure'),
    ('VIP_7_DAYS', '7-Day VIP Badge & Top Placement', 'VIP_BADGE', 2, 7, 999.00, 'KES', 'VIP badge ribbon + category top placement for 7 days'),
    ('DIAMOND_30_DAYS', '30-Day Diamond Exclusive', 'FEATURED_PRODUCT', 3, 30, 2499.00, 'KES', 'Homepage carousel hero + diamond badge + priority search for 30 days')
ON CONFLICT (package_code) DO NOTHING;

