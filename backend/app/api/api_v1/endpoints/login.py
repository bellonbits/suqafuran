from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel
from sqlmodel import Session
from app.api import deps
from app.core import security
from app.core.config import settings
from app.crud import crud_user

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login/access-token")
def login_access_token(
    response: Response,
    credentials: LoginRequest,
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    JSON login endpoint, get an access token for future requests
    """
    user = crud_user.authenticate(
        db, email=credentials.email, password=credentials.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    elif not user.email_verified:
        raise HTTPException(
            status_code=400,
            detail="Email not verified. Please check your inbox for the verification code."
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
        }
    }
