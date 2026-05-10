from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from pydantic import BaseModel
from app.api import deps
from app.models.listing import Listing, Category, ListingRead
from app.models.user import User
from app.models.promotion import Promotion, PromotionStatus
from app.models.audit import AuditLog

router = APIRouter()


@router.get("/stats", response_model=dict)
def read_admin_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Get platform statistics.
    """
    total_users = db.exec(select(func.count(User.id))).one()
    total_listings = db.exec(select(func.count(Listing.id))).one()
    active_listings = db.exec(select(func.count(Listing.id)).where(Listing.status == "active")).one()
    pending_listings = db.exec(select(func.count(Listing.id)).where(Listing.status == "pending")).one()
    pending_promotions = db.exec(select(func.count(Promotion.id)).where(Promotion.status == PromotionStatus.SUBMITTED)).one()
    
    return {
        "total_users": total_users,
        "total_listings": total_listings,
        "active_listings": active_listings,
        "pending_listings": pending_listings,
        "pending_promotions": pending_promotions,
    }


@router.get("/queue", response_model=List[ListingRead])
def read_moderation_queue(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get listings awaiting moderation.
    """
    statement = select(Listing).where(Listing.status == "pending").offset(skip).limit(limit)
    listings = db.exec(statement).all()
    return listings


@router.post("/moderate/{listing_id}", response_model=Listing)
def moderate_listing(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    listing_id: int,
    approve: bool = True,
) -> Any:
    """
    Approve or reject a listing.
    """
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing.status = "active" if approve else "rejected"
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.get("/users", response_model=List[User])
def read_users_admin(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    List all users (Admin only).
    """
    statement = select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
    users = db.exec(statement).all()
    return users

class AgentEmailIn(BaseModel):
    email: str

@router.get("/agents", response_model=List[dict])
def list_agents(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    agents = db.exec(select(User).where(User.is_agent == True).order_by(User.created_at.desc())).all()
    return [{"id": u.id, "full_name": u.full_name, "email": u.email, "phone": u.phone, "created_at": u.created_at.isoformat()} for u in agents]

@router.post("/agents/add")
def add_agent(
    payload: AgentEmailIn,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    user = db.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email.")
    if user.is_agent:
        raise HTTPException(status_code=400, detail="This user is already an agent.")
    user.is_agent = True
    db.add(user)
    db.commit()
    return {"success": True, "name": user.full_name, "email": user.email}

@router.post("/agents/remove")
def remove_agent(
    payload: AgentEmailIn,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    user = db.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email.")
    user.is_agent = False
    db.add(user)
    db.commit()
    return {"success": True}

@router.post("/users/{user_id}/status")
def update_user_status(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    user_id: int,
    is_active: bool,
) -> Any:
    """
    Deactivate or activate a user account.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = is_active
    db.add(user)
    
    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="USER_STATUS_UPDATE",
        resource_type="user",
        resource_id=user_id,
        details=f"User {'activated' if is_active else 'deactivated'}"
    ))
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user_admin(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
    user_id: int,
) -> Any:
    """
    Permanently delete a user account.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    
    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="USER_DELETE",
        resource_type="user",
        resource_id=user_id,
        details="User permanently deleted"
    ))
    
    db.commit()
    return {"success": True}
