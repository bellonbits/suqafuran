# Duplicate Sellers Fix & Prevention

## Problem
32 users created multiple seller accounts (shops) instead of just one per user. Examples:
- User 481: "abdirahim hassan" (2 accounts)
- User 456: "Deqa faradar" (2 accounts)
- User 455: "sumeyosomane" (2 accounts)

## Solution

### ✅ Already Fixed
- Merged all 32 duplicate user accounts
- Kept the newest shop, deactivated older ones
- All duplicates are now consolidated into single shops per user

### 🔒 Prevention (Now Enforced)

#### 1. Database Level
Added a unique index on active sellers:
```sql
CREATE UNIQUE INDEX idx_sellers_user_id_active
ON sellers(user_id)
WHERE is_active = true
```

This enforces at database level: **Only 1 active seller per user**

**Migration:** Run this on your server:
```bash
cd ~/suqafuran
docker-compose exec backend alembic upgrade head
```

#### 2. Application Level
New seller service with duplicate checks:
```python
from app.services.seller_service import prevent_duplicate_seller

# Before creating a new seller:
prevent_duplicate_seller(db, user_id=123)
```

This will reject seller creation with error message:
```
"User already has an active seller account: 'Shop Name'. 
Each user can only have one active shop. 
Contact support if you need to manage multiple shops."
```

#### 3. Endpoint Protection
- All seller creation endpoints now check for duplicates
- Existing sellers trying to create new shops will get clear error
- Users can only have ONE active seller at a time

## How Users Can Manage Multiple Shops

Instead of creating multiple accounts:

1. **Rename the shop** in settings
2. **Add multiple locations** to one shop
3. **Use teams feature** to manage multiple shops as organization

## For Admins

### Find duplicate sellers (if they return):
```bash
curl http://165.22.13.173:8011/api/v1/listings/admin/duplicates
```

### Merge duplicates manually:
```bash
curl -X POST "http://165.22.13.173:8011/api/v1/listings/admin/merge-duplicates?user_id=USER_ID"
```

## Verification

After deployment, verify the constraint is in place:
```bash
psql $DATABASE_URL -c "
SELECT * FROM pg_indexes 
WHERE indexname = 'idx_sellers_user_id_active'
"
```

Should return the unique index.

## Rollback (if needed)

If you need to allow multiple sellers again:
```bash
docker-compose exec backend alembic downgrade -1
```

This removes the constraint, but is NOT recommended.
