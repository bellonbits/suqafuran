from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.meeting_deal import Deal, DealOutcome, Meeting
from pydantic import BaseModel

router = APIRouter()

class DealRespondIn(BaseModel):
    outcome: DealOutcome

@router.post("/{meeting_id}/respond", response_model=Deal)
def respond_deal(
    meeting_id: int,
    payload: DealRespondIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Ensure current user is part of the meeting
    if current_user.id not in [meeting.buyer_id, meeting.seller_id]:
         raise HTTPException(status_code=403, detail="Not authorized to respond to this deal")

    # Check if deal already exists
    statement = select(Deal).where(
        Deal.listing_id == meeting.listing_id,
        Deal.buyer_id == meeting.buyer_id,
        Deal.seller_id == meeting.seller_id
    )
    deal = db.exec(statement).first()

    if not deal:
        deal = Deal(
            listing_id=meeting.listing_id,
            buyer_id=meeting.buyer_id,
            seller_id=meeting.seller_id,
            outcome=payload.outcome.value
        )
    else:
        deal.outcome = payload.outcome.value
        
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal
