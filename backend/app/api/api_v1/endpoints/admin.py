from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from app.api import deps
from app.models.listing import Listing, Category, ListingRead
from app.models.user import User
from app.models.promotion import Promotion, PromotionStatus

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
