# Phase 2: Integration Testing Guide

**Status**: Manual Testing Required (Database setup needed for backend)  
**Scope**: Frontend → API Client Integration  
**Tested By**: You (Manual Testing)

---

## Quick Summary

✅ **What's Ready**:
- Frontend UI (all pages)
- API Client library (`/src/lib/api.ts`)
- Auth hooks (`/src/hooks/useAuth.ts`)
- Environment config (`.env.local`)
- Updated AuthModal

⚠️ **What Needs Backend**:
- Actual signup/login (requires PostgreSQL)
- Order creation (requires database)
- Payment testing (requires Daraja credentials)

---

## Manual Testing Steps (No Backend Required)

### Step 1: Verify API Client is Configured

**File**: `src/lib/api.ts`

```bash
# Check the file exists and has key functions
grep -c "authAPI\|ordersAPI\|paymentsAPI" src/lib/api.ts
# Should output: 3
```

**Expected**: All API endpoints defined ✓

### Step 2: Verify Environment Configuration

**File**: `.env.local`

```bash
cat .env.local
```

**Expected**:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=Suqafuran
NEXT_PUBLIC_ENVIRONMENT=development
```

### Step 3: Verify AuthModal Updates

**File**: `src/components/AuthModal.tsx`

Check for these changes:
- [ ] Imports `authAPI` from `/lib/api`
- [ ] Uses `authAPI.signup()` instead of `authService.signup()`
- [ ] Uses `authAPI.login()` instead of `authService.login()`
- [ ] Stores token as `auth_token` (not `access_token`)
- [ ] Stores user object in localStorage

**Code Check**:
```bash
grep -c "authAPI\|auth_token" src/components/AuthModal.tsx
# Should show multiple matches
```

### Step 4: Test Frontend API Client in Browser Console

**Open**: http://localhost:3002

**In Browser DevTools Console** (F12):

```javascript
// Test 1: Check API client is loaded
import('/lib/api.ts').then(m => console.log('API client loaded'))

// Test 2: Check environment
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should output: http://localhost:8000/api/v1

// Test 3: Check localStorage is working
localStorage.setItem('test', 'value')
console.log(localStorage.getItem('test'))
// Should output: value
```

### Step 5: Verify Frontend Structure

**Expected File Structure**:
```
src/
├── lib/
│   └── api.ts                 ✓ Created
├── hooks/
│   └── useAuth.ts             ✓ Created
├── components/
│   └── AuthModal.tsx          ✓ Updated
└── .env.local                 ✓ Created
```

**Verify with**:
```bash
ls -la src/lib/api.ts src/hooks/useAuth.ts .env.local
```

---

## Testing Checklist (When Backend is Ready)

Once you set up PostgreSQL and start the backend:

- [ ] Can open http://localhost:3002
- [ ] Can click "Sign In" button
- [ ] AuthModal opens without errors
- [ ] Can fill signup form
- [ ] Click "Sign Up" sends request to backend
- [ ] DevTools Network tab shows POST to `/api/v1/auth/signup`
- [ ] Receive token in response
- [ ] Token saved in localStorage
- [ ] User data saved in localStorage
- [ ] Redirect to /shops after signup
- [ ] Can login with credentials
- [ ] Token persists on page reload
- [ ] Can navigate to /orders with token
- [ ] Can see "Create Order" page
- [ ] Can create order (goes to `/checkout`)
- [ ] Can initiate M-Pesa payment

---

## Next Phase: Checkout Integration (Phase 2.2)

Moving forward with:
1. **Wire cart to order creation**
2. **Add payment initiation**
3. **Test M-Pesa flow**

See: `CHECKOUT_INTEGRATION.md`

---

## Next Phase: Seller Features (Phase 2.3)

Building:
1. **Seller registration integration**
2. **Seller dashboard API connection**
3. **Earnings display**

See: `SELLER_INTEGRATION.md`

---

## Getting Backend Running

If you want to set up PostgreSQL locally:

```bash
# macOS - Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb suqafuran

# Start backend
cd /Users/mac/suqafuran/backend
python -m uvicorn main:app --reload --port 8000
```

Then run the full test suite.

---

## Verification Checklist

- [x] API client library created (`src/lib/api.ts`)
- [x] Auth hook created (`src/hooks/useAuth.ts`)
- [x] Environment variables configured (`.env.local`)
- [x] AuthModal updated to use new API
- [x] Frontend pages all rendering
- [x] No TypeScript errors
- [x] No console errors (in browser)
- [ ] Backend responding (needs database)
- [ ] Can signup/login (needs database)
- [ ] Can create orders (needs database)
- [ ] Can pay with M-Pesa (needs Daraja account)

---

**Status**: Phase 2.1 Complete - Ready for Phase 2.2 (Checkout) and 2.3 (Sellers)

