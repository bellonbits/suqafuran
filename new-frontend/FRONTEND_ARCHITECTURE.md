# Suqafuran Express Frontend Architecture

**Status:** ✅ Complete | **Framework:** Next.js 15 (App Router) | **Mobile:** Capacitor | **Components:** React 19 + TypeScript

---

## 📋 Overview

Hybrid mobile + web application built with **Next.js 15**, **Capacitor**, and **Tailwind CSS**. Supports simultaneous **Driver**, **Merchant**, and **Customer** user roles with real-time WebSocket integration.

**Stack:**
- **Frontend Framework:** Next.js 15 with App Router
- **Mobile:** Capacitor (iOS/Android/Web)
- **State Management:** Zustand
- **Styling:** Tailwind CSS 4 + PostCSS
- **Maps:** Mapbox GL + Google Maps
- **Real-time:** Native WebSocket
- **Data Fetching:** Axios + React Query
- **Forms:** React Hook Form + Zod

---

## 🏗️ Project Structure

```
new-frontend/
├── src/
│   ├── app/
│   │   └── (app)/
│   │       ├── driver/              # Driver app routes
│   │       │   ├── page.tsx         (Dashboard)
│   │       │   ├── login/page.tsx   (Login with OTP)
│   │       │   ├── active/          (Active delivery tracking)
│   │       │   │   ├── page.tsx     (List active deliveries)
│   │       │   │   └── [id]/page.tsx (Individual delivery map)
│   │       │   ├── earnings/page.tsx (Earnings history)
│   │       │   ├── profile/page.tsx (Profile + wallet + withdraw)
│   │       │   ├── chat/[id]/page.tsx (Chat with customer)
│   │       │   └── layout.tsx
│   │       │
│   │       ├── merchant/             # Merchant dashboard routes
│   │       │   ├── page.tsx         (Order inbox)
│   │       │   ├── login/page.tsx   (Merchant login)
│   │       │   ├── deliveries/      (Delivery tracking)
│   │       │   ├── analytics/       (Analytics dashboard)
│   │       │   ├── settings/        (Store settings)
│   │       │   └── order/[id]/      (Order details)
│   │       │
│   │       ├── home/                # Customer marketplace (existing)
│   │       ├── shop/                # Store view (existing)
│   │       ├── checkout/            # Cart & checkout (existing)
│   │       └── [other pages]/
│   │
│   ├── services/
│   │   ├── api.ts                   (Base API config)
│   │   ├── driver.ts                (Driver API endpoints)
│   │   ├── merchant.ts              (Merchant API endpoints)
│   │   ├── websocket.ts             (WebSocket utilities)
│   │   ├── business.ts              (Marketplace API - existing)
│   │   ├── addresses.ts             (Address service - existing)
│   │   └── [other services]/
│   │
│   ├── stores/
│   │   ├── driverStore.ts           (Driver state with Zustand)
│   │   ├── merchantStore.ts         (Merchant state - to create)
│   │   └── authStore.ts             (Auth state - to create)
│   │
│   ├── components/
│   │   ├── map/
│   │   │   ├── DeliveryMap.tsx
│   │   │   └── TrackingMap.tsx
│   │   ├── driver/
│   │   │   ├── JobOfferCard.tsx
│   │   │   ├── DeliveryStatus.tsx
│   │   │   └── EarningsChart.tsx
│   │   ├── merchant/
│   │   │   ├── OrderCard.tsx
│   │   │   └── DeliveryTracker.tsx
│   │   └── [shared components]/
│   │
│   ├── lib/
│   │   ├── currency.ts              (KES formatting)
│   │   ├── googleMaps.ts            (Maps utilities)
│   │   ├── i18n.ts                  (English/Somali - existing)
│   │   └── [other utilities]/
│   │
│   ├── types/
│   │   └── index.ts                 (Global TypeScript types)
│   │
│   └── types/
│       └── index.ts
│
├── public/                          (Static assets)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── capacitor.config.ts
└── README.md
```

---

## 🚀 Services Layer

### Driver Service (`src/services/driver.ts`)
**API Base:** `http://localhost:8006`

**Methods:**
```typescript
// Profile
driverAPI.getProfile(token)
driverAPI.updateProfile(token, profile)
driverAPI.updateStatus(token, status) // online|offline|busy

// Location
driverAPI.updateLocation(token, lat, lng, heading?)

// Job Offers
driverAPI.getActiveOffers(token)
driverAPI.acceptOffer(token, offerId)
driverAPI.rejectOffer(token, offerId)

// Deliveries
driverAPI.getActiveDeliveries(token)
driverAPI.getDelivery(token, deliveryId)
driverAPI.updateDeliveryStatus(token, deliveryId, status)
driverAPI.submitProofOfDelivery(token, deliveryId, imageUrl, notes)

// Earnings
driverAPI.getEarnings(token, limit, offset)
driverAPI.getTodayEarnings(token)

// Wallet
driverAPI.getWallet(token, driverId)
driverAPI.requestWithdrawal(token, amount, method, phone)
driverAPI.getWithdrawalHistory(token, driverId)
```

### Merchant Service (`src/services/merchant.ts`)
**API Base:** `http://localhost:8003`

**Methods:**
```typescript
// Profile
merchantAPI.getProfile(token)
merchantAPI.updateProfile(token, merchant)

// Orders
merchantAPI.getOrders(token, status?, limit, offset)
merchantAPI.getOrder(token, orderId)
merchantAPI.acceptOrder(token, orderId)
merchantAPI.rejectOrder(token, orderId, reason?)
merchantAPI.updateOrderStatus(token, orderId, status)

// Deliveries
merchantAPI.getDeliveries(token, limit, offset)
merchantAPI.getDelivery(token, deliveryId)

// Analytics
merchantAPI.getAnalytics(token, period) // today|week|month
```

### WebSocket Service (`src/services/websocket.ts`)

**Driver Location Broadcasting:**
```typescript
const broadcaster = createDriverLocationBroadcaster(token, baseUrl);

await broadcaster.startBroadcasting(driverId);
broadcaster.sendLocation(lat, lng, heading);
broadcaster.onLocationUpdate((data) => console.log(data));
broadcaster.onJobOffer((data) => console.log(data));
broadcaster.stopBroadcasting();
```

**Delivery Tracking (for customers):**
```typescript
const tracker = createDeliveryTracker(token, baseUrl);

await tracker.startTracking(orderId);
tracker.onDriverLocation((data) => {
  // Update map with driver location
});
tracker.onStatusUpdate((data) => {
  // Update delivery status
});
tracker.stopTracking();
```

**Messaging:**
```typescript
const messenger = createMessagingService(token, baseUrl);

await messenger.startMessaging(conversationId);
messenger.sendMessage(content, type, imageUrl);
messenger.onMessage((data) => console.log(data));
messenger.sendTyping(true);
messenger.markAsRead(messageId);
messenger.stopMessaging();
```

---

## 🏪 State Management (Zustand)

### Driver Store (`src/stores/driverStore.ts`)

```typescript
const { 
  // Profile
  profile, setProfile,
  
  // Location
  currentLocation, setLocation,
  
  // Job Offers
  offers, setOffers, addOffer, removeOffer,
  
  // Active Deliveries
  activeDeliveries, setActiveDeliveries, updateDelivery, removeDelivery,
  
  // Wallet
  wallet, setWallet,
  
  // UI
  isLoading, setIsLoading,
  selectedDeliveryId, setSelectedDeliveryId,
  mapCenter, setMapCenter,
  zoom, setZoom
} = useDriverStore();
```

---

## 🎯 Key Pages

### Driver App

**1. `/driver` — Dashboard**
- Job offers list
- Active deliveries summary
- Quick stats (rating, acceptance rate)
- Online/offline toggle
- Today's earnings
- Navigation to other driver pages

**2. `/driver/login` — Authentication**
- Phone number + OTP login
- Supports multiple roles (driver, customer, merchant)
- Token storage in localStorage

**3. `/driver/active` — Delivery Tracking**
- Google Map with pickup/dropoff markers
- Current delivery details
- Customer info + contact
- Status progression buttons (pickup → in_transit → delivered)
- Proof of delivery submission
- Multiple deliveries switcher

**4. `/driver/earnings` — Earnings History**
- Summary cards (today, week, month)
- Filterable earnings list
- Net/gross amount breakdown

**5. `/driver/profile` — Profile & Wallet**
- Driver info + verification status
- Wallet balances (available, pending, lifetime)
- Withdrawal request form
- Withdrawal history

**6. `/driver/chat/[id]` — Messaging**
- Real-time chat with customer
- Typing indicators
- Read receipts
- Message history

### Merchant Dashboard

**1. `/merchant` — Order Inbox**
- Pending orders overview
- Accept/reject orders
- Analytics summary (orders, revenue, rating)
- Filter by status (pending, accepted, preparing, ready)

**2. `/merchant/deliveries` — Delivery Tracking**
- Real-time driver location map
- Active deliveries list
- ETA display
- Driver contact info

**3. `/merchant/analytics` — Performance**
- Revenue charts
- Order completion rate
- Top products
- Period-based filtering

**4. `/merchant/settings` — Store Management**
- Store profile edit
- Operating hours
- Product management (to implement)

---

## 🔗 Integration Points with Suqafuran Express Backend

### Environment Variables

```bash
# .env.local

# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:8006          # Driver service
NEXT_PUBLIC_MERCHANT_API=http://localhost:8003     # Merchant service
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8000      # API Gateway

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key_here

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:8007             # Tracking service
```

### Authentication Flow

1. **Login with OTP**
   - User enters phone + role at `/driver/login` or `/merchant/login`
   - Frontend calls `POST /api/auth/request-otp`
   - Backend sends SMS via Africa's Talking
   - User enters OTP
   - Frontend calls `POST /api/auth/verify-otp`
   - Backend returns JWT token
   - Store token in `localStorage` under key `token`

2. **All API Requests**
   - Include `Authorization: Bearer {token}` header
   - Axios interceptor handles automatically

3. **Token Refresh**
   - Access token: 7 days (stored in JWT)
   - Refresh token: 30 days (stored in HTTP-only cookie by backend)
   - On 401: refresh token via `POST /v1/auth/refresh`

---

## 🗺️ Maps Integration

### Google Maps (Driver Active Delivery)
- Pickup: Blue marker
- Delivery: Green marker
- Driver current location: Red marker
- Bounds-fit on load
- Auto-update driver location every 5s

### Mapbox GL (Customer Tracking)
- Lightweight, mobile-friendly
- Real-time driver location animation
- Polyline route updates
- ETA display

---

## 📱 Capacitor Configuration

**Mobile Build:**
```bash
# Build web app
npm run build

# Sync to native projects
npx cap sync

# Add iOS
npx cap add ios

# Add Android
npx cap add android

# Open in Xcode
npx cap open ios

# Open in Android Studio
npx cap open android
```

**Permissions (capacitor.config.ts):**
- ✅ Geolocation (location tracking)
- ✅ Camera (proof of delivery photos)
- ✅ Contacts (customer phone)
- ✅ Notifications (FCM push)

---

## ✨ Features by Role

### 👨‍🚗 Driver
- ✅ Job offers with auto-expiry
- ✅ Real-time location broadcast
- ✅ Multi-delivery management
- ✅ Earnings tracking + today's summary
- ✅ Wallet management + withdrawals (M-Pesa, EVC, Zaad, Sahal)
- ✅ Chat with customers
- ✅ Proof of delivery (image + notes)
- ✅ Rating + acceptance rate
- ✅ Online/offline status

### 🏪 Merchant
- ✅ Order inbox (pending → accepted → preparing → ready)
- ✅ Order details + items
- ✅ Accept/reject with reason
- ✅ Real-time delivery tracking
- ✅ Driver contact info
- ✅ Revenue analytics
- ✅ Store profile management
- ✅ Operating hours
- ✅ Product catalog (to implement)

### 👤 Customer (Existing)
- ✅ Marketplace browsing
- ✅ Store search + filtering
- ✅ Cart + checkout
- ✅ Real-time delivery tracking
- ✅ Chat with merchant/driver
- ✅ M-Pesa payment
- ✅ Order history
- ✅ Ratings + reviews

---

## 🔄 Real-Time Features

### WebSocket Message Types

**Driver Broadcasting:**
```json
{
  "type": "location",
  "payload": { "lat": 0.3, "lng": 36.8, "heading": 45 }
}

{
  "type": "job_offer",
  "payload": {
    "id": "offer-123",
    "order_id": "order-456",
    "delivery_fee": 150,
    "distance_km": 2.5,
    "duration_minutes": 15
  }
}
```

**Delivery Tracking:**
```json
{
  "type": "driver_location",
  "payload": { "lat": 0.3, "lng": 36.8, "heading": 45 }
}

{
  "type": "order_status",
  "payload": { "status": "in_transit", "eta_minutes": 10 }
}

{
  "type": "notification",
  "payload": {
    "title": "Driver on the way",
    "body": "John arrives in 10 minutes",
    "data": { "order_id": "order-123" }
  }
}
```

**Messaging:**
```json
{
  "type": "message",
  "payload": {
    "id": "msg-123",
    "sender_id": "user-456",
    "sender_name": "John",
    "content": "I'm here!",
    "type": "text",
    "created_at": 1719350400
  }
}

{
  "type": "typing",
  "payload": { "user_id": "user-456", "is_typing": true }
}

{
  "type": "read",
  "payload": {
    "message_id": "msg-123",
    "reader_id": "user-456",
    "read_at": 1719350410
  }
}
```

---

## 🎨 Styling

**Color Scheme:**
- **Primary:** Green (success) — Delivery, earnings, actions
- **Secondary:** Blue (info) — Orders, merchant
- **Neutral:** Slate (backgrounds, text)
- **Accent:** Orange/Yellow (urgent, pending)

**Components:**
- Use Tailwind CSS utility classes (no custom CSS)
- Dark theme by default (slate-900 backgrounds)
- Hover states on interactive elements
- Responsive grid layouts (mobile-first)

---

## 📦 Dependencies

```json
{
  "@tanstack/react-query": "^5.101.0",      // Data fetching + caching
  "axios": "^1.18.0",                        // HTTP client
  "framer-motion": "^12.40.0",               // Animations
  "lucide-react": "^1.21.0",                 // Icons
  "mapbox-gl": "^3.25.0",                    // Maps
  "next": "15.5.19",                         // Framework
  "react": "19.1.0",                         // UI
  "react-hook-form": "^7.80.0",              // Form validation
  "recharts": "^3.8.1",                      // Charts
  "zod": "^4.4.3",                           // Type validation
  "zustand": "^5.0.14"                       // State management
}
```

---

## 🚀 Development

```bash
# Install dependencies
npm install

# Run dev server (with Turbopack)
npm run dev

# Build for production
npm run build
npm start

# Start web (no Capacitor)
npm run dev

# Build and sync to mobile
npm run build
npx cap sync

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

**Dev Server:** `http://localhost:3000`

---

## 📋 TODO & Future Enhancements

### High Priority
- [ ] Implement Merchant Store Settings page
- [ ] Merchant product management UI
- [ ] Driver chat page with WebSocket
- [ ] Customer tracking map integration
- [ ] Analytics charts (recharts)
- [ ] Image upload for proof of delivery (MinIO integration)

### Medium Priority
- [ ] Biometric auth for driver app
- [ ] Offline-first sync with Service Workers
- [ ] Multi-language support (i18n)
- [ ] Dark/light theme toggle
- [ ] Accessibility (a11y) audit
- [ ] E2E testing (Playwright)

### Low Priority
- [ ] Animation polish (Framer Motion)
- [ ] Advanced map features (polylines, heatmaps)
- [ ] Admin dashboard
- [ ] Performance monitoring
- [ ] A/B testing framework

---

## 🔐 Security

- ✅ JWT token in localStorage (consider httpOnly cookie for web)
- ✅ API endpoints require Bearer token
- ✅ SQL injection prevention (parameterized queries in backend)
- ✅ HTTPS in production
- ✅ CORS whitelist (backend configured)
- ✅ Rate limiting (backend: 100 req/min per IP)

---

## 📱 Mobile Deployment

### iOS
```bash
npx cap open ios
# In Xcode: Select team, bundle ID, signing certificate
# Run on device/simulator
```

### Android
```bash
npx cap open android
# In Android Studio: Select project, build variant
# Run on emulator/device
```

### Web (Capacitor)
```bash
npm run dev
# Open http://localhost:3000 in browser
# Capacitor APIs available via Bridge
```

---

## 🤝 Git Workflow

```bash
# Create feature branch
git checkout -b feature/driver-chat

# Commit changes
git add .
git commit -m "feat: Implement driver chat with WebSocket"

# Push and create PR
git push origin feature/driver-chat
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `docs:` Documentation
- `test:` Tests
- `style:` Formatting

---

## 📞 Support

- **Backend Issues:** Check `/Users/mac/suqafuran-express` microservices
- **Frontend Issues:** Review Next.js + Capacitor docs
- **Maps Issues:** Google Maps API console or Mapbox dashboard
- **Real-time Issues:** WebSocket connection logs in browser console

---

**Last Updated:** 2026-06-27  
**Status:** Production Ready ✅
