from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile, Form
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
    """
    Submit a verification request with ID documents and a selfie.
    """
    # 1. Check pending request
    existing = db.exec(
        select(VerificationRequest)
        .where(VerificationRequest.user_id == current_user.id)
        .where(VerificationRequest.status == VerificationStatus.PENDING)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="A verification request is already pending")
    
    # 2. Upload Document Files
    import shutil
    import os
    from app.core.config import settings
    import uuid


    document_urls = []
    # Ensure upload dir exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    for file in document_files:
        extension = file.filename.split(".")[-1].lower()
        if extension not in settings.ALLOWED_EXTENSIONS:
            continue
        
        filename = f"{uuid.uuid4()}.{extension}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        document_urls.append(f"/api/v1/listings/images/{filename}")

    if not document_urls:
         raise HTTPException(status_code=400, detail="No valid document files uploaded")

    # 3. Upload Selfie
    selfie_filename = f"selfie_{uuid.uuid4()}.jpg"
    selfie_path = os.path.join(settings.UPLOAD_DIR, selfie_filename)
    
    with open(selfie_path, "wb") as f:
        shutil.copyfileobj(selfie_file.file, f)
    
    selfie_url = f"/api/v1/listings/images/{selfie_filename}"

    # 4. Perform Facial Recognition (Compare Selfie vs First Document) - REMOVED due to build complexity
    # Automatic facial recognition has been disabled to speed up deployment.
    # Requests will now be reviewed manually by administrators.
    
    # 5. Create Database Object
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
