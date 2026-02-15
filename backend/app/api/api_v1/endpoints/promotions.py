from datetime import datetime, timedelta
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.promotion import Promotion, PromotionPlan, PromotionStatus
from app.models.listing import Listing
from app.utils.code_generator import generate_promotion_code
from pydantic import BaseModel

router = APIRouter()

class PromotionCreateIn(BaseModel):
    listing_id: int
    plan_id: int

class PromotionSubmitIn(BaseModel):
    payment_proof: str # Transaction ID or reference

class PromotionApproveIn(BaseModel):
    plan_id: int  # Admin selects the promotion type

class PromotionRejectIn(BaseModel):
    reason: str

@router.get("/plans", response_model=List[PromotionPlan])
def get_plans(db: Session = Depends(deps.get_db)) -> Any:
    return db.exec(select(PromotionPlan)).all()

@router.post("/", response_model=Promotion)
def create_promotion_request(
    payload: PromotionCreateIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    promo = Promotion(
        listing_id=payload.listing_id,
        plan_id=payload.plan_id,
        status=PromotionStatus.PENDING
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo

@router.post("/{promo_id}/submit")
def submit_payment_proof(
    promo_id: int,
    payload: PromotionSubmitIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    statement = select(Promotion).where(Promotion.id == promo_id)
    promo = db.exec(statement).first()
    
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion request not found")
        
    promo.payment_proof = payload.payment_proof
    promo.status = PromotionStatus.SUBMITTED
    promo.updated_at = datetime.utcnow()
    
    db.add(promo)
    db.commit()
    return {"success": True}

# ===== ADMIN-ONLY ENDPOINTS =====

@router.get("/pending", response_model=List[Promotion])
def get_pending_promotions(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_admin_user)
) -> Any:
    """Admin-only: Get all pending/submitted promotions awaiting approval"""
    statement = select(Promotion).where(
        Promotion.status.in_([PromotionStatus.PENDING, PromotionStatus.SUBMITTED])
    )
    return db.exec(statement).all()

@router.post("/{promo_id}/approve")
def approve_promotion(
    promo_id: int,
    payload: PromotionApproveIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_admin_user)
) -> Any:
    """
    Admin-only: Approve promotion and generate unique code.
    
    Workflow:
    1. Admin manually checks mobile money payment
    2. Admin clicks "Generate Promotion Code"
    3. System generates unique code (YYYYMMDD-XXX-YYY)
    4. Admin selects promotion type (plan_id)
    5. System updates listing boost level and expiry
    6. Returns code for admin to send to seller
    """
    # Get promotion
    statement = select(Promotion).where(Promotion.id == promo_id)
    promo = db.exec(statement).first()
    
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    if promo.status == PromotionStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Promotion already approved")
    
    # Get promotion plan
    plan = db.get(PromotionPlan, payload.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Promotion plan not found")
    
    # Generate unique promotion code
    code = generate_promotion_code(db)
    
    # Update promotion
    promo.promotion_code = code
    promo.plan_id = payload.plan_id
    promo.status = PromotionStatus.APPROVED
    promo.approved_by = current_user.id
    promo.approved_at = datetime.utcnow()
    promo.expires_at = datetime.utcnow() + timedelta(days=plan.duration_days)
    promo.updated_at = datetime.utcnow()
    
    # Update listing boost level
    listing = db.get(Listing, promo.listing_id)
    if listing:
        # Map plan name to boost level (1=Standard, 2=Premium, 3=Diamond)
        boost_mapping = {
            "Standard": 1,
            "Premium": 2,
            "Diamond": 3
        }
        listing.boost_level = boost_mapping.get(plan.name, 1)
        listing.boost_expires_at = promo.expires_at
        db.add(listing)
    
    db.add(promo)
    db.commit()
    db.refresh(promo)
    
    return {
        "success": True,
        "promotion_code": code,
        "expires_at": promo.expires_at,
        "message": f"Promotion approved! Code: {code}"
    }

@router.post("/{promo_id}/reject")
def reject_promotion(
    promo_id: int,
    payload: PromotionRejectIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_admin_user)
) -> Any:
    """Admin-only: Reject promotion with reason"""
    statement = select(Promotion).where(Promotion.id == promo_id)
    promo = db.exec(statement).first()
    
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    promo.status = PromotionStatus.REJECTED
    promo.admin_notes = payload.reason
    promo.updated_at = datetime.utcnow()
    
    db.add(promo)
    db.commit()
    
    return {"success": True, "message": "Promotion rejected"}

@router.post("/admin/direct-promote")
def direct_promote(
    payload: PromotionCreateIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_admin_user)
) -> Any:
    """
    Admin-only: Directly promote a listing without a pre-existing request.
    Used for phone-initiated requests where payment is confirmed manually.
    """
    # 1. Verify listing exists
    listing = db.get(Listing, payload.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    # 2. Get promotion plan
    plan = db.get(PromotionPlan, payload.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Promotion plan not found")
        
    # 3. Create, approve, and generate code in one action
    code = generate_promotion_code(db)
    expires_at = datetime.utcnow() + timedelta(days=plan.duration_days)
    
    promo = Promotion(
        listing_id=payload.listing_id,
        plan_id=payload.plan_id,
        status=PromotionStatus.APPROVED,
        promotion_code=code,
        approved_by=current_user.id,
        approved_at=datetime.utcnow(),
        expires_at=expires_at,
        admin_notes="Directly initiated by admin (Simple Process)"
    )
    db.add(promo)
    
    # 4. Update listing boost status
    boost_mapping = {
        "Standard": 1,
        "Premium": 2,
        "Diamond": 3
    }
    listing.boost_level = boost_mapping.get(plan.name, 1)
    listing.boost_expires_at = expires_at
    db.add(listing)
    
    db.commit()
    db.refresh(promo)
    
    return {
        "success": True,
        "promotion_code": code,
        "listing_id": listing.id,
        "listing_title": listing.title,
        "status": "APPROVED",
        "message": f"Direct promotion active for {listing.title}! Code: {code}"
    }
