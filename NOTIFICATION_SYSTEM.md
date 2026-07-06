# Email & SMS Notification System

**Status**: ✅ COMPLETE  
**Date**: July 6, 2026  
**Integration**: Email (Resend) + SMS (AfricasTalking)

---

## Overview

Complete notification system for order lifecycle and abandoned cart recovery using:
- **Email**: Resend API for transactional emails
- **SMS**: AfricasTalking for SMS messages
- **Background Tasks**: Async scheduled jobs for periodic checks

---

## Architecture

### Components

1. **NotificationIntegrationService** - Main service handling email/SMS
2. **AbandonedCartNotificationService** - Detects and notifies abandoned carts
3. **BackgroundTaskScheduler** - Periodic background tasks
4. **Order Router Integration** - Sends notifications on order events
5. **Cart Router Integration** - Admin endpoint for manual checks

### Service Flow

```
Order Created
    ↓
create_order() endpoint
    ↓
NotificationIntegrationService.send_order_notification()
    ↓
├─→ Send Email (if enabled)
├─→ Send SMS (if enabled)
└─→ Log result
```

---

## Notification Types

### Order Lifecycle Notifications

#### 1. Order Created
**Trigger**: Order successfully created (checkout complete)  
**Recipients**: Customer  
**Content**: Order confirmation with order ID, items, total, tracking link

```
Email Subject: "Order Confirmation #{order_id}"
SMS: "Order confirmed! #{order_id}. Track: {short_link}. -Suqafuran"
```

#### 2. Order Confirmed
**Trigger**: Seller confirms order  
**Recipients**: Customer  
**Content**: Notification that seller has confirmed

```
Email Subject: "Your Order #{order_id} is Confirmed!"
SMS: "Seller confirmed! Order {order_id} being packed. -Suqafuran"
```

#### 3. Order Packed
**Trigger**: Seller marks order as packed  
**Recipients**: Customer  
**Content**: Order is packed and ready (delivery/pickup)

```
Email Subject: "Your Order #{order_id} is Packed!"
SMS: "Ready! {fulfillment_type}. Track: {short_link}. -Suqafuran"
```

#### 4. Rider Assigned (Delivery Only)
**Trigger**: Rider assigned to order  
**Recipients**: Customer  
**Content**: Rider name, phone, ETA

```
Email Subject: "Your Rider is on the Way! 🚗"
SMS: "Rider {rider_name} ({rider_phone}) assigned. ETA: {estimated_time}min."
```

#### 5. Order In Transit (Delivery Only)
**Trigger**: Order status changed to in_transit  
**Recipients**: Customer  
**Content**: Live tracking link, rider info

```
Email Subject: "Your Order is on the Way! 🚗"
SMS: "On the way! ETA: {estimated_time}min. Track: {short_link}."
```

#### 6. Order Delivered
**Trigger**: Order marked as delivered  
**Recipients**: Customer  
**Content**: Confirmation and review link

```
Email Subject: "Your Order has Arrived! ✅"
SMS: "Delivered! Rate: {review_link}. -Suqafuran"
```

### Abandoned Cart Recovery

#### Abandoned Cart Reminder
**Trigger**: Cart untouched for 2+ hours (automatic or manual)  
**Recipients**: Customer  
**Content**: Items in cart, pricing, quick checkout link

```
Email Subject: "Don't forget your items! 🛒"
Email Body: Shows item list, pricing, "Complete Purchase" CTA
SMS: "Don't lose {item_count} items! Use SAVE10. Complete: {cart_link}."
```

**Frequency**: Automatically checked every hour  
**Manual Trigger**: `POST /api/v1/cart/check-abandoned?hours_threshold=2` (admin only)

### Delivery Issues

#### Delivery Issue Report
**Trigger**: Customer reports delivery issue  
**Recipients**: Customer (confirmation)  
**Content**: Issue type, description, support link

```
Email Subject: "Delivery Issue Reported - Order {order_id}"
SMS: "Issue reported. Support will contact you soon."
```

---

## User Preferences

### Notification Preferences
Users can control notifications via their profile settings:

```python
user.email_notifications: bool  # Enable/disable email
user.sms_notifications: bool    # Enable/disable SMS
```

### Default Settings
- **Email**: Enabled by default
- **SMS**: Disabled by default (users opt-in)

---

## API Endpoints

### Order Notifications (Automatic)
These are triggered automatically during order lifecycle:

```
POST /api/v1/orders
  ↓ Triggers: order_created notification

PATCH /api/v1/orders/{id}/status
  ↓ Triggers: order_confirmed, order_packed, order_in_transit, order_delivered
    (based on status change)
```

### Cart Notifications

#### Manual Abandoned Cart Check (Admin)
```
POST /api/v1/cart/check-abandoned?hours_threshold=2

Request:
- Query param: hours_threshold (default: 2 hours)
- Authentication: Admin only

Response:
{
  "status": "success",
  "message": "Abandoned cart check initiated for carts untouched for 2 hours",
  "notification": "Check will run asynchronously"
}
```

---

## Background Tasks

### Automatic Tasks

#### 1. Abandoned Cart Check
**Frequency**: Every 1 hour  
**Action**: Find carts with items untouched for 2+ hours and send notifications  
**Implementation**: `_abandoned_carts_check_loop()`

```python
async def _abandoned_carts_check_loop():
    while True:
        await asyncio.sleep(3600)  # Every hour
        await AbandonedCartNotificationService.check_and_notify_abandoned_carts(
            hours_threshold=2
        )
```

#### 2. Delivery Reminders
**Frequency**: Every 30 minutes  
**Action**: Find orders in transit for >20 minutes and send reminders  
**Implementation**: `_delivery_reminders_loop()`

```python
async def _delivery_reminders_loop():
    while True:
        await asyncio.sleep(1800)  # Every 30 minutes
        # Find in_transit orders and send reminders
```

### Startup Initialization
```python
# In main.py
@app.on_event("startup")
async def startup_event():
    init_background_tasks()  # Starts all background tasks
```

---

## Email Templates

### Template Variables
All templates support dynamic variable substitution:

| Variable | Example | Usage |
|----------|---------|-------|
| `{order_id}` | 12345 | Order identifier |
| `{customer_name}` | John Doe | Customer full name |
| `{item_count}` | 3 | Number of items |
| `{total}` | 10000.00 | Total amount (KSh) |
| `{fulfillment_type}` | Delivery/Pickup | Fulfillment mode |
| `{tracking_link}` | suq.co/o12345 | Order tracking URL |
| `{rider_name}` | Ahmed | Rider full name |
| `{rider_phone}` | +252612345678 | Rider phone |
| `{estimated_time}` | 30 | Minutes until arrival |
| `{review_link}` | suq.co/review/12345 | Review page link |
| `{cart_link}` | suqafuran.com/cart | Shopping cart URL |
| `{cart_items}` | [list] | Formatted cart items |
| `{subtotal}` | 9000.00 | Cart subtotal |
| `{discount}` | 1000.00 | Promo discount |

### Email Template Structure

```python
EMAIL_TEMPLATES = {
    "notification_type": {
        "subject": "Email subject with {variables}",
        "body": """
Email body with dynamic content.
Supports multiline formatting.
Variables replaced: {order_id}, {customer_name}, etc.
"""
    }
}
```

---

## SMS Templates

### SMS Constraints
- **Character limit**: 160 characters (standard SMS)
- **Encoding**: UTF-8
- **Format**: Plain text only, no HTML

### SMS Template Structure

```python
SMS_TEMPLATES = {
    "notification_type": "SMS body with {variables}. Max 160 chars.",
}
```

---

## Configuration

### Email Service (Resend)
```python
# Configured via existing email_service.py
send_email(
    to_email="user@example.com",
    subject="Subject",
    body="Plain text body",
    html="<html>HTML version</html>"
)
```

### SMS Service (AfricasTalking)
```python
# Configured via existing africastalking_service.py
send_sms(
    phone_number="+252612345678",
    message="SMS message (max 160 chars)"
)
```

---

## Integration Points

### 1. Order Creation (`routers/order_endpoints.py`)
```python
# After order is created and committed:
asyncio.create_task(
    NotificationIntegrationService.send_order_notification(
        order=order,
        notification_type="order_created",
        session=session,
    )
)
```

### 2. Order Status Updates (`routers/order_endpoints.py`)
```python
# After order status is updated:
status_to_notification = {
    OrderStatus.confirmed: "order_confirmed",
    OrderStatus.packed: "order_packed",
    OrderStatus.in_transit: "order_in_transit",
    OrderStatus.delivered: "order_delivered",
}

asyncio.create_task(
    NotificationIntegrationService.send_order_notification(
        order=order,
        notification_type=status_to_notification[order.status],
        session=session,
        extra_data={
            "rider_name": rider.full_name,
            "rider_phone": rider.phone,
        }
    )
)
```

### 3. Abandoned Carts (`routers/cart.py`)
```python
# Manual admin trigger:
POST /api/v1/cart/check-abandoned?hours_threshold=2

# Automatic (runs every hour via background task)
```

---

## Error Handling

### Graceful Degradation
- Email failures don't block order creation
- SMS failures don't block email sending
- Async tasks fail silently and log errors
- User experience unaffected

### Logging
```python
logger.info(f"Notification sent for order {order.id}: {notification_type}")
logger.error(f"Failed to send notification: {error}")
logger.error(f"Failed to send email to {email}: {error}")
logger.error(f"Failed to send SMS to {phone}: {error}")
```

---

## Database Schema

### Notification Tables (Existing)
```sql
-- In-app notification history
notifications (
  id INT PRIMARY KEY,
  user_id INT FK,
  type VARCHAR,
  title VARCHAR,
  message TEXT,
  status ENUM,
  action_url VARCHAR,
  created_at TIMESTAMP
)

-- User notification preferences
notification_preferences (
  user_id INT FK PRIMARY KEY,
  email_enabled BOOL,
  sms_enabled BOOL,
  updated_at TIMESTAMP
)
```

---

## Monitoring & Analytics

### Metrics to Track
1. **Email delivery rate**: Emails sent vs. bounced
2. **SMS delivery rate**: SMS sent vs. failed
3. **Abandoned cart recovery**: Carts recovered after notification
4. **Order confirmation time**: Time from order creation to delivery
5. **Notification preference**: % users with email/SMS enabled

### Log Locations
- **Application logs**: `/var/log/suqafuran/app.log`
- **Email service logs**: Resend dashboard
- **SMS service logs**: AfricasTalking console

---

## Testing

### Manual Testing

#### 1. Test Order Notifications
```bash
# Create an order
POST /api/v1/orders
{
  "fulfillment_type": "delivery",
  "address_id": 1,
  "customer_phone": "+252612345678",
  "courier_tip": 500
}

# Monitor logs for notification send
tail -f /var/log/suqafuran/app.log | grep "Notification sent"
```

#### 2. Test Abandoned Cart
```bash
# Trigger manual check
POST /api/v1/cart/check-abandoned?hours_threshold=0

# Should send notifications immediately for any carts
```

#### 3. Test SMS/Email Providers
```python
# Test email
from app.services.email_service import send_email
await send_email(
    to_email="test@example.com",
    subject="Test",
    body="Test email body"
)

# Test SMS
from app.services.africastalking_service import send_sms
await send_sms(
    phone_number="+252612345678",
    message="Test SMS message"
)
```

---

## Deployment Checklist

- [ ] Configure Resend API key in environment variables
- [ ] Configure AfricasTalking API key in environment variables
- [ ] Test email sending with Resend
- [ ] Test SMS sending with AfricasTalking
- [ ] Verify background tasks start on app startup
- [ ] Monitor first 24 hours of notifications
- [ ] Check email delivery rates
- [ ] Check SMS delivery rates
- [ ] Verify abandoned cart detection works
- [ ] Test SMS fallback if email fails

---

## Future Enhancements

### Phase 2 Notifications
- [ ] Delivery driver ratings and reviews
- [ ] In-app push notifications via Firebase
- [ ] WhatsApp integration (via provider)
- [ ] Telegram bot for order updates
- [ ] Rich email with product images
- [ ] Dynamic reminder timing based on user timezone
- [ ] A/B testing of notification copy
- [ ] Segmented notifications based on user behavior

---

## Files Modified/Created

### Created
- `backend/app/services/notification_integration.py` - Main notification service
- `backend/app/services/background_tasks.py` - Background task scheduler
- `NOTIFICATION_SYSTEM.md` - This documentation

### Modified
- `backend/routers/order_endpoints.py` - Added notification triggers
- `backend/routers/cart.py` - Added abandoned cart check endpoint
- `backend/main.py` - Added background task initialization

---

## Service Integration Summary

| Service | Function | Status |
|---------|----------|--------|
| Email (Resend) | Transactional emails | ✅ Integrated |
| SMS (AfricasTalking) | Text messages | ✅ Integrated |
| Background Tasks | Scheduled jobs | ✅ Integrated |
| Order Router | Notification triggers | ✅ Integrated |
| Cart Router | Abandoned cart checks | ✅ Integrated |

---

**Status**: ✅ Ready for production deployment

