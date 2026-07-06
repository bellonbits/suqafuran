"""M-Pesa Payment Integration with Order Creation"""
import logging
import requests
import base64
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Body, Header, Depends
from jose import jwt
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core import security
from app.api import deps

# Import models from legacy structure
import sys
sys.path.insert(0, '/Users/mac/suqafuran/backend')
from models import Order, OrderItem, OrderStatus, Payment
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


class MPesaService:
    """M-Pesa Daraja API Integration"""

    def __init__(self):
        if not hasattr(settings, 'MPESA_CONSUMER_KEY') or not settings.MPESA_CONSUMER_KEY:
            raise ValueError("M-Pesa credentials not configured")

        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.business_shortcode = settings.MPESA_BUSINESS_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY
        self.environment = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox')
        self.callback_url = settings.MPESA_CALLBACK_URL
        self.base_url = "https://sandbox.safaricom.co.ke" if self.environment == "sandbox" else "https://api.safaricom.co.ke"

    def get_access_token(self):
        """Get M-Pesa access token"""
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        try:
            response = requests.get(
                url,
                auth=(self.consumer_key, self.consumer_secret),
                timeout=10,
                verify=True
            )
            if response.status_code == 200:
                return response.json()["access_token"]
            else:
                raise Exception(f"M-Pesa auth failed: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"Failed to get M-Pesa access token: {str(e)}")
            raise Exception(f"Failed to get M-Pesa access token: {str(e)}")

    def initiate_stk_push(self, phone_number: str, amount: float, order_id: str, account_reference: str):
        """Initiate M-Pesa STK push"""
        try:
            access_token = self.get_access_token()

            # Format phone number: remove +, leading 0, ensure 254 prefix
            phone = phone_number.replace("+", "").lstrip("0")
            if not phone.startswith("254"):
                phone = "254" + phone

            logger.info(f"[MPesaService] Formatted phone: {phone_number} -> {phone}")

            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            password_string = f"{self.business_shortcode}{self.passkey}{timestamp}"
            password = base64.b64encode(password_string.encode()).decode()

            url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
            headers = {"Authorization": f"Bearer {access_token}"}
            payload = {
                "BusinessShortCode": self.business_shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(amount),
                "PartyA": phone,
                "PartyB": self.business_shortcode,
                "PhoneNumber": phone,
                "CallBackURL": self.callback_url,
                "AccountReference": account_reference,
                "TransactionDesc": f"Payment for order {order_id}"
            }

            response = requests.post(url, json=payload, headers=headers, timeout=10)
            result = response.json()

            logger.info(f"[MPesaService] STK Push Response: {result}")
            return result
        except Exception as e:
            logger.error(f"[MPesaService] Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Payment initiation failed: {str(e)}")


def extract_user_id_from_token(authorization: Optional[str]) -> Optional[str]:
    """Extract user ID from JWT token in Authorization header"""
    if not authorization:
        return None

    try:
        # Format: "Bearer <token>"
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        token = parts[1]
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id = decoded.get("sub")
        return str(user_id) if user_id else None
    except Exception as e:
        logger.warning(f"Failed to extract user ID from token: {str(e)}")
        return None


@router.post("/mpesa")
def initiate_mpesa_checkout(
    body: dict = Body(...),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(deps.get_db)
):
    """
    Initiate M-Pesa payment from checkout and create order

    Body parameters:
    - phoneNumber: Customer phone number (required)
    - amount: Payment amount in KES (required)
    - items: Order items list
    - fulfillmentType: delivery or pickup
    - deliveryAddress: Delivery address
    - courierTip: Optional tip amount
    """
    try:
        # Extract parameters first
        phone_number = body.get('phoneNumber') or body.get('phone_number')
        amount = body.get('amount')
        items = body.get('items', [])
        location = body.get('location')
        delivery_address = body.get('deliveryAddress', location)
        fulfillment_type = body.get('fulfillmentType', 'delivery')
        courier_tip = body.get('courierTip', 0)

        # Validation
        if not phone_number or not amount:
            raise HTTPException(status_code=400, detail="Missing required fields: phoneNumber, amount")

        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")

        # Extract authenticated user ID from JWT token
        user_id = extract_user_id_from_token(authorization)
        if not user_id:
            user_id = f"guest_{uuid.uuid4().hex[:8]}"

        # Generate order ID
        order_id = f"ORD-{uuid.uuid4().hex[:12]}"

        logger.info(f"[M-Pesa] Processing checkout: phone={phone_number}, amount={amount}, order={order_id}, user={user_id}")

        # CREATE ORDER FIRST (before M-Pesa service initialization)
        try:
            order = Order(
                id=order_id,
                user_id=user_id,
                seller_id="guest-seller",
                status=OrderStatus.PAYMENT_PENDING,
                delivery_option=fulfillment_type,
                delivery_address=delivery_address or "Current Location",
                phone_number=phone_number,
                total_amount=amount,
                platform_fee=amount * 0.1,
                seller_amount=amount * 0.9,
                courier_tip=courier_tip,
                payment_status="pending",
                payment_method="mpesa",
                location_lat=0.0,
                location_lng=0.0
            )
            db.add(order)
            db.flush()

            # Add order items
            for item in items:
                order_item = OrderItem(
                    id=str(uuid.uuid4()),
                    order_id=order_id,
                    product_id=str(item.get('id', '')),
                    title=item.get('title', ''),
                    quantity=item.get('quantity', 1),
                    price=float(item.get('price', 0))
                )
                db.add(order_item)

            # Create payment record
            payment = Payment(
                id=str(uuid.uuid4()),
                order_id=order_id,
                amount=amount,
                status="pending",
                mpesa_reference=None,
                merchant_request_id=None,
                checkout_request_id=None
            )
            db.add(payment)
            db.commit()

            logger.info(f"[M-Pesa] ✅ Order created: {order_id} for user {user_id}")

        except Exception as db_error:
            db.rollback()
            logger.error(f"[M-Pesa] Error creating order: {str(db_error)}")
            raise HTTPException(status_code=500, detail=f"Error creating order: {str(db_error)}")

        # NOW try to initialize M-Pesa service
        try:
            service = MPesaService()
        except (AttributeError, ValueError) as e:
            logger.warning(f"[M-Pesa] M-Pesa credentials not configured: {str(e)}")
            # Order was created, but M-Pesa service unavailable
            return {
                "success": False,
                "message": "Order created but payment service unavailable",
                "order_id": order_id,
                "detail": "Payment service not configured. Please check M-Pesa settings."
            }

        # Initiate STK push
        result = service.initiate_stk_push(
            phone_number=phone_number,
            amount=amount,
            order_id=order_id,
            account_reference=order_id
        )

        # Check response
        if result.get("ResponseCode") == "0":
            return {
                "success": True,
                "message": "Payment initiated successfully",
                "order_id": order_id,
                "checkout_request_id": result.get("CheckoutRequestID"),
                "mpesa_response": result
            }
        else:
            error_message = result.get("ResponseDescription", "Unknown error")
            logger.warning(f"[M-Pesa] STK Push failed: {error_message}")
            raise HTTPException(status_code=400, detail=f"Payment initiation failed: {error_message}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[M-Pesa] Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment processing error")


@router.get("/mpesa/callback", include_in_schema=False)
def mpesa_callback_get():
    """M-Pesa callback endpoint (GET)"""
    return {"status": "ok"}


@router.post("/mpesa/callback", include_in_schema=False)
def mpesa_callback_post(body: dict = Body(...)):
    """
    M-Pesa callback endpoint
    Receives payment status updates from M-Pesa
    """
    try:
        logger.info(f"[M-Pesa Callback] Received: {body}")

        # Parse the callback
        result_code = body.get("Body", {}).get("stkCallback", {}).get("ResultCode")

        if result_code == 0:
            # Payment successful
            logger.info("[M-Pesa] Payment successful")
        else:
            # Payment failed
            logger.warning(f"[M-Pesa] Payment failed with code: {result_code}")

        return {"ResultCode": 0, "ResultDesc": "Received successfully"}
    except Exception as e:
        logger.error(f"[M-Pesa Callback] Error: {str(e)}")
        return {"ResultCode": 1, "ResultDesc": "Error processing callback"}


@router.post("/mpesa/simulate")
def simulate_mpesa_payment(body: dict = Body(...)):
    """
    Simulate M-Pesa payment (for testing)

    This endpoint simulates an M-Pesa payment by generating a callback
    """
    try:
        checkout_request_id = body.get("CheckoutRequestID")
        result_code = body.get("ResultCode", 0)

        if not checkout_request_id:
            raise HTTPException(status_code=400, detail="CheckoutRequestID required")

        logger.info(f"[M-Pesa Simulate] Simulating payment: {checkout_request_id}")

        # Return mock response
        return {
            "success": True,
            "message": "Payment simulation initiated",
            "checkout_request_id": checkout_request_id,
            "result_code": result_code
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[M-Pesa Simulate] Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment simulation error")
