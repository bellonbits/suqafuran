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
from app.services.email_service import email_service
from pydantic import BaseModel

router = APIRouter()

class RequestOtpIn(BaseModel):
    email: str

class RequestOtpOut(BaseModel):
    success: bool
    cooldown_seconds: int = 60

class VerifyOtpIn(BaseModel):
    email: str
    otp: str

class SignupIn(BaseModel):
    full_name: str
    email: str
    password: str

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
    success = email_service.send_verification_code(payload.email)
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
    existing = crud_user.get_user_by_email(db, email=payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    signup_data = {"full_name": payload.full_name, "email": payload.email, "password": payload.password}
    stored = email_service.store_pending_signup(payload.email, signup_data)
    if not stored:
        raise HTTPException(status_code=500, detail="Failed to store signup data. Please try again.")

    success = email_service.send_verification_code(payload.email)
    if not success:
        email_service.delete_pending_signup(payload.email)
        raise HTTPException(status_code=500, detail="Failed to send verification email. Please try again.")

    return {"success": True, "cooldown_seconds": 60}


@router.post("/verify-otp", response_model=AuthOut)
def verify_otp(
    response: Response,
    payload: VerifyOtpIn,
    db: Session = Depends(deps.get_db)
) -> Any:
    is_valid = email_service.check_verification_code(payload.email, payload.otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    user = crud_user.get_user_by_email(db, email=payload.email)

    if not user:
        signup_data = email_service.get_pending_signup(payload.email)
        if not signup_data:
            raise HTTPException(status_code=400, detail="Signup session expired. Please sign up again.")
        user = crud_user.create_user(
            db,
            email=signup_data["email"],
            password=signup_data["password"],
            full_name=signup_data["full_name"],
        )
        user.email_verified = True
        user.phone_verified = True
        user.verified_level = UserVerifiedLevel.phone
        db.add(user)
        db.add(AuditLog(
            user_id=user.id, action="USER_SIGNUP", resource_type="user",
            resource_id=user.id, details=f"New user: {user.full_name} ({user.email})"
        ))
        db.commit()
        db.refresh(user)
        email_service.delete_pending_signup(payload.email)
    else:
        user.email_verified = True
        user.phone_verified = True
        user.verified_level = UserVerifiedLevel.phone
        db.add(user)
        db.add(AuditLog(
            user_id=user.id, action="USER_LOGIN", resource_type="user",
            resource_id=user.id, details=f"User {user.full_name} logged in via email OTP"
        ))
        db.commit()
        db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(user.id, expires_delta=access_token_expires)

    response.set_cookie(
        key="access_token", value=access_token, httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax", secure=True,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.full_name, "email": user.email, "verified_level": user.verified_level}
    }
