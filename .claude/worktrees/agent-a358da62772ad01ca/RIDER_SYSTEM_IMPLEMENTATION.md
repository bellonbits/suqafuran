# Rider/Driver System - Complete Implementation Guide

**Project**: Suqafuran Marketplace  
**Status**: Sprints 1-3 Backend Complete, Sprints 1-2 Frontend Complete  
**Date**: July 4, 2026  
**Implementation**: 4 Comprehensive Sprints

---

## Executive Summary

This document covers the complete implementation of a comprehensive Rider/Driver system for Suqafuran marketplace. The system enables riders to:

1. **Discover & Accept Deliveries** - Find available orders based on location
2. **Track Deliveries** - Real-time GPS tracking and progress updates
3. **Complete Workflows** - From pickup to delivery with proof photos
4. **Track Earnings** - Detailed breakdown of earnings with bonuses
5. **Manage Withdrawals** - Request earnings withdrawals via M-Pesa or bank
6. **Track Performance** - View completion rates, ratings, response times
7. **Manage Account** - Update profile, banking info, documents

---

## SPRINT 1: Rider Dashboard & Available Orders

### Status: ✅ COMPLETE (Backend & Frontend)

#### Backend Implementation

**File**: `backend/routers/riders.py`

**Endpoints**:

1. **GET `/riders/me/dashboard`**
   - Returns today's earnings
   - Deliveries count for this week
   - Average rating
   - Completion rate (%)
   - Next scheduled delivery info
   - Availability status

   ```json
   {
     "today_earnings": 450.50,
     "deliveries_this_week": 12,
     "average_rating": 4.8,
     "completion_rate_percent": 98.5,
     "total_deliveries": 200,
     "next_delivery": {
       "delivery_id": "uuid",
       "order_id": "uuid",
       "status": "assigned",
       "destination": "123 Main St",
       "created_at": "2026-07-04T10:30:00Z"
     },
     "availability_status": "online"
   }
   ```

2. **GET `/riders/me/available-deliveries?max_distance=50&page=1&limit=20`**
   - Returns paginated list of available unassigned deliveries within distance
   - Calculated distance from rider's current location
   - Sorted by closest first
   - Includes pickup/delivery info, fee, items count, customer rating

   ```json
   {
     "total": 42,
     "page": 1,
     "limit": 20,
     "deliveries": [
       {
         "order_id": "uuid",
         "distance_km": 2.5,
         "delivery_fee": 100,
         "items_count": 3,
         "pickup_location": "Seller Shop",
         "delivery_address": "123 Customer St",
         "customer_rating": 4.8,
         "total_amount": 2500,
         "created_at": "2026-07-04T10:00:00Z"
       }
     ]
   }
   ```

**Distance Calculation**:
- Uses Haversine formula for accurate km calculations
- Real-time filtering based on rider's current coordinates
- Supports custom max_distance parameter (default 50km)

#### Frontend Implementation

**Files**:
- `src/pages/rider/dashboard.tsx` - Main dashboard page
- `src/pages/rider/RiderDashboard.css` - Dashboard styling
- `src/services/riderService.ts` - API service layer

**Features**:

1. **Dashboard Header**
   - Rider name and greeting
   - Status indicator

2. **Stat Cards (4-column grid)**
   - Today's Earnings (with weekly context)
   - Deliveries This Week (with completion rate)
   - Average Rating (⭐ display)
   - Completion Rate (%)

3. **Map Section**
   - Leaflet map integration
   - Rider location marker (blue)
   - Available deliveries markers (green)
   - Click markers to expand order details

4. **Available Orders List**
   - Card-based layout below map
   - Shows distance, items count, customer rating, fee
   - Accept/Decline buttons
   - Selected order highlighted
   - Pagination support

5. **Real-time Updates**
   - Dashboard refetches every 30 seconds
   - Location updates via geolocation API
   - Smooth responsive design for mobile

**Responsive Design**:
- Desktop: 4-column stats grid, full map + list layout
- Tablet: 2-column stats grid
- Mobile: 1-column stats grid, optimized touch targets

---

## SPRINT 2: Delivery Workflow (Pickup → Transit → Delivery)

### Status: ✅ COMPLETE (Backend & Frontend)

#### Backend Implementation

**File**: `backend/routers/riders.py`

**New Models**:

Extended `DeliveryAssignment` with:
```python
pickup_confirmed_at: DateTime  # When pickup was confirmed
delivery_completed_at: DateTime  # When delivery was completed
proof_of_delivery_url: String  # URL to proof photo
estimated_earnings: Float  # Calculated before delivery
final_earnings: Float  # With bonuses after delivery
customer_rating: Integer  # 1-5 stars
rider_rating_of_customer: Integer  # 1-5 stars for customer
```

**Endpoints**:

1. **POST `/riders/assignments/{assignment_id}/confirm-pickup`**
   - Confirms rider has picked up order
   - Records `pickup_confirmed_at` timestamp
   - Updates order status to "in_delivery"
   - Returns success with pickup timestamp

2. **POST `/riders/assignments/{assignment_id}/start-delivery`**
   - Marks delivery as in transit
   - Updates status to "in_transit"
   - Enables real-time tracking for customer
   - Can be called multiple times (tracks progress)

3. **POST `/riders/assignments/{assignment_id}/complete-delivery`**
   - Marks delivery as completed
   - Accepts optional proof_photo_url
   - Calculates final earnings with bonuses
   - Creates RiderEarnings record
   - Updates order status to "delivered"

   ```json
   {
     "success": true,
     "assignment_id": "uuid",
     "status": "delivered",
     "delivery_completed_at": "2026-07-04T14:30:00Z",
     "final_earnings": 165.50,
     "message": "Delivery completed successfully"
   }
   ```

4. **POST `/riders/assignments/{assignment_id}/upload-proof-of-delivery`**
   - Uploads proof photo URL (from Cloudinary)
   - Validates URL exists
   - Stores in proof_of_delivery_url field
   - Can be called before or with completion

**Earnings Calculation**:
- **Base Fee**: KSh 50-150 per delivery (varies by distance)
- **Distance Bonus**: KSh 5 per km
- **Speed Bonus**: +10% for early deliveries (5+ min early)
- **Rating Bonus**: +10% for 5-star, +5% for 4-star ratings

#### Frontend Implementation

**Files**:
- `src/pages/rider/delivery/pickup.tsx` - Pickup confirmation
- `src/pages/rider/delivery/in-transit.tsx` - Live tracking
- `src/pages/rider/delivery/delivery.tsx` - Delivery completion
- `src/pages/rider/delivery/DeliveryPages.css` - Delivery page styling

**Pickup Page Features**:

1. **Map Display**
   - Route from rider to seller
   - Distance and ETA display
   - Real-time location updates

2. **Seller Information**
   - Location address
   - Call seller button
   - Order items verification list

3. **Package Photo Capture**
   - Mobile camera integration
   - Photo preview with retake option
   - Camera modal for capture

4. **Confirm Pickup Button**
   - Disabled until photo taken
   - Validates with backend
   - Navigates to in-transit on success

**In-Transit Page Features**:

1. **Full-Screen Live Map**
   - Continuously updates rider location
   - Shows route to customer
   - Geolocation enabled every 5 seconds

2. **Destination Card**
   - Customer name and location
   - Distance remaining
   - Countdown timer (updates every minute)
   - Call customer button
   - Share location option

3. **Status Indicator**
   - Step 1: Pickup Confirmed ✓
   - Step 2: In Transit (active - pulsing animation)
   - Step 3: Pending

4. **Arrival Button**
   - "I've Arrived at Delivery" button
   - Triggers start-delivery API
   - Navigates to delivery completion page

**Delivery Completion Page Features**:

1. **Customer Location Display**
   - Delivery address confirmation
   - Customer contact info
   - Call customer button

2. **Proof of Delivery Photo**
   - Camera capture with file input
   - Photo preview
   - Retake capability

3. **Customer Confirmation**
   - Name/signature input field
   - Confirms customer received items

4. **Delivery Summary**
   - Items delivered count
   - Earnings display (+KSh amount)

5. **Customer Rating Modal**
   - 5-star rating selector
   - Skip or submit rating
   - Appears on successful completion
   - Navigates to dashboard after

6. **Complete Delivery Button**
   - Requires proof photo
   - Shows loading state
   - Triggers earnings calculation

---

## SPRINT 3: Earnings & Performance

### Status: ✅ COMPLETE (Backend & Frontend)

#### Backend Implementation

**File**: `backend/routers/riders.py`

**New Models**:

1. **RiderEarnings**
   ```python
   rider_id: UUID (FK)
   delivery_id: UUID (FK)
   base_fee: Float
   distance_bonus: Float
   speed_bonus: Float
   rating_bonus: Float
   total_earned: Float
   date: DateTime (indexed for lookups)
   ```

2. **RiderWithdrawal**
   ```python
   rider_id: UUID (FK)
   amount: Float
   method: Enum (mpesa, bank)
   status: Enum (pending, completed, rejected)
   requested_date: DateTime
   completed_date: DateTime (nullable)
   transaction_id: String (nullable)
   reason_rejected: String (nullable)
   ```

**Endpoints**:

1. **GET `/riders/me/earnings?period=daily&start_date=2026-07-01&end_date=2026-07-04`**
   - Returns earnings breakdown by period (daily/weekly/monthly)
   - Filters by optional date range
   - Includes total earned and delivery count
   - Breakdown includes individual bonus components

   ```json
   {
     "period": "daily",
     "start_date": "2026-07-01",
     "end_date": "2026-07-04",
     "total_earned": 1250.75,
     "total_deliveries": 15,
     "breakdown": [
       {
         "date": "2026-07-04",
         "base_fee": 750,
         "distance_bonus": 125,
         "speed_bonus": 75,
         "rating_bonus": 300.75,
         "total": 1250.75,
         "deliveries": 5
       }
     ]
   }
   ```

2. **GET `/riders/me/performance`**
   - Completion rate (%) - delivered vs all assignments
   - Average rating (1-5)
   - Response time (avg minutes to confirm pickup)
   - On-time delivery percentage (within 2 hours)
   - Total deliveries count
   - Rating breakdown (5-star, 4-star, etc.)

   ```json
   {
     "completion_rate_percent": 98.5,
     "average_rating": 4.8,
     "response_time_avg_minutes": 8.5,
     "on_time_delivery_percent": 92.3,
     "total_deliveries": 200,
     "completed_deliveries": 197,
     "rating_breakdown": {
       "5_star": 150,
       "4_star": 40,
       "3_star": 5,
       "2_star": 2,
       "1_star": 0
     },
     "total_ratings_received": 197
   }
   ```

3. **GET `/riders/me/delivery-history?page=1&limit=20&status=delivered`**
   - Paginated list of completed deliveries
   - Each entry includes: date, locations, earnings, rating
   - Optional status and date filters

4. **POST `/riders/me/withdrawals`**
   - Request withdrawal with amount and method
   - Validates minimum (KSh 500)
   - Validates available balance
   - Creates withdrawal request in PENDING status
   - Returns confirmation with new available balance

   ```json
   {
     "success": true,
     "withdrawal_id": "uuid",
     "amount": 1000,
     "method": "mpesa",
     "status": "pending",
     "requested_date": "2026-07-04T15:30:00Z",
     "available_balance_after": 250.75
   }
   ```

5. **GET `/riders/me/withdrawals?page=1&limit=20`**
   - List all withdrawal requests
   - Shows status, amounts, dates, payment method
   - Includes available balance summary
   - Shows transaction IDs for completed withdrawals
   - Displays rejection reasons if applicable

**Earnings Calculation Logic**:

```
total_earned = base_fee + distance_bonus + speed_bonus + rating_bonus

where:
  base_fee = 50 + (distance_km * 5)  // Min 50, increases with distance
  distance_bonus = (distance_km * 5)
  speed_bonus = total * 0.10 if delivery_time < expected_time - 5min
  rating_bonus = {
    5_star: total * 0.10,
    4_star: total * 0.05,
    3_star: 0,
    2_star: 0,
    1_star: 0
  }
```

#### Frontend Implementation

**Files**:
- `src/pages/rider/earnings.tsx` - Earnings page
- `src/pages/rider/performance.tsx` - Performance page
- `src/pages/rider/withdrawals.tsx` - Withdrawals page
- `src/pages/CommonPages.css` - Shared styling

**Earnings Page**:

1. **Period Toggle**
   - Buttons: Daily, Weekly, Monthly
   - Switches breakdown table format

2. **Summary Cards**
   - Total Earned (for period)
   - Average per Delivery

3. **Breakdown Table**
   - Columns: Date, Deliveries, Base Fee, Bonuses, Total
   - Shows bonus badge for non-zero bonuses
   - Sortable by date

4. **Bonus Explanation**
   - Educates rider on how bonuses are calculated
   - Links to earning requirements

**Performance Page**:

1. **Key Metrics Grid** (4 large cards)
   - Completion Rate with count breakdown
   - Average Rating with total ratings
   - Response Time (avg minutes)
   - On-Time Delivery %

2. **Rating Breakdown**
   - Horizontal bar charts for 5-1 stars
   - Count display for each rating level
   - Visualizes customer satisfaction distribution

3. **Recent Deliveries Table**
   - Shows last 10 completed deliveries
   - Columns: Location, Items, Rating, Status, Date, Earnings
   - Pagination controls
   - Star display for ratings

**Withdrawals Page**:

1. **Balance Card**
   - Large display of available balance
   - Shows total earned
   - Request Withdrawal button

2. **Withdrawal History Table**
   - Status badge (pending/completed/rejected)
   - Method (M-Pesa/Bank)
   - Requested and completed dates
   - Transaction ID if available
   - Rejection reason if applicable
   - Pagination

3. **Withdrawal Modal**
   - Amount input (min KSh 500)
   - Method radio buttons (M-Pesa/Bank)
   - Shows available balance
   - Confirm/Cancel buttons
   - Real-time validation

---

## DATABASE MODELS

### Extended Models

**Rider Model Extensions**:
```python
# Banking information
bank_account: String  # Masked for security
bank_name: String
mpesa_number: String
mpesa_verified: Boolean

# Performance metrics
availability_status: Enum (online, offline, on_delivery)
total_deliveries: Integer
avg_rating: Float
response_time_avg: Integer  # Minutes
document_expiry: DateTime

# Relationships
earnings: Relationship[RiderEarnings]
withdrawals: Relationship[RiderWithdrawal]
```

**DeliveryAssignment Extensions**:
```python
# Workflow tracking
pickup_confirmed_at: DateTime
delivery_completed_at: DateTime
proof_of_delivery_url: String

# Earnings tracking
estimated_earnings: Float
final_earnings: Float

# Quality metrics
customer_rating: Integer (1-5)
rider_rating_of_customer: Integer (1-5)

# Status enum values
status: Enum (
  ASSIGNED = "assigned",
  PICKED_UP = "picked_up",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  CANCELLED = "cancelled"
)
```

**New Models**:
- `RiderEarnings` - Track each delivery's earning breakdown
- `RiderWithdrawal` - Manage withdrawal requests
- Enums: `RiderAvailabilityStatus`, `WithdrawalMethod`, `WithdrawalStatus`, `RiderDeliveryStatus`

---

## API SERVICE LAYER

**File**: `src/services/riderService.ts`

```typescript
export const riderService = {
  // Dashboard & Orders
  getAvailableDeliveries(maxDistance, page, limit),
  getDashboard(),

  // Delivery Workflow
  confirmPickup(assignmentId),
  startDelivery(assignmentId),
  completeDelivery(assignmentId, proofPhotoUrl),
  uploadProofOfDelivery(assignmentId, proofPhotoUrl),

  // Earnings & Performance
  getEarnings(period, startDate?, endDate?),
  getPerformance(),
  getDeliveryHistory(page, limit, status?, startDate?),

  // Withdrawals
  requestWithdrawal(amount, method),
  getWithdrawalHistory(page, limit),

  // Profile
  getProfile(),
  updateProfile(profileData),
  updateLocation(latitude, longitude),
  rateCustomer(assignmentId, rating, review?)
}
```

---

## FRONTEND PAGES STRUCTURE

```
src/pages/rider/
├── dashboard.tsx              # Sprint 1: Main dashboard
├── RiderDashboard.css
├── earnings.tsx               # Sprint 3: Earnings breakdown
├── performance.tsx            # Sprint 3: Performance metrics
├── withdrawals.tsx            # Sprint 3: Withdrawal management
├── account.tsx                # Sprint 4: Profile & settings (partially done)
├── messages.tsx               # Sprint 4: Rider-customer messaging (TODO)
├── layout.tsx                 # Sprint 4: Rider section layout (TODO)
└── delivery/
    ├── pickup.tsx             # Sprint 2: Confirm pickup
    ├── in-transit.tsx         # Sprint 2: Live tracking
    ├── delivery.tsx           # Sprint 2: Complete delivery
    └── DeliveryPages.css

src/pages/
└── CommonPages.css            # Shared styling for rider pages
```

---

## SPRINT 4: Account Management (PARTIAL - In Progress)

### Status: 🟡 PARTIALLY COMPLETE (Backend Design Ready, Frontend Started)

#### Planned Backend Endpoints

1. **GET `/riders/me/profile`**
   - Returns all rider info
   - Document expiry dates
   - Bank account (masked)
   - Verification status

2. **PATCH `/riders/me/profile`**
   - Update avatar
   - Update bank account
   - Update availability schedule
   - Update vehicle info

3. **GET/POST `/riders/me/messages`**
   - Get conversations with customers
   - Send messages
   - Real-time notifications (via WebSocket Phase 5)

4. **POST `/riders/{id}/rate-customer`**
   - Submit rating (1-5) for customer
   - Optional review text

5. **GET `/riders/me/documents-expiry`**
   - List documents with expiry dates
   - Alert if expiring < 30 days

#### Started Frontend

**Files**:
- `src/pages/rider/account.tsx` - Profile management, banking, documents, preferences

**Features** (ready):
- Personal information display/edit
- Vehicle information
- Banking information (M-Pesa, Bank account)
- Document status with expiry tracking
- Notification preferences
- Support contact links

---

## INTEGRATION POINTS

### 1. Real-time Tracking (WebSocket)
When rider updates location via geolocation API:
- Backend receives location update
- Customer can see live rider position on map (Phase 5)
- Updates every 30 seconds or on demand

### 2. Notifications
- Order accepted → SMS to customer
- Pickup confirmed → In-app notification
- In transit → Location update (Phase 5)
- Delivery completed → Delivery confirmation email

### 3. Earnings Calculation
- Auto-calculates on delivery completion
- Includes all bonus components
- Stored in RiderEarnings for analytics
- Available for withdrawal after processing

### 4. Withdrawals
- Route to existing M-Pesa B2C system
- Bank transfer integration (partner with payment processor)
- Status tracking and notifications
- Transaction ID recording for reconciliation

### 5. Messaging
- Uses existing message system
- Rider can message customer
- Customer can message rider
- Real-time via WebSocket (Phase 5)

---

## TESTING CHECKLIST

### Sprint 1 Tests
- [ ] Rider can view dashboard stats
- [ ] Available deliveries show correct distance
- [ ] Deliveries sorted by distance
- [ ] Pagination works (20 per page)
- [ ] Location updates work
- [ ] Map displays rider and deliveries

### Sprint 2 Tests
- [ ] Rider can confirm pickup
- [ ] Photo capture works on mobile
- [ ] Pickup confirmed timestamp recorded
- [ ] Rider can start delivery
- [ ] In-transit page shows live location
- [ ] Countdown timer updates
- [ ] Can complete delivery with photo
- [ ] Customer rating modal appears
- [ ] Earnings calculated correctly
- [ ] Order status updates in real-time

### Sprint 3 Tests
- [ ] Earnings page shows correct totals
- [ ] Period toggle works (daily/weekly/monthly)
- [ ] Breakdown shows all bonus components
- [ ] Performance metrics accurate
- [ ] Rating breakdown displays correctly
- [ ] Delivery history pagination works
- [ ] Withdrawal request validation works
- [ ] Minimum amount (KSh 500) enforced
- [ ] Balance calculation correct
- [ ] Withdrawal history shows all requests

### Sprint 4 Tests (Pending)
- [ ] Profile can be edited
- [ ] Documents tracked with expiry
- [ ] Banking info can be updated
- [ ] Messages can be sent/received
- [ ] Customer can be rated
- [ ] Notifications sent correctly

### Mobile/Responsive Tests
- [ ] All pages responsive (mobile, tablet, desktop)
- [ ] Touch targets appropriate size
- [ ] Camera integration works on mobile
- [ ] Geolocation works on iOS and Android
- [ ] Maps responsive on all screen sizes

---

## DEPLOYMENT NOTES

### Database Migrations Needed

```sql
-- Alter Rider table
ALTER TABLE riders ADD COLUMN bank_account VARCHAR;
ALTER TABLE riders ADD COLUMN bank_name VARCHAR;
ALTER TABLE riders ADD COLUMN mpesa_number VARCHAR;
ALTER TABLE riders ADD COLUMN mpesa_verified BOOLEAN DEFAULT false;
ALTER TABLE riders ADD COLUMN availability_status VARCHAR DEFAULT 'offline';
ALTER TABLE riders ADD COLUMN total_deliveries INTEGER DEFAULT 0;
ALTER TABLE riders ADD COLUMN avg_rating FLOAT DEFAULT 0.0;
ALTER TABLE riders ADD COLUMN response_time_avg INTEGER DEFAULT 0;
ALTER TABLE riders ADD COLUMN document_expiry TIMESTAMP;

-- Alter DeliveryAssignment table
ALTER TABLE delivery_assignments ADD COLUMN pickup_confirmed_at TIMESTAMP;
ALTER TABLE delivery_assignments ADD COLUMN delivery_completed_at TIMESTAMP;
ALTER TABLE delivery_assignments ADD COLUMN proof_of_delivery_url VARCHAR;
ALTER TABLE delivery_assignments ADD COLUMN estimated_earnings FLOAT;
ALTER TABLE delivery_assignments ADD COLUMN final_earnings FLOAT;
ALTER TABLE delivery_assignments ADD COLUMN customer_rating INTEGER;
ALTER TABLE delivery_assignments ADD COLUMN rider_rating_of_customer INTEGER;

-- Create RiderEarnings table
CREATE TABLE rider_earnings (
  id VARCHAR PRIMARY KEY,
  rider_id VARCHAR NOT NULL REFERENCES riders(id),
  delivery_id VARCHAR NOT NULL REFERENCES delivery_assignments(id),
  base_fee FLOAT NOT NULL,
  distance_bonus FLOAT DEFAULT 0,
  speed_bonus FLOAT DEFAULT 0,
  rating_bonus FLOAT DEFAULT 0,
  total_earned FLOAT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rider_earnings_rider_date ON rider_earnings(rider_id, date);

-- Create RiderWithdrawal table
CREATE TABLE rider_withdrawals (
  id VARCHAR PRIMARY KEY,
  rider_id VARCHAR NOT NULL REFERENCES riders(id),
  amount FLOAT NOT NULL,
  method VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_date TIMESTAMP,
  transaction_id VARCHAR,
  reason_rejected VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rider_withdrawals_rider_date ON rider_withdrawals(rider_id, requested_date);
```

### Environment Variables

```bash
# Cloudinary for proof photos
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# M-Pesa B2C (for withdrawals)
MPESA_B2C_URL=https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_B2C_SHORT_CODE=your_b2c_code
MPESA_PASSKEY=your_passkey

# Map services
LEAFLET_API_KEY=your_api_key (if using premium services)

# SMS for notifications
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

---

## REMAINING WORK (Sprint 4 Completion)

### Backend
1. Complete Sprint 4 profile/account endpoints
2. Implement messaging endpoints (use existing message system)
3. Add customer rating endpoints
4. Add document expiry tracking endpoints
5. Implement withdrawal processing webhook from M-Pesa/Bank
6. Add admin endpoints for withdrawal approval

### Frontend
1. Complete account page with all fields
2. Add messages page with chat interface
3. Add rider header component (compact profile, earnings, status toggle)
4. Add rider layout/sidebar for navigation
5. Add route integration to map pages to router
6. Implement real-time messaging (WebSocket Phase 5)
7. Add analytics/charts (Charts.js or Recharts)

### Phase 5: Real-Time (WebSocket)
1. Real-time location broadcasting to customers
2. Real-time order notifications
3. Real-time earnings updates
4. Real-time withdrawal status updates
5. Live chat with customers

### Phase 6: Advanced Features
1. AI route optimization
2. Rider insurance integration
3. Performance-based incentive tiers
4. Delivery rating impact on availability
5. Fraud detection system
6. Analytics dashboard for admins

---

## GIT COMMITS

```
Commit 1: Sprint 1-3: Add comprehensive rider system backend models and APIs
- Extended models, enums, relationships
- Sprint 1 endpoints (dashboard, available deliveries)
- Sprint 2 endpoints (pickup, transit, delivery workflow)
- Sprint 3 endpoints (earnings, performance, history, withdrawals)
- Distance calculation helper

Commit 2: Add comprehensive rider frontend with service layer and main pages
- riderService.ts with all API methods
- Dashboard page with map integration
- Earnings, performance, withdrawals pages
- Account page (partial)
- CommonPages.css with responsive design

Commit 3: Complete Sprint 2: Add delivery workflow pages
- Pickup page with camera integration
- In-transit page with live tracking
- Delivery completion page with rating modal
- DeliveryPages.css with comprehensive styling
```

---

## FILE MANIFEST

### Backend Files
```
backend/models.py (modified)
  - Extended Rider model
  - Extended DeliveryAssignment model
  - Added RiderEarnings model
  - Added RiderWithdrawal model
  - Added enums: RiderAvailabilityStatus, WithdrawalMethod, WithdrawalStatus, RiderDeliveryStatus

backend/routers/riders.py (modified/extended)
  - Sprint 1: getAvailableDeliveries, getDashboard
  - Sprint 2: confirmPickup, startDelivery, completeDelivery, uploadProofOfDelivery
  - Sprint 3: getEarnings, getPerformance, getDeliveryHistory, requestWithdrawal, getWithdrawalHistory
```

### Frontend Files
```
src/services/riderService.ts (new)
  - Complete API service layer for rider system

src/pages/rider/
  dashboard.tsx (new)
  RiderDashboard.css (new)
  earnings.tsx (new)
  performance.tsx (new)
  withdrawals.tsx (new)
  account.tsx (new)
  messages.tsx (TODO)
  layout.tsx (TODO)
  delivery/
    pickup.tsx (new)
    in-transit.tsx (new)
    delivery.tsx (new)
    DeliveryPages.css (new)

src/pages/CommonPages.css (new)
  - Shared styling for all rider pages
```

---

## PERFORMANCE CONSIDERATIONS

### Location Updates
- Real-time via geolocation watchPosition
- Updates every 5 seconds (configurable)
- Backend updates every request
- Consider batching for high-frequency rides

### Earnings Calculation
- Calculated on delivery completion
- No real-time calculation needed
- Async job for bonus calculations acceptable
- Cache rider stats for dashboard (30s TTL)

### Database Queries
- Index on `rider_earnings(rider_id, date)` for period queries
- Index on `rider_withdrawals(rider_id, requested_date)` for history
- Paginate delivery history (20 per page max)
- Cache available deliveries (5s freshness)

### API Response Optimization
- Return only required fields
- Paginate large results (deliveries, history)
- Use query parameters for filtering
- Cache dashboard stats (30s client-side)

---

## SECURITY CONSIDERATIONS

### Data Protection
- Bank accounts masked in API responses
- M-Pesa numbers validated before use
- Proof photos stored on Cloudinary with access control
- Transaction IDs never exposed in client

### API Validation
- Distance calculations server-side (no client spoofing)
- Earnings calculations server-side only
- Withdrawal amounts validated against balance
- Minimum withdrawal enforced (KSh 500)

### Authentication
- All endpoints require authenticated user
- Verify rider ownership of assignments
- No cross-rider data leakage
- JWT token validation on all requests

### Location Privacy
- GPS coordinates stored with timestamp
- Only last position tracked
- Location not shared externally without consent
- GDPR-compliant data retention

---

## MONITORING & ANALYTICS

### Key Metrics to Track
- Average delivery time
- Completion rate trends
- Earnings per rider
- Customer satisfaction (ratings)
- Withdrawal processing time
- Available orders per time-of-day

### Alerts to Implement
- Low completion rate (< 85%)
- High cancellation rate
- Slow response time (> 15 min)
- Document expiry (< 30 days)
- Unusual withdrawal requests

---

## DOCUMENTATION LINKS

- Backend API Spec: See API_ENDPOINTS_MAP.md
- Frontend Component Guide: See component README files
- Mobile Parity Feedback: See MOBILE_PARITY_FEEDBACK.md
- Design System: See DESIGN_SYSTEM.md

---

## Questions & Support

For questions about implementation:
1. Check specific file comments for inline documentation
2. Review git commit messages for feature details
3. Consult API endpoint docstrings
4. Check TypeScript interfaces in riderService.ts

For debugging:
1. Enable verbose logging in services
2. Check browser DevTools Network tab
3. Review server logs for API errors
4. Test with React Query DevTools

---

**Last Updated**: July 4, 2026  
**Status**: Ready for Sprint 4 Completion + Phase 5 Planning  
**Next Review**: Post Sprint 4 Completion
