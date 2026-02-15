from datetime import datetime
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.trust import Rating, Report
from app.models.meeting_deal import Meeting, Deal
from app.models.interaction import Interaction
from app.models.listing import Listing
from pydantic import BaseModel

router = APIRouter()

class PendingActions(BaseModel):
    meetings: List[dict]
    deals: List[dict]

@router.get("/pending", response_model=PendingActions)
def get_pending_trust_actions(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    # 1. Fetch Interactions that might lead to a meeting
    # For MVP, we'll look at interactions involving the current user in the last 7 days
    interactions = db.exec(
        select(Interaction, Listing)
        .join(Listing, Interaction.listing_id == Listing.id)
        .where(
            (Interaction.buyer_id == current_user.id) | (Listing.owner_id == current_user.id)
        )
    ).all()

    pending_meetings = []
    seen_pairs = set()

    for interaction, listing in interactions:
        seller_id = listing.owner_id
        buyer_id = interaction.buyer_id
        pair_key = (listing.id, buyer_id, seller_id)
        
        if pair_key in seen_pairs:
            continue
        seen_pairs.add(pair_key)

        # Check if meeting already exists and if user already responded
        meeting = db.exec(
            select(Meeting).where(
                Meeting.listing_id == listing.id,
                Meeting.buyer_id == buyer_id,
                Meeting.seller_id == seller_id
            )
        ).first()

        is_pending = False
        if not meeting:
            is_pending = True
            meeting_id = interaction.id # Virtual ID based on interaction for tracking
            # We'll prefix with "virtual_" to distinguish or just use interaction.id
            # Frontend trustService expects a number, so we'll use interaction.id
        else:
            meeting_id = meeting.id
            if current_user.id == buyer_id and not meeting.buyer_response:
                is_pending = True
            elif current_user.id == seller_id and not meeting.seller_response:
                is_pending = True

        if is_pending:
            pending_meetings.append({
                "id": meeting_id, # This ID is used for respondToMeeting
                "listing_id": listing.id,
                "listing_title": listing.title,
                "other_user_id": seller_id if current_user.id == buyer_id else buyer_id,
                "type": "meeting"
            })

    # 2. Fetch Deals where meeting was confirmed YES but no Deal record exists
    from app.models.meeting_deal import MeetingResponse
    meetings_confirmed = db.exec(
        select(Meeting, Listing)
        .join(Listing, Meeting.listing_id == Listing.id)
        .where(
            Meeting.buyer_response == "yes",
            Meeting.seller_response == "yes",
            (Meeting.buyer_id == current_user.id) | (Meeting.seller_id == current_user.id)
        )
    ).all()

    pending_deals = []
    for meeting, listing in meetings_confirmed:
        # Check if Deal already exists
        deal = db.exec(
            select(Deal).where(
                Deal.listing_id == listing.id,
                Deal.buyer_id == meeting.buyer_id,
                Deal.seller_id == meeting.seller_id
            )
        ).first()

        if not deal:
            pending_deals.append({
                "id": meeting.id, # Use Meeting ID for deal response prompt
                "listing_id": listing.id,
                "listing_title": listing.title,
                "type": "deal"
            })

    return {
        "meetings": pending_meetings,
        "deals": pending_deals
    }

class RatingCreateIn(BaseModel):
    deal_id: int
    rated_user_id: int
    score: int
    comment: Optional[str] = None

class ReportCreateIn(BaseModel):
    listing_id: Optional[int] = None
    reason: str
    description: Optional[str] = None

@router.post("/ratings", response_model=Rating)
def create_rating(
    payload: RatingCreateIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    rating = Rating(
        deal_id=payload.deal_id,
        rater_id=current_user.id,
        rated_user_id=payload.rated_user_id,
        score=payload.score,
        comment=payload.comment
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating

@router.post("/reports", response_model=Report)
def create_report(
    payload: ReportCreateIn,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    report = Report(
        listing_id=payload.listing_id,
        reporter_id=current_user.id,
        reason=payload.reason,
        description=payload.description
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
