-- Create Offer table
CREATE TABLE IF NOT EXISTS offer (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listing(id),
    buyer_id INTEGER NOT NULL REFERENCES "user"(id),
    amount FLOAT NOT NULL,
    message TEXT,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_offer_listing_id ON offer(listing_id);
CREATE INDEX IF NOT EXISTS ix_offer_buyer_id ON offer(buyer_id);
CREATE INDEX IF NOT EXISTS ix_offer_status ON offer(status);
CREATE INDEX IF NOT EXISTS ix_offer_created_at ON offer(created_at);

-- Create PriceAlert table
CREATE TABLE IF NOT EXISTS pricealert (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listing(id),
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    target_price FLOAT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_notified_at TIMESTAMP,
    last_price FLOAT
);

CREATE INDEX IF NOT EXISTS ix_pricealert_listing_id ON pricealert(listing_id);
CREATE INDEX IF NOT EXISTS ix_pricealert_user_id ON pricealert(user_id);
CREATE INDEX IF NOT EXISTS ix_pricealert_is_active ON pricealert(is_active);
CREATE INDEX IF NOT EXISTS ix_pricealert_created_at ON pricealert(created_at);

-- Create SavedSearch table
CREATE TABLE IF NOT EXISTS savedsearch (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    name VARCHAR NOT NULL,
    query VARCHAR NOT NULL,
    category_id INTEGER REFERENCES category(id),
    min_price FLOAT,
    max_price FLOAT,
    location VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_matched_at TIMESTAMP,
    match_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_savedsearch_user_id ON savedsearch(user_id);
CREATE INDEX IF NOT EXISTS ix_savedsearch_is_active ON savedsearch(is_active);
CREATE INDEX IF NOT EXISTS ix_savedsearch_created_at ON savedsearch(created_at);

-- Create NotificationPreferences table
CREATE TABLE IF NOT EXISTS notificationpreferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES "user"(id),
    email_messages BOOLEAN NOT NULL DEFAULT true,
    email_offers BOOLEAN NOT NULL DEFAULT true,
    email_price_drops BOOLEAN NOT NULL DEFAULT true,
    email_search_matches BOOLEAN NOT NULL DEFAULT true,
    email_order_updates BOOLEAN NOT NULL DEFAULT true,
    email_listings BOOLEAN NOT NULL DEFAULT true
);

-- Verify tables created
SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('offer', 'pricealert', 'savedsearch', 'notificationpreferences')
ORDER BY table_name;
