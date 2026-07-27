# Database Setup & Migration Guide

## Current Migrations Ready

```
✓ 006_add_listing_to_featured.sql - Featured advertising listing tracking
✓ 007_add_featured_analytics.sql - Campaign performance analytics
✓ 008_add_subscription_features.sql - All subscription feature tables
```

## Application Steps

### Option 1: Manual Application (Recommended for verification)

```bash
# Get your database credentials
export DB_HOST="your-host"
export DB_USER="your-user"
export DB_PASSWORD="your-password"
export DB_NAME="suqafuran"

# Apply each migration
psql "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}" < backend/migrations/006_add_listing_to_featured.sql

psql "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}" < backend/migrations/007_add_featured_analytics.sql

psql "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}" < backend/migrations/008_add_subscription_features.sql
```

### Option 2: Automatic via Alembic (If configured)

```bash
cd backend
alembic upgrade head
```

## Verification Checklist

After applying migrations, verify all tables exist:

```sql
-- Check identity verification table
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'identity_verification';

-- Check discount codes
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'discount_code';

-- Check analytics events
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'analytics_event';

-- Check shop branding
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'shop_branding';

-- Check staff accounts
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'staff_account';

-- Check API keys
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'api_key';

-- Check custom domains
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'custom_domain';

-- Check advertising credits
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'advertising_credit';

-- Verify seller_subscription has new columns
\d seller_subscription
```

## Rollback (If needed)

Each migration can be rolled back by dropping the tables:

```sql
DROP TABLE IF EXISTS identity_verification CASCADE;
DROP TABLE IF EXISTS discount_code CASCADE;
DROP TABLE IF EXISTS analytics_event CASCADE;
DROP TABLE IF EXISTS shop_branding CASCADE;
DROP TABLE IF EXISTS staff_account CASCADE;
DROP TABLE IF EXISTS api_key CASCADE;
DROP TABLE IF EXISTS custom_domain CASCADE;
DROP TABLE IF EXISTS advertising_credit CASCADE;
```

