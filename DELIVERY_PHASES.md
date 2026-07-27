# Order Fulfillment Implementation - Phased Approach

## Phase 1: Seller Order Management
**Duration:** 1-2 hours
**Goal:** Enable sellers to view and manage orders

### Backend
- [ ] GET /sellers/orders - List all orders for seller
- [ ] GET /sellers/orders/{order_id} - View order details
- [ ] POST /orders/{order_id}/status - Update order status (PREPARING, READY_FOR_PICKUP)
- [ ] GET /sellers/dashboard - Analytics (pending, preparing, ready orders)

### Frontend
- [ ] Seller dashboard page showing orders
- [ ] Order list with status filter
- [ ] Order detail view with status update buttons
- [ ] Real-time order count badges

### Database
- [ ] Ensure seller_id is properly linked to orders
- [ ] Add order status history tracking (optional)

---

## Phase 2: Delivery Tracking & Rider Management
**Duration:** 2-3 hours
**Goal:** Assign riders and track delivery progress

### Backend
- [ ] GET /riders - List available riders
- [ ] POST /orders/{order_id}/assign-rider - Assign rider to delivery
- [ ] GET /orders/{order_id}/rider - Get assigned rider details
- [ ] POST /orders/{order_id}/status - Update to IN_DELIVERY, DELIVERED
- [ ] GET /riders/deliveries - Get deliveries for a rider

### Frontend
- [ ] Customer order detail - show assigned rider info
- [ ] Real-time delivery map (optional: integrate Google Maps)
- [ ] Rider contact button
- [ ] Delivery progress timeline

### Database
- [ ] DeliveryAssignment model (rider_id, order_id, status)
- [ ] Rider location tracking (optional)

---

## Phase 3: Order Cancellation & Refunds
**Duration:** 1.5-2 hours
**Goal:** Handle order cancellations and process refunds

### Backend
- [ ] POST /orders/{order_id}/cancel - Cancel order (only if status allows)
- [ ] POST /orders/{order_id}/refund - Process refund to M-Pesa
- [ ] GET /refunds/{order_id} - Get refund status
- [ ] Validation rules (can't cancel if in_delivery)

### Frontend
- [ ] Cancel button on order (conditional based on status)
- [ ] Refund confirmation dialog
- [ ] Refund status view
- [ ] Cancellation reason input

### Database
- [ ] Refund model (order_id, amount, status, timestamp)
- [ ] Track cancellation reason

---

## Phase 4: Rating, Reviews & Feedback
**Duration:** 1.5-2 hours
**Goal:** Enable customers to review orders and sellers

### Backend
- [ ] POST /orders/{order_id}/rate - Submit rating (1-5 stars)
- [ ] POST /orders/{order_id}/review - Submit review text
- [ ] GET /sellers/{seller_id}/reviews - Get seller reviews
- [ ] GET /sellers/{seller_id}/stats - Average rating & review count
- [ ] POST /orders/{order_id}/report-issue - Report problems

### Frontend
- [ ] Rating stars on delivered orders
- [ ] Review text input
- [ ] Issue report form (damaged, wrong item, etc)
- [ ] Seller profile with reviews & ratings

### Database
- [ ] Rating model (order_id, user_id, rating, comment)
- [ ] Issue model (already exists)

---

## Phase 5: Real M-Pesa Integration (Advanced)
**Duration:** 2-3 hours
**Goal:** Replace mock payments with real M-Pesa integration

### Backend
- [ ] Real STK push implementation (not mock)
- [ ] M-Pesa callback handler validation
- [ ] Payment webhook processing
- [ ] Error handling for failed transactions
- [ ] Transaction logging & reconciliation

### Frontend
- [ ] Error messages for failed payments
- [ ] Payment retry logic
- [ ] Transaction receipt

### Database
- [ ] Payment transaction logs
- [ ] Reconciliation records

---

## Implementation Order
1. **Phase 1** → Sellers can manage orders
2. **Phase 2** → Deliveries can be tracked
3. **Phase 3** → Orders can be cancelled/refunded
4. **Phase 4** → Customers can rate & review
5. **Phase 5** → Real payments (optional/final)

## Success Criteria Per Phase
- All endpoints tested with curl
- Frontend pages functional
- Database migrations complete
- No 500 errors in logs
- Order status transitions working correctly

