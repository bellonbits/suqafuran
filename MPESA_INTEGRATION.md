# M-Pesa Integration Guide

Complete guide for M-Pesa payment processing and rider withdrawal system.

## Overview

- **STK Push**: For customer order payments
- **B2C Payments**: For rider earnings withdrawals
- **Callbacks**: Webhook processing for transaction status
- **Status Queries**: Check payment and withdrawal status

## Architecture

```
Rider Withdrawal Flow:
┌──────────────────┐
│ Rider requests   │
│ withdrawal       │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Validate amount  │
│ Check balance    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Send B2C payment │
│ to M-Pesa        │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ M-Pesa processes │
│ payment          │
└────────┬─────────┘
         ↓
┌──────────────────────────────────┐
│ M-Pesa sends callback webhook    │
│ with transaction result          │
└────────┬───────────────────────┘
         ↓
┌──────────────────┐
│ Update withdrawal│
│ status & record  │
│ transaction ID   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Send SMS to rider│
│ confirmation     │
└──────────────────┘
```

## Setup

### 1. Get M-Pesa Credentials

**Sandbox (Testing)**
- Go to: https://developer.safaricom.co.ke
- Create an account
- Create a new application
- Get Consumer Key & Consumer Secret
- Note the Business Shortcode and Passkey

**Production**
- Contact Safaricom M-Pesa team
- Provide business documentation
- Get production credentials

### 2. Environment Configuration

```bash
# .env or environment variables

# M-Pesa Credentials
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORTCODE=174379  # Test shortcode
MPESA_PASSKEY=bfb279f9ba9b9d1ddb224758a0c55aefc78c6d18c329df8235221ee8b7f6a49e

# URLs
MPESA_ENVIRONMENT=sandbox  # or production
MPESA_CALLBACK_URL=https://yourdomain.com/api/v1/mpesa/callback
```

### 3. Install Dependencies

```bash
pip install requests
```

## API Endpoints

### 1. Initiate Withdrawal

**Endpoint**: `POST /api/v1/riders/me/withdrawals`

**Request**:
```json
{
  "amount": 1000,
  "method": "mpesa"
}
```

**Response**:
```json
{
  "success": true,
  "withdrawal_id": "with_123abc",
  "amount": 1000,
  "method": "mpesa",
  "status": "pending",
  "requested_date": "2026-07-04T10:30:00Z"
}
```

### 2. Withdrawal Callback

**Endpoint**: `POST /api/v1/mpesa/callback`

Receives M-Pesa B2C payment callback

### 3. Query Withdrawal Status

**Endpoint**: `GET /api/v1/riders/me/withdrawals/{withdrawal_id}`

## Usage Examples

### Python Backend Integration

```python
from services.mpesa_service import get_mpesa_service
from sqlalchemy.orm import Session

def process_withdrawal(withdrawal_id: str, amount: float, phone: str, db: Session):
    """Process rider withdrawal"""
    mpesa = get_mpesa_service()

    # Format phone number
    formatted_phone = mpesa.format_phone_number(phone)

    if not mpesa.validate_phone_number(formatted_phone):
        raise ValueError("Invalid phone number")

    # Send B2C payment
    success, message, transaction_id = mpesa.send_b2c_payment(
        amount=amount,
        phone_number=formatted_phone,
        withdrawal_id=withdrawal_id
    )

    if success:
        # Update withdrawal status
        withdrawal = db.query(RiderWithdrawal).filter(
            RiderWithdrawal.id == withdrawal_id
        ).first()

        if withdrawal:
            withdrawal.status = WithdrawalStatus.PENDING
            withdrawal.transaction_id = transaction_id
            db.commit()

        return True, "Withdrawal initiated"
    else:
        return False, message
```

### Handle Callback

```python
from services.mpesa_callback_handler import MPesaCallbackHandler
from fastapi import Request, HTTPException

@app.post("/api/v1/mpesa/callback")
async def mpesa_callback(request: Request, db: Session = Depends(get_db)):
    """M-Pesa callback webhook"""
    body = await request.json()

    # Validate signature (production)
    # if not MPesaCallbackHandler.validate_callback_signature(body, settings.MPESA_WEBHOOK_SECRET):
    #     raise HTTPException(status_code=403, detail="Invalid signature")

    # Determine callback type
    if "stkCallback" in body.get("Body", {}):
        # STK Push callback (customer payment)
        MPesaCallbackHandler.handle_stk_push_callback(body, db)
    elif "Result" in body:
        # B2C callback (rider withdrawal)
        MPesaCallbackHandler.handle_b2c_callback(body, db)

    return {"ResultCode": 0}
```

## Testing

### Sandbox Testing

```bash
# Test credentials already provided
MPESA_CONSUMER_KEY=nHpup1nZANXGztfBz1dQrDor6KSTjPpnFGI4UfCnGIGcF7rI
MPESA_CONSUMER_SECRET=28qOXen3l4pTnDKlXFmG0ed1T2mALPhJ0eayhUEMx06wB0XN9lU7CrwT9ZcZSwp8

# Test phone numbers (use any valid format)
254712345678  # Safaricom
254722345678  # Safaricom
254730123456  # Safaricom
```

### Test Withdrawal Flow

```python
import requests
from datetime import datetime

# 1. Get access token
auth_response = requests.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    auth=("consumer_key", "consumer_secret")
)
access_token = auth_response.json()["access_token"]

# 2. Send B2C payment
import base64
timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
password = base64.b64encode(
    f"{BUSINESS_SHORTCODE}{PASSKEY}{timestamp}".encode()
).decode()

payload = {
    "OriginatorConversationID": f"WITHDRAWAL_test_{timestamp}",
    "InitiatorName": "SUQAFURAN",
    "CommandID": "BusinessPayment",
    "Amount": 100,
    "PartyA": "174379",
    "PartyB": "254712345678",
    "Remarks": "Withdrawal test"
}

response = requests.post(
    "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
    json=payload,
    headers={"Authorization": f"Bearer {access_token}"}
)

print(response.json())
```

## Error Handling

### Common Errors

| Code | Meaning | Solution |
|------|---------|----------|
| 1 | Insufficient Funds | Check M-Pesa account balance |
| 2 | Less than minimum | Minimum withdrawal KSh 500 |
| 3 | More than maximum | Check daily limits |
| 4 | Daily limit exceeded | Retry next day |
| 8 | Unresolved recipient | Validate phone number |
| 9 | Duplicate transaction | Check for duplicate ID |

### Retry Strategy

```python
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3)
)
def send_withdrawal_with_retry(withdrawal_id, amount, phone):
    """Send withdrawal with automatic retry"""
    mpesa = get_mpesa_service()
    success, message, transaction_id = mpesa.send_b2c_payment(
        amount=amount,
        phone_number=phone,
        withdrawal_id=withdrawal_id
    )

    if not success:
        raise Exception(message)

    return transaction_id
```

## Webhook Security

### Signature Validation (Production)

```python
import hmac
import hashlib

def validate_mpesa_webhook(body: dict, webhook_secret: str) -> bool:
    """Validate M-Pesa webhook signature"""
    signature = body.get("Signature")

    # Reconstruct signature
    callback_json = json.dumps(body, separators=(',', ':'), sort_keys=True)
    expected_signature = hmac.new(
        webhook_secret.encode(),
        callback_json.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)
```

### IP Whitelisting

M-Pesa callbacks come from these IPs (sandbox):
- 196.3.96.0 - 196.3.99.255
- 192.108.239.0 - 192.108.239.255

```python
# Middleware to check IP
from fastapi import Request, HTTPException

async def validate_mpesa_ip(request: Request, call_next):
    """Validate request comes from M-Pesa"""
    client_ip = request.client.host
    mpesa_ips = [
        "196.3.96.0/21",  # Safaricom
        "192.108.239.0/24"
    ]

    # In production, check IP against CIDR ranges
    # For now, accept all in sandbox
    return await call_next(request)
```

## Monitoring

### Log M-Pesa Transactions

```python
import logging

logger = logging.getLogger("mpesa")

def log_transaction(
    transaction_id: str,
    rider_id: str,
    amount: float,
    status: str,
    response: dict
):
    """Log M-Pesa transaction"""
    logger.info(
        f"M-Pesa Transaction | "
        f"ID: {transaction_id} | "
        f"Rider: {rider_id} | "
        f"Amount: {amount} | "
        f"Status: {status}"
    )
```

### Alert on Failures

```python
def alert_withdrawal_failure(withdrawal_id: str, reason: str):
    """Alert team on withdrawal failure"""
    # Send to Slack/Email
    message = f"Withdrawal {withdrawal_id} failed: {reason}"

    # TODO: Send alert to monitoring system
    logger.error(message)
```

## Production Checklist

- [ ] Update to production credentials
- [ ] Update callback URLs to production domain
- [ ] Enable signature validation
- [ ] Set up IP whitelisting
- [ ] Enable logging and monitoring
- [ ] Test with real M-Pesa account
- [ ] Set up alerts for failures
- [ ] Document support contact info
- [ ] Train support team on process
- [ ] Set up daily reconciliation

## Troubleshooting

### Callbacks Not Being Received

```bash
# 1. Verify callback URL is correct
echo $MPESA_CALLBACK_URL

# 2. Check firewall/network
curl -I https://yourdomain.com/api/v1/mpesa/callback

# 3. Check application logs
tail -f /var/log/app/mpesa.log

# 4. Test callback manually
curl -X POST https://yourdomain.com/api/v1/mpesa/callback \
  -H "Content-Type: application/json" \
  -d '{"test": "callback"}'
```

### Token Expiry Issues

```python
# Ensure token is refreshed
def get_valid_token():
    mpesa = get_mpesa_service()
    if not mpesa._ensure_token():
        raise Exception("Failed to get M-Pesa token")
    return mpesa.access_token
```

## Resources

- [Safaricom M-Pesa API Docs](https://developer.safaricom.co.ke/apis)
- [Daraja Documentation](https://developer.safaricom.co.ke/docs)
- [M-Pesa Error Codes](https://developer.safaricom.co.ke/docs/error-codes)

---

**Status**: Ready for Implementation ✅  
**Last Updated**: July 4, 2026  
**Maintainer**: Backend Team
