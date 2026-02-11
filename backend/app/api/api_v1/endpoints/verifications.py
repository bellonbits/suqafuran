from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User
from app.models.verification import (
    VerificationRequest, 
    VerificationRequestBase, 
    VerificationStatus,
    VerificationRequestRead
)

router = APIRouter()

@router.post("/apply", response_model=VerificationRequest)
def apply_for_verification(
    *,
    db: Session = Depends(deps.get_db),
    verification_in: VerificationRequestBase,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Submit a verification request.
    """
    # Check if a pending request already exists
    existing = db.exec(
        select(VerificationRequest)
        .where(VerificationRequest.user_id == current_user.id)
        .where(VerificationRequest.status == VerificationStatus.PENDING)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="A verification request is already pending")
    
    db_obj = VerificationRequest.model_validate(
        verification_in, update={"user_id": current_user.id}
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/me", response_model=Optional[VerificationRequest])
def get_my_verification_status(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user's verification status.
    """
    return db.exec(
        select(VerificationRequest)
        .where(VerificationRequest.user_id == current_user.id)
        .order_by(VerificationRequest.created_at.desc())
    ).first()

@router.get("/", response_model=List[VerificationRequestRead])
def list_verification_requests(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    (Admin) List all verification requests.
    """
    return db.exec(select(VerificationRequest).offset(skip).limit(limit)).all()

@router.patch("/{id}", response_model=VerificationRequest)
def update_verification_status(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    status: VerificationStatus = Body(..., embed=True),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    (Admin) Approve or reject a verification request.
    """
    request = db.get(VerificationRequest, id)
    if not request:
        raise HTTPException(status_code=404, detail="Verification request not found")
    
    request.status = status
    db.add(request)
    
    # If approved, update user's verification status
    if status == VerificationStatus.APPROVED:
        user = db.get(User, request.user_id)
        if user:
            user.is_verified = True
            db.add(user)
            
    db.commit()
    db.refresh(request)
    return request
