# ✅ Auto-Verification: Integrated with Existing Document Verification

**Purpose:** Auto-verify sellers who have already passed document verification OR own an existing shop.

**Date:** 2026-07-27

---

## How It Works

### Verification Check Hierarchy

```
Seller visits verification page
    ↓
Does seller have APPROVED VerificationRequest?
    ├─ YES → Auto-approve verified badge ✓
    │        (Already passed document verification)
    │
    └─ NO → Does seller have existing listings?
             ├─ YES → Auto-approve verified badge ✓
             │        (Already vetted as shop owner)
             │
             └─ NO → Show verification form
                    (New seller, needs documents)
```

---

## Integration Points

### 1. Existing Verification System
**Model:** `VerificationRequest` (already exists in `/app/models/verification.py`)

**Attributes:**
- `document_type` - "ID", "Passport", "Business Registration"
- `status` - "pending", "approved", "rejected"
- `tier` - "tier2", "tier3" (verification level)
- `document_urls[]` - Uploaded ID documents
- `selfie_url` - Verified selfie
- `proof_of_address_url` - Address proof
- `video_selfie_url` - Video verification
- `auto_verification_status` - "passed", "failed", "manual_review"

**Endpoint:** `POST /verifications/apply` (already exists)

### 2. New Verified Badge System
**Model:** `IdentityVerification` (added for subscription feature)

**Purpose:** Marks seller as eligible for "✓ Verified Shop" badge

**Auto-filled from:** VerificationRequest if available

---

## Auto-Verification Logic

### Check 1: Approved VerificationRequest ✓

```python
approved_verification = session.exec(
    select(VerificationRequest)
    .where(VerificationRequest.user_id == seller_id)
    .where(VerificationRequest.status == VerificationStatus.APPROVED)
).first()

if approved_verification:
    # Extract from existing verification
    verification_data = {
        "type": "existing_verification",
        "document_type": approved_verification.document_type,
        "tier": approved_verification.tier,
        "verified_at": approved_verification.updated_at,
    }
```

**Benefits:**
- Seller already uploaded documents ✓
- Already passed facial recognition ✓
- Already has ID verified ✓
- No need to re-verify

### Check 2: Existing Shop Owner ✓

```python
has_listings = session.exec(
    select(Listing).where(Listing.owner_id == seller_id).limit(1)
).first()

if has_listings:
    # Already vetted by platform
    verification_data = {
        "has_listings": True,
        "reason": "existing shop owner"
    }
```

**Benefits:**
- Already selling on platform ✓
- Already has platform verification ✓
- Platform vouches for them ✓
- Low risk to auto-approve

---

## API Endpoints

### 1. Auto-Verify Endpoint
```
POST /subscriptions/sellers/{seller_id}/verification/auto-verify
```

**Response (Auto-Approved):**
```json
{
  "status": "verified",
  "auto_verified": true,
  "message": "Auto-verified (approved verification)",
  "reason": "approved verification",
  "verification_data": {
    "type": "existing_verification",
    "verification_id": 123,
    "document_type": "ID",
    "tier": "tier2",
    "verified_at": "2026-07-25T10:00:00",
    "auto_verification_status": "passed"
  }
}
```

**Response (Needs Manual Verification):**
```json
{
  "status": "needs_verification",
  "auto_verified": false,
  "message": "New seller without verification or listings",
  "reason": "New seller without verification or listings",
  "verification_data": {
    "has_listings": false
  }
}
```

### 2. Status Endpoint
```
GET /subscriptions/sellers/{seller_id}/verification/status
```

**Response:**
```json
{
  "status": "approved",
  "is_verified": true,
  "verified_at": "2026-07-25T10:00:00",
  "email_verified": true,
  "phone_verified": true,
  "auto_verified": true,
  "id_type": "ID",
  "rejection_reason": null
}
```

---

## Database Schema

### IdentityVerification (New)
```sql
-- Auto-filled from VerificationRequest if available
id_type          VARCHAR   -- Source: VerificationRequest.document_type
id_number        VARCHAR   -- Source: VerificationRequest.id_number
verified_at      TIMESTAMP -- When approved
status           VARCHAR   -- 'approved' after auto-verify
phone_verified   BOOLEAN   -- true after auto-verify
email_verified   BOOLEAN   -- true after auto-verify
```

### VerificationRequest (Existing)
```sql
-- Already has all documents
document_type    VARCHAR   -- "ID", "Passport", etc
document_urls    JSON[]    -- Uploaded documents
selfie_url       VARCHAR   -- Selfie photo
proof_of_address VARCHAR   -- Address proof
video_selfie_url VARCHAR   -- Video verification
status           VARCHAR   -- "pending", "approved", "rejected"
tier             VARCHAR   -- "tier2", "tier3"
```

---

## User Flows

### Flow 1: Seller with Approved Verification Documents

**Scenario:** Seller uploaded documents, passed facial recognition, got "approved"

```
Step 1: Visit verification page
        ↓
Step 2: System checks: "Has approved VerificationRequest?"
        → YES
        ↓
Step 3: Auto-approve from existing verification
        ↓
Step 4: Show "✓ Verified Shop" badge
        ↓
Step 5: Copy document data to IdentityVerification table
        ↓
Step 6: Set is_verified = true on User record
        ↓
Success! No manual submission needed.
```

**User sees:**
- Green badge: "✓ Verified Shop"
- Message: "Auto-verified from your approved documents"
- No form to fill

### Flow 2: Existing Shop Owner (No prior verification)

**Scenario:** Seller has been on platform, already has 10+ listings

```
Step 1: Visit verification page
        ↓
Step 2: System checks: "Has approved VerificationRequest?"
        → NO
        ↓
Step 3: System checks: "Has existing listings?"
        → YES (10 listings found)
        ↓
Step 4: Auto-approve as existing seller
        ↓
Step 5: Create IdentityVerification record (auto_verified=true)
        ↓
Step 6: Set is_verified = true on User record
        ↓
Success! Platform already vouches for them.
```

**User sees:**
- Green badge: "✓ Verified Shop"
- Message: "Auto-verified as existing shop owner"
- No form to fill

### Flow 3: New Seller (No verification, No listings)

**Scenario:** Brand new user, no documents submitted yet

```
Step 1: Visit verification page
        ↓
Step 2: System checks: "Has approved VerificationRequest?"
        → NO
        ↓
Step 3: System checks: "Has existing listings?"
        → NO
        ↓
Step 4: Show verification form
        ↓
Step 5: User submits National ID + Selfie
        ↓
Step 6: Documents sent to `/verifications/apply` endpoint
        ↓
Step 7: Facial recognition + document verification runs
        ↓
Step 8: Admin reviews if needed
        ↓
Step 9: When approved → Auto-filled into IdentityVerification
        ↓
Success! User now has verified badge.
```

**User sees:**
- Gray badge: "Not Verified"
- Form: "Upload National ID or Passport"
- Message: "We'll review within 1-2 business days"

---

## Implementation Details

### File: `backend/app/services/subscription_service.py`

**New method: `auto_verify_existing_sellers()`**
- Returns: `dict` with `auto_verified`, `reason`, `verification_data`
- Checks VerificationRequest table first
- Falls back to Listing count
- Creates/updates IdentityVerification record
- Sets user.is_verified flag

### File: `backend/app/api/api_v1/endpoints/subscriptions.py`

**Updated endpoints:**
- `POST /subscriptions/sellers/{id}/verification/auto-verify`
- `GET /subscriptions/sellers/{id}/verification/status`

**Returns:** Reason for verification status + document info

### File: `new-frontend/src/app/seller-dashboard/verification/page.tsx`

**Updated `loadVerification()`:**
- Calls auto-verify endpoint on page load
- Checks `auto_verified` flag in response
- If true: Shows approved status + reason
- If false: Shows verification form
- Logs document type from verification_data

---

## Testing Checklist

### Test 1: Seller with Approved Documents
```bash
# Prerequisites:
# - Seller has VerificationRequest with status='approved'
# - Seller has passed document verification

# Test:
POST /subscriptions/sellers/{id}/verification/auto-verify
# Expected: auto_verified=true, reason="approved verification"

# Visit verification page
# Expected: Shows "✓ Verified Shop" badge
# Expected: No form shown
# Expected: Shows document type in status
```

### Test 2: Existing Shop Owner
```bash
# Prerequisites:
# - Seller has no VerificationRequest (or rejected)
# - Seller has 5+ listings on platform

# Test:
POST /subscriptions/sellers/{id}/verification/auto-verify
# Expected: auto_verified=true, reason="existing shop owner"

# Visit verification page
# Expected: Shows "✓ Verified Shop" badge
# Expected: Message says "existing shop owner"
# Expected: No form shown
```

### Test 3: New Seller Needs Documents
```bash
# Prerequisites:
# - Seller has no VerificationRequest
# - Seller has no listings

# Test:
POST /subscriptions/sellers/{id}/verification/auto-verify
# Expected: auto_verified=false

# Visit verification page
# Expected: Shows "Not Verified" status (gray)
# Expected: Shows document upload form
# Expected: Can submit National ID + selfie
```

### Test 4: Flow After Manual Verification
```bash
# Prerequisites:
# - New seller submits documents via /verifications/apply
# - Admin approves VerificationRequest (status=approved)

# Test:
GET /subscriptions/sellers/{id}/verification/status
# Expected: Auto-fetches and approves from VerificationRequest
# Expected: Shows approved status on next page visit
```

---

## Benefits Summary

✅ **No Re-Verification:** Already verified sellers don't need to do it again  
✅ **Faster Onboarding:** Existing shop owners get badge instantly  
✅ **Reuses Existing System:** Leverages existing VerificationRequest infrastructure  
✅ **Document Tracking:** Knows which docs were submitted and verified  
✅ **Tier-Based:** Respects tier2/tier3 levels from existing system  
✅ **Audit Trail:** Logs all auto-verifications  
✅ **Backward Compatible:** Doesn't break existing verification flow  

---

## Files Modified

- ✅ `backend/app/services/subscription_service.py` - Enhanced auto_verify_existing_sellers()
- ✅ `backend/app/api/api_v1/endpoints/subscriptions.py` - Updated endpoints
- ✅ `new-frontend/src/app/seller-dashboard/verification/page.tsx` - Integrated with new endpoint

---

**Implementation Complete!**
Sellers are auto-verified if they have existing approved documents or are existing shop owners.

