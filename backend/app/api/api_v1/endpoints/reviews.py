from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.review import Review, ReviewCreate, ReviewResponse
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[Review])
def list_reviews(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """
    List reviews for the current seller's products (paginated).
    """
    statement = (
        select(Review)
        .where(Review.seller_id == current_user.id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    reviews = db.exec(statement).all()
    return reviews


@router.post("", response_model=Review)
def create_review(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    review_in: ReviewCreate,
) -> Any:
    """
    Create a new verified review for a seller's listing.
    Only buyers who had a real in-app conversation or completed deal on that listing can leave a review.
    """
    from app.models.listing import Listing
    from app.models.message import Message
    from app.models.meeting_deal import Deal

    listing = db.get(Listing, review_in.product_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot review your own listing")

    # Verify that the buyer had in-app conversation or deal on this ad
    has_chatted = db.exec(
        select(Message).where(
            Message.listing_id == listing.id,
            ((Message.sender_id == current_user.id) & (Message.receiver_id == listing.owner_id)) |
            ((Message.receiver_id == current_user.id) & (Message.sender_id == listing.owner_id))
        )
    ).first()

    has_deal = db.exec(
        select(Deal).where(
            Deal.listing_id == listing.id,
            Deal.buyer_id == current_user.id,
            Deal.seller_id == listing.owner_id
        )
    ).first()

    if not has_chatted and not has_deal and not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Verified review restriction: You can only review sellers after chatting about this item."
        )

    # Check for duplicate review from this user on this listing
    existing_review = db.exec(
        select(Review).where(
            Review.product_id == listing.id,
            Review.seller_id == listing.owner_id,
            Review.customer_name == (current_user.full_name or "Buyer")
        )
    ).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already submitted a review for this listing.")

    review = Review(
        product_id=listing.id,
        seller_id=listing.owner_id,
        customer_name=current_user.full_name or "Buyer",
        rating=review_in.rating,
        comment=review_in.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.post("/{review_id}/response", response_model=Review)
def add_seller_response(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    review_id: int,
    response_in: ReviewResponse,
) -> Any:
    """
    Add a seller response to a review.
    """
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this review")

    review.response = response_in.response
    review.responded_at = datetime.utcnow()

    db.add(review)
    db.commit()
    db.refresh(review)
    return review
