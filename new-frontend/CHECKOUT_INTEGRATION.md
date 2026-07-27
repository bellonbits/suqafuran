# Phase 2.2: Checkout Integration

**Status**: Ready for Implementation  
**Scope**: Cart → Order Creation → Payment

---

## What Was Added

### Import API Client

```typescript
import { ordersAPI, paymentsAPI } from '@/lib/api';
```

### Updated Payment Handler

**Before**: Called `/api/v1/payments/mpesa` endpoint directly  
**After**: Uses `ordersAPI` and `paymentsAPI` from API client

---

## Implementation Details

### Step 1: Create Order

```typescript
const order = await ordersAPI.create({
  items: cartItems.map(item => ({
    product_id: item.id,
    title: item.title,
    quantity: item.quantity,
    price: item.price
  })),
  delivery_option: 'delivery' | 'pickup',
  delivery_address: '123 Main St',
  phone_number: '+254712345678',
  courier_tip: 50,
  location: {
    latitude: -1.2921,
    longitude: 36.8219
  }
});
```

**Response**:
```json
{
  "id": "order_123",
  "status": "payment_pending",
  "total_amount": 1100,
  "platform_fee": 100,
  "seller_amount": 1000,
  "items": [...],
  "created_at": "2026-07-01T..."
}
```

### Step 2: Initiate Payment

```typescript
const payment = await paymentsAPI.initiateMPesa({
  phone_number: '+254712345678',
  amount: 1100,
  order_id: 'order_123',
  account_reference: 'SUQA123'
});
```

**Response**:
```json
{
  "success": true,
  "merchant_request_id": "mpesa_req_123",
  "checkout_request_id": "mpesa_checkout_123",
  "response_code": "0"
}
```

### Step 3: Handle Success

- Show M-Pesa PIN prompt message
- Store order ID in sessionStorage
- Redirect to orders page
- User can track order status

---

## Flow Diagram

```
User fills checkout form
        ↓
Click "Pay with M-Pesa"
        ↓
Create Order (POST /orders)
        ↓
Order Created with ID
        ↓
Initiate M-Pesa (POST /payments/mpesa/initiate)
        ↓
M-Pesa Prompt Shown to User
        ↓
User Enters PIN on Phone
        ↓
Backend receives M-Pesa Callback
        ↓
Order Status Updated to "confirmed"
        ↓
Redirect to Orders Page
        ↓
User Sees Order in List
```

---

## Error Handling

### Missing Phone Number
```
Error: Please enter your phone number
Action: Show alert, stay on checkout
```

### Location Not Available
```
Error: Unable to get your location
Action: Use default Nairobi coordinates
```

### Order Creation Fails
```
Error: Failed to create order
Action: Show error message, don't proceed to payment
```

### Payment Initiation Fails
```
Error: Failed to initiate payment
Action: Order created but not paid, user can retry
```

---

## Testing Checklist

- [ ] Can add products to cart
- [ ] Cart count updates in header
- [ ] Can proceed to checkout
- [ ] Can select delivery/pickup
- [ ] Can enter delivery address
- [ ] Can enter phone number
- [ ] Can enter promo code (SAVE10)
- [ ] Total updates with discount
- [ ] Can select courier tip
- [ ] Click "Pay with M-Pesa" button
- [ ] See validation errors if data missing
- [ ] No console errors
- [ ] Network tab shows API calls

---

## Code Changes Required

**File**: `src/app/(app)/checkout/page.tsx`

**Imports to Add**:
```typescript
import { ordersAPI, paymentsAPI } from '@/lib/api';
```

**Function to Replace**:
```typescript
// OLD: const handleMpesaPayment = async () => { ... }
// NEW: Use the implementation from CHECKOUT_INTEGRATION.md
```

**Required Changes**:
1. Add API imports
2. Replace handleMpesaPayment function
3. Add proper error handling
4. Add loading states
5. Update success/error messages

---

## Status

- [x] API Client has order/payment functions
- [x] Checkout page structure exists
- [ ] Payment handler needs update
- [ ] Error handling needs enhancement
- [ ] Loading states need implementation

---

## Related Files

- `src/lib/api.ts` - API endpoints
- `src/app/(app)/checkout/page.tsx` - Checkout page
- `src/store/useCart.ts` - Cart state
- `.env.local` - API configuration

