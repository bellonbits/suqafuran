from typing import List, Dict, Any, Optional
from sqlmodel import Session
from app.services.ai_shopper.schemas import (
    ShopperChatRequest,
    ShopperChatResponse,
    ShopperSearchRequest,
    ShopperSearchResponse,
    ShopperCompareRequest,
    ShopperCompareResponse,
    ExtractedQueryParams,
)
from app.services.ai_shopper.orchestrator import process_shopping_message
from app.services.ai_shopper.query_parser import parse_shopping_query
from app.services.ai_shopper.retrieval import retrieve_marketplace_listings, retrieve_marketplace_sellers
from app.services.ai_shopper.recommendation_engine import rank_products
from app.services.ai_shopper.product_comparison import compare_products
from app.services.ai_shopper.conversation import ConversationManager


class AIShopperService:
    @staticmethod
    def chat(db: Session, request: ShopperChatRequest) -> ShopperChatResponse:
        return process_shopping_message(db=db, request=request)

    @staticmethod
    def search(db: Session, request: ShopperSearchRequest) -> ShopperSearchResponse:
        params = parse_shopping_query(request.query)
        # Apply explicit overrides if provided
        if request.max_price is not None:
            params.max_price = request.max_price
        if request.min_price is not None:
            params.min_price = request.min_price
        if request.location:
            params.location = request.location
        if request.condition:
            params.condition = request.condition

        retrieved_prods, is_fallback = retrieve_marketplace_listings(db, params, limit=request.limit)
        ranked = rank_products(retrieved_prods, params)
        sellers = retrieve_marketplace_sellers(db, params.clean_keywords or request.query, limit=4)

        return ShopperSearchResponse(
            query=request.query,
            total_matches=len(ranked),
            is_fallback=is_fallback,
            extracted_params=params,
            products=ranked,
            sellers=sellers,
        )

    @staticmethod
    def compare(db: Session, request: ShopperCompareRequest) -> ShopperCompareResponse:
        from app.models.listing import Listing
        from sqlmodel import select

        products = []
        if request.product_ids:
            listings = db.exec(select(Listing).where(Listing.id.in_(request.product_ids))).all()
            dummy_params = ExtractedQueryParams(raw_query="")
            for l in listings:
                first_img = l.images[0] if (l.images and isinstance(l.images, list)) else None
                from app.services.ai_shopper.schemas import ShopperProductItem
                products.append(
                    ShopperProductItem(
                        id=l.id,
                        title=l.title_en or l.title_so or "Product",
                        price=float(l.price or 0),
                        condition=l.condition or "Used",
                        location=l.location or "Kenya",
                        image=first_img,
                        seller_id=l.owner_id or 1,
                        seller_name="Verified Shop",
                        is_verified=True,
                        listing_url=f"/listing/{l.id}",
                        chat_url=f"/messages?userId={l.owner_id}&productId={l.id}",
                        directed_message=f"I am comparing {l.title_en} on Suqafuran.",
                    )
                )

        if not products and request.query:
            params = parse_shopping_query(request.query)
            prods, _ = retrieve_marketplace_listings(db, params, limit=3)
            products = prods

        comparison_result = compare_products(products, request.query or "Product Comparison")
        return ShopperCompareResponse(comparison=comparison_result)

    @staticmethod
    def get_suggestions() -> List[str]:
        return [
            "Find a smartphone within my budget",
            "Help me choose a laptop",
            "Discover fashion deals",
            "Find home appliances",
            "Compare popular products",
        ]

    @staticmethod
    def get_conversation(conversation_id: str) -> Dict[str, Any]:
        return ConversationManager.get_or_create_session(conversation_id)

    @staticmethod
    def delete_conversation(conversation_id: str) -> bool:
        ConversationManager.delete_session(conversation_id)
        return True


ai_shopper_service = AIShopperService()

