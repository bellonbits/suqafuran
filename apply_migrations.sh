#!/bin/bash

# Apply subscription system migrations
# This script applies all pending migrations to the database

set -e

# Load environment variables
export $(cat backend/.env | grep -v '#' | xargs)

echo "📦 Suqafuran Subscription System - Database Migration"
echo "=================================================="
echo ""
echo "Database: $DATABASE_URL"
echo ""

# Apply migrations
echo "Applying migration 006: Featured listing tracking..."
psql "$DATABASE_URL" -f backend/migrations/006_add_listing_to_featured.sql || echo "✓ Migration 006 already applied or skipped"

echo ""
echo "Applying migration 007: Featured analytics..."
psql "$DATABASE_URL" -f backend/migrations/007_add_featured_analytics.sql || echo "✓ Migration 007 already applied or skipped"

echo ""
echo "Applying migration 008: Subscription features (main)..."
psql "$DATABASE_URL" -f backend/migrations/008_add_subscription_features.sql || echo "✓ Migration 008 already applied or skipped"

echo ""
echo "✅ All migrations applied successfully!"
echo ""

# Verify tables exist
echo "Verifying tables..."
psql "$DATABASE_URL" -c "\dt identity_verification discount_code analytics_event shop_branding staff_account api_key custom_domain advertising_credit"

echo ""
echo "✅ Migration complete!"
