# Suqafuran API Endpoint Reference

**Version**: 2.0 (Architecture-Aligned)  
**Status**: Reference Document - Implementation in Progress  
**Last Updated**: July 6, 2026

---

## BASE URL

```
Production: https://api.suqafuran.com/api/v1
Development: http://localhost:8000/api/v1
```

## AUTHENTICATION

All endpoints except auth-related require JWT token in header:

```
Authorization: Bearer {jwt_token}
```

User roles determine access:
- `customer` - Browse, cart, orders
- `seller` - Shop, products, orders, earnings
- `rider` - Deliveries, earnings
- `admin` - All operations with restrictions
- `agent` - Support, marketing, analytics

---

## MODULE 1: USER & AUTHENTICATION

### Base Path: `/users`

```
POST   /users/signup                    Register new user
POST   /users/login                     Login with email/phone
POST   /users/otp/send                  Send OTP for verification
POST   /users/otp/verify                Verify OTP
POST   /users/refresh-token             Refresh JWT token
POST   /users/logout                    Logout

GET    /users/me                        Get current user profile
PATCH  /users/me                        Update profile
GET    /users/me/roles                  Get user's roles
POST   /users/me/avatar                 Upload profile picture
DELETE /users/me                        Delete account

POST   /users/password/change           Change password
POST   /users/password/reset            Reset password
POST   /users/password/reset/verify     Verify reset token
```

---

## MODULE 2: SHOP

### Base Path: `/shops`

#### Public Endpoints (Customer Browse)

```
GET    /shops                           List all shops
GET    /shops/{id}                      Get shop details
GET    /shops/{id}/products             Get shop's products
GET    /shops/{id}/reviews              Get shop reviews
GET    /shops/{id}/availability         Check if shop is open

GET    /shops/search                    Search shops by name
GET    /shops/by-category/{cat_id}      Get shops in category
GET    /shops/nearby                    Get shops near location (geo-search)
GET    /shops/featured                  Get featured shops
```

#### Seller Endpoints (Shop Management)

```
POST   /shops                           Create shop (seller registration)
GET    /shops/me                        Get my shop details
PATCH  /shops/me                        Update my shop info
DELETE /shops/me                        Close shop (soft delete)

GET    /shops/me/banner                 Get shop banner image
POST   /shops/me/banner                 Upload shop banner
DELETE /shops/me/banner                 Remove shop banner

PATCH  /shops/me/hours                  Set operating hours
PATCH  /shops/me/policies               Update policies (refund, shipping, etc.)
GET    /shops/me/settings               Get shop settings
PATCH  /shops/me/settings               Update settings
```

#### Admin Endpoints (Shop Moderation)

```
GET    /shops/admin/pending             List pending shop registrations
POST   /shops/admin/{id}/approve        Approve shop registration
POST   /shops/admin/{id}/reject         Reject shop registration
POST   /shops/admin/{id}/suspend        Suspend shop
POST   /shops/admin/{id}/ban            Ban shop
GET    /shops/admin/{id}/analytics      Get shop analytics
```

---

## MODULE 3: PRODUCT & LISTING

### Base Path: `/products`

#### Customer/Public Endpoints

```
GET    /products                        List all products (with pagination)
GET    /products/search                 Search products by query
GET    /products/categories/{cat_id}    Get products in category
GET    /products/trending               Get trending products
GET    /products/recommended            Get recommended products (personalized)
GET    /products/{id}                   Get product details
GET    /products/{id}/variants          Get product variants (size, color)
GET    /products/{id}/stock             Check stock availability
GET    /products/{id}/similar           Get similar products
GET    /products/{id}/reviews           Get product reviews (see MODULE: REVIEW)
```

#### Seller Endpoints (Product Management)

```
POST   /products                        Create product listing
GET    /products/me                     Get my listings
GET    /products/me/active              Get active listings
GET    /products/me/inactive            Get inactive listings
PATCH  /products/{id}                   Update listing
DELETE /products/{id}                   Delete listing (soft delete)
POST   /products/{id}/bulk-update       Bulk update price/stock
PATCH  /products/{id}/stock             Update stock quantity

POST   /products/{id}/images            Upload product image
DELETE /products/{id}/images/{img_id}   Delete image

POST   /products/{id}/publish           Publish listing
POST   /products/{id}/unpublish         Unpublish listing
POST   /products/{id}/reactivate        Reactivate old listing
```

#### Admin Endpoints

```
GET    /products/admin/pending          List pending listings
POST   /products/admin/{id}/approve     Approve listing
POST   /products/admin/{id}/flag        Flag for review
POST   /products/admin/{id}/remove      Remove listing (moderation)
```

---

## MODULE 4: CATEGORY

### Base Path: `/categories`

#### Public Endpoints (Customer Browse)

```
GET    /categories                      Get root categories (17 total)
GET    /categories/{id}                 Get category with subcategories
GET    /categories/{id}/subcategories   Get subcategories only
GET    /categories/{id}/products        Get products in category
GET    /categories/search               Search categories by name
GET    /categories/by-slug/{slug}       Get category by slug
```

#### Admin Endpoints (Category Management)

```
POST   /categories                      Create root category
POST   /categories/{id}/subcategories   Create subcategory
POST   /categories/{id}/types           Create type (subsubcategory)

PATCH  /categories/{id}                 Update category
DELETE /categories/{id}                 Delete category (with cascade warnings)

POST   /categories/{id}/icon            Upload category icon
DELETE /categories/{id}/icon            Remove icon

GET    /categories/admin/structure      Get full hierarchy (admin view)
```

---

## MODULE 5: CART

### Base Path: `/cart`

```
GET    /cart                            Get my shopping cart
POST   /cart/items                      Add product to cart
DELETE /cart/items/{item_id}            Remove item from cart
PATCH  /cart/items/{item_id}            Update item quantity
DELETE /cart                            Clear entire cart

POST   /cart/promo                      Apply promo code
DELETE /cart/promo/{code}               Remove promo code

GET    /cart/summary                    Get cart summary (totals, taxes)
POST   /cart/validate                   Validate cart before checkout
```

---

## MODULE 6: ORDER

### Base Path: `/orders`

#### Customer Endpoints

```
POST   /orders                          Create order from cart (CHECKOUT)
GET    /orders                          List my orders
GET    /orders/{id}                     Get order details
GET    /orders/{id}/tracking            Get real-time tracking
POST   /orders/{id}/cancel              Cancel order (before shipped)
POST   /orders/{id}/request-modification Request order change

GET    /orders/history                  Get order history (filtered by status)
GET    /orders/current                  Get active orders
GET    /orders/completed                Get completed orders
GET    /orders/receipts/{id}            Download receipt as PDF
```

#### Seller Endpoints

```
GET    /orders                          Get orders for my shop
GET    /orders/pending                  Get pending orders
GET    /orders/{id}                     Get order details
PATCH  /orders/{id}/status              Update order status (confirm→pack→ready)
POST   /orders/{id}/confirm             Confirm order
POST   /orders/{id}/pack                Mark as packed
POST   /orders/{id}/pickup-ready        Mark ready for pickup (pickup mode)
POST   /orders/{id}/assign-rider        Assign rider for delivery

GET    /orders/analytics/daily          Daily order stats
GET    /orders/analytics/trends         Order trends
POST   /orders/{id}/notes               Add internal notes
```

#### Rider Endpoints

```
GET    /orders/available                List available deliveries
GET    /orders/assigned                 List my assigned deliveries
POST   /orders/{id}/accept              Accept delivery assignment
POST   /orders/{id}/reject              Reject delivery assignment
GET    /orders/{id}/details             Get full order details

POST   /orders/{id}/location            Update my location (in transit)
POST   /orders/{id}/arrived             Mark arrived at delivery location
POST   /orders/{id}/photo               Upload proof of delivery photo
POST   /orders/{id}/signature           Get customer signature
POST   /orders/{id}/complete            Mark delivery complete
POST   /orders/{id}/issue               Report issue/exception
```

#### Admin Endpoints

```
GET    /orders/admin/all                Get all orders (platform-wide)
GET    /orders/admin/{id}               Get order details (admin view)
POST   /orders/admin/{id}/refund        Process refund
POST   /orders/admin/{id}/investigate   Start investigation (dispute)
GET    /orders/admin/disputes           Get disputed orders
```

---

## MODULE 7: PAYMENT

### Base Path: `/payments`

```
POST   /payments/initiate               Start payment (M-Pesa STK)
GET    /payments/{id}/status            Check payment status

POST   /payments/callback               M-Pesa callback (webhook) - Internal

GET    /payments/history                Get transaction history
GET    /payments/{id}/receipt           Get payment receipt

POST   /payments/refund/{order_id}      Request refund
GET    /payments/refunds                Get refund history
```

---

## MODULE 8: DELIVERY

### Base Path: `/deliveries`

#### Customer Endpoints

```
GET    /deliveries/{order_id}           Get delivery info for order
GET    /deliveries/{id}/tracking        Get real-time tracking (rider location)
GET    /deliveries/{id}/rider-info      Get rider contact & details
POST   /deliveries/{id}/contact-rider   Contact rider (send message)
```

#### Rider Endpoints

```
GET    /deliveries/available            List available delivery jobs
POST   /deliveries/{id}/accept          Accept delivery job
GET    /deliveries/active               Get my active deliveries
GET    /deliveries/{id}                 Get delivery details
POST   /deliveries/{id}/location        Update my location (real-time)
POST   /deliveries/{id}/arrived         Mark arrived
POST   /deliveries/{id}/complete        Mark complete with proof
POST   /deliveries/{id}/issue           Report issue
```

#### Seller Endpoints

```
GET    /deliveries/my-orders            Get deliveries for my orders
POST   /deliveries/{id}/assign-rider    Assign rider to order
POST   /deliveries/{id}/schedule        Schedule pickup time
```

#### Admin Endpoints

```
GET    /deliveries/admin/all            View all deliveries
GET    /deliveries/admin/heatmap        Get delivery heatmap (geo)
GET    /deliveries/admin/analytics      Analytics & performance
POST   /deliveries/admin/{id}/reassign  Reassign to different rider
```

---

## MODULE 9: REVIEW

### Base Path: `/reviews`

```
GET    /reviews/product/{product_id}    Get reviews for product
GET    /reviews/order/{order_id}        Get review for order (if exists)

POST   /reviews                         Create review (after order delivered)
GET    /reviews/me                      Get my reviews
PATCH  /reviews/{id}                    Update my review
DELETE /reviews/{id}                    Delete my review

GET    /reviews/shop/{shop_id}          Get reviews for shop
POST   /reviews/{id}/helpful            Mark review as helpful

GET    /reviews/admin                   Get all reviews (admin moderation)
POST   /reviews/admin/{id}/flag         Flag review as inappropriate
```

---

## MODULE 10: VERIFICATION

### Base Path: `/verification`

#### User Endpoints

```
POST   /verification/start              Start verification process
POST   /verification/upload-id          Upload identity document
POST   /verification/upload-selfie      Upload selfie for liveness
POST   /verification/upload-address     Upload proof of address
GET    /verification/status             Get verification status
GET    /verification/requirements       Get verification requirements
```

#### Seller/Rider Endpoints

```
POST   /verification/seller/submit      Submit seller verification
POST   /verification/rider/submit       Submit rider verification
GET    /verification/me/status          Get my verification status
```

#### Admin Endpoints

```
GET    /verification/admin/pending      List pending verifications
GET    /verification/admin/{id}         Get verification details
POST   /verification/admin/{id}/approve Approve verification
POST   /verification/admin/{id}/reject  Reject verification
POST   /verification/admin/{id}/request-docs Request additional docs
```

---

## MODULE 11: MESSAGE (NEW)

### Base Path: `/messages`

```
GET    /messages                        Get my conversations (threads)
POST   /messages                        Start new conversation
GET    /messages/{conversation_id}      Get conversation history
POST   /messages/{conversation_id}      Send message
DELETE /messages/{id}                   Delete message
PATCH  /messages/{id}                   Edit message

GET    /messages/{conversation_id}/unread  Get unread count
POST   /messages/{conversation_id}/read-all Mark all as read

GET    /messages/search                 Search messages/conversations
```

**WebSocket Event**: `message:new` when message received

---

## MODULE 12: NOTIFICATION

### Base Path: `/notifications`

```
GET    /notifications                   Get my notifications
GET    /notifications/unread            Get unread notifications
POST   /notifications/{id}/read         Mark as read
DELETE /notifications/{id}              Delete notification

PATCH  /notifications/preferences       Update notification preferences
GET    /notifications/preferences       Get preferences

GET    /notifications/email-settings    Get email notification settings
PATCH  /notifications/email-settings   Update email settings
```

**WebSocket Event**: `notification:new` when notification created

---

## MODULE 13: RIDER

### Base Path: `/riders`

#### Rider Endpoints

```
GET    /riders/me                       Get my driver profile
PATCH  /riders/me                       Update driver info
GET    /riders/me/documents             Get my documents
POST   /riders/me/documents             Upload document
GET    /riders/me/vehicle               Get vehicle info
PATCH  /riders/me/vehicle               Update vehicle

POST   /riders/me/status/online         Go online (available)
POST   /riders/me/status/offline        Go offline (unavailable)
GET    /riders/me/status                Get current status

GET    /riders/me/earnings/today        Get today's earnings
GET    /riders/me/earnings/weekly       Get weekly earnings
GET    /riders/me/earnings/monthly      Get monthly earnings
GET    /riders/me/earnings/history      Get earnings history
GET    /riders/me/earnings/breakdown    Get breakdown (by type)

GET    /riders/me/performance           Get performance metrics
GET    /riders/me/analytics             Get analytics dashboard

POST   /riders/me/withdraw              Request withdrawal
GET    /riders/me/withdrawals           Get withdrawal history
```

#### Admin Endpoints

```
GET    /riders/admin/all                Get all riders
GET    /riders/admin/{id}               Get rider details
POST   /riders/admin/{id}/suspend       Suspend rider
POST   /riders/admin/{id}/ban           Ban rider
GET    /riders/admin/{id}/history       Get delivery history
GET    /riders/admin/{id}/performance   Get performance metrics
```

---

## MODULE 14: SELLER (Extended)

### Base Path: `/sellers`

```
GET    /sellers/me/dashboard            Get seller dashboard (overview)
GET    /sellers/me/orders/pending       Get pending orders
GET    /sellers/me/orders/completed     Get completed orders
GET    /sellers/me/stats/today          Get today's stats
GET    /sellers/me/stats/this-week      Get weekly stats
GET    /sellers/me/stats/this-month     Get monthly stats

GET    /sellers/me/products/top         Get top selling products
GET    /sellers/me/reviews/recent       Get recent reviews
GET    /sellers/me/customers/top        Get top customers

GET    /sellers/me/earnings/total       Total lifetime earnings
GET    /sellers/me/earnings/pending     Pending earnings
GET    /sellers/me/earnings/withdrawn   Withdrawn amount
GET    /sellers/me/withdrawals          Get withdrawal history
POST   /sellers/me/withdraw             Request withdrawal

GET    /sellers/me/messages/unread      Get unread message count
GET    /sellers/me/issues               Get support issues/disputes
```

---

## MODULE 15: AGENT

### Base Path: `/agents`

```
GET    /agents/me/dashboard             Get agent overview
GET    /agents/me/tickets               Get assigned support tickets
GET    /agents/me/sellers               Get assigned sellers (accounts)

POST   /agents/campaigns/create         Create promotion campaign
GET    /agents/campaigns                Get campaigns
PATCH  /agents/campaigns/{id}           Update campaign
DELETE /agents/campaigns/{id}           End campaign

GET    /agents/me/analytics             Get performance analytics
GET    /agents/me/effectiveness         Get campaign effectiveness
```

---

## MODULE 16: ADMIN

### Base Path: `/admin`

#### Dashboard & Analytics

```
GET    /admin/dashboard                 Get admin dashboard overview
GET    /admin/analytics                 Get platform analytics
GET    /admin/analytics/users           Get user growth
GET    /admin/analytics/revenue         Get revenue metrics
GET    /admin/analytics/orders          Get order metrics
GET    /admin/reports/daily             Get daily report
GET    /admin/reports/export/{format}   Export reports (CSV, PDF)
```

#### Platform Moderation

```
GET    /admin/disputes/all              Get all disputes
GET    /admin/disputes/{id}             Get dispute details
POST   /admin/disputes/{id}/resolve     Resolve dispute

GET    /admin/fraud/alerts              Get fraud alerts
GET    /admin/fraud/{id}                Get fraud details
POST   /admin/fraud/{id}/investigate    Investigate
POST   /admin/fraud/{id}/flag-user      Flag user as fraud

GET    /admin/support/tickets           Get support tickets
POST   /admin/support/{id}/assign       Assign to agent
POST   /admin/support/{id}/resolve      Resolve ticket
```

#### System Management

```
GET    /admin/settings                  Get platform settings
PATCH  /admin/settings                  Update settings
GET    /admin/settings/fees             Get fee structure
PATCH  /admin/settings/fees             Update fees

POST   /admin/announcements             Create announcement
GET    /admin/announcements             Get announcements
DELETE /admin/announcements/{id}        Delete announcement

POST   /admin/maintenance               Enable maintenance mode
```

---

## MODULE 17: WISHLIST

### Base Path: `/wishlist`

```
GET    /wishlist                        Get my wishlist
POST   /wishlist/items                  Add item to wishlist
DELETE /wishlist/items/{product_id}     Remove from wishlist
GET    /wishlist/count                  Get wishlist count
POST   /wishlist/share                  Share wishlist (get link)
GET    /wishlist/shared/{token}         View shared wishlist (public)
```

---

## WEBHOOK ENDPOINTS (Receive External Events)

### Payment Webhook

```
POST   /webhooks/mpesa/callback         M-Pesa payment callback
```

### SMS Delivery Webhook

```
POST   /webhooks/sms/delivery           SMS delivery confirmation
```

---

## ERROR RESPONSES

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { "field": "error detail" },
    "timestamp": "2026-07-06T10:30:00Z",
    "request_id": "req_xyz123"
  }
}
```

### Common Error Codes

```
AUTH_REQUIRED          - Authentication token missing/invalid
FORBIDDEN              - User not authorized for this action
NOT_FOUND              - Resource not found
VALIDATION_ERROR       - Request validation failed
CONFLICT               - Resource already exists / state conflict
RATE_LIMITED           - Too many requests
SERVER_ERROR           - Internal server error
PAYMENT_FAILED         - Payment processing failed
INVENTORY_ERROR        - Stock not available
DELIVERY_ERROR         - Delivery assignment failed
```

---

## PAGINATION

List endpoints support:

```
?skip=0&limit=20          # Default: skip=0, limit=20
?page=1&page_size=20      # Alternative pagination
?sort=created_at          # Sort field
?sort_order=desc          # asc or desc
```

---

## RATE LIMITS

```
Public endpoints:     100 req/min per IP
Authenticated:        500 req/min per user
Admin endpoints:      1000 req/min per admin
WebSocket:            1 connection per user (persistent)
```

---

## WEBSOCKET ENDPOINTS

```
ws://localhost:8000/ws/{user_id}/{token}
```

### Events

**Client → Server**:
```
message:send              Send message
location:update          Update rider location
status:change            Update status
```

**Server → Client**:
```
order:created            New order placed
order:status_update      Order status changed
rider:assigned           Rider assigned to order
delivery:update          Delivery location update
message:received         New message
notification:received    New notification
payment:confirmed        Payment confirmed
```

---

## AUTHENTICATION FLOW

### 1. Sign Up

```bash
POST /users/signup
{
  "email": "user@example.com",
  "password": "secure_password",
  "phone": "+252612345678",
  "full_name": "John Doe"
}

Response: 
{
  "user_id": 123,
  "email": "user@example.com"
}
```

### 2. Email Verification

```bash
POST /users/otp/send
{ "email": "user@example.com" }

POST /users/otp/verify
{
  "email": "user@example.com",
  "otp": "123456"
}

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": { "id": 123, "role": "customer" }
}
```

### 3. Use Token

```bash
Authorization: Bearer eyJhbGc...
```

---

## EXAMPLE REQUESTS

### Search Products

```bash
GET /products?q=phone&category=16&min_price=5000&max_price=50000&skip=0&limit=20

Response:
{
  "products": [
    {
      "id": 1,
      "title": "iPhone 13",
      "price": 35000,
      "rating": 4.5,
      "shop": { "id": 1, "name": "TechStore" }
    }
  ],
  "total": 45,
  "skip": 0,
  "limit": 20
}
```

### Add to Cart

```bash
POST /cart/items
{
  "product_id": 1,
  "quantity": 2
}

Response:
{
  "id": 1,
  "product_id": 1,
  "quantity": 2,
  "price": 35000,
  "subtotal": 70000
}
```

### Create Order

```bash
POST /orders
{
  "fulfillment_type": "delivery",
  "address_id": 5,
  "delivery_option": "standard",
  "courier_tip": 500,
  "phone": "+252612345678"
}

Response:
{
  "id": 101,
  "customer_id": 123,
  "status": "pending",
  "total": 73000,
  "created_at": "2026-07-06T10:30:00Z"
}
```

---

## Implementation Status

| Module | Status | Endpoints | Notes |
|--------|--------|-----------|-------|
| User | ✅ | 9/10 | Auth complete |
| Shop | ⚠️ | 5/11 | Public view working |
| Product | ⚠️ | 7/13 | Seller CRUD incomplete |
| Category | ❌ | 0/5 | NEW - needs implementation |
| Cart | ❌ | 0/6 | NEW - needs implementation |
| Order | ⚠️ | 8/15 | Partial - missing customer flows |
| Payment | ✅ | 3/3 | M-Pesa working |
| Delivery | ⚠️ | 8/11 | Tracking incomplete |
| Review | ⚠️ | 5/8 | Partial |
| Verification | ⚠️ | 3/8 | Admin review working |
| Message | ❌ | 0/7 | NEW - needs implementation |
| Notification | ✅ | 4/5 | WebSocket events working |
| Rider | ✅ | 13/14 | Nearly complete |
| Seller | ✅ | 9/9 | Dashboard complete |
| Admin | ✅ | 18+ | Full dashboard |
| Agent | ⚠️ | 3/6 | Partial |
| Wishlist | ❌ | 0/6 | NEW - needs implementation |

---

**Total Endpoints**: 127 planned, 88 implemented (69% complete)

