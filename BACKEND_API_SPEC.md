# Suqafuran Backend API Specification

## Base URL
```
http://localhost:8000/api/v1
```

---

## Authentication

All endpoints (except `/auth/*` and `/users/register`) require Bearer token in Authorization header:
```
Authorization: Bearer {access_token}
```

---

## Orders API

### Create Order
```
POST /orders
Content-Type: application/json

{
  "items": [
    {
      "product_id": "123",
      "quantity": 2,
      "price": 1000,
      "title": "Product Name"
    }
  ],
  "delivery_option": "delivery" | "pickup",
  "delivery_address": "123 Main St, Nairobi",  // required if delivery
  "scheduled_time": "2024-06-30T14:00:00",    // optional for scheduled
  "phone_number": "+254712345678",
  "courier_tip": 50,
  "promo_code": "SAVE10",
  "location": {
    "latitude": -1.2921,
    "longitude": 36.8219
  }
}

Response: 201 Created
{
  "id": "order_123",
  "status": "pending",
  "items": [...],
  "total_amount": 1100,
  "platform_fee": 100,
  "seller_amount": 1000,
  "delivery_option": "delivery",
  "payment_status": "pending",
  "created_at": "2024-06-30T10:00:00Z"
}
```

### List Orders
```
GET /orders?status=pending&limit=20

Response: 200 OK
[
  {
    "id": "order_123",
    "status": "pending",
    "total_amount": 1100,
    ...
  }
]
```

### Get Order Details
```
GET /orders/{order_id}

Response: 200 OK
{
  "id": "order_123",
  "status": "confirmed",
  "items": [...],
  "total_amount": 1100,
  "seller_amount": 1000,
  "platform_fee": 100,
  "delivery_address": "123 Main St",
  "phone_number": "+254712345678",
  "delivery_option": "delivery",
  "payment_status": "completed",
  "created_at": "2024-06-30T10:00:00Z",
  "updated_at": "2024-06-30T10:30:00Z"
}
```

### Update Order Status
```
PATCH /orders/{order_id}
Content-Type: application/json

{
  "status": "confirmed" | "preparing" | "ready_for_pickup" | "in_delivery" | "delivered" | "cancelled"
}

Response: 200 OK
{
  "id": "order_123",
  "status": "confirmed",
  ...
}
```

### Cancel Order
```
POST /orders/{order_id}/cancel
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}

Response: 200 OK
{
  "id": "order_123",
  "status": "cancelled",
  ...
}
```

### Rate Delivery
```
POST /orders/{order_id}/rate-delivery
Content-Type: application/json

{
  "rating": 5,
  "comment": "Great service!"
}

Response: 200 OK
{
  "message": "Rating submitted successfully"
}
```

### Report Issue
```
POST /orders/{order_id}/report-issue
Content-Type: application/json

{
  "issue_type": "item_mismatch" | "damaged" | "missing_items" | "other",
  "description": "Item doesn't match the listing",
  "images": ["image_url_1", "image_url_2"]
}

Response: 201 Created
{
  "issue_id": "issue_456",
  "status": "under_review",
  "created_at": "2024-06-30T11:00:00Z"
}
```

### Request Resolution
```
POST /issues/{issue_id}/request-resolution
Content-Type: application/json

{
  "resolution_type": "refund" | "replacement"
}

Response: 200 OK
{
  "id": "resolution_789",
  "status": "pending",
  "type": "refund"
}
```

---

## Payments API

### Initiate M-Pesa Payment
```
POST /payments/mpesa/initiate
Content-Type: application/json

{
  "phone_number": "+254712345678",
  "amount": 1100,
  "order_id": "order_123",
  "account_reference": "SUQA123",
  "transaction_description": "Payment for order"
}

Response: 200 OK
{
  "success": true,
  "merchant_request_id": "mpesa_req_123",
  "checkout_request_id": "mpesa_checkout_123",
  "response_code": "0",
  "response_description": "Success. Request accepted for processing",
  "customer_message": "Success. Request accepted for processing"
}
```

### Check Payment Status
```
GET /payments/{order_id}/status

Response: 200 OK
{
  "order_id": "order_123",
  "status": "completed",
  "amount": 1100,
  "mpesa_reference": "LK451H1IG0",
  "payment_method": "mpesa",
  "created_at": "2024-06-30T10:00:00Z",
  "updated_at": "2024-06-30T10:05:00Z"
}
```

### Get Payment History
```
GET /payments/history?limit=20

Response: 200 OK
[
  {
    "order_id": "order_123",
    "status": "completed",
    "amount": 1100,
    ...
  }
]
```

### Refund Payment
```
POST /payments/{order_id}/refund
Content-Type: application/json

{
  "amount": 1100  // optional, full refund if omitted
}

Response: 200 OK
{
  "success": true,
  "refund_reference": "REF123456",
  "amount": 1100
}
```

### M-Pesa Callback (Webhook)
```
POST /payments/mpesa/callback
Content-Type: application/json

Body from M-Pesa Daraja API:
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "mpesa_req_123",
      "CheckoutRequestID": "mpesa_checkout_123",
      "ResultCode": 0,
      "ResultDesc": "The service request has been accepted successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 1100
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "LK451H1IG0"
          },
          {
            "Name": "PhoneNumber",
            "Value": 254712345678
          }
        ]
      }
    }
  }
}

Response: 200 OK
{
  "success": true,
  "message": "Payment processed"
}
```

---

## Seller API

### Register Seller
```
POST /sellers/register
Content-Type: application/json

{
  "shop_name": "Fresh Groceries",
  "owner_name": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "mpesa_number": "+254712345678",
  "shop_address": "123 Main St, Nairobi",
  "category": "groceries",
  "location": {
    "latitude": -1.2921,
    "longitude": 36.8219
  }
}

Response: 201 Created
{
  "id": "seller_123",
  "shop_name": "Fresh Groceries",
  "owner_name": "John Doe",
  "email": "john@example.com",
  "verification_status": "pending",
  "mpesa_verified": false,
  "is_active": true,
  "created_at": "2024-06-30T10:00:00Z"
}
```

### Get Seller Profile
```
GET /sellers/me

Response: 200 OK
{
  "id": "seller_123",
  "shop_name": "Fresh Groceries",
  "owner_name": "John Doe",
  "email": "john@example.com",
  "phone": "+254712345678",
  "mpesa_number": "+254712345678",
  "mpesa_verified": true,
  "shop_location": {
    "latitude": -1.2921,
    "longitude": 36.8219
  },
  "shop_address": "123 Main St, Nairobi",
  "category": "groceries",
  "verification_status": "verified",
  "is_active": true,
  "created_at": "2024-06-30T10:00:00Z"
}
```

### Update Seller Profile
```
PATCH /sellers/me
Content-Type: application/json

{
  "shop_name": "Fresh Groceries Store",
  "shop_address": "456 New St, Nairobi"
}

Response: 200 OK
{
  "id": "seller_123",
  "shop_name": "Fresh Groceries Store",
  ...
}
```

### Verify M-Pesa Number
```
POST /sellers/verify-mpesa
Content-Type: application/json

{
  "mpesa_number": "+254712345678"
}

Response: 200 OK
{
  "verified": true,
  "message": "M-Pesa number verified successfully"
}
```

### Get Seller Orders
```
GET /sellers/me/orders?status=pending&limit=20

Response: 200 OK
[
  {
    "id": "order_123",
    "customer_name": "Jane Smith",
    "items": [...],
    "total_amount": 1100,
    "seller_amount": 1000,
    "delivery_option": "delivery",
    "status": "pending",
    "payment_status": "pending",
    "customer_phone": "+254787654321",
    "created_at": "2024-06-30T10:00:00Z"
  }
]
```

### Get Seller Order Details
```
GET /sellers/me/orders/{order_id}

Response: 200 OK
{
  "id": "order_123",
  "customer_name": "Jane Smith",
  ...
}
```

### Update Seller Order Status
```
PATCH /sellers/me/orders/{order_id}
Content-Type: application/json

{
  "status": "pending" | "preparing" | "ready" | "completed" | "cancelled"
}

Response: 200 OK
{
  "id": "order_123",
  "status": "preparing",
  ...
}
```

### Confirm Payment Received
```
POST /sellers/me/orders/{order_id}/confirm-payment
Content-Type: application/json

{}

Response: 200 OK
{
  "message": "Payment confirmed",
  "mpesa_ref": "LK451H1IG0"
}
```

### Get Seller Earnings
```
GET /sellers/me/earnings?period=monthly

Response: 200 OK
{
  "total_earnings": 50000,
  "platform_fees": 5000,
  "net_earnings": 45000,
  "transactions": [
    {
      "date": "2024-06-30",
      "amount": 1000,
      "order_id": "order_123"
    }
  ]
}
```

### Request Withdrawal
```
POST /sellers/me/withdrawals
Content-Type: application/json

{
  "amount": 45000
}

Response: 201 Created
{
  "id": "withdrawal_123",
  "amount": 45000,
  "status": "pending",
  "message": "Withdrawal request submitted. You will receive the amount within 24 hours."
}
```

### Get Withdrawal History
```
GET /sellers/me/withdrawals

Response: 200 OK
[
  {
    "id": "withdrawal_123",
    "amount": 45000,
    "status": "completed",
    "date": "2024-06-30T10:00:00Z"
  }
]
```

---

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Error Codes

- **400 Bad Request** - Invalid input data
- **401 Unauthorized** - Missing or invalid authentication token
- **403 Forbidden** - User doesn't have permission to access this resource
- **404 Not Found** - Resource not found
- **409 Conflict** - Order status conflict (e.g., trying to mark completed order as pending)
- **422 Unprocessable Entity** - Validation error on input data
- **500 Internal Server Error** - Server error

---

## Payment Flow

1. **Create Order** → POST /orders
   - Returns `order_id` and `status: "payment_pending"`

2. **Initiate M-Pesa** → POST /payments/mpesa/initiate
   - Customer approves on their phone
   - M-Pesa sends callback to `/payments/mpesa/callback`

3. **Check Status** → GET /payments/{order_id}/status
   - Confirm payment is `completed`

4. **Automatic Payment Split**
   - System automatically sends:
     - Seller amount to seller's M-Pesa
     - Platform fee retained
     - Courier tip added if applicable

5. **Order Status Update**
   - System changes order status to `confirmed`
   - Seller notification sent

---

## Seller Workflow

1. **Register** → POST /sellers/register
2. **Verify M-Pesa** → POST /sellers/verify-mpesa
3. **Wait for Admin Approval** (verification_status: pending → verified)
4. **View Orders** → GET /sellers/me/orders
5. **Update Order Status** → PATCH /sellers/me/orders/{id}
6. **Confirm Payment** → POST /sellers/me/orders/{id}/confirm-payment
7. **View Earnings** → GET /sellers/me/earnings
8. **Request Withdrawal** → POST /sellers/me/withdrawals

---

## Implementation Notes

### Payment Splitting Logic
```
Customer Pays: 1100 KSh

// Automatic split:
Seller Net Price: 1000 KSh → Seller's M-Pesa
Platform Fee (10%): 100 KSh → Suqafuran
Courier Tip: 50 KSh → Rider

Total: 1150 KSh (if tip included)
```

### Seller Confirmation Requirement
- Seller MUST confirm payment before order status can change from `payment_pending`
- This ensures seller has received M-Pesa confirmation
- Prevents accidental item release without payment confirmation

### Issue Resolution
1. Customer reports issue with itemized proof
2. System creates issue record (status: under_review)
3. Admin/Seller reviews issue
4. Customer selects resolution: refund or replacement
5. System processes refund via M-Pesa or creates replacement order

---

## Database Schema Requirements

### Orders Table
```sql
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  seller_id VARCHAR(50) NOT NULL,
  status ENUM('pending', 'payment_pending', 'confirmed', 'preparing', 'ready_for_pickup', 'in_delivery', 'delivered', 'cancelled'),
  delivery_option ENUM('delivery', 'pickup'),
  delivery_address TEXT,
  phone_number VARCHAR(20),
  total_amount DECIMAL(10, 2),
  platform_fee DECIMAL(10, 2),
  seller_amount DECIMAL(10, 2),
  courier_tip DECIMAL(10, 2),
  payment_status ENUM('pending', 'completed', 'failed'),
  payment_reference VARCHAR(100),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE order_items (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50),
  title VARCHAR(255),
  quantity INT,
  price DECIMAL(10, 2),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE sellers (
  id VARCHAR(50) PRIMARY KEY,
  shop_name VARCHAR(255),
  owner_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  mpesa_number VARCHAR(20) UNIQUE,
  mpesa_verified BOOLEAN DEFAULT FALSE,
  shop_address TEXT,
  category VARCHAR(50),
  verification_status ENUM('pending', 'verified', 'rejected'),
  is_active BOOLEAN DEFAULT TRUE,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE payments (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2),
  status ENUM('pending', 'completed', 'failed'),
  mpesa_reference VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE issues (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  issue_type ENUM('item_mismatch', 'damaged', 'missing_items', 'other'),
  description TEXT,
  status ENUM('under_review', 'resolved', 'rejected'),
  resolution_type ENUM('refund', 'replacement'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

## Testing Checklist

- [ ] Create order with delivery option
- [ ] Create order with pickup option
- [ ] Initiate M-Pesa payment
- [ ] Verify payment callback handling
- [ ] Check payment splitting calculation
- [ ] Seller confirms payment
- [ ] Seller updates order status
- [ ] Customer rates delivery
- [ ] Customer reports issue
- [ ] Request resolution (refund/replacement)
- [ ] Seller registration flow
- [ ] M-Pesa verification
- [ ] Earnings calculation
- [ ] Withdrawal request

