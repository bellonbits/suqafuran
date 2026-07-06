"""M-Pesa Payment Integration"""
import logging
import requests
import base64
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Body
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


class MPesaService:
    """M-Pesa Daraja API Integration"""

    def __init__(self):
        # Check if credentials are configured
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


@router.post("/mpesa")
def initiate_mpesa_checkout(body: dict = Body(...)):
    """
    Initiate M-Pesa payment from checkout

    Body parameters:
    - phoneNumber: Customer phone number (required)
    - amount: Payment amount in KES (required)
    - orderId: Order ID (required) - if not provided, generates new one
    - items: Order items list
    - fulfillmentType: delivery or pickup
    - deliveryAddress: Delivery address
    - courierTip: Optional tip amount
    - userId: Authenticated user ID (optional - for guest checkout, a guest ID will be generated)
    """
    try:
        # Initialize database
        from app.core.config import settings
        from sqlalchemy import create_engine
        from sqlalchemy.orm import Session, sessionmaker
        from app.models.order import Order, OrderItem
        from app.models.user import User
        from datetime import datetime
        import uuid

        # Get database session
        try:
            engine = create_engine(settings.DATABASE_URL)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            db = SessionLocal()
        except Exception as e:
            logger.error(f"[M-Pesa] Database connection failed: {str(e)}")
            db = None

        # Initialize service on demand
        try:
            service = MPesaService()
        except (AttributeError, ValueError) as e:
            logger.warning(f"[M-Pesa] M-Pesa credentials not configured: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail="Payment service not configured. Please check M-Pesa settings."
            )

        phone_number = body.get('phoneNumber') or body.get('phone_number')
        amount = body.get('amount')
        order_id = body.get('orderId') or body.get('order_id')
        items = body.get('items', [])
        location = body.get('location')
        delivery_address = body.get('deliveryAddress', location)
        fulfillment_type = body.get('fulfillmentType', 'delivery')
        courier_tip = body.get('courierTip', 0)

        # Validation
        if not phone_number or not amount or not order_id:
            raise HTTPException(status_code=400, detail="Missing required fields: phoneNumber, amount, orderId")

        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")

        logger.info(f"[M-Pesa] Processing checkout: phone={phone_number}, amount={amount}, order={order_id}")

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
