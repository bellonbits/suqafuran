import secrets
import string
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session
from app.api import deps
from app.crud import crud_user
from app.models.user import UserCreate, User, UserUpdate
from app.utils.email import send_verification_email
from app.utils.redis import set_verification_code, get_verification_code, delete_verification_code

router = APIRouter()


def generate_verification_code(length: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))


@router.post("/signup", response_model=User)
def create_user_signup(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate
) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    user = crud_user.create_user(db, user_in=user_in)
    
    # Generate and send verification code
    code = generate_verification_code()
    set_verification_code(user.email, code)
    send_verification_email(user.email, code)
    
    return user


@router.get("/me", response_model=User)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.get("/public/{user_id}", response_model=dict)
def read_user_public(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
) -> Any:
    """
    Get public information for a user.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"full_name": user.full_name, "id": user.id, "is_verified": user.is_verified}


@router.patch("/me", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update own user.
    """
    user = crud_user.update_user(db, db_obj=current_user, user_in=user_in)
    return user


@router.post("/verify-email")
def verify_email(
    *,
    db: Session = Depends(deps.get_db),
    email: str = Body(...),
    code: str = Body(...),
) -> Any:
    """
    Verify email with code.
    """
    stored_code = get_verification_code(email)
    if not stored_code or stored_code != code:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    
    user = crud_user.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    crud_user.verify_user(db, db_obj=user)
    delete_verification_code(email)
    
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
def resend_verification(
    *,
    db: Session = Depends(deps.get_db),
    email: str = Body(..., embed=True),
) -> Any:
    """
    Resend verification code.
    """
    user = crud_user.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return {"message": "Email is already verified"}
    
    code = generate_verification_code()
    set_verification_code(email, code)
    send_verification_email(email, code)
    
    return {"message": "Verification code resent"}


@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(deps.get_db),
    email: str = Body(..., embed=True),
) -> Any:
    """
    Send password reset code.
    """
    user = crud_user.get_user_by_email(db, email=email)
    if not user:
        # We don't want to leak if a user exists
        return {"message": "If an account exists with this email, a reset code has been sent"}
    
    code = generate_verification_code()
    from app.utils.redis import set_reset_token
    from app.utils.email import send_reset_password_email
    
    set_reset_token(email, code)
    send_reset_password_email(email, code)
    
    return {"message": "Password reset code sent"}


@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(deps.get_db),
    email: str = Body(...),
    code: str = Body(...),
    new_password: str = Body(...),
) -> Any:
    """
    Reset password using code.
    """
    from app.utils.redis import get_reset_token, delete_reset_token
    
    stored_code = get_reset_token(email)
    if not stored_code or stored_code != code:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    
    user = crud_user.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    crud_user.update_user(db, db_obj=user, user_in=UserUpdate(password=new_password))
    delete_reset_token(email)
    
    return {"message": "Password reset successfully"}
