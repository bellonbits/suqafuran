# Notifications System - Integration Guide

**Status**: Phase 4 Complete ✅  
**Date**: 2026-07-01

This guide shows how to integrate notifications throughout the Suqafuran frontend application.

---

## Quick Start

### 1. Basic Usage

```typescript
import { notificationService } from '@/services/notificationService';

// Use predefined templates
notificationService.orderCreated('ORDER_123');
notificationService.paymentSuccessful('ORDER_123', 2500);
notificationService.orderDelivered('ORDER_123');
```

### 2. Custom Notifications

```typescript
notificationService.send({
  type: 'promotion',
  title: 'Flash Sale!',
  message: '50% off on all groceries today',
  channels: ['email', 'sms', 'push', 'in-app'],
  actionUrl: '/shops?category=groceries',
  actionLabel: 'Shop Now',
});
```

### 3. Display Unread Count in Components

```typescript
import { useNotifications } from '@/store/useNotifications';

export function MyComponent() {
  const { unreadCount, notifications } = useNotifications();
  
  return (
    <div>
      <span>Unread: {unreadCount}</span>
      {notifications.map(n => (
        <div key={n.id}>{n.title}</div>
      ))}
    </div>
  );
}
```

---

## Integration Points

### Order Creation Flow

**File**: `src/app/(app)/checkout/page.tsx`

```typescript
import { notificationService } from '@/services/notificationService';

const handleOrderCreate = async () => {
  try {
    const order = await createOrder(formData);
    
    // Trigger notification
    notificationService.orderCreated(order.id);
    
    router.push(`/orders/${order.id}`);
  } catch (error) {
    notificationService.send({
      type: 'issue',
      title: 'Order Failed',
      message: 'Unable to create order. Please try again.',
      channels: ['in-app'],
    });
  }
};
```

### Payment Success

**File**: `src/app/(app)/checkout/page.tsx`

```typescript
const handleMpesaSuccess = async (response) => {
  // Payment confirmed
  notificationService.paymentSuccessful(orderId, amount);
  
  // Notify seller
  notificationService.send({
    type: 'order',
    title: 'New Order',
    message: `Order #${orderId} received for KSh ${amount}`,
    channels: ['sms', 'push', 'in-app'],
    actionUrl: `/seller/orders/${orderId}`,
  });
};
```

### Order Status Updates

**File**: `src/app/(app)/orders/page.tsx`

```typescript
// When seller confirms order
const handleSellerConfirmation = (orderId: string) => {
  notificationService.orderConfirmed(orderId, shopName);
};

// When order is being prepared
const handleOrderPreparing = (orderId: string) => {
  notificationService.orderPreparing(orderId, shopName);
};

// When order is ready
const handleOrderReady = (orderId: string) => {
  notificationService.orderReady(orderId, shopName);
};

// When rider is on the way
const handleInDelivery = (orderId: string, riderName: string) => {
  notificationService.orderInDelivery(orderId, riderName);
};

// When order is delivered
const handleDelivered = (orderId: string) => {
  notificationService.orderDelivered(orderId);
};
```

### Seller Registration

**File**: `src/app/(app)/seller/register/page.tsx`

```typescript
const handleSellerRegistration = async (formData) => {
  const seller = await registerSeller(formData);
  
  // Welcome notification
  notificationService.sellerRegistered(seller.shop_name);
  
  router.push('/seller/dashboard');
};
```

### Seller Verification (Admin)

**File**: `src/app/admin/sellers/page.tsx`

```typescript
const handleSellerVerification = async (sellerId: string) => {
  const seller = await verifySeller(sellerId);
  
  // Notify seller
  notificationService.sellerVerified(seller.shop_name);
};
```

### Issue Resolution (Admin/Support)

**File**: `src/app/admin/disputes/page.tsx`

```typescript
const handleDisputeResolution = async (disputeId: string, resolution: string) => {
  const dispute = await resolveDispute(disputeId, resolution);
  
  // Notify customer
  notificationService.issueResolved(disputeId, resolution);
};
```

### Earnings Payout

**File**: `src/app/(app)/seller/dashboard/page.tsx`

```typescript
const handleWithdrawalRequest = async (amount: number) => {
  const payout = await requestWithdrawal(amount);
  
  notificationService.sellerEarningsAvailable(amount);
};
```

---

## Notification Types Reference

### Order Notifications

```typescript
// Customer placed order
notificationService.orderCreated(orderId: string)
// Channels: email, sms, in-app
// Use: Right after checkout

// Seller confirmed order
notificationService.orderConfirmed(orderId: string, shopName: string)
// Channels: email, sms, push, in-app
// Use: When seller accepts order

// Order is being prepared
notificationService.orderPreparing(orderId: string, shopName: string)
// Channels: push, in-app
// Use: When shop starts preparing

// Order ready for pickup/delivery
notificationService.orderReady(orderId: string, shopName: string)
// Channels: email, sms, push, in-app
// Use: When order is packaged

// Rider picking up order
notificationService.orderInDelivery(orderId: string, riderName: string)
// Channels: sms, push, in-app
// Use: When rider gets the order

// Order delivered
notificationService.orderDelivered(orderId: string)
// Channels: email, sms, push, in-app
// Use: When rider delivers
// Includes: Rating prompt

// Order cancelled
notificationService.orderCancelled(orderId: string, reason: string)
// Channels: email, sms, in-app
// Use: When order is cancelled
```

### Payment Notifications

```typescript
// Payment awaiting PIN
notificationService.paymentInitiated(orderId: string, amount: number)
// Channels: sms, push, in-app
// Use: M-Pesa prompt shown

// Payment completed
notificationService.paymentSuccessful(orderId: string, amount: number)
// Channels: email, sms, push, in-app
// Use: Money deducted from account

// Payment failed
notificationService.paymentFailed(orderId: string, reason: string)
// Channels: email, sms, in-app
// Use: When payment is rejected

// Refund processed
notificationService.refundProcessed(amount: number)
// Channels: email, sms, in-app
// Use: When refund is issued
```

### Seller Notifications

```typescript
// New seller registered
notificationService.sellerRegistered(shopName: string)
// Channels: email, sms, in-app
// Use: Welcome message

// Seller account verified
notificationService.sellerVerified(shopName: string)
// Channels: email, sms, push, in-app
// Use: When seller is approved

// Earnings available for withdrawal
notificationService.sellerEarningsAvailable(amount: number)
// Channels: email, sms, push, in-app
// Use: When balance reaches threshold
```

### Issue Notifications

```typescript
// Issue reported by customer
notificationService.issueReported(issueId: string, issueType: string)
// Channels: email, in-app
// Use: When customer submits dispute

// Issue resolved
notificationService.issueResolved(issueId: string, resolution: string)
// Channels: email, sms, push, in-app
// Use: When admin resolves
```

### Promotion Notifications

```typescript
// Special offer available
notificationService.promotionAvailable(
  title: string,
  discount: number,
  code: string
)
// Channels: email, sms, push, in-app
// Use: Marketing campaigns
```

### System Notifications

```typescript
// Maintenance window
notificationService.maintenanceAlert(startTime: string, duration: string)
// Channels: in-app
// Use: Scheduled downtime

// System error
notificationService.systemError(errorMessage: string)
// Channels: in-app
// Use: Critical errors
```

---

## User Preferences

The notification system respects user preferences. Before sending external notifications (email, SMS, push), the backend checks:

```typescript
{
  emailNotifications: boolean,      // Send emails?
  smsNotifications: boolean,        // Send SMS?
  pushNotifications: boolean,       // Send push?
  inAppNotifications: boolean,      // Show in-app?
  orderUpdates: boolean,            // Receive order updates?
  paymentUpdates: boolean,          // Receive payment updates?
  deliveryUpdates: boolean,         // Receive delivery updates?
  promotions: boolean,              // Receive promotions?
  systemAlerts: boolean,            // Receive system alerts?
}
```

**Location**: `src/app/notifications/preferences/page.tsx`

Users can change these at any time. The frontend passes these to the backend with each notification request.

---

## Backend Integration

The frontend sends notifications to `/api/v1/notifications/send` for email/SMS/push channels:

```typescript
POST /api/v1/notifications/send
{
  type: 'order' | 'payment' | 'delivery' | 'issue' | 'promotion' | 'system',
  title: string,
  message: string,
  channels: ['email', 'sms', 'push', 'in-app'],
  actionUrl?: string,
  actionLabel?: string,
  data?: any
}
```

**Flow**:
1. Frontend calls `notificationService.send()`
2. For in-app: Zustand store updates immediately
3. For email/SMS/push: Fetch POST to backend
4. Backend enqueues task in Celery
5. Celery workers process async (respects user preferences)
6. External services send (SMTP, Africastalking, Firebase)

---

## Example Integration: Complete Order Flow

```typescript
// 1. Customer creates order
const handleCheckout = async (items, address, paymentMethod) => {
  const order = await createOrder({ items, address });
  
  // In-app + Email + SMS
  notificationService.orderCreated(order.id);
  
  // 2. Initiate payment
  const mpesaSession = await initiateMpesa({
    amount: order.total,
    phone: order.customer_phone,
  });
  
  // SMS + Push (urgent)
  notificationService.paymentInitiated(order.id, order.total);
  
  // 3. Payment success (via webhook)
  const handlePaymentCallback = async (response) => {
    if (response.status === 'success') {
      // All channels
      notificationService.paymentSuccessful(order.id, order.total);
      
      // Also notify seller
      notificationService.send({
        type: 'order',
        title: 'New Order',
        message: `Order #${order.id} - KSh ${order.total}`,
        channels: ['sms', 'push', 'in-app'],
        actionUrl: `/seller/orders/${order.id}`,
      });
    } else {
      // Notify about failure
      notificationService.paymentFailed(order.id, response.error);
    }
  };
  
  // 4. Seller confirms (from seller dashboard)
  const handleSellerConfirm = async () => {
    const confirmed = await confirmOrder(order.id);
    
    // Customer: All channels
    notificationService.orderConfirmed(order.id, confirmed.shop_name);
  };
  
  // 5. Order preparing (shop marks as preparing)
  const handlePreparing = async () => {
    // Customer: Push + In-app
    notificationService.orderPreparing(order.id, confirmed.shop_name);
  };
  
  // 6. Order ready (shop marks as ready)
  const handleReady = async () => {
    // Customer: All channels
    notificationService.orderReady(order.id, confirmed.shop_name);
  };
  
  // 7. In delivery (rider picks up)
  const handleInDelivery = async (rider) => {
    // Customer: SMS + Push + In-app
    notificationService.orderInDelivery(order.id, rider.name);
  };
  
  // 8. Delivered (rider confirms delivery)
  const handleDelivered = async () => {
    // Customer: All channels + Rating prompt
    notificationService.orderDelivered(order.id);
  };
};
```

---

## Testing the Notification System

### Manual Testing

1. **View Notification Center**: Click bell icon in header
2. **Send Test Notification**: 
   ```typescript
   // In browser console
   import { notificationService } from '@/services/notificationService';
   notificationService.orderCreated('TEST_ORDER_123');
   ```
3. **View Preferences**: Go to `/notifications/preferences`
4. **Test Preferences**: Toggle options and save
5. **Check Persistence**: Refresh page - preferences remain

### Automated Testing

```typescript
// __tests__/notificationService.test.ts
import { notificationService } from '@/services/notificationService';
import { useNotifications } from '@/store/useNotifications';

describe('Notification Service', () => {
  it('should create order notification', () => {
    notificationService.orderCreated('ORDER_123');
    const { notifications } = useNotifications.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('order');
  });

  it('should send multi-channel notification', async () => {
    notificationService.send({
      type: 'payment',
      title: 'Test',
      message: 'Test message',
      channels: ['email', 'sms', 'push', 'in-app'],
    });
    
    const { notifications } = useNotifications.getState();
    expect(notifications[0].type).toBe('payment');
  });
});
```

---

## Checklist for Adding Notifications

When adding a new feature that should send notifications:

- [ ] Import `notificationService`
- [ ] Identify notification type (order, payment, delivery, issue, promotion, system)
- [ ] Choose appropriate template or use `notificationService.send()`
- [ ] Select channels (email, sms, push, in-app)
- [ ] Add action URL for user to click through
- [ ] Test on real feature
- [ ] Verify backend receives the notification
- [ ] Check email/SMS are sent (once backend is configured)
- [ ] Confirm user preferences are respected

---

## Next Steps

1. **Phase 4.1: Backend Integration**
   - [ ] Create `/api/v1/notifications/send` endpoint
   - [ ] Set up email service (SMTP)
   - [ ] Set up SMS service (Africastalking)
   - [ ] Set up push service (Firebase)
   - [ ] Create Celery tasks for async processing

2. **Phase 4.2: Analytics**
   - [ ] Track notification delivery rates
   - [ ] Track user engagement (opens, clicks)
   - [ ] A/B test notification content

3. **Phase 4.3: Real-time**
   - [ ] WebSocket integration for live updates
   - [ ] Push notification sounds
   - [ ] App badge count on iOS/Android

---

## Component Locations

```
Frontend Structure:
├── src/
│   ├── store/
│   │   └── useNotifications.ts          ← Zustand store
│   ├── services/
│   │   └── notificationService.ts       ← Notification templates
│   ├── components/
│   │   ├── NotificationCenter.tsx       ← Bell dropdown UI
│   │   └── shared/
│   │       └── Header.tsx               ← Integrated here
│   └── app/
│       └── notifications/
│           └── preferences/
│               └── page.tsx             ← Preferences page
└── PHASE4_NOTIFICATIONS_SUMMARY.md      ← This documentation
```

---

## Common Issues & Solutions

**Issue**: Notifications not showing?
- Check browser console for errors
- Verify `NotificationCenter` is imported in Header
- Check Zustand store has `addNotification` action

**Issue**: Preferences not persisting?
- Check localStorage for `notifications-storage` key
- Verify browser allows localStorage
- Check browser DevTools > Application > Local Storage

**Issue**: Links not working in notifications?
- Ensure `actionUrl` is set in notification
- Verify URL starts with `/` for client routing
- Test navigation manually first

**Issue**: Too many notifications?
- Implement notification grouping
- Add auto-delete after 7 days (already implemented)
- Add mute/snooze options for users

---

**Documentation Complete** ✅

For questions or issues, check the service files or contact the development team.
