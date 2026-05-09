from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.meeting_deal import Deal
from app.models.listing import Listing
from app.models.user import User
from app.services.trust_service import update_user_trust

router = APIRouter()

@router.post("/confirm")
def confirm_deal(
    *,
    db: Session = Depends(deps.get_db),
    deal_in: dict,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Mark a deal as confirmed by one party. 
    If both confirm, it becomes a 'Verified Transaction'.
    """
    listing_id = deal_in.get("listing_id")
    other_user_id = deal_in.get("other_user_id")
    
    if not listing_id or not other_user_id:
        raise HTTPException(status_code=400, detail="Missing listing_id or other_user_id")
    
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Find or create deal
    # A deal involves listing_id, buyer_id, seller_id
    buyer_id = current_user.id if listing.owner_id != current_user.id else other_user_id
    seller_id = listing.owner_id
    
    deal = db.exec(
        select(Deal).where(
            Deal.listing_id == listing_id,
            Deal.buyer_id == buyer_id,
            Deal.seller_id == seller_id
        )
    ).first()
    
    if not deal:
        deal = Deal(
            listing_id=listing_id,
            buyer_id=buyer_id,
            seller_id=seller_id,
            outcome="pending"
        )
        db.add(deal)
        db.commit()
        db.refresh(deal)
    
    # Mark confirmation
    if current_user.id == deal.buyer_id:
        deal.buyer_confirmed = True
    elif current_user.id == deal.seller_id:
        deal.seller_confirmed = True
        
    if deal.buyer_confirmed and deal.seller_confirmed:
        deal.outcome = "bought"
        # Trigger Trust Score Update for both
        buyer = db.get(User, deal.buyer_id)
        seller = db.get(User, deal.seller_id)
        if buyer: update_user_trust(buyer, db)
        if seller: update_user_trust(seller, db)
        
    db.add(deal)
    db.commit()
    db.refresh(deal)
    
    return {"message": "Confirmation recorded", "verified": deal.buyer_confirmed and deal.seller_confirmed}
