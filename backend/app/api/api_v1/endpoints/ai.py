from typing import Any
from fastapi import APIRouter, Depends, Request
from app.api import deps
from app.models.user import User
from app.services.ai_service import ai_service
from app.core.limiter import limiter

router = APIRouter()

@router.post("/listings/generate")
@limiter.limit("10/minute")
async def generate_ai_text(
    *,
    request: Request,
    payload: dict,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Generate or improve listing content using AI.
    """
    result = ai_service.generate_listing_text(
        type=payload.get("type"),
        input_text=payload.get("input"),
        target_language=payload.get("target_language", "en"),
        category=payload.get("category"),
        attributes=payload.get("attributes"),
    )
    return {"output": result}

@router.post("/moderation/check")
@limiter.limit("5/minute")
async def check_ai_moderation(
    *,
    request: Request,
    payload: dict,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Check listing for scam, fraud or safety risks.
    """
    return ai_service.check_moderation(payload)

@router.post("/search/parse")
@limiter.limit("20/minute")
async def parse_ai_search(
    *,
    request: Request,
    payload: dict,
) -> Any:
    """
    Parse natural language search query.
    """
    return ai_service.parse_search_query(payload.get("query", ""))

@router.post("/listings/price-recommendation")
@limiter.limit("10/minute")
async def get_ai_price_recommendation(
    *,
    request: Request,
    payload: dict,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get price recommendation for a listing.
    """
    return ai_service.get_price_recommendation(payload)

@router.post("/listings/predict-category")
@limiter.limit("20/minute")
async def predict_ai_category(
    *,
    request: Request,
    payload: dict,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Predict category for a listing title.
    """
    return ai_service.predict_category(payload.get("title", ""), payload.get("description", ""))

@router.post("/chat/suggestions")
@limiter.limit("30/minute")
async def get_ai_chat_suggestions(
    *,
    request: Request,
    payload: dict,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get suggested replies for a chat.
    """
    return ai_service.generate_chat_suggestions(payload.get("messages", []), payload.get("role", "buyer"))

@router.get("/seller/score/{user_id}")
async def get_ai_seller_score(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Calculate trust score for a seller.
    """
    from app import crud
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get basic history (e.g., number of listings, age)
    history = {
        "listing_count": len(user.listings),
        "is_active": user.is_active,
    }
    
    return ai_service.calculate_seller_score(
        {"full_name": user.full_name, "created_at": str(user.created_at), "is_verified": user.is_verified},
        [history]
    )

@router.post("/insights/demand")
async def get_ai_demand_insights(
    payload: dict,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get market demand insights.
    """
    return ai_service.get_demand_insights(
        location=payload.get("location", "Nairobi"),
        category=payload.get("category", "General")
    )

@router.post("/listings/parse")
@limiter.limit("5/minute")
async def parse_ai_listing(
    *,
    request: Request,
    payload: dict,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Parse natural language listing description into structured data.
    """
    return ai_service.parse_listing(payload.get("input", ""))

@router.post("/recommendations")
async def get_ai_recommendations(
    payload: dict,
) -> Any:
    """
    Get personalized recommendations.
    """
    return ai_service.get_recommended_listings(payload.get("history", []))
