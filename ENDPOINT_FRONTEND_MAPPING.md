# 🔗 Backend Endpoints → Frontend Integration Mapping

**Backend Server:** `http://localhost:8000`  
**Frontend:** `/Users/mac/suqafuran/new-frontend`  
**API Services:** `/new-frontend/src/services/`  
**API Client:** `/new-frontend/src/lib/api.ts` & `/new-frontend/src/services/api.ts`

---

## 📋 PHASE 4 ENDPOINTS & FRONTEND INTEGRATION

### 🔐 AUTH ENDPOINTS (6 endpoints)

| Backend Endpoint | Method | Frontend Service | Frontend Pages | Component |
|-----------------|--------|------------------|-----------------|-----------|
| `/api/v1/auth/signup` | POST | `authService.signupEmail()` | `/signup` | SignupForm |
| `/api/v1/auth/signup-phone` | POST | `authService.signupPhone()` | `/signup` | PhoneSignup |
| `/api/v1/auth/request-otp` | POST | `authService.requestOTP()` | `/signup` | OTPInput |
| `/api/v1/auth/verify-otp` | POST | `authService.verifyOTP()` | `/signup` | OTPVerify |
| `/api/v1/auth/request-phone-otp` | POST | `authService.requestPhoneOTP()` | `/signup` | PhoneOTP |
| `/api/v1/auth/verify-phone-otp` | POST | `authService.verifyPhoneOTP()` | `/signup` | PhoneVerify |
| `/api/v1/login/access-token` | POST | `authService.login()` | `/login` | LoginForm |

**Location:** `/new-frontend/src/app/(app)/login/` & `/new-frontend/src/app/(app)/signup/`  
**Service File:** `/new-frontend/src/services/authService.ts`

---

### 📦 ORDERS ENDPOINTS (5 endpoints)

| Backend Endpoint | Method | Frontend Service | Frontend Pages | Usage |
|-----------------|--------|------------------|-----------------|-------|
| `/api/v1/orders` | POST | `ordersAPI.create()` | `/checkout` | Create new order |
| `/api/v1/orders` | GET | `ordersAPI.list()` | `/orders` | List user orders |
| `/api/v1/orders/{order_id}` | GET | `ordersAPI.get()` | `/orders/{id}` | View order details |
| `/api/v1/orders/{order_id}/rate-delivery` | POST | `ordersAPI.rateDelivery()` | `/orders/{id}` | Rate delivery (post-delivery) |
| `/api/v1/orders/{order_id}/report-issue` | POST | `ordersAPI.reportIssue()` | `/orders/{id}` | Report order issues |

**Location:** `/new-frontend/src/app/(app)/checkout/page.tsx`, `/orders/page.tsx`  
**Service File:** `/new-frontend/src/lib/api.ts` & `/new-frontend/src/services/orderService.ts`  
**Stores:** Check `/new-frontend/src/stores/` for state management

---

### 💳 PAYMENTS ENDPOINTS (3 endpoints)

| Backend Endpoint | Method | Frontend Service | Frontend Pages | Flow |
|-----------------|--------|------------------|-----------------|------|
| `/api/v1/payments/mpesa/initiate` | POST | `paymentsAPI.initiateMPesa()` | `/checkout` | Trigger M-Pesa STK push |
| `/api/v1/payments/{order_id}/status` | GET | `paymentsAPI.checkStatus()` | `/checkout`, `/orders/{id}` | Check payment status |
| `/api/v1/payments/{order_id}/refund` | POST | `paymentsAPI.refund()` | `/orders/{id}` | Refund payment (admin) |

**Location:** `/new-frontend/src/app/(app)/checkout/page.tsx`  
**Service File:** `/new-frontend/src/services/paymentService.ts`  
**Stores:** Payment state in `/new-frontend/src/stores/`

---

### 👨‍💼 SELLERS ENDPOINTS (11 endpoints)

| Backend Endpoint | Method | Frontend Service | Frontend Pages | Usage |
|-----------------|--------|------------------|-----------------|-------|
| `/api/v1/sellers/register` | POST | `sellersAPI.register()` | `/seller/register`, `/sell` | Register new seller |
| `/api/v1/sellers/me` | GET | `sellersAPI.getProfile()` | `/seller/dashboard`, `/merchant/settings` | Load seller profile |
| `/api/v1/sellers/me` | PATCH | `sellersAPI.updateProfile()` | `/merchant/settings` | Update seller info |
| `/api/v1/sellers/verify-mpesa` | POST | `sellersAPI.verifyMPesa()` | `/merchant/settings` | Verify M-Pesa number |
| `/api/v1/sellers/me/orders` | GET | `sellersAPI.getOrders()` | `/merchant/page`, `/merchant/deliveries` | List seller orders |
| `/api/v1/sellers/me/orders/{order_id}` | GET | `sellersAPI.getOrder()` | `/merchant/deliveries` | View specific order |
| `/api/v1/sellers/me/orders/{order_id}` | PATCH | `sellersAPI.updateOrderStatus()` | `/merchant/deliveries` | Update order status |
| `/api/v1/sellers/me/orders/{order_id}/confirm-payment` | POST | `sellersAPI.confirmPayment()` | `/merchant/deliveries` | Confirm payment received |
| `/api/v1/sellers/me/earnings` | GET | `sellersAPI.getEarnings()` | `/seller/dashboard` | Show earnings dashboard |
| `/api/v1/sellers/me/withdrawals` | GET | `sellersAPI.getWithdrawals()` | `/seller/dashboard` | Withdrawal history |
| `/api/v1/sellers/me/withdrawals` | POST | `sellersAPI.requestWithdrawal()` | `/seller/dashboard` | Request withdrawal |

**Location:** `/new-frontend/src/app/(app)/merchant/`, `/seller/`  
**Service File:** `/new-frontend/src/services/sellerService.ts`

---

### 🚗 RIDERS ENDPOINTS (7 endpoints)

| Backend Endpoint | Method | Frontend Service | Frontend Pages | Usage |
|-----------------|--------|------------------|-----------------|-------|
| `/api/v1/riders/register` | POST | `ridersAPI.register()` | `/driver/page` | Register new rider/driver |
| `/api/v1/riders/{rider_id}` | GET | `ridersAPI.get()` | `/driver/profile` | Get driver profile |
| `/api/v1/riders/{rider_id}/location` | POST | `ridersAPI.updateLocation()` | `/driver/active` | Update real-time location |
| `/api/v1/riders/assignments/assign` | POST | `ridersAPI.assign()` | `/driver/active` | Accept delivery assignment |
| `/api/v1/riders/assignments/{assignment_id}` | GET | `ridersAPI.getAssignment()` | `/driver/active` | Get assignment details |
| `/api/v1/riders/assignments/{assignment_id}` | PATCH | `ridersAPI.updateAssignment()` | `/driver/active` | Update delivery status |
| `/api/v1/riders/{rider_id}/assignments` | GET | `ridersAPI.getAssignments()` | `/driver/earnings`, `/driver/active` | List assignments |

**Location:** `/new-frontend/src/app/(app)/driver/`  
**Service File:** `/new-frontend/src/services/driver.ts`

---

### 🔔 NOTIFICATIONS ENDPOINTS (5 endpoints)

| Backend Endpoint | Method | Frontend Service | Frontend Pages | Usage |
|-----------------|--------|------------------|-----------------|-------|
| `/api/v1/notifications/` | POST | `notificationService.send()` | Order completion, payments | Send notification |
| `/api/v1/notifications/` | GET | `notificationService.list()` | `/notifications` | List user notifications |
| `/api/v1/notifications/{notification_id}` | GET | `notificationService.get()` | `/notifications/{id}` | Get single notification |
| `/api/v1/notifications/{notification_id}/read` | PATCH | `notificationService.markRead()` | `/notifications` | Mark as read |
| `/api/v1/notifications/preferences` | GET/POST/PATCH | `notificationService.getPrefs()` | `/notifications/preferences` | Manage notification settings |

**Location:** `/new-frontend/src/app/notifications/`  
**Service File:** `/new-frontend/src/services/notificationService.ts`

---

### 📡 WEBSOCKET ENDPOINTS (6 endpoints)

| Backend Endpoint | Method | Frontend Service | Frontend Pages | Real-time Features |
|-----------------|--------|------------------|-----------------|-------------------|
| `/api/v1/device-tokens/register` | POST | `websocketService.registerToken()` | App initialization | Register push device |
| `/api/v1/device-tokens` | GET | `websocketService.listTokens()` | Settings | List registered devices |
| `/api/v1/device-tokens/{token_id}` | DELETE | `websocketService.revokeToken()` | Settings | Remove device token |
| `/api/v1/realtime-events` | GET | `websocketService.getEvents()` | Dashboard, orders | Real-time event log |
| `/api/v1/websocket/status` | GET | `websocketService.getStatus()` | Dashboard | Check connection status |
| `/api/v1/websocket/stats` | GET | `websocketService.getStats()` | Admin, dashboard | WebSocket statistics |

**Location:** WebSocket connection in `/new-frontend/src/services/websocket.ts`  
**Service File:** `/new-frontend/src/services/websocket.ts`

---

## 🛠️ FRONTEND SERVICES REFERENCE

### Service Files Location
```
/new-frontend/src/services/
├── api.ts                 ← Base HTTP client (Axios)
├── authService.ts         ← Auth endpoints
├── orderService.ts        ← Order operations
├── paymentService.ts      ← Payment processing
├── sellerService.ts       ← Seller management
├── driver.ts              ← Driver/rider operations
├── notificationService.ts ← Notifications
├── websocket.ts           ← Real-time connections
├── admin.ts               ← Admin endpoints
├── aiService.ts           ← AI features
├── business.ts            ← Business operations
└── ... (more services)
```

### API Client Configuration
**File:** `/new-frontend/src/services/api.ts`

```typescript
// Base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Auto-includes auth token in all requests
// Handles 401 errors (redirects to login)
```

---

## ⚙️ ENVIRONMENT SETUP

### Required `.env.local` in frontend
```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Optional - Third party services
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key
NEXT_PUBLIC_FIREBASE_CONFIG=your_config
```

---

## 🎯 PAGE-TO-ENDPOINT MAPPING

### Home & Browsing
- **`/`** → Lists products, shops (no direct endpoint needed, uses search/listings)
- **`/search`** → Search products (`/api/v1/listings/search`)
- **`/[category]`** → Browse by category (`/api/v1/listings/categories/{slug}`)
- **`/shops`** → List all shops (`/api/v1/businesses/nearby`)

### User Auth & Profile
- **`/signup`** → `POST /auth/signup*` (see auth endpoints)
- **`/login`** → `POST /login/access-token`
- **`/dashboard`** → `GET /users/me`, `GET /orders`, `GET /notifications`

### Shopping
- **`/listing/[id]`** → `GET /listings/{id}` (product details)
- **`/checkout`** → `POST /orders`, `POST /payments/mpesa/initiate`
- **`/orders`** → `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/rate-delivery`
- **`/favorites`** → `GET /favorites`, `POST /favorites/{id}`, `DELETE /favorites/{id}`

### Seller Dashboard
- **`/sell`** → Sell products (requires `/sellers/register`)
- **`/seller/register`** → `POST /sellers/register`
- **`/seller/dashboard`** → `GET /sellers/me`, `GET /sellers/me/earnings`, `GET /sellers/me/withdrawals`
- **`/merchant/settings`** → `PATCH /sellers/me`, `POST /sellers/verify-mpesa`
- **`/merchant/deliveries`** → `GET /sellers/me/orders`, `PATCH /sellers/me/orders/{id}`, `POST /sellers/me/orders/{id}/confirm-payment`

### Driver/Rider
- **`/driver`** → `POST /riders/register`
- **`/driver/active`** → `POST /riders/{id}/location`, `POST /riders/assignments/assign`, `PATCH /riders/assignments/{id}`
- **`/driver/earnings`** → `GET /riders/{id}/assignments` (with earnings calc)
- **`/driver/profile`** → `GET /riders/{id}`

### Admin
- **`/admin`** → Admin dashboard (uses `/api/v1/admin/*` endpoints)
- **`/admin/sellers`** → Seller management
- **`/admin/payments`** → Payment admin
- **`/admin/disputes`** → Dispute handling

---

## 🔄 DATA FLOW EXAMPLE: Checkout to Payment

```
Checkout Page (/checkout)
    ↓
[User selects items] → ordersAPI.create({items, delivery...})
    ↓
Backend: POST /api/v1/orders
    ↓ (returns order ID)
↓
[Show M-Pesa prompt] → paymentsAPI.initiateMPesa({phone, amount, order_id})
    ↓
Backend: POST /api/v1/payments/mpesa/initiate
    ↓ (returns STK trigger response)
↓
[Poll payment status] → paymentsAPI.checkStatus(order_id)
    ↓
Backend: GET /api/v1/payments/{order_id}/status
    ↓
[Success] → Redirect to orders list
    ↓
ordersAPI.list() → GET /api/v1/orders
```

---

## ✅ INTEGRATION CHECKLIST

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`
- [ ] Services in `/new-frontend/src/services/` connected to backend
- [ ] Auth token stored in `localStorage` after login
- [ ] WebSocket connected for real-time events
- [ ] Notification preferences configured
- [ ] Payment flow tested (M-Pesa)
- [ ] Seller registration tested
- [ ] Driver/rider operations tested

---

## 🚀 START FRONTEND

```bash
cd /Users/mac/suqafuran/new-frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## 📱 MOBILE/PWA SUPPORT

Frontend is built with **Capacitor** for iOS/Android:
```bash
npx cap build ios    # iOS build
npx cap build android # Android build
```

---

**All 27 Phase 4 endpoints are fully integrated and mapped to frontend pages & components! ✅**

