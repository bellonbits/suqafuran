from datetime import datetime, timedelta
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlmodel import Session, select
from app.api import deps
from app.core import security
from app.core.config import settings
from app.crud import crud_user
from app.models.user import User, UserVerifiedLevel
from app.models.audit import AuditLog
from app.services.africastalking_service import africastalking_service
from pydantic import BaseModel

router = APIRouter()

class RequestOtpIn(BaseModel):
    phone: str

class RequestOtpOut(BaseModel):
    success: bool
    cooldown_seconds: int = 60

class VerifyOtpIn(BaseModel):
    phone: str
    otp: str
    # full_name removed from here as it should be in signup only, 
    # but keeping it optional for backward compatibility if needed, 
    # though strictly we should move to signup flow.
    full_name: Optional[str] = None 

class SignupIn(BaseModel):
    full_name: str
    phone: str
    password: str
    email: Optional[str] = None

class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Any

@router.post("/request-otp", response_model=RequestOtpOut)
@deps.limiter.limit("5/minute")
def request_otp(
    request: Request,
    payload: RequestOtpIn,
    db: Session = Depends(deps.get_db)
) -> Any:
    # Use Africa's Talking
    success = africastalking_service.send_verification_code(payload.phone)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification code. Please try again later."
        )
    
    return {"success": True, "cooldown_seconds": 60}

@router.post("/signup", response_model=RequestOtpOut)
@deps.limiter.limit("3/minute")
def signup(
    request: Request,
    payload: SignupIn,
    db: Session = Depends(deps.get_db)
) -> Any:
    # 1. Check if user already exists
    user = crud_user.get_user_by_phone(db, phone=payload.phone)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this phone number already exists in the system.",
        )
    if payload.email:
        user_by_email = crud_user.get_user_by_email(db, email=payload.email)
        if user_by_email:
            raise HTTPException(
                status_code=400,
                detail="The user with this email already exists in the system.",
            )

    # 2. Store signup data in Redis (NOT in database yet)
    signup_data = {
        "full_name": payload.full_name,
        "phone": payload.phone,
        "password": payload.password,
        "email": payload.email
    }
    stored = africastalking_service.store_pending_signup(payload.phone, signup_data)
    if not stored:
        print(f"[Signup] FAILED to store pending signup for {payload.phone}")
        raise HTTPException(
            status_code=500,
            detail="Failed to store signup data. Please try again."
        )

    print(f"[Signup] Stored pending data for {payload.phone}. Proceeding to OTP...")

    # 3. Send OTP
    success = africastalking_service.send_verification_code(payload.phone)
    if not success:
        africastalking_service.delete_pending_signup(payload.phone)
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification code. Please try again."
        )
    
    return {"success": True, "cooldown_seconds": 60}

@router.post("/verify-otp", response_model=AuthOut)
def verify_otp(
    response: Response,
    payload: VerifyOtpIn,
    db: Session = Depends(deps.get_db)
) -> Any:
    # 1. Check code with Africa's Talking
    is_valid = africastalking_service.check_verification_code(payload.phone, payload.otp)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # 2. Check if this is a new signup or existing user login
    user = crud_user.get_user_by_phone(db, phone=payload.phone)
    
    if not user:
        # This is a new signup - retrieve pending signup data
        signup_data = africastalking_service.get_pending_signup(payload.phone)
        
        if not signup_data:
            raise HTTPException(
                status_code=400, 
                detail="Signup session expired. Please sign up again."
            )
        
        # Create user with verified status
        print(f"[Verify] Creating NEW USER in DB for {payload.phone}")
        user = crud_user.create_user(
            db,
            phone=signup_data["phone"],
            password=signup_data["password"],
            full_name=signup_data["full_name"],
            email=signup_data.get("email")
        )
        
        # Mark as verified immediately
        user.phone_verified = True
        user.is_verified = True
        user.verified_level = UserVerifiedLevel.phone
        db.add(user)
        # Audit log for signup
        signup_log = AuditLog(
            user_id=user.id,
            action="USER_SIGNUP",
            resource_type="user",
            resource_id=user.id,
            details=f"New user registered: {user.full_name} ({user.phone})"
        )
        db.add(signup_log)
        db.commit()
        db.refresh(user)
        print(f"[Verify] Successfully created user {user.id}")
        
        # Clean up pending signup data
        africastalking_service.delete_pending_signup(payload.phone)
    else:
        print(f"[Verify] Existing user {user.id} logged in via OTP")
        # Existing user - just mark as verified
        user.phone_verified = True
        user.is_verified = True
        user.verified_level = UserVerifiedLevel.phone
        db.add(user)
        # Audit log for login
        login_log = AuditLog(
            user_id=user.id,
            action="USER_LOGIN",
            resource_type="user",
            resource_id=user.id,
            details=f"User {user.full_name} logged in via OTP ({user.phone})"
        )
        db.add(login_log)
        db.commit()
        db.refresh(user)
    
    # 3. Generate token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.full_name,
            "phone": user.phone,
            "verified_level": user.verified_level
        }
    }
