# Suqafuran Subscription Features - Implementation Plan

## Priority 1: Core Monetization (Foundation)
These features directly enable selling subscriptions.

### ✅ Product Limit Enforcement
- [x] Already in subscriptionservice.py
- [ ] Add frontend validation on product create
- [ ] Show product count in seller dashboard
- [ ] Display upgrade prompt at 90% capacity

### ✅ Verified Badge System
- [ ] Create verification model (identity_verification table)
- [ ] Admin dashboard for verifying businesses
- [ ] Badge display on shop pages and search results
- [ ] Verification requirements: National ID, phone, email

### ✅ Marketing Codes / Discount Codes
- [ ] Create discount_code table
- [ ] Seller can create/manage codes
- [ ] Track usage and revenue per code
- [ ] Auto-generate codes (e.g., SUMMER10, WELCOME500)

### ✅ Analytics Dashboard
- [ ] Create analytics events table
- [ ] Track: visitors, product views, clicks, messages, calls
- [ ] Dashboard showing metrics (daily/weekly/monthly)
- [ ] Top viewed products, search keywords, traffic sources

### ✅ Email Support
- [ ] Add to support system (configure support@suqafuran.com)
- [ ] SLA: Response within 24 hours (Starter)

---

## Priority 2: Business Plan Differentiators
Features that justify 2,500 KSh/month upgrade.

### ✅ Priority Search Ranking
- [ ] Add ranking_boost field to seller_subscription
- [ ] Modify search algorithm to boost Business sellers
- [ ] Ensure relevant + boost, not just force to top

### ✅ Custom Shop Branding
- [ ] Create shop_branding table (banner, colors, logo, about)
- [ ] Shop page respects branding
- [ ] Seller dashboard to upload/edit branding

### ✅ Bulk Product Import
- [ ] CSV upload endpoint
- [ ] Parse: Name, Price, Stock, Category, Images, Description
- [ ] Batch create/update products
- [ ] Import history and error reporting

### ✅ Staff Accounts (3 for Business, 10 for Enterprise)
- [ ] Create staff_account table
- [ ] Role-based permissions: Owner, Manager, Sales, Inventory
- [ ] Invite and manage staff in dashboard
- [ ] Activity logging per staff member

### ✅ Priority Support (2-4 hours response)
- [ ] Live chat integration
- [ ] WhatsApp integration
- [ ] Faster email SLA
- [ ] Support ticket dashboard

---

## Priority 3: Enterprise Plan (10,000 KSh/month)
Premium features for large businesses.

### ✅ Unlimited Everything
- [ ] Already works (no limits for Enterprise)
- [ ] Display in plan comparison

### ✅ API Access
- [ ] Create API keys management
- [ ] Endpoints: POST /products, GET /orders, PUT /inventory, GET /analytics
- [ ] Rate limiting: 10,000 requests/day
- [ ] Webhook support for real-time events

### ✅ Custom Domain
- [ ] Add custom_domain field to seller
- [ ] DNS CNAME configuration help
- [ ] SSL certificate for custom domain
- [ ] CDN routing

### ✅ Dedicated Support
- [ ] Assign account_manager to seller
- [ ] WhatsApp + Phone support
- [ ] 30-60 min response time during business hours
- [ ] Quarterly business reviews

---

## Priority 4: Premium Add-ons
Optional features that increase ARPU.

### AI Product Descriptions
- [ ] Integrate with Claude API
- [ ] Generate descriptions from title + category
- [ ] Allow editing before publishing
- [ ] Usage quota per plan

### Scheduled Publishing
- [ ] Add publish_at timestamp to product
- [ ] Background job to publish at scheduled time
- [ ] Calendar view in dashboard

### Inventory Alerts
- [ ] Create alert rule (stock < threshold)
- [ ] Seller receives WhatsApp/Email when low
- [ ] Configure thresholds per product

### Competitor Insights
- [ ] Show category average pricing
- [ ] Show best-selling items in category
- [ ] Pricing suggestions

### Customer Segmentation
- [ ] Track repeat customers
- [ ] Identify high-value buyers
- [ ] Segment by purchase frequency/value
- [ ] Target marketing to segments

### Abandoned Cart Recovery
- [ ] Track which products users browse but don't buy
- [ ] Send WhatsApp/Email reminders
- [ ] Track recovery conversions

### Advanced Reports
- [ ] Revenue trends (daily/monthly)
- [ ] Best-selling products
- [ ] Conversion rates
- [ ] Seasonal trends
- [ ] Exportable PDFs

### Advertising Credits
- [ ] Include monthly credits in Business/Enterprise plans
- [ ] Automatically deduct from Featured Advertising spend
- [ ] Track credit usage
- [ ] Rollover policy (unused credits expire)

---

## Database Schema Changes Required

```sql
-- Verification
CREATE TABLE identity_verification (
  id INT PRIMARY KEY,
  seller_id INT REFERENCES user(id),
  id_type VARCHAR (50), -- "national_id", "passport", "business_reg"
  id_number VARCHAR(255),
  verified_at TIMESTAMP,
  verification_status VARCHAR(20) -- "pending", "approved", "rejected"
);

-- Marketing Codes
CREATE TABLE discount_code (
  id INT PRIMARY KEY,
  seller_id INT REFERENCES user(id),
  code VARCHAR(50) UNIQUE,
  discount_type VARCHAR(20), -- "percentage", "fixed"
  discount_value DECIMAL(10, 2),
  expiry_date DATE,
  max_uses INT,
  current_uses INT DEFAULT 0,
  revenue_generated DECIMAL(10, 2)
);

-- Analytics Events
CREATE TABLE analytics_event (
  id INT PRIMARY KEY,
  seller_id INT REFERENCES user(id),
  listing_id INT REFERENCES listing(id),
  event_type VARCHAR(50), -- "view", "product_click", "whatsapp", "call", "message"
  created_at TIMESTAMP
);

-- Shop Branding
CREATE TABLE shop_branding (
  id INT PRIMARY KEY,
  seller_id INT REFERENCES user(id) UNIQUE,
  banner_url VARCHAR(255),
  brand_color VARCHAR(7), -- hex color
  logo_url VARCHAR(255),
  about_text TEXT,
  theme VARCHAR(20) -- "light", "dark", "custom"
);

-- Staff Accounts
CREATE TABLE staff_account (
  id INT PRIMARY KEY,
  seller_id INT REFERENCES user(id),
  user_id INT REFERENCES user(id),
  role VARCHAR(50), -- "owner", "manager", "sales", "inventory"
  permissions JSON,
  created_at TIMESTAMP
);

-- API Keys
CREATE TABLE api_key (
  id INT PRIMARY KEY,
  seller_id INT REFERENCES user(id),
  key_hash VARCHAR(255),
  created_at TIMESTAMP,
  last_used TIMESTAMP,
  is_active BOOL
);

-- Custom Domain
CREATE TABLE custom_domain (
  id INT PRIMARY KEY,
  seller_id INT REFERENCES user(id),
  domain VARCHAR(255) UNIQUE,
  verified BOOL,
  verification_token VARCHAR(255),
  created_at TIMESTAMP
);

-- Add to seller_subscription
ALTER TABLE seller_subscription ADD COLUMN ranking_boost BOOL DEFAULT FALSE;
ALTER TABLE user ADD COLUMN custom_domain VARCHAR(255);
ALTER TABLE user ADD COLUMN is_verified BOOL DEFAULT FALSE;
```

---

## Implementation Priority

1. **Week 1-2:** Product limits + Analytics
2. **Week 3:** Verified badge + Marketing codes
3. **Week 4:** Staff accounts + Custom branding
4. **Week 5:** Bulk import + Search boost
5. **Week 6+:** API + Custom domain + Add-ons

---

## Revenue Impact

| Feature | Starter | Business | Enterprise |
|---------|---------|----------|-----------|
| Product Limit | 200 | Unlimited | Unlimited |
| Analytics | Basic | Advanced | Advanced |
| Verified Badge | ✓ | ✓ | ✓ |
| Marketing Codes | ✓ | ✓ | ✓ |
| Priority Ranking | ✗ | ✓ | ✓ |
| Bulk Import | ✗ | ✓ | ✓ |
| Staff Accounts | ✗ | 3 | 10 |
| API Access | ✗ | ✗ | ✓ |
| Custom Domain | ✗ | ✗ | ✓ |
| Dedicated Support | ✗ | ✗ | ✓ |
| Advertising Credits | ✗ | 500 KSh | 1,500 KSh |

---

## Success Metrics

- Trial to paid conversion rate
- Churn rate by plan
- Feature adoption rate
- ARPU growth
- Customer satisfaction (NPS)
