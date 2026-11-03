from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from app.api import deps
from app.models.user import User
from app.services.recommendation_service import (
    get_similar_listings,
    get_personalized_recommendations,
)

router = APIRouter()


@router.get("/similar/{listing_id}", response_model=List[Any])
def similar_listings(
    *,
    db: Session = Depends(deps.get_db),
    listing_id: int,
    limit: int = Query(10, ge=1, le=50),
) -> Any:
    """
    Get similar listings based on category, price range, condition, location, and title keywords.
    """
    return get_similar_listings(db=db, listing_id=listing_id, limit=limit)


@router.get("/for-you", response_model=List[Any])
def recommendations_for_you(
    *,
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_current_user_optional),
    viewed_ids: Optional[str] = Query(None, description="Comma-separated list of viewed listing IDs for guests"),
    limit: int = Query(12, ge=1, le=50),
) -> Any:
    """
    Get personalized recommendations for the authenticated user or guest session.
    """
    guest_ids = []
    if viewed_ids:
        try:
            guest_ids = [int(x.strip()) for x in viewed_ids.split(",") if x.strip().isdigit()]
        except Exception:
            guest_ids = []

    user_id = current_user.id if current_user else None
    return get_personalized_recommendations(
        db=db,
        user_id=user_id,
        guest_viewed_ids=guest_ids,
        limit=limit,
    )

