from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ShoppingIntentType(str):
    SEARCH = "search"
    COMPARE = "compare"
    BUDGET_QUERY = "budget_query"
    SELLER_DISCOVERY = "seller_discovery"
    PRODUCT_ALTERNATIVE = "product_alternative"
    CLARIFICATION = "clarification"
    GENERAL = "general"


class ExtractedQueryParams(BaseModel):
    category_id: Optional[int] = None
    category_slug: Optional[str] = None
    clean_keywords: str = ""
    brand: Optional[str] = None
    condition: Optional[str] = None  # New, Used, Refurbished
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    currency: str = "KES"
    location: Optional[str] = None
    required_specs: Dict[str, Any] = Field(default_factory=dict)
    intended_use: Optional[str] = None
    is_budget_query: bool = False
    is_compare_query: bool = False
    compare_product_ids: List[int] = Field(default_factory=list)


class ShopperProductItem(BaseModel):
    id: int
    title: str
    price: float
    compare_at_price: Optional[float] = None
    currency: str = "KES"
    condition: Optional[str] = "Used"
    location: Optional[str] = "Kenya"
    image: Optional[str] = None
    seller_id: int
    seller_name: str
    is_verified: bool = False
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    recommendation_reason: Optional[str] = None
    match_score: float = 0.0
    directed_message: str = ""
    listing_url: str = ""
    chat_url: str = ""


class ShopperSellerItem(BaseModel):
    id: int
    name: str
    slug: str
    avatar_url: Optional[str] = None
    location: str = "Nairobi"
    is_verified: bool = False
    listing_count: int = 0
    top_categories: List[str] = Field(default_factory=list)
    shop_url: str = ""


class ProductComparisonDimension(BaseModel):
    dimension_name: str
    values: Dict[int, Any]  # product_id -> value
    winner_product_id: Optional[int] = None
    note: Optional[str] = None


class ProductComparisonResult(BaseModel):
    product_ids: List[int]
    products: List[ShopperProductItem]
    dimensions: List[ProductComparisonDimension]
    strengths_and_limitations: Dict[int, Dict[str, List[str]]]  # product_id -> {strengths: [], limitations: []}
    overall_verdict: str
    best_value_product_id: Optional[int] = None


# ─── API Request & Response Schemas ──────────────────────────────────────────

class ChatMessagePayload(BaseModel):
    role: str = "user"  # user, assistant, system
    content: str
    created_at: Optional[datetime] = None


class AIShopperChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    history: List[ChatMessagePayload] = Field(default_factory=list)
    location_preference: Optional[str] = None
    max_price: Optional[float] = None
    currency: str = "KES"


class AIShopperSearchRequest(BaseModel):
    query: str
    category_id: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    location: Optional[str] = None
    condition: Optional[str] = None
    limit: int = 10


class AIShopperCompareRequest(BaseModel):
    product_ids: List[int]
    user_criteria: Optional[str] = None


class AIShopperChatResponse(BaseModel):
    conversation_id: str
    intent: str = "general"
    understood: Optional[ExtractedQueryParams] = None
    extracted_params: Optional[ExtractedQueryParams] = None
    message: str
    products: List[ShopperProductItem] = Field(default_factory=list)
    comparison: Optional[ProductComparisonResult] = None
    sellers: List[ShopperSellerItem] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)
    filters_applied: Dict[str, Any] = Field(default_factory=dict)
    is_fallback: bool = False


class AIShopperSearchResponse(BaseModel):
    query: str
    total_found: int = 0
    total_matches: int = 0
    extracted_params: Optional[ExtractedQueryParams] = None
    products: List[ShopperProductItem] = Field(default_factory=list)
    sellers: List[ShopperSellerItem] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    is_fallback: bool = False


class ShopperCompareResponse(BaseModel):
    comparison: Optional[ProductComparisonResult] = None


class AIShopperSuggestionsResponse(BaseModel):
    popular_prompts: List[str]
    category_suggestions: List[Dict[str, str]]
    budget_presets: List[Dict[str, Any]]


# Clean aliases across the ai_shopper service and API endpoints
ShopperChatRequest = AIShopperChatRequest
ShopperSearchRequest = AIShopperSearchRequest
ShopperCompareRequest = AIShopperCompareRequest
ShopperChatResponse = AIShopperChatResponse
ShopperSearchResponse = AIShopperSearchResponse
ComparisonResult = ProductComparisonResult
IntentType = ShoppingIntentType

