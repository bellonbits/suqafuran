from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional
import requests
import base64
from datetime import datetime

from database import get_db
from models import Payment, Order, User, Seller
from schemas import MPesaPaymentRequest, PaymentStatusResponse, RefundRequest
from config import settings

router = APIRouter(prefix="/payments", tags=["payments"])

# M-Pesa Daraja Integration
class MPesaService:
    def __init__(self):
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.business_shortcode = settings.MPESA_BUSINESS_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY
        self.environment = settings.MPESA_ENVIRONMENT
        self.callback_url = settings.MPESA_CALLBACK_URL
        self.base_url = "https://sandbox.safaricom.co.ke" if self.environment == "sandbox" else "https://api.safaricom.co.ke"

    def get_access_token(self):
        url = f"{self.base_url}/oauth/v1/generate"
        response = requests.get(
            url,
            auth=(self.consumer_key, self.consumer_secret),
            timeout=10
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        raise Exception("Failed to get M-Pesa access token")

    def initiate_stk_push(self, phone_number: str, amount: float, order_id: str, account_reference: str):
        access_token = self.get_access_token()

        # Remove '+' and convert to format M-Pesa expects
        phone = phone_number.replace("+", "").lstrip("0")
        if not phone.startswith("254"):
            phone = "254" + phone[1:]

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
        return response.json()

mpesa_service = MPesaService()

@router.post("/mpesa/initiate")
def initiate_mpesa_payment(
    payment_data: MPesaPaymentRequest,
    db: Session = Depends(get_db)
):
    # Get order
    order = db.query(Order).filter(Order.id == payment_data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if payment already exists
    existing_payment = db.query(Payment).filter(Payment.order_id == payment_data.order_id).first()
    if existing_payment and existing_payment.status == "completed":
        raise HTTPException(status_code=400, detail="Payment already completed")

    try:
        # Initiate STK push
        result = mpesa_service.initiate_stk_push(
            payment_data.phone_number,
            payment_data.amount,
            payment_data.order_id,
            payment_data.account_reference
        )

        if result.get("ResponseCode") == "0":
            # Create/update payment record
            payment = Payment(
                order_id=payment_data.order_id,
                amount=payment_data.amount,
                status="pending",
                merchant_request_id=result.get("MerchantRequestID"),
                checkout_request_id=result.get("CheckoutRequestID")
            )
            db.add(payment)
            db.commit()
            db.refresh(payment)

            return {
                "success": True,
                "merchant_request_id": result.get("MerchantRequestID"),
                "checkout_request_id": result.get("CheckoutRequestID"),
                "response_code": result.get("ResponseCode"),
                "response_description": result.get("ResponseDescription"),
                "customer_message": result.get("CustomerMessage")
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("ResponseDescription", "Payment initiation failed"))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mpesa/callback", include_in_schema=False)
def mpesa_callback(db: Session = Depends(get_db)):
    # This would be called by M-Pesa service
    # Implement proper callback handling
    return {"success": True}

@router.post("/mpesa/callback", include_in_schema=False)
def mpesa_callback_post(body: dict = Body(...), db: Session = Depends(get_db)):
    """
    M-Pesa callback endpoint for STK push responses
    """
    try:
        stk_callback = body.get("Body", {}).get("stkCallback", {})
        checkout_request_id = stk_callback.get("CheckoutRequestID")
        result_code = stk_callback.get("ResultCode")

        # Find payment by checkout_request_id
        payment = db.query(Payment).filter(
            Payment.checkout_request_id == checkout_request_id
        ).first()

        if not payment:
            return {"success": False, "message": "Payment not found"}

        if result_code == 0:
            # Payment successful
            metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])
            mpesa_ref = None
            amount = None

            for item in metadata:
                if item.get("Name") == "MpesaReceiptNumber":
                    mpesa_ref = item.get("Value")
                elif item.get("Name") == "Amount":
                    amount = item.get("Value")

            # Update payment status
            payment.status = "completed"
            payment.mpesa_reference = mpesa_ref
            payment.updated_at = datetime.utcnow()

            # Update order status
            order = db.query(Order).filter(Order.id == payment.order_id).first()
            if order:
                order.payment_status = "completed"
                order.payment_reference = mpesa_ref
                order.status = "confirmed"
                order.updated_at = datetime.utcnow()

            db.commit()
            return {"success": True, "message": "Payment processed"}
        else:
            # Payment failed
            payment.status = "failed"
            payment.updated_at = datetime.utcnow()

            order = db.query(Order).filter(Order.id == payment.order_id).first()
            if order:
                order.payment_status = "failed"
                order.status = "cancelled"

            db.commit()
            return {"success": True, "message": "Payment failed"}

    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/{order_id}/status", response_model=PaymentStatusResponse)
def check_payment_status(
    order_id: str,
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return {
        "order_id": payment.order_id,
        "status": payment.status,
        "amount": payment.amount,
        "mpesa_reference": payment.mpesa_reference,
        "payment_method": "mpesa",
        "created_at": payment.created_at,
        "updated_at": payment.updated_at
    }

@router.post("/{order_id}/refund")
def refund_payment(
    order_id: str,
    refund_data: RefundRequest,
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.status != "completed":
        raise HTTPException(status_code=400, detail="Can only refund completed payments")

    refund_amount = refund_data.amount or payment.amount

    # Create refund record
    # TODO: Implement M-Pesa refund API call
    payment.status = "refunded"
    payment.updated_at = datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "refund_reference": f"REF{payment.id}",
        "amount": refund_amount
    }
