from datetime import datetime, timedelta
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select
from app.api import deps
from app.core import security
from app.core.config import settings
from app.crud import crud_user
from app.models.otp import OTP
from app.models.user import User, UserVerifiedLevel
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
def request_otp(
    payload: RequestOtpIn,
    db: Session = Depends(deps.get_db)
) -> Any:
    # 1. Generate OTP
    code = OTP.generate_code()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # 2. Save OTP
    otp_obj = OTP(phone=payload.phone, code=code, expires_at=expires_at)
    db.add(otp_obj)
    db.commit()
    
    # 3. Simulate SMS sending
    print(f"SMS sent to {payload.phone}: Code is {code}")
    
    return {"success": True, "cooldown_seconds": 60}

@router.post("/signup", response_model=RequestOtpOut)
def signup(
    payload: SignupIn,
    db: Session = Depends(deps.get_db)
) -> Any:
    # 1. Check if user exists
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

    # 2. Create User
    user = crud_user.create_user(
        db, 
        phone=payload.phone, 
        password=payload.password, 
        full_name=payload.full_name,
        email=payload.email
    )

    # 3. Generate & Send OTP
    code = OTP.generate_code()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    otp_obj = OTP(phone=payload.phone, code=code, expires_at=expires_at)
    db.add(otp_obj)
    db.commit()
    
    print(f"SMS sent to {payload.phone}: Code is {code}")
    
    return {"success": True, "cooldown_seconds": 60}

@router.post("/verify-otp", response_model=AuthOut)
def verify_otp(
    response: Response,
    payload: VerifyOtpIn,
    db: Session = Depends(deps.get_db)
) -> Any:
    # 1. Find valid OTP
    statement = select(OTP).where(
        OTP.phone == payload.phone,
        OTP.code == payload.otp,
        OTP.is_used == False,
        OTP.expires_at > datetime.utcnow()
    )
    otp_obj = db.exec(statement).first()
    
    if not otp_obj:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # 2. Mark OTP as used
    otp_obj.is_used = True
    db.add(otp_obj)
    
    # 3. Get or create user (Handle verification)
    user = crud_user.get_user_by_phone(db, phone=payload.phone)
    if not user:
        # Fallback for old flow or implicit signup (maybe disallowed now?)
        # For now, let's allow it but we need a password... 
        # Actually, if we want strict password flow, we should fail here?
        # User requested: "place details in sign in page then verify... then login using verified mobile and password"
        # Since we can't create a password here, we must assume user exists from signup.
        # But for backward compatibility with existing tasks/tests, maybe we generate a random one or error.
        # Let's Error to enforce the new flow.
        raise HTTPException(status_code=400, detail="User not found. Please sign up first.")
    
    if not user.is_verified:
        user.is_verified = True
        user.verified_level = UserVerifiedLevel.phone
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # 4. Generate token
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
