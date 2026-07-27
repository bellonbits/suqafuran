# 🚀 Suqafuran Subscription System - LAUNCH CHECKLIST

Complete pre-launch verification and deployment guide.

---

## ✅ TASK 1: DATABASE SETUP

### Migrations Applied
- [ ] `006_add_listing_to_featured.sql` ✓ Featured advertising tracking
- [ ] `007_add_featured_analytics.sql` ✓ Campaign analytics
- [ ] `008_add_subscription_features.sql` ✓ All subscription tables

### Verification Queries
```sql
-- Run these to verify all tables exist
\dt identity_verification
\dt discount_code
\dt analytics_event
\dt shop_branding
\dt staff_account
\dt api_key
\dt custom_domain
\dt advertising_credit

-- Verify columns added to existing tables
\d seller_subscription
-- Should have: ranking_boost BOOLEAN

\d "user"
-- Should have: is_verified BOOLEAN, custom_domain VARCHAR, account_manager_id INT
```

**Status: [ ] Complete**

---

## ✅ TASK 2: BACKEND-FRONTEND INTEGRATION

### Marketing Codes
- [x] Service Layer: `discount_code_service.py` ✓
- [x] API Endpoints: `discount_codes.py` ✓
- [ ] Frontend Integration:
  - [ ] Create code form in marketing dashboard
  - [ ] List codes display with analytics
  - [ ] Disable code functionality
  - [ ] Test discount application flow

### Analytics Tracking
- [x] Service Layer: `analytics_service.py` ✓
- [x] API Endpoints: `analytics_sellers.py` ✓
- [ ] Frontend Integration:
  - [ ] `trackEvent()` utility function added to utils
  - [ ] Track shop_visit on landing
  - [ ] Track product_view on listing open
  - [ ] Track whatsapp_click, call_click, message_click
  - [ ] Analytics dashboard fetches from API
  - [ ] Daily metrics chart displays correctly

### Verified Badge System
- [x] Service Layer: (in `subscription_service.py`)
- [ ] API Endpoints:
  - [ ] POST `/subscriptions/sellers/{id}/verification/submit`
  - [ ] GET `/subscriptions/sellers/{id}/verification/status`
  - [ ] Admin approval endpoint
- [ ] Frontend Integration:
  - [ ] Verification page shows status
  - [ ] Document upload form
  - [ ] Admin dashboard shows pending verifications

### Staff Accounts
- [x] Models: `StaffAccount` in subscription_features.py
- [ ] API Endpoints:
  - [ ] POST `/subscriptions/sellers/{id}/staff/invite`
  - [ ] GET `/subscriptions/sellers/{id}/staff`
  - [ ] PUT `/subscriptions/sellers/{id}/staff/{id}`
  - [ ] DELETE `/subscriptions/sellers/{id}/staff/{id}`
- [ ] Frontend Integration:
  - [ ] Staff list displays in settings
  - [ ] Invite form works
  - [ ] Role/permission selector works

### Subscriptions
- [x] Service Layer: `subscription_service.py` ✓
- [x] API Endpoints: `subscriptions.py` ✓
- [ ] Frontend Integration:
  - [ ] Plans display correctly on subscription page
  - [ ] Trial button works
  - [ ] Upgrade modal shows M-Pesa flow
  - [ ] Current plan shows in dashboard

### Featured Advertising
- [x] Service Layer: `featured_advertising_service.py` ✓
- [x] API Endpoints: `featured_advertising.py` ✓
- [ ] Frontend Integration:
  - [ ] Pricing display
  - [ ] Purchase flow
  - [ ] Active placements list

**Status: [ ] Complete**

---

## ✅ TASK 3: ADMIN DASHBOARDS

### Subscription Admin Dashboard
- [ ] Create `/admin-dashboard/subscriptions/page.tsx` (partially done)
- [ ] Add:
  - [ ] KPI cards (MRR, ARPU, churn, conversion)
  - [ ] Tier distribution chart
  - [ ] Manual subscription assignment form
  - [ ] Subscription list with filtering
  - [ ] Admin can approve manual upgrades

### Featured Ads Admin Dashboard
- [ ] Create `/admin-dashboard/featured-ads/page.tsx` (partially done)
- [ ] Add:
  - [ ] KPI cards (revenue, placements, avg cost)
  - [ ] Revenue by placement type chart
  - [ ] Active placements list
  - [ ] Admin can manage placements

### Verification Admin Dashboard
- [ ] Create verification review interface
- [ ] Admin can:
  - [ ] View pending verifications
  - [ ] Approve with badge activation
  - [ ] Reject with reason
  - [ ] View verification history

### Analytics Admin Dashboard
- [ ] Create analytics overview
- [ ] Show:
  - [ ] Top shops by traffic
  - [ ] Most searched keywords
  - [ ] Conversion trends
  - [ ] Event distribution

**Status: [ ] Complete**

---

## ✅ TASK 4: M-PESA TESTING

### Sandbox Setup
- [ ] M-Pesa sandbox credentials in `.env`:
  ```
  MPESA_CONSUMER_KEY=your_key
  MPESA_CONSUMER_SECRET=your_secret
  MPESA_PASSKEY=your_passkey
  MPESA_SHORTCODE=174379
  ```

### Test Cases
- [ ] Start trial → Shows "7-day trial activated"
- [ ] Upgrade → M-Pesa STK push sent successfully
- [ ] Callback → Subscription marked as paid
- [ ] Verify Payment → Correctly checks payment status
- [ ] Failed Payment → Manual subscription assignment works

### Flow Testing
1. [ ] Create test seller account
2. [ ] Navigate to subscription page
3. [ ] Click "Start Free Trial" → Verify subscription created with `trial_active=true`
4. [ ] Try to upgrade → M-Pesa STK push prompt appears
5. [ ] On sandbox, complete payment
6. [ ] Verify callback received and subscription activated
7. [ ] Check product limit enforced at 200 (Starter)
8. [ ] Upgrade manually via admin dashboard
9. [ ] Verify new plan's features active

**Status: [ ] Complete**

---

## ✅ TASK 5: ANALYTICS TRACKING

### Event Tracking Implementation
- [ ] Utility function: `utils/analytics.ts`
  ```typescript
  export async function trackEvent(
    eventType: string,
    sellerId: number,
    options?: any
  ) {
    // Call /analytics/track endpoint
  }
  ```

### Frontend Tracking Points
- [ ] Shop landing page:
  ```typescript
  useEffect(() => {
    trackEvent('shop_visit', sellerId, { source: 'search' });
  }, [sellerId]);
  ```

- [ ] Product view (on listing detail):
  ```typescript
  useEffect(() => {
    trackEvent('product_view', sellerId, { listing_id });
  }, [listing_id]);
  ```

- [ ] Contact buttons:
  ```typescript
  const onWhatsApp = () => {
    trackEvent('whatsapp_click', sellerId, { listing_id });
    // Open WhatsApp...
  };
  ```

### Analytics Dashboard Display
- [ ] GET `/analytics/sellers/{id}/summary` returns metrics
- [ ] Dashboard shows:
  - [ ] Shop visits (monthly)
  - [ ] Product views (monthly)
  - [ ] WhatsApp clicks
  - [ ] Call clicks
  - [ ] Messages
  - [ ] Traffic sources pie chart
  - [ ] Top search keywords
  - [ ] Daily trend chart

**Status: [ ] Complete**

---

## ✅ TASK 6: MONITORING & ANALYTICS

### Metrics to Track
- [ ] **Subscription Metrics:**
  - [ ] Trial start rate
  - [ ] Trial to paid conversion rate
  - [ ] Monthly subscription revenue (by tier)
  - [ ] Churn rate per tier
  - [ ] Average subscription lifetime

- [ ] **Feature Usage:**
  - [ ] Analytics dashboard access rate
  - [ ] Marketing codes created per seller
  - [ ] Marketing codes usage rate
  - [ ] Average discount value
  - [ ] Verification completion rate

- [ ] **Platform Metrics:**
  - [ ] Total unique events tracked (daily)
  - [ ] Events by type distribution
  - [ ] Top performing search queries
  - [ ] Traffic sources breakdown

### Dashboard Setup
- [ ] Create `/admin-dashboard/monitoring/subscriptions` (metrics dashboard)
- [ ] Show:
  - [ ] Live MRR
  - [ ] Conversion funnel (Free → Starter → Business)
  - [ ] Churn trends
  - [ ] Feature adoption rates
  - [ ] Top performing promotions

### Alerts Setup
- [ ] Alert when churn rate > 10%
- [ ] Alert when trial conversion < 20%
- [ ] Alert when M-Pesa failures > 5% of attempts
- [ ] Daily revenue email to admins

**Status: [ ] Complete**

---

## 🧪 TESTING MATRIX

### Subscription Purchase Flow

| Scenario | Expected | Status |
|----------|----------|--------|
| Free user clicks "Start Trial" | 7-day trial activated | [ ] |
| Trial user upgrades to Starter | M-Pesa STK prompt appears | [ ] |
| Payment succeeds | Subscription activated immediately | [ ] |
| Payment fails | Admin can manually assign subscription | [ ] |
| Trial expires | Trial badge disappears, upgrade prompt shows | [ ] |

### Features Gating

| Plan | Feature | Accessible |
|------|---------|-----------|
| Free | Product listing (20 max) | [ ] |
| Free | Analytics | [ ] No |
| Starter | Product listing (200 max) | [ ] |
| Starter | Analytics | [ ] Yes |
| Starter | Marketing codes | [ ] Yes |
| Starter | Verified badge | [ ] Yes |
| Business | Product listing (unlimited) | [ ] |
| Business | Bulk import | [ ] Yes |
| Business | Staff accounts (3) | [ ] Yes |
| Enterprise | All features | [ ] Yes |

### Analytics Tracking

| Event | Triggered | Visible in Dashboard |
|-------|-----------|---------------------|
| Shop visit | On shop landing | [ ] Yes |
| Product view | On listing open | [ ] Yes |
| Product click | On secondary action | [ ] Yes |
| WhatsApp click | On WA button click | [ ] Yes |
| Call click | On phone button click | [ ] Yes |
| Message click | On message button click | [ ] Yes |

---

## 📋 PRE-LAUNCH DEPLOYMENT

### Database
- [ ] Migrations applied to production DB
- [ ] All tables verified to exist
- [ ] Indexes created successfully
- [ ] Backup taken before migration

### Backend
- [ ] All endpoints implemented
- [ ] M-Pesa credentials configured
- [ ] Email sending configured (for support SLA)
- [ ] Rate limiting configured (API keys)
- [ ] Build passes (`npm run build`)
- [ ] No console errors in server logs

### Frontend
- [ ] All pages built and type-checked
- [ ] Analytics tracking integrated
- [ ] Plan gating working
- [ ] Subscription flow tested end-to-end
- [ ] Build passes (`npm run build`)
- [ ] No console errors in browser

### Admin
- [ ] Admin dashboards accessible
- [ ] Verification flow working
- [ ] Manual subscription assignment works
- [ ] Analytics dashboard displaying data
- [ ] All admin actions have audit logs

---

## 🎯 LAUNCH DAY CHECKLIST

### Morning (Pre-Launch)
- [ ] Backup all data
- [ ] Test all payment flows one more time
- [ ] Load test: Can system handle 100 concurrent users?
- [ ] Verify M-Pesa sandbox working
- [ ] Communicate with support team: How to handle issues

### Launch (Go Live)
- [ ] Enable subscription plans for all users
- [ ] Send announcement email to existing sellers
- [ ] Display trial CTA on dashboard
- [ ] Monitor error rates for 30 minutes
- [ ] Check M-Pesa payment logs
- [ ] Monitor analytics tracking events

### Post-Launch (First Week)
- [ ] Monitor churn rate daily
- [ ] Monitor trial conversion daily
- [ ] Check feature adoption metrics
- [ ] Gather user feedback
- [ ] Fix any critical bugs immediately
- [ ] Publish launch announcement

---

## 📊 SUCCESS METRICS (First 30 Days)

| Metric | Target | Status |
|--------|--------|--------|
| Trial sign-up rate | 15-20% of free users | [ ] |
| Trial to paid conversion | 30-40% of trials | [ ] |
| Starter subscriptions | 50+ sellers | [ ] |
| Monthly subscription revenue | 37,500+ KSh | [ ] |
| Customer satisfaction (NPS) | 40+ | [ ] |
| Critical bug reports | < 5 | [ ] |

---

## 🚨 ROLLBACK PLAN

If critical issue found:

1. **Immediate:** Disable subscription button in frontend
2. **Within 1 hour:** Roll back latest backend deployment
3. **Within 2 hours:** Investigate root cause
4. **Communication:** Update all affected sellers

Rollback commands:
```bash
# Stop accepting new subscriptions
# Revert to previous backend version
# Keep existing subscriptions active
# Refund any failed recent payments manually
```

---

## 📞 SUPPORT READINESS

### FAQ Prepared
- [ ] How do I upgrade my subscription?
- [ ] What payment methods are supported?
- [ ] Can I cancel my subscription?
- [ ] When will my next billing be?
- [ ] How do I get the verified badge?
- [ ] Why did my payment fail?

### Support Channels
- [ ] Email support@suqafuran.com (24hr response)
- [ ] In-app chat (business hours)
- [ ] WhatsApp (business hours)

### Support Scripts
- [ ] Trial activation explanation
- [ ] Payment failure resolution
- [ ] Upgrade benefits explanation
- [ ] Cancellation process
- [ ] Refund policy

---

## ✨ SIGN-OFF

Once all items checked, subscription system is ready for launch.

**Prepared by:** ____________  
**Date:** ____________  
**Approval:** ____________

