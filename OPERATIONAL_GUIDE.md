# 🛠️ Subscription System - Operational Guide

How to manage, monitor, and optimize the subscription system post-launch.

---

## 📊 DAILY MONITORING

### Morning Checklist (9 AM)
```sql
-- Check subscription metrics
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_subscriptions,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_subs
FROM seller_subscription
WHERE created_at >= NOW() - INTERVAL '1 day'
GROUP BY DATE(created_at);

-- Check trial conversions
SELECT 
  COUNT(*) as total_trials,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as converted,
  ROUND(100.0 * SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) / COUNT(*), 2) as conversion_rate
FROM seller_subscription
WHERE trial_active = true AND created_at >= NOW() - INTERVAL '1 day';

-- Check payment failures
SELECT 
  COUNT(*) as total_attempts,
  SUM(CASE WHEN status = 'payment_failed' THEN 1 ELSE 0 END) as failures,
  ROUND(100.0 * SUM(CASE WHEN status = 'payment_failed' THEN 1 ELSE 0 END) / COUNT(*), 2) as failure_rate
FROM seller_billing
WHERE created_at >= NOW() - INTERVAL '1 day';
```

### Weekly Metrics Report
```sql
-- Revenue by plan
SELECT 
  sp.name,
  COUNT(ss.id) as subscribers,
  SUM(ss.plan_id = sp.id * sp.monthly_price) as monthly_revenue
FROM seller_subscription ss
JOIN subscription_plan sp ON ss.plan_id = sp.id
WHERE ss.is_active = true
GROUP BY sp.name, sp.monthly_price;

-- Churn rate
SELECT 
  DATE_TRUNC('week', cancelled_at) as week,
  COUNT(*) as cancelled_subscriptions
FROM seller_subscription
WHERE is_active = false AND cancelled_at IS NOT NULL
  AND cancelled_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('week', cancelled_at);

-- Feature adoption
SELECT 
  'Analytics' as feature,
  COUNT(DISTINCT seller_id) as sellers_using
FROM analytics_event
WHERE created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'Discount Codes',
  COUNT(DISTINCT seller_id)
FROM discount_code
WHERE is_active = true;
```

---

## 🔧 COMMON ADMIN TASKS

### Manually Assign Subscription (Payment Failed)

```bash
# Via admin dashboard:
1. Go to /admin-dashboard/subscriptions
2. Find seller in list
3. Click "Manual Subscription Assignment" form
4. Select seller ID
5. Select plan (Business, Enterprise, etc)
6. Click "Apply Subscription"
7. Seller immediately gets features active

# Via database (emergency):
INSERT INTO seller_subscription (
  seller_id, plan_id, status, is_active, 
  trial_active, created_at, renews_at
) VALUES (
  123, 2, 'active', true, false, 
  NOW(), NOW() + INTERVAL '30 days'
);

-- Mark as paid/verified
UPDATE seller_billing 
SET status = 'active' 
WHERE seller_id = 123 AND status = 'pending'
ORDER BY created_at DESC LIMIT 1;
```

### Approve Verified Badge

```bash
# Via admin dashboard:
1. Go to verification review interface
2. Review seller's ID document
3. Check phone/email verified
4. Click "Approve"
5. Seller gets "✓ Verified Shop" badge

# Mark as verified in database:
UPDATE identity_verification 
SET status = 'approved', verified_at = NOW()
WHERE seller_id = 123;

UPDATE "user" 
SET is_verified = true 
WHERE id = 123;
```

### Process Refund

```bash
# Partial refund (customer error)
SELECT * FROM seller_billing 
WHERE seller_id = 123 AND status = 'active'
ORDER BY created_at DESC LIMIT 1;

-- Record refund
INSERT INTO seller_billing (
  seller_id, amount_kes, status, mpesa_receipt, notes
) VALUES (
  123, -5000, 'refunded', 'REF123', 'Duplicate charge refund'
);

-- Send to seller
-- Reverse charge to their M-Pesa account
```

### Disable/Extend a Subscription

```sql
-- Disable immediately
UPDATE seller_subscription 
SET is_active = false, status = 'cancelled'
WHERE seller_id = 123;

-- Extend by 30 days
UPDATE seller_subscription 
SET renews_at = renews_at + INTERVAL '30 days'
WHERE seller_id = 123 AND is_active = true;
```

---

## 🚨 TROUBLESHOOTING

### M-Pesa Payment Stuck in "Pending"

```sql
-- Check pending payments
SELECT * FROM seller_billing 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '30 minutes';

-- Resolution options:
-- 1. Wait for callback (normal: < 30 min)
-- 2. Verify payment manually via Safaricom API
-- 3. Refund and ask seller to retry
-- 4. Admin: assign subscription manually

-- Manual check:
UPDATE seller_billing 
SET status = 'active' 
WHERE seller_id = 123 AND status = 'pending';
```

### Trial Not Activated

```sql
-- Check trial record
SELECT * FROM seller_subscription 
WHERE seller_id = 123 
AND trial_active = true;

-- If not found, create manually:
INSERT INTO seller_subscription (
  seller_id, plan_id, status, is_active, 
  trial_active, trial_ends_at, created_at
) VALUES (
  123, 2, 'active', true, true,
  NOW() + INTERVAL '7 days', NOW()
);
```

### Subscription Not Showing in Dashboard

```sql
-- Verify subscription record exists
SELECT * FROM seller_subscription 
WHERE seller_id = 123;

-- Check if features cached correctly
SELECT * FROM seller_feature_access 
WHERE seller_id = 123;

-- If needed, refresh cache:
-- Backend should call: 
-- subscription_service.update_seller_features(123, session)

-- Or manually in database:
DELETE FROM seller_feature_access 
WHERE seller_id = 123;
-- Frontend will fetch fresh features on next page load
```

---

## 📈 OPTIMIZATION & GROWTH

### Identify Churn Risk

```sql
-- Sellers likely to churn (not used features)
SELECT 
  s.id, 
  s.email,
  ss.created_at,
  COUNT(ae.id) as events_last_7_days
FROM seller_subscription ss
JOIN "user" s ON ss.seller_id = s.id
LEFT JOIN analytics_event ae ON 
  ae.seller_id = s.id 
  AND ae.created_at >= NOW() - INTERVAL '7 days'
WHERE ss.is_active = true
  AND ss.created_at < NOW() - INTERVAL '30 days'
GROUP BY s.id, ss.created_at
HAVING COUNT(ae.id) = 0
LIMIT 20;

-- Action: Send email: "We noticed you haven't used your analytics dashboard.
-- Here's how to get the most from your subscription..."
```

### Identify Upsell Opportunities

```sql
-- Starter sellers using advanced features
SELECT 
  s.id,
  s.email,
  COUNT(CASE WHEN ae.event_type = 'product_view' THEN 1 END) as views,
  COUNT(DISTINCT ae.listing_id) as unique_products
FROM seller_subscription ss
JOIN "user" s ON ss.seller_id = s.id
JOIN analytics_event ae ON ae.seller_id = s.id
WHERE ss.plan_id = 2 -- Starter
  AND ae.created_at >= NOW() - INTERVAL '30 days'
GROUP BY s.id
HAVING COUNT(DISTINCT ae.listing_id) > 150 -- Close to 200 limit
ORDER BY views DESC
LIMIT 20;

-- Action: Send email: "You're almost at your 200-product limit.
-- Upgrade to Business for unlimited products & bulk import!"
```

### Most Valuable Sellers

```sql
-- Top earning sellers (by referrals, reviews, products)
SELECT 
  s.id,
  s.email,
  COUNT(DISTINCT ae.listing_id) as active_products,
  SUM(CASE WHEN dc.id IS NOT NULL THEN 1 ELSE 0 END) as marketing_codes,
  ss.plan_id,
  sp.name
FROM "user" s
LEFT JOIN seller_subscription ss ON s.id = ss.seller_id
LEFT JOIN subscription_plan sp ON ss.plan_id = sp.id
LEFT JOIN analytics_event ae ON s.id = ae.seller_id 
  AND ae.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN discount_code dc ON s.id = dc.seller_id
WHERE ss.is_active = true
GROUP BY s.id, ss.plan_id, sp.name
ORDER BY active_products DESC
LIMIT 20;

-- Action: Reach out personally to top 20 sellers for feedback & upgrades
```

---

## 💰 REVENUE REPORTING

### Daily Revenue

```sql
SELECT 
  DATE(created_at) as date,
  SUM(amount_kes) as revenue,
  COUNT(*) as transactions,
  SUM(CASE WHEN status = 'active' THEN amount_kes ELSE 0 END) as confirmed
FROM seller_billing
WHERE status IN ('active', 'paid')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### MRR (Monthly Recurring Revenue)

```sql
-- Current MRR
SELECT 
  sp.name,
  COUNT(ss.id) * sp.monthly_price as monthly_revenue
FROM seller_subscription ss
JOIN subscription_plan sp ON ss.plan_id = sp.id
WHERE ss.is_active = true
GROUP BY sp.name, sp.monthly_price
ORDER BY monthly_revenue DESC;

-- Calculate total MRR
SELECT 
  SUM(sp.monthly_price) as total_mrr
FROM seller_subscription ss
JOIN subscription_plan sp ON ss.plan_id = sp.id
WHERE ss.is_active = true;
```

### Featured Ads Revenue

```sql
SELECT 
  placement_type,
  COUNT(*) as active_placements,
  SUM(price_kes) as total_revenue,
  AVG(price_kes) as avg_cost
FROM featured_selling
WHERE is_active = true 
  AND ends_at > NOW()
GROUP BY placement_type
ORDER BY total_revenue DESC;
```

---

## 📧 AUTOMATED COMMUNICATIONS

### Trial Expiring Soon (2 Days Before)

```sql
SELECT s.email, ss.trial_ends_at
FROM seller_subscription ss
JOIN "user" s ON ss.seller_id = s.id
WHERE ss.trial_active = true
  AND ss.trial_ends_at BETWEEN NOW() AND NOW() + INTERVAL '2 days'
  AND NOT EXISTS (
    SELECT 1 FROM seller_billing 
    WHERE seller_id = s.id AND status = 'active'
  );

-- Send email: "Your 7-day trial ends in 2 days. 
-- Upgrade now to keep your analytics and verified badge!"
```

### Payment Failed - Retry

```sql
SELECT s.email
FROM seller_billing sb
JOIN "user" s ON sb.seller_id = s.id
WHERE sb.status = 'payment_failed'
  AND sb.created_at >= NOW() - INTERVAL '1 hour'
  AND sb.created_at <= NOW();

-- Send SMS/Email: "Your subscription payment failed.
-- Retry now: [link] or contact support."
```

---

## 🎓 PERFORMANCE OPTIMIZATION

### Query Optimization

```sql
-- Add indexes if missing (migrations should include these)
CREATE INDEX idx_seller_subscription_active ON seller_subscription(seller_id, is_active);
CREATE INDEX idx_analytics_event_seller_date ON analytics_event(seller_id, created_at DESC);
CREATE INDEX idx_discount_code_active ON discount_code(is_active, expiry_date);
```

### Cache Strategy

- Seller features cached in `seller_feature_access` table
- Refresh when subscription changes
- Clear when plan manually assigned by admin
- TTL: Real-time (no expiry)

### Database Maintenance

```bash
# Weekly maintenance
VACUUM ANALYZE analytics_event;
VACUUM ANALYZE seller_subscription;
REINDEX TABLE analytics_event;

# Monthly
CLUSTER analytics_event USING idx_analytics_event_seller_date;
```

---

## 📞 ESCALATION CONTACTS

**If issues arise, escalate to:**

- **Payment Issues:** M-Pesa Support + Safaricom Account Manager
- **Database Issues:** DevOps / Database Admin
- **Seller Complaints:** Customer Support Lead
- **Feature Bugs:** Engineering Lead
- **Revenue/Reporting:** Finance Team

---

## ✅ MONTHLY REVIEW CHECKLIST

- [ ] Revenue trending (up or down?)
- [ ] Churn rate acceptable (< 10%)?
- [ ] Trial conversion healthy (> 25%)?
- [ ] Payment failure rate low (< 5%)?
- [ ] Feature adoption increasing?
- [ ] Customer satisfaction (NPS tracking)?
- [ ] Any critical bugs to patch?
- [ ] Marketing codes performing?
- [ ] Verified badge program working?

---

**Last Updated:** 2026-07-27  
**Next Review:** 2026-08-27

