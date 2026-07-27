from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api import deps
from app.models.interaction import Interaction, InteractionType
from pydantic import BaseModel

router = APIRouter()

class InteractionCreateIn(BaseModel):
    listing_id: int
    type: InteractionType

@router.post("/", response_model=Interaction)
def create_interaction(
    payload: InteractionCreateIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    db_obj = Interaction(
        listing_id=payload.listing_id,
        buyer_id=current_user.id,
        type=str(payload.type.value).lower()
    )
    db.add(db_obj)
    
    # Increment leads on the listing
    from app.models.listing import Listing
    listing = db.get(Listing, payload.listing_id)
    if listing:
        listing.leads += 1
        db.add(listing)
        
    db.commit()
    db.refresh(db_obj)
    return db_obj
