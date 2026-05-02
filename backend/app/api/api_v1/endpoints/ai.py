from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List, Any
from app.services.ai_service import ai_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


# ─── Request/Response Models ──────────────────────────────────────────────────

class GenerateListingRequest(BaseModel):
    title: str
    category: Optional[str] = None
    attributes: Optional[dict] = None
    target_language: Optional[str] = "en"
    type: Optional[str] = "description"   # "title" | "description" | "translate"

class ModerationRequest(BaseModel):
    text: str
    image_urls: Optional[List[str]] = []

class ParseSearchRequest(BaseModel):
    query: str

class PriceRecommendationRequest(BaseModel):
    title: str
    category_id: Optional[int] = None
    condition: Optional[str] = "Used"
    currency: Optional[str] = "USD"

class PredictCategoryRequest(BaseModel):
    title: str
    description: Optional[str] = ""

class ChatSuggestionsRequest(BaseModel):
    conversation_id: Optional[int] = None
    messages: Optional[List[dict]] = []
    role: Optional[str] = "buyer"

class ParseListingRequest(BaseModel):
    text: str

class RecommendationsRequest(BaseModel):
    category_id: Optional[int] = None
    limit: Optional[int] = 10
    user_history: Optional[List[Any]] = []

class DemandInsightsRequest(BaseModel):
    category_id: Optional[int] = None
    location: Optional[str] = "Nairobi"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/listings/generate")
def generate_listing_text(body: GenerateListingRequest):
    """Generate AI-enhanced listing title or description."""
    result = ai_service.generate_listing_text(
        type=body.type,
        input_text=body.title,
        target_language=body.target_language,
        category=body.category,
        attributes=body.attributes,
    )
    return {"result": result}


@router.post("/moderation/check")
def check_moderation(body: ModerationRequest):
    """Check listing text for scam, fraud or inappropriate content."""
    listing_data = {"title_en": body.text, "description_en": body.text}
    result = ai_service.check_moderation(listing_data)
    return result


@router.post("/search/parse")
def parse_search(body: ParseSearchRequest):
    """Convert natural language query into structured search filters."""
    result = ai_service.parse_search_query(body.query)
    return result


@router.post("/listings/price-recommendation")
def price_recommendation(body: PriceRecommendationRequest):
    """Return a suggested price range for a listing."""
    listing_data = {
        "title_en": body.title,
        "category": body.category_id,
        "condition": body.condition,
        "currency": body.currency,
    }
    result = ai_service.get_price_recommendation(listing_data)
    return result


@router.post("/listings/predict-category")
def predict_category(body: PredictCategoryRequest):
    """Predict the best category for a listing."""
    result = ai_service.predict_category(body.title, body.description)
    return result


@router.post("/chat/suggestions")
def chat_suggestions(body: ChatSuggestionsRequest):
    """Generate smart reply suggestions for a chat conversation."""
    result = ai_service.generate_chat_suggestions(
        messages=body.messages,
        role=body.role,
    )
    return result


@router.get("/seller/score/{user_id}")
def seller_score(user_id: int):
    """Calculate and return a trust/seller score for a user."""
    result = ai_service.calculate_seller_score(
        user_data={"id": user_id},
        history=[],
    )
    return result


@router.post("/insights/demand")
def demand_insights(body: DemandInsightsRequest):
    """Get market demand insights for a category/location."""
    result = ai_service.get_demand_insights(
        location=body.location or "Nairobi",
        category=str(body.category_id) if body.category_id else "General",
    )
    return result


@router.post("/listings/parse")
def parse_listing(body: ParseListingRequest):
    """
    10-Second Listing: convert raw text (e.g. 'iPhone 12 50k Nairobi')
    into a structured listing object ready to prefill the form.
    """
    result = ai_service.parse_listing(body.text)
    # Normalize fields to match frontend expectations
    title = result.get("title", body.text)
    return {
        "title_en": title,
        "title_so": title,
        "description_en": f"Selling: {title}. {result.get('condition', 'Used')} condition. Contact me for more details.",
        "description_so": f"Waan iibinayaa: {title}. Xaalad: {result.get('condition', 'La isticmaalay')}. Ila soo xiriir.",
        "price": result.get("price"),
        "currency": result.get("currency", "USD"),
        "condition": result.get("condition", "Used"),
        "location": result.get("location"),
        "category_slug": result.get("category_slug"),
    }


@router.post("/recommendations")
def get_recommendations(body: RecommendationsRequest):
    """Get personalized listing recommendations."""
    result = ai_service.get_recommended_listings(
        user_history=body.user_history or [],
    )
    return result
