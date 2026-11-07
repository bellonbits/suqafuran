import logging
from typing import Optional, List, Dict, Any
from sqlmodel import Session
from app.services.ai_shopper.schemas import (
    ShopperChatRequest,
    ShopperChatResponse,
    ExtractedQueryParams,
    ShopperProductItem,
    ShopperSellerItem,
    ComparisonResult,
)
from app.services.ai_shopper.safety import sanitize_input
from app.services.ai_shopper.intent_classifier import classify_intent, IntentType
from app.services.ai_shopper.query_parser import parse_shopping_query
from app.services.ai_shopper.retrieval import retrieve_marketplace_listings, retrieve_marketplace_sellers
from app.services.ai_shopper.recommendation_engine import rank_products
from app.services.ai_shopper.product_comparison import compare_products
from app.services.ai_shopper.prompts import build_shopper_context_prompt
from app.services.ai_shopper.llm_provider import generate_llm_response
from app.services.ai_shopper.conversation import ConversationManager

logger = logging.getLogger(__name__)


def process_shopping_message(
    db: Session,
    request: ShopperChatRequest,
) -> ShopperChatResponse:
    """
    Main orchestration pipeline for Suqafuran AI Shopper.
    """
    clean_query = sanitize_input(request.message)
    if not clean_query:
        return ShopperChatResponse(
            message="Please tell me what product or deal you're looking for on Suqafuran!",
            intent=IntentType.GENERAL.value,
            products=[],
            sellers=[],
            suggested_followups=[
                "Find a smartphone within my budget",
                "Help me choose a laptop",
                "Discover fashion deals",
            ],
            conversation_id=request.conversation_id or "new",
        )

    # 1. Session Context
    session = ConversationManager.get_or_create_session(request.conversation_id)
    conversation_id = session["id"]
    prev_params_dict = session.get("accumulated_params", {})
    prev_params = ExtractedQueryParams(**prev_params_dict) if prev_params_dict else None

    # 2. Intent Classification
    intent = classify_intent(clean_query)

    # 3. Query Parameter Extraction (merging session history)
    params = parse_shopping_query(clean_query, existing_params=prev_params)

    products: List[ShopperProductItem] = []
    sellers: List[ShopperSellerItem] = []
    comparison: Optional[ComparisonResult] = None
    is_fallback: bool = False

    # 4. Action based on Intent
    if intent == IntentType.COMPARE.value:
        # Retrieve candidate products matching the query or previous params
        retrieved_prods, is_fallback = retrieve_marketplace_listings(db, params, limit=4)
        if len(retrieved_prods) >= 2:
            comparison = compare_products(retrieved_prods[:3], clean_query)
            products = retrieved_prods[:3]
        else:
            products = retrieved_prods
    elif intent == IntentType.SELLER_DISCOVERY.value:
        sellers = retrieve_marketplace_sellers(db, clean_query, limit=5)
        # Also retrieve a few products from these sellers or category
        retrieved_prods, _ = retrieve_marketplace_listings(db, params, limit=6)
        products = retrieved_prods
    else:
        # Standard search, budget query, or product alternative
        retrieved_prods, is_fallback = retrieve_marketplace_listings(db, params, limit=12)
        products = rank_products(retrieved_prods, params)
        if params.location:
            sellers = retrieve_marketplace_sellers(db, params.location, limit=3)

    # 5. Generate Grounded AI Response
    prompt = build_shopper_context_prompt(
        user_query=clean_query,
        intent=intent,
        extracted_params=params.dict(exclude_none=True),
        products=[p.dict() for p in products[:5]],
        sellers=[s.dict() for s in sellers[:3]],
        is_fallback=is_fallback,
    )

    llm_text = generate_llm_response(
        prompt=prompt,
        conversation_history=session.get("history", []),
    )

    # Fallback response generation if LLM is unavailable
    if not llm_text:
        term = params.clean_keywords or "marketplace items"
        budget_str = f" under KSh {params.max_price:,.0f}" if params.max_price else ""
        loc_str = f" in {params.location}" if params.location else ""

        if comparison and comparison.products:
            prod_names = " vs ".join([p.title for p in comparison.products[:2]])
            llm_text = (
                f"Here is a side-by-side comparison for {prod_names}. "
                f"{comparison.verdict}"
            )
        elif is_fallback and products:
            llm_text = (
                f"I couldn't find an exact listing matching \"{clean_query}\" right now. "
                f"However, here are top recommended alternatives from verified sellers currently on Suqafuran."
            )
        elif products:
            top_p = products[0]
            llm_text = (
                f"I found {len(products)} active listing{'s' if len(products) > 1 else ''} for \"{term}\"{budget_str}{loc_str}. "
                f"A great option is the \"{top_p.title}\" for KSh {top_p.price:,.0f}. You can view full specs or message the seller directly."
            )
        else:
            llm_text = (
                f"Explore featured listings and verified sellers across Suqafuran below. "
                f"Feel free to specify a brand, budget, or location!"
            )

    # 6. Generate Contextual Follow-up Suggestions
    suggested_followups: List[str] = []
    if products:
        if not params.max_price:
            suggested_followups.append("Show options under my budget")
        if not params.condition:
            suggested_followups.append("Show only brand new items")
        if not comparison and len(products) >= 2:
            suggested_followups.append(f"Compare {products[0].title[:20]} and {products[1].title[:20]}")
        suggested_followups.append("Show verified shops only")
    else:
        suggested_followups = [
            "Smart TVs under 35,000 KSh",
            "Laptops for programming",
            "Sneakers and sports shoes",
            "Fashion deals in Nairobi",
        ]

    # 7. Update Session
    new_history = list(session.get("history", []))
    new_history.append({"role": "user", "content": clean_query})
    new_history.append({"role": "assistant", "content": llm_text})
    ConversationManager.save_session(conversation_id, new_history, params)

    return ShopperChatResponse(
        message=llm_text,
        intent=intent,
        extracted_params=params,
        products=products,
        comparison=comparison,
        sellers=sellers,
        suggested_followups=suggested_followups[:4],
        conversation_id=conversation_id,
        is_fallback=is_fallback,
    )
