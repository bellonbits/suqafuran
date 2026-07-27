# 🚀 Frontend Quick Start Guide

## Prerequisites
- ✅ Backend running on `http://localhost:8000`
- ✅ Celery worker running (async notifications)
- ✅ Redis connected
- ✅ PostgreSQL database connected
- ✅ Node.js 18+ installed
- ✅ npm or yarn installed

---

## Step 1: Configure Frontend Environment

```bash
cd /Users/mac/suqafuran/new-frontend

# Create .env.local file
cat > .env.local << 'ENVFILE'
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Google Maps (optional)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key_here

# Firebase (optional for push notifications)
NEXT_PUBLIC_FIREBASE_CONFIG=your_config_here
ENVFILE
```

---

## Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

---

## Step 3: Start Development Server

```bash
npm run dev
# or
yarn dev

# Frontend will run on: http://localhost:3000
```

---

## Step 4: Verify Integration

### Test Login Flow
1. Open http://localhost:3000
2. Go to `/signup`
3. Sign up with email/phone
4. OTP sent via Resend (email) & Africastalking (SMS)
5. Verify OTP
6. Login with credentials

### Test Order Creation
1. Browse products at home page
2. Add items to cart
3. Go to `/checkout`
4. Create order
5. Enter M-Pesa number
6. STK push triggered on phone
7. Complete payment
8. Order appears in `/orders`

### Test Seller Registration
1. Go to `/sell`
2. Register as seller
3. Verify M-Pesa number
4. Access seller dashboard at `/merchant/page`
5. View orders in `/merchant/deliveries`

### Test Driver Registration
1. Go to `/driver`
2. Register as driver
3. Accept assignments
4. Update location in `/driver/active`
5. View earnings in `/driver/earnings`

---

## Directory Structure

```
/new-frontend/
├── src/
│   ├── app/                          # Next.js app directory
│   │   ├── (app)/
│   │   │   ├── [category]/           # Browse by category
│   │   │   ├── checkout/             # Checkout flow
│   │   │   ├── driver/               # Driver pages
│   │   │   ├── favorites/            # Wishlist
│   │   │   ├── listing/[id]/         # Product details
│   │   │   ├── login/                # Login page
│   │   │   ├── merchant/             # Seller dashboard
│   │   │   ├── messages/             # Chat
│   │   │   ├── notifications/        # Notifications
│   │   │   ├── orders/               # Order management
│   │   │   ├── search/               # Search
│   │   │   ├── sell/                 # Become seller
│   │   │   ├── seller/               # Seller dashboard alt
│   │   │   ├── shops/                # Shop listings
│   │   │   └── signup/               # Registration
│   │   └── admin/                    # Admin pages
│   │
│   ├── components/                   # React components
│   │   ├── features/
│   │   ├── shared/
│   │   └── ui/
│   │
│   ├── services/                     # API services
│   │   ├── api.ts                    # HTTP client
│   │   ├── authService.ts            # Auth
│   │   ├── orderService.ts           # Orders
│   │   ├── paymentService.ts         # Payments
│   │   ├── sellerService.ts          # Sellers
│   │   ├── driver.ts                 # Drivers
│   │   ├── notificationService.ts    # Notifications
│   │   ├── websocket.ts              # Real-time
│   │   └── ...more services
│   │
│   ├── stores/                       # State management
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   ├── orderStore.ts
│   │   └── ...more stores
│   │
│   ├── lib/                          # Utilities
│   │   ├── api.ts                    # API types & functions
│   │   ├── currency.ts               # Currency formatting
│   │   ├── i18n.ts                   # Internationalization
│   │   └── ...more utilities
│   │
│   └── types/
│       └── index.ts                  # TypeScript types
│
├── public/
│   ├── categories/                   # Category images
│   └── icons/                        # SVG icons
│
├── .env.local                        # Environment (you create this)
├── .env.example                      # Example env
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm start                # Start production server

# Testing
npm run lint             # Run linter
npm run test             # Run tests

# Mobile
npx cap build ios        # Build iOS
npx cap build android    # Build Android
npx cap open ios         # Open iOS project
npx cap open android     # Open Android project
```

---

## API Endpoints Used by Frontend

### Auth
- POST `/api/v1/auth/signup` - Sign up with email
- POST `/api/v1/auth/signup-phone` - Sign up with phone
- POST `/api/v1/auth/request-otp` - Request OTP
- POST `/api/v1/auth/verify-otp` - Verify OTP
- POST `/api/v1/login/access-token` - Login

### Orders
- POST `/api/v1/orders` - Create order
- GET `/api/v1/orders` - List orders
- GET `/api/v1/orders/{id}` - Get order details
- POST `/api/v1/orders/{id}/rate-delivery` - Rate delivery
- POST `/api/v1/orders/{id}/report-issue` - Report issue

### Payments
- POST `/api/v1/payments/mpesa/initiate` - Start payment
- GET `/api/v1/payments/{id}/status` - Check payment status
- POST `/api/v1/payments/{id}/refund` - Refund payment

### Sellers
- POST `/api/v1/sellers/register` - Register as seller
- GET `/api/v1/sellers/me` - Get seller profile
- PATCH `/api/v1/sellers/me` - Update seller profile
- POST `/api/v1/sellers/verify-mpesa` - Verify M-Pesa
- GET `/api/v1/sellers/me/orders` - Seller's orders
- GET `/api/v1/sellers/me/earnings` - Earnings dashboard
- POST `/api/v1/sellers/me/withdrawals` - Request withdrawal

### Drivers/Riders
- POST `/api/v1/riders/register` - Register as driver
- POST `/api/v1/riders/{id}/location` - Update location
- POST `/api/v1/riders/assignments/assign` - Accept delivery
- GET `/api/v1/riders/{id}/assignments` - View assignments

### Notifications
- POST `/api/v1/notifications/` - Send notification
- GET `/api/v1/notifications/` - List notifications
- PATCH `/api/v1/notifications/{id}/read` - Mark as read
- GET/POST `/api/v1/notifications/preferences` - Manage preferences

### WebSocket
- POST `/api/v1/device-tokens/register` - Register device for push
- GET `/api/v1/realtime-events` - Get real-time events
- GET `/api/v1/websocket/status` - Check connection status

---

## Troubleshooting

### CORS Errors
✅ Already configured in backend with `CORS_ORIGINS`
If still having issues:
```bash
# Backend .env has:
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,...
```

### Auth Token Not Persisting
Make sure localStorage is enabled:
```typescript
// Check in browser console
localStorage.getItem('auth_token')
```

### API 404 Errors
Verify:
1. Backend running: `curl http://localhost:8000/health`
2. Frontend env correct: `echo $NEXT_PUBLIC_API_URL`
3. Endpoint exists: Check `/ENDPOINT_FRONTEND_MAPPING.md`

### WebSocket Connection Issues
Check:
1. Redis running: `redis-cli ping` → should return "PONG"
2. Celery worker running: `celery -A app.tasks.celery_app inspect active`

---

## Mobile Development

### iOS
```bash
cd /Users/mac/suqafuran/new-frontend

# First time
npx cap init ios

# After changes
npm run build
npx cap sync ios
npx cap open ios
```

### Android
```bash
# First time
npx cap init android

# After changes
npm run build
npx cap sync android
npx cap open android
```

---

## Environment Checklist

- [ ] `.env.local` created with `NEXT_PUBLIC_API_URL`
- [ ] Backend running on `http://localhost:8000`
- [ ] Celery worker running
- [ ] Redis connected
- [ ] PostgreSQL connected
- [ ] npm dependencies installed
- [ ] Dev server started on port 3000

---

## Next Steps

1. **Start Frontend** → `npm run dev`
2. **Test Auth Flow** → Sign up, verify OTP, login
3. **Test Buyer Flow** → Browse, add to cart, checkout, pay
4. **Test Seller Flow** → Register shop, add products, manage orders
5. **Test Driver Flow** → Register, accept deliveries, track earnings

---

**Frontend & Backend fully integrated! 🎉**

