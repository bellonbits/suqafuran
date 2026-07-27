# Backend-Frontend Integration Guide

Complete API endpoints for subscription features and how to wire them in the frontend.

---

## 📊 ANALYTICS TRACKING

### Track Events (PUBLIC - No Auth Needed)

```typescript
// Frontend: Add this to your analytics service
const trackEvent = async (eventType: string, sellerId: number, options?: any) => {
  try {
    await api.post('/analytics/track', null, {
      params: {
        event_type: eventType,
        seller_id: sellerId,
        listing_id: options?.listing_id,
        source: options?.source || 'direct',
        search_query: options?.search_query,
      }
    });
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
};
```

### Add Tracking Throughout UI

**In ListingSearch (when visitor arrives on shop):**
```typescript
useEffect(() => {
  if (sellerId) {
    trackEvent('shop_visit', sellerId, { source: 'search' });
  }
}, [sellerId]);
```

**On product view (hover or click):**
```typescript
const handleProductView = (listingId: number) => {
  trackEvent('product_view', sellerId, { 
    listing_id: listingId,
    source: currentSource 
  });
};
```

**On contact buttons:**
```typescript
const handleWhatsAppClick = (listingId: number) => {
  trackEvent('whatsapp_click', sellerId, { listing_id: listingId });
  // Then open WhatsApp...
};

const handleCallClick = (listingId: number) => {
  trackEvent('call_click', sellerId, { listing_id: listingId });
  // Then initiate call...
};
```

### Get Analytics Dashboard Data

```typescript
// GET /analytics/sellers/{seller_id}/summary?days=30
const response = await api.get(`/analytics/sellers/${sellerId}/summary?days=30`);
const metrics = response.data.metrics;

// Returns:
{
  period_days: 30,
  total_events: 1250,
  shop_visits: 42,
  product_views: 350,
  product_clicks: 85,
  whatsapp_clicks: 12,
  call_clicks: 8,
  message_clicks: 5,
  follows: 3,
  unique_visitors: 35,
  by_source: {
    search: 25,
    category: 10,
    homepage: 5,
    direct: 2
  },
  top_search_queries: [
    { query: "perfume", count: 15 },
    { query: "oud", count: 8 }
  ]
}
```

### Get Daily Breakdown

```typescript
// GET /analytics/sellers/{seller_id}/daily?days=30
const response = await api.get(`/analytics/sellers/${sellerId}/daily?days=30`);
const dailyMetrics = response.data.daily_metrics;

// Returns array of:
[
  {
    date: "2026-07-27",
    shop_visits: 5,
    product_views: 45,
    product_clicks: 10,
    whatsapp_clicks: 2,
    call_clicks: 1,
    message_clicks: 0,
    follows: 1
  },
  ...
]
```

---

## 🎟️ MARKETING CODES

### Create Discount Code

```typescript
// POST /discount-codes/sellers/{seller_id}/create
const createCode = async (sellerId: number, code: {
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  expiry_date: string; // "2026-08-31"
  description?: string;
  max_uses?: number;
  min_purchase_amount?: number;
}) => {
  const response = await api.post(`/discount-codes/sellers/${sellerId}/create`, code);
  return response.data.code; // Returns created code object
};
```

### List Seller's Codes

```typescript
// GET /discount-codes/sellers/{seller_id}/list?active_only=true
const response = await api.get(`/discount-codes/sellers/${sellerId}/list`, {
  params: { active_only: true }
});
const codes = response.data.codes;

// Returns:
[
  {
    id: 1,
    code: "SUMMER10",
    description: "Summer promotion",
    discount_type: "percentage",
    discount_value: 10,
    times_used: 45,
    max_uses: 100,
    remaining_uses: 55,
    revenue_generated: 125000,
    expiry_date: "2026-08-31",
    is_active: true,
    created_at: "2026-07-20T10:00:00"
  }
]
```

### Get Code Analytics

```typescript
// GET /discount-codes/sellers/{seller_id}/code/{code_id}/analytics
const response = await api.get(`/discount-codes/sellers/${sellerId}/code/${codeId}/analytics`);
const analytics = response.data.analytics;

// Returns:
{
  code: "SUMMER10",
  discount_type: "percentage",
  discount_value: 10,
  times_used: 45,
  max_uses: 100,
  remaining_uses: 55,
  revenue_generated: 125000.50,
  expiry_date: "2026-08-31",
  is_expired: false,
  is_active: true,
  status: "Active"
}
```

### Disable Code

```typescript
// POST /discount-codes/sellers/{seller_id}/code/{code_id}/disable
await api.post(`/discount-codes/sellers/${sellerId}/code/${codeId}/disable`);
```

### Apply Code (Customer)

```typescript
// POST /discount-codes/apply (PUBLIC - No auth)
const applyCode = async (code: string, orderAmount: number) => {
  try {
    const response = await api.post('/discount-codes/apply', {
      code,
      order_amount: orderAmount
    });
    
    return response.data.discount; // Returns discount calculation
  } catch (error) {
    // Invalid code, expired, reached limit, etc.
    toast.error(error.response.data.detail);
  }
};

// Returns:
{
  code: "SUMMER10",
  discount_type: "percentage",
  discount_value: 10,
  discount_amount: 1000,
  final_amount: 9000,
  uses_remaining: 54
}
```

---

## ✅ VERIFIED BADGE

### Submit Verification

```typescript
// POST /subscriptions/sellers/{seller_id}/verification/submit
const submitVerification = async (sellerId: number, data: {
  id_type: 'national_id' | 'passport' | 'business_reg';
  id_number: string;
  id_image: File; // Upload as FormData
}) => {
  const formData = new FormData();
  formData.append('id_type', data.id_type);
  formData.append('id_number', data.id_number);
  formData.append('id_image', data.id_image);
  
  const response = await api.post(
    `/subscriptions/sellers/${sellerId}/verification/submit`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  
  return response.data;
};
```

### Get Verification Status

```typescript
// GET /subscriptions/sellers/{seller_id}/verification/status
const response = await api.get(`/subscriptions/sellers/${sellerId}/verification/status`);
const status = response.data.verification_status;

// Returns:
{
  status: 'pending' | 'approved' | 'rejected',
  email_verified: true,
  phone_verified: true,
  verified_at: '2026-07-25T10:00:00' | null,
  rejection_reason: null | 'ID image unclear',
  is_verified: true
}
```

---

## 👥 STAFF ACCOUNTS (Business+)

### Invite Staff

```typescript
// POST /subscriptions/sellers/{seller_id}/staff/invite
const inviteStaff = async (sellerId: number, data: {
  email: string;
  role: 'manager' | 'sales' | 'inventory' | 'support';
}) => {
  const response = await api.post(
    `/subscriptions/sellers/${sellerId}/staff/invite`,
    data
  );
  return response.data;
};
```

### Get Staff Accounts

```typescript
// GET /subscriptions/sellers/{seller_id}/staff
const response = await api.get(`/subscriptions/sellers/${sellerId}/staff`);
const staff = response.data.staff_accounts;

// Returns:
[
  {
    id: 1,
    user_id: 123,
    name: "Ahmed Manager",
    email: "ahmed@shop.com",
    role: "manager",
    permissions: {
      manage_products: true,
      manage_orders: true,
      view_analytics: true,
      reply_messages: true
    },
    is_active: true,
    last_login: "2026-07-27T14:30:00"
  }
]
```

### Update Staff Role

```typescript
// PUT /subscriptions/sellers/{seller_id}/staff/{staff_id}
const updateStaff = async (sellerId: number, staffId: number, data: {
  role: string;
  permissions: Record<string, boolean>;
}) => {
  const response = await api.put(
    `/subscriptions/sellers/${sellerId}/staff/${staffId}`,
    data
  );
  return response.data;
};
```

### Remove Staff

```typescript
// DELETE /subscriptions/sellers/{seller_id}/staff/{staff_id}
await api.delete(`/subscriptions/sellers/${sellerId}/staff/${staffId}`);
```

---

## 💳 SUBSCRIPTIONS

### Get Current Plan

```typescript
// GET /subscriptions/sellers/{seller_id}/current
const response = await api.get(`/subscriptions/sellers/${sellerId}/current`);
const subscription = response.data;

// Returns:
{
  id: 1,
  plan_id: 2,
  plan_name: "business",
  status: "active",
  is_active: true,
  trial_active: false,
  trial_ends_at: null,
  renews_at: "2026-08-27",
  billing_frequency: "monthly"
}
```

### Get Feature Access

```typescript
// GET /subscriptions/sellers/{seller_id}/features
const response = await api.get(`/subscriptions/sellers/${sellerId}/features`);
const features = response.data;

// Returns:
{
  plan: "business",
  max_products: null, // unlimited
  has_analytics: true,
  has_verified_badge: true,
  has_priority_ranking: true,
  has_custom_branding: true,
  has_bulk_import: true,
  has_staff_accounts: true,
  has_priority_support: true
}
```

### Start Trial

```typescript
// POST /subscriptions/sellers/{seller_id}/start-trial
const response = await api.post(`/subscriptions/sellers/${sellerId}/start-trial`, {
  plan_id: 2 // Starter plan
});

// Returns:
{
  status: "success",
  subscription_id: 123,
  trial_ends_at: "2026-08-03",
  message: "7-day trial started!"
}
```

---

## 🎬 FEATURED ADVERTISING

### Get Pricing

```typescript
// GET /featured/pricing (PUBLIC)
const response = await api.get('/featured/pricing');
const pricing = response.data;

// Returns all placement types with pricing
```

### Purchase Featured Placement

```typescript
// POST /featured/sellers/{seller_id}/purchase
const response = await api.post(`/featured/sellers/${sellerId}/purchase`, {
  placement_type: "homepage_featured_shop",
  duration_days: 7
});

// Returns placement with cost
```

### Get Active Placements

```typescript
// GET /featured/sellers/{seller_id}/placements
const response = await api.get(`/featured/sellers/${sellerId}/placements`);
const placements = response.data.placements;
```

---

## 📋 INTEGRATION CHECKLIST

### Frontend Changes Needed

- [ ] Import analytics service in each page that needs tracking
- [ ] Add `trackEvent()` calls to:
  - [ ] Shop visit (homepage/search landing)
  - [ ] Product view (listing detail)
  - [ ] Product click (click to view)
  - [ ] WhatsApp click (contact button)
  - [ ] Call click (phone button)
  - [ ] Message click (message button)
  - [ ] Follow shop (follow button)

- [ ] Update Analytics Dashboard page:
  - [ ] Fetch and display metrics from `/analytics/sellers/{id}/summary`
  - [ ] Show daily breakdown chart from `/analytics/sellers/{id}/daily`
  - [ ] Display top search queries
  - [ ] Show traffic by source pie chart

- [ ] Update Marketing Codes page:
  - [ ] Fetch codes from `/discount-codes/sellers/{id}/list`
  - [ ] Create codes with form POST to `/discount-codes/sellers/{id}/create`
  - [ ] Show analytics per code from `/discount-codes/sellers/{id}/code/{id}/analytics`

- [ ] Update Verification page:
  - [ ] Check status from `/subscriptions/sellers/{id}/verification/status`
  - [ ] Submit verification to `/subscriptions/sellers/{id}/verification/submit`

- [ ] Update Staff page:
  - [ ] List staff from `/subscriptions/sellers/{id}/staff`
  - [ ] Invite from `/subscriptions/sellers/{id}/staff/invite`
  - [ ] Update roles/permissions
  - [ ] Remove staff members

### Backend Status

- [x] Analytics service implemented
- [x] Analytics endpoints implemented
- [x] Discount codes service & endpoints implemented
- [ ] Verification submission endpoint (needs S3 upload)
- [ ] Staff account endpoints
- [ ] Migrations applied to database
- [ ] M-Pesa sandbox tested

---

## 🚀 Testing Endpoints

```bash
# Test analytics tracking
curl -X POST "http://localhost:8000/api/v1/analytics/track?event_type=shop_visit&seller_id=1&source=search"

# Get analytics summary
curl -X GET "http://localhost:8000/api/v1/analytics/sellers/1/summary?days=30" \
  -H "Authorization: Bearer TOKEN"

# Create discount code
curl -X POST "http://localhost:8000/api/v1/discount-codes/sellers/1/create" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER10",
    "discount_type": "percentage",
    "discount_value": 10,
    "expiry_date": "2026-08-31"
  }'

# Apply discount code (public)
curl -X POST "http://localhost:8000/api/v1/discount-codes/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER10",
    "order_amount": 10000
  }'
```

