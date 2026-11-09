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
    ShoppingIntentType,
    IntentType,
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
    if intent in (ShoppingIntentType.GREETING, ShoppingIntentType.CASUAL, ShoppingIntentType.MARKETPLACE_INFO, ShoppingIntentType.SUPPORT):
        # Conversational, informational, or support requests do NOT trigger random product searches
        products = []
        sellers = []
        if intent == ShoppingIntentType.SELLER_DISCOVERY:
            sellers = retrieve_marketplace_sellers(db, clean_query, limit=4)
    elif intent == ShoppingIntentType.COMPARE:
        # Retrieve candidate products matching the query or previous params
        retrieved_prods, is_fallback = retrieve_marketplace_listings(db, params, limit=4)
        if len(retrieved_prods) >= 2:
            comparison = compare_products(retrieved_prods[:3], clean_query)
            products = retrieved_prods[:3]
        else:
            products = retrieved_prods
    elif intent == ShoppingIntentType.SELLER_DISCOVERY:
        sellers = retrieve_marketplace_sellers(db, clean_query, limit=5)
        # Also retrieve matching products if category or keywords exist
        if params.clean_keywords or params.category_slug:
            retrieved_prods, _ = retrieve_marketplace_listings(db, params, limit=6)
            products = retrieved_prods
    elif intent == ShoppingIntentType.INSPIRATION:
        # Ideas / Brainstorming: Retrieve only if an inferred category or keyword exists
        if params.clean_keywords or params.category_slug or params.intended_use:
            retrieved_prods, is_fallback = retrieve_marketplace_listings(db, params, limit=8)
            products = rank_products(retrieved_prods, params)
    else:
        # Standard search, budget query, clarification, or product alternative
        retrieved_prods, is_fallback = retrieve_marketplace_listings(db, params, limit=12)
        products = rank_products(retrieved_prods, params)
        if params.location:
            sellers = retrieve_marketplace_sellers(db, params.location, limit=3)

    # Populate genuine recommended shops from the actual matched products and marketplace
    if products and intent not in (ShoppingIntentType.GREETING, ShoppingIntentType.CASUAL, ShoppingIntentType.MARKETPLACE_INFO, ShoppingIntentType.SUPPORT):
        seller_map: Dict[int, ShopperSellerItem] = {s.id: s for s in sellers}
        for p in products:
            if p.seller_id and p.seller_name and p.seller_id not in seller_map:
                clean_name = p.seller_name.strip()
                if clean_name.lower() in ("shop", "verified shop", "seller"):
                    clean_name = f"Shop #{p.seller_id}"
                slug = "".join(c for c in clean_name.lower() if c.isalnum()) or f"shop{p.seller_id}"
                seller_map[p.seller_id] = ShopperSellerItem(
                    id=p.seller_id,
                    name=clean_name,
                    slug=slug,
                    avatar_url=None,
                    location=p.location or "Nairobi",
                    is_verified=bool(p.is_verified),
                    shop_url=f"/shops/{slug}",
                )
                if len(seller_map) >= 4:
                    break

        if len(seller_map) < 4:
            for extra_s in retrieve_marketplace_sellers(db, params.location or "", limit=4):
                if extra_s.id not in seller_map:
                    seller_map[extra_s.id] = extra_s
                if len(seller_map) >= 4:
                    break

        sellers = list(seller_map.values())[:4]

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

        if intent == ShoppingIntentType.GREETING:
            llm_text = (
                "Hello! Welcome to Suqafuran. I'm your personal shopping assistant. "
                "Whether you're looking for great deals, need gift ideas, or want to explore verified local shops across Kenya, "
                "I'm here to help. What can I find for you today?"
            )
        elif intent == ShoppingIntentType.CASUAL:
            llm_text = (
                "I'm doing great, thank you! It's always a pleasure to chat. "
                "Feel free to look around or let me know if you have a specific item, budget, or occasion in mind — "
                "I'm happy to help you discover the best options on Suqafuran."
            )
        elif intent == ShoppingIntentType.MARKETPLACE_INFO:
            llm_text = (
                "Suqafuran is Kenya's trusted digital marketplace connecting buyers with verified local sellers across "
                "Nairobi, Mombasa, Kisumu, Nakuru, and all 47 counties. You can chat directly with shop owners, "
                "inspect items in person before paying, and find great deals across fashion, electronics, home essentials, and more."
            )
        elif intent == ShoppingIntentType.SUPPORT:
            llm_text = (
                "For direct customer support or dispute resolution, our team is readily available via phone or WhatsApp at "
                "+254 720 073322. You can also chat directly with verified sellers from any listing page. How else can I assist you?"
            )
        elif intent == ShoppingIntentType.INSPIRATION and not products:
            llm_text = (
                "I'd love to help you brainstorm some great ideas! "
                "To help me tailor the best suggestions from our verified marketplace sellers, "
                "what's the occasion, and do you have a preferred budget or style in mind?"
            )
        elif comparison and comparison.products:
            prod_names = " vs ".join([p.title for p in comparison.products[:2]])
            llm_text = (
                f"Here is a side-by-side comparison for {prod_names}. "
                f"{comparison.verdict}"
            )
        elif params.max_price and not products:
            llm_text = (
                f"I couldn't find any listings matching \"{term}\"{budget_str}{loc_str} on Suqafuran right now. "
                f"Would you like to expand your budget slightly or check similar categories?"
            )
        elif is_fallback and products:
            llm_text = (
                f"I couldn't find an exact listing matching \"{clean_query}\" right now. "
                f"However, here are verified alternatives within your requirements currently on Suqafuran."
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
    if intent == ShoppingIntentType.GREETING:
        suggested_followups = [
            "Find smartphones under 25k",
            "Trending fashion deals",
            "Help me furnish my house",
            "How does Suqafuran work?",
        ]
    elif intent == ShoppingIntentType.CASUAL:
        suggested_followups = [
            "What's trending today?",
            "Gift ideas for a friend",
            "Show me electronics deals",
            "Browse verified shops",
        ]
    elif intent == ShoppingIntentType.MARKETPLACE_INFO:
        suggested_followups = [
            "How do I start selling?",
            "What are the seller plans?",
            "How does buyer safety work?",
            "Browse product categories",
        ]
    elif intent == ShoppingIntentType.SUPPORT:
        suggested_followups = [
            "Chat on WhatsApp (+254 720 073322)",
            "Call customer care",
            "How to report a scam",
            "Back to shopping",
        ]
    elif products:
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
            "Laptops for work and school",
            "Sneakers and sports shoes",
            "Kitchen essentials",
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

