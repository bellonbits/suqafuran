from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile, Form
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.api import deps
from app.models.user import User
from app.models.verification import (
    VerificationRequest,
    VerificationStatus,
    VerificationRequestRead
)
from app.services.storage_service import storage_service

router = APIRouter()

@router.post("/apply", response_model=VerificationRequest)
async def apply_for_verification(
    *,
    db: Session = Depends(deps.get_db),
    # verification_in: VerificationRequestBase, # Cannot use Pydantic model with Form/File mix easily in FastAPI
    document_type: str = Form(...),
    notes: Optional[str] = Form(None),
    document_files: List[UploadFile] = File(...),
    selfie_file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Submit a verification request with ID documents and a selfie."""

    existing = db.exec(
        select(VerificationRequest)
        .where(VerificationRequest.user_id == current_user.id)
        .where(VerificationRequest.status == VerificationStatus.PENDING)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A verification request is already pending")

    # Upload document files via storage_service (Cloudinary)
    document_urls = []
    for file in document_files:
        if not file.filename:
            continue
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ["jpg", "jpeg", "png", "pdf"]:
            continue
        content = await file.read()
        url = await storage_service.upload_file(content, file.filename)
        document_urls.append(url)

    if not document_urls:
        raise HTTPException(status_code=400, detail="No valid document files uploaded")

    # Upload selfie via storage_service (Cloudinary)
    selfie_content = await selfie_file.read()
    selfie_url = await storage_service.upload_file(
        selfie_content, selfie_file.filename or "selfie.jpg"
    )

    db_obj = VerificationRequest(
        user_id=current_user.id,
        document_type=document_type,
        notes=notes,
        status=VerificationStatus.PENDING,
        document_urls=document_urls,
        selfie_url=selfie_url,
        facial_match_score=0.0,
        auto_verification_status="manual_review"
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
    requests = db.exec(
        select(VerificationRequest)
        .order_by(VerificationRequest.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    result = []
    for req in requests:
        user = db.get(User, req.user_id)
        data = req.dict()
        if user:
            data["user"] = {
                "full_name": user.full_name,
                "phone": user.phone,
                "email": user.email,
                "is_verified": user.is_verified,
                "avatar_url": user.avatar_url,
            }
        result.append(data)
    return result

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
        from app.models.user import UserVerifiedLevel
        user = db.get(User, request.user_id)
        if user:
            user.is_verified = True
            user.verified_level = UserVerifiedLevel.id
            db.add(user)
            
    db.commit()
    db.refresh(request)
    return request
