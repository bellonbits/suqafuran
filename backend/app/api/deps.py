from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlmodel import Session, select

from app.core import security
from app.core.config import settings
from app.db.session import Session as DbSession, engine
from app.models.user import User
from app.core.limiter import limiter
import structlog

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token",
    auto_error=False
)


def get_db() -> Generator:
    with DbSession(engine) as session:
        yield session


def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(reusable_oauth2),
    request: Request = Depends()
) -> User:
    # Try getting token from: cookie → header → query param
    if request:
        token = request.cookies.get("access_token") or token or request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = payload.get("sub")
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.get(User, token_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Bind user context to logs
    structlog.contextvars.bind_contextvars(
        user_id=user.id,
        user_email=user.email,
        is_admin=user.is_admin
    )
    
    # Layer 1.1: Capture Signals
    changed = False
    if request:
        fingerprint = request.headers.get("X-Device-Fingerprint")
        if fingerprint and user.device_fingerprint != fingerprint:
            user.device_fingerprint = fingerprint
            changed = True
        
        ip = request.client.host
        if ip and user.last_ip != ip:
            user.last_ip = ip
            changed = True
            
    if changed:
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def get_current_user_optional(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(reusable_oauth2),
    request: Request = Depends()
) -> Optional[User]:
    # Try getting token from cookie first
    if request:
        token = request.cookies.get("access_token") or token
    
    if not token:
        return None
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = payload.get("sub")
        if not token_data:
            return None
    except (jwt.JWTError, ValidationError):
        return None
    
    user = db.get(User, token_data)
    if user:
        structlog.contextvars.bind_contextvars(
            user_id=user.id,
            user_email=user.email,
            is_admin=user.is_admin
        )
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_active_agent(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_agent and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user

# Alias for admin endpoints
get_current_admin_user = get_current_active_superuser
get_current_agent_user = get_current_active_agent
get_current_active_admin = get_current_active_superuser
