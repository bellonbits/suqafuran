# Payment Simulation Testing Guide

## Quick Start

The payment system works without M-Pesa credentials by using simulation endpoints. Orders are created first, then you can simulate payment success/failure.

### Step 1: Get Authentication Token

```bash
curl -X POST http://localhost:8000/api/v1/admin/dev/token
# Returns: {"access_token": "...", "token_type": "bearer"}
```

### Step 2: Create an Order

```bash
TOKEN="your-token-here"

curl -X POST http://localhost:8000/api/v1/payments/mpesa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phoneNumber": "254712345678",
    "amount": 5000,
    "items": [
      {
        "id": "prod_1",
        "title": "Sample Product",
        "quantity": 1,
        "price": 5000
      }
    ],
    "location": "Nairobi",
    "fulfillmentType": "delivery"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Order created but payment service unavailable",
  "order_id": "ORD-abc123def456",
  "detail": "Payment service not configured."
}
```

✅ **Note:** Order is created successfully! The "unavailable" message is expected because M-Pesa credentials aren't configured. The `order_id` is what you need next.

### Step 3: Simulate Payment

#### Successful Payment
```bash
curl -X POST http://localhost:8000/api/v1/payments/mpesa/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-abc123def456",
    "success": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Payment completed for order ORD-abc123def456",
  "order_id": "ORD-abc123def456",
  "order_status": "confirmed",
  "payment_status": "completed",
  "mpesa_reference": "SIMORD-ABC1"
}
```

#### Failed Payment
```bash
curl -X POST http://localhost:8000/api/v1/payments/mpesa/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-abc123def456",
    "success": false
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Payment failed for order ORD-abc123def456",
  "order_id": "ORD-abc123def456",
  "order_status": "cancelled",
  "payment_status": "failed"
}
```

## Order Status Transitions

| Status | Meaning |
|--------|---------|
| `payment_pending` | Order created, awaiting payment |
| `confirmed` | Payment successful ✅ |
| `cancelled` | Payment failed ❌ |

## Payment Status Transitions

| Status | Meaning |
|--------|---------|
| `pending` | Initial state |
| `completed` | Payment successful ✅ |
| `failed` | Payment failed ❌ |

## Full Testing Flow

```bash
#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/admin/dev/token | jq -r '.access_token')

# Create order
ORDER_ID=$(curl -s -X POST http://localhost:8000/api/v1/payments/mpesa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phoneNumber": "254712345678",
    "amount": 5000,
    "items": [{"id": "1", "title": "Test", "quantity": 1, "price": 5000}]
  }' | jq -r '.order_id')

echo "Order created: $ORDER_ID"

# Simulate payment
curl -s -X POST http://localhost:8000/api/v1/payments/mpesa/simulate \
  -H "Content-Type: application/json" \
  -d "{\"order_id\": \"$ORDER_ID\", \"success\": true}" | jq .
```

## Frontend Integration

The frontend checkout page uses the same `/api/v1/payments/mpesa` endpoint. After order creation, users would normally enter their phone and confirm the payment on their device. For testing, use the simulate endpoint instead.

## Notes

- Orders are created **before** attempting M-Pesa connection
- This ensures no orders are lost even if payment service is unavailable
- Simulations update database state immediately (no async processing)
- Each simulation creates a test M-Pesa reference: `SIM{ORDER_ID_PREFIX}`
