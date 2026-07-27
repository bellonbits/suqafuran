from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.listing import Listing
from app.services.trust_service import trust_service
from pydantic import BaseModel

router = APIRouter()

class DealConfirm(BaseModel):
    listing_id: int
    other_user_id: int

@router.post("/confirm")
def confirm_deal(
    *,
    db: Session = Depends(deps.get_db),
    deal_in: DealConfirm,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Confirm a successful deal between two users.
    Both users get a trust score boost for successful platform interactions.
    """
    listing = db.query(Listing).filter(Listing.id == deal_in.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
        
    other_user = db.query(User).filter(User.id == deal_in.other_user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="Other user not found")
        
    # Security: Ensure current user is part of this conversation
    # In a real system, we'd check if a conversation exists between them
    
    # 1. Boost Trust Scores
    trust_service.update_trust_score(db, current_user.id, 50, "Successful deal completion")
    trust_service.update_trust_score(db, other_user.id, 50, "Successful deal completion")
    
    # 2. Mark Listing as Closed
    listing.status = "closed"
    db.add(listing)
    
    db.commit()
    
    return {"status": "success", "message": "Deal confirmed! Trust scores updated."}
