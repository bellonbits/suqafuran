from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlmodel import Session, select, func, or_
from sqlalchemy.orm import selectinload
from datetime import datetime
import logging
from app.api import deps
from app.models.listing import Listing, Category
from app.models.user import User
from app.models.listing_attribute import ListingAttribute
from app.models.attribute import Attribute
from app.models.subscription import FeaturedSelling
from app.models.analytics import ZeroResultSearch

logger = logging.getLogger("search")

router = APIRouter()


@router.get("/listings/search", response_model=List[Any])
def search_listings(
    *,
    db: Session = Depends(deps.get_db),
    request: Request,
    q: Optional[str] = Query(None, description="Search query"),
    category_id: Optional[int] = Query(None),
    subcategory_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    attributes: Optional[str] = Query(None, description="JSON string of attribute filters"),
    featured_only: bool = Query(False, description="Show only featured products"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> Any:
    """
    Advanced search with full-text search, category filtering, and attribute filtering.
    Supports featured product filtering.

    Example attribute filter:
    {"brand": ["nike", "adidas"], "condition": ["new", "like-new"], "price_range": [100, 500]}
    """
    statement = select(Listing).where(Listing.status == "active")

    # Text search
    if q:
        search_filter = f"%{q}%"
        statement = statement.where(
            (Listing.title_en.ilike(search_filter))
            | (Listing.title_so.ilike(search_filter))
            | (Listing.description_en.ilike(search_filter))
            | (Listing.description_so.ilike(search_filter))
        )

    # Category filter
    if category_id:
        statement = statement.where(Listing.category_id == category_id)

    if subcategory_id:
        statement = statement.where(Listing.subcategory_id == subcategory_id)

    # Price filter
    if min_price is not None:
        statement = statement.where(Listing.price >= min_price)
    if max_price is not None:
        statement = statement.where(Listing.price <= max_price)

    # Attribute filters
    if attributes:
        import json
        try:
            attr_filters = json.loads(attributes)
            for attr_slug, values in attr_filters.items():
                if not isinstance(values, list):
                    values = [values]

                # Join with ListingAttribute and Attribute tables
                subquery = select(ListingAttribute.listing_id).join(
                    Attribute, ListingAttribute.attribute_id == Attribute.id
                ).where(
                    (Attribute.slug == attr_slug)
                    & (ListingAttribute.value.in_(values))
                )
                statement = statement.where(Listing.id.in_(subquery))
        except json.JSONDecodeError:
            pass

    # Featured filter
    if featured_only:
        featured_ids = set()
        featured_placements = db.exec(
            select(FeaturedSelling).where(
                FeaturedSelling.placement_type == "featured_product",
                FeaturedSelling.is_active == True,
                FeaturedSelling.ends_at > datetime.utcnow(),
            )
        ).all()
        featured_ids = {p.listing_id for p in featured_placements if p.listing_id}
        if featured_ids:
            statement = statement.where(Listing.id.in_(featured_ids))
        else:
            # No featured products, return empty
            return []

    # Sorting: Featured products first, then by boost level and date
    statement = statement.order_by(
        Listing.boost_level.desc(),
        Listing.created_at.desc(),
    ).offset(skip).limit(limit)

    listings = db.exec(statement).all()

    # If direct text match returns no results, attempt semantic synonym expansion
    if len(listings) == 0 and q and q.strip():
        try:
            from app.services.search_intelligence import parse_natural_language_search
            parsed = parse_natural_language_search(q)
            synonyms_to_try = [parsed["clean_keywords"]] + parsed.get("synonyms", [])
            synonyms_to_try = [s for s in synonyms_to_try if s and len(s) > 1 and s != q.lower()]

            if synonyms_to_try:
                fallback_stmt = select(Listing).where(Listing.status == "active")
                filters = []
                for term in synonyms_to_try[:4]:
                    filters.append(Listing.title_en.ilike(f"%{term}%"))
                    filters.append(Listing.title_so.ilike(f"%{term}%"))
                fallback_stmt = fallback_stmt.where(or_(*filters))

                if parsed.get("detected_location"):
                    fallback_stmt = fallback_stmt.where(Listing.location.ilike(f"%{parsed['detected_location']}%"))
                if min_price is None and parsed.get("min_price"):
                    fallback_stmt = fallback_stmt.where(Listing.price >= parsed["min_price"])
                if max_price is None and parsed.get("max_price"):
                    fallback_stmt = fallback_stmt.where(Listing.price <= parsed["max_price"])
                if category_id:
                    fallback_stmt = fallback_stmt.where(Listing.category_id == category_id)
                if subcategory_id:
                    fallback_stmt = fallback_stmt.where(Listing.subcategory_id == subcategory_id)

                fallback_listings = db.exec(
                    fallback_stmt.order_by(Listing.boost_level.desc(), Listing.created_at.desc()).offset(skip).limit(limit)
                ).all()

                if fallback_listings:
                    listings = fallback_listings
        except Exception as e:
            logger.debug(f"Semantic search expansion failed: {e}")

    # Track zero-result searches to identify unmet marketplace demand (only if still zero)
    if len(listings) == 0 and q and q.strip():
        try:
            client_ip = request.client.host if request.client else None
            user_location = request.headers.get("x-user-location")
            zero_record = ZeroResultSearch(
                query=q.strip()[:200],
                category_id=category_id,
                subcategory_id=subcategory_id,
                location=user_location,
                ip_address=client_ip,
            )
            db.add(zero_record)
            db.commit()
        except Exception as e:
            logger.debug(f"Failed to record zero-result search: {e}")
            db.rollback()

    # Get all featured product IDs for this result set
    featured_listing_ids = set()
    featured_placements = db.exec(
        select(FeaturedSelling).where(
            FeaturedSelling.placement_type == "featured_product",
            FeaturedSelling.is_active == True,
            FeaturedSelling.ends_at > datetime.utcnow(),
        )
    ).all()
    featured_listing_ids = {p.listing_id for p in featured_placements if p.listing_id}

    # Format response with featured status
    results = []
    for l in listings:
        is_featured = l.id in featured_listing_ids
        results.append({
            "id": l.id,
            "title": l.title_en or l.title_so,
            "price": l.price,
            "category_id": l.category_id,
            "subcategory_id": l.subcategory_id,
            "location": l.location,
            "images": l.images[:1] if l.images else [],
            "created_at": l.created_at.isoformat() if l.created_at else None,
            "is_featured": is_featured,
        })

    # Sort to put featured at top
    results.sort(key=lambda x: not x["is_featured"])

    return results


@router.get("/listings/{listing_id}/attributes", response_model=List[Any])
def get_listing_attributes(
    *,
    db: Session = Depends(deps.get_db),
    listing_id: int,
) -> Any:
    """
    Get all attributes for a specific listing.
    """
    attributes = db.exec(
        select(ListingAttribute)
        .where(ListingAttribute.listing_id == listing_id)
        .join(Attribute, ListingAttribute.attribute_id == Attribute.id)
    ).all()

    return [
        {
            "attribute_id": la.attribute_id,
            "attribute_name": la.attribute.name if hasattr(la, 'attribute') else None,
            "attribute_slug": la.attribute.slug if hasattr(la, 'attribute') else None,
            "value": la.value,
        }
        for la in attributes
    ]


@router.get("/attribute-filters/{category_id}", response_model=Any)
def get_attribute_filters(
    *,
    db: Session = Depends(deps.get_db),
    category_id: int,
) -> Any:
    """
    Get available attribute filters and their options for a category.
    Used to build dynamic filter UI.
    """
    from app.models.category_attribute import CategoryAttribute
    from app.models.attribute_option import AttributeOption

    # Get attributes assigned to this category
    cat_attrs = db.exec(
        select(CategoryAttribute)
        .where(CategoryAttribute.category_id == category_id)
        .order_by(CategoryAttribute.sort_order)
    ).all()

    filters = []
    for cat_attr in cat_attrs:
        attr = db.get(Attribute, cat_attr.attribute_id)
        if not attr:
            continue

        # Get options if select/multiselect
        options = []
        if attr.field_type in ["select", "multiselect"]:
            opts = db.exec(
                select(AttributeOption)
                .where(AttributeOption.attribute_id == attr.id)
                .order_by(AttributeOption.sort_order)
            ).all()
            options = [
                {"value": opt.value, "display_name": opt.display_name}
                for opt in opts
            ]

        filters.append(
            {
                "id": attr.id,
                "name": attr.name,
                "slug": attr.slug,
                "field_type": attr.field_type,
                "required": cat_attr.required,
                "options": options,
            }
        )

    return {"category_id": category_id, "filters": filters}


@router.get("/search/zero-results")
def get_zero_result_searches(
    *,
    db: Session = Depends(deps.get_db),
    limit: int = Query(50, ge=1, le=200),
    days: int = Query(30, ge=1, le=365),
) -> Any:
    """
    (Admin / Intelligence) Retrieve top zero-result queries to identify unmet marketplace demand.
    """
    from datetime import timedelta
    since = datetime.utcnow() - timedelta(days=days)

    statement = (
        select(
            ZeroResultSearch.query,
            func.count(ZeroResultSearch.id).label("count"),
            func.max(ZeroResultSearch.created_at).label("last_searched_at"),
            func.max(ZeroResultSearch.category_id).label("sample_category_id")
        )
        .where(ZeroResultSearch.created_at >= since)
        .group_by(ZeroResultSearch.query)
        .order_by(func.count(ZeroResultSearch.id).desc())
        .limit(limit)
    )

    rows = db.exec(statement).all()
    return [
        {
            "query": r[0],
            "count": r[1],
            "last_searched_at": r[2].isoformat() if r[2] else None,
            "category_id": r[3],
        }
        for r in rows
    ]


@router.get("/search/suggestions")
def get_search_suggestions(
    *,
    db: Session = Depends(deps.get_db),
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(8, ge=1, le=20),
) -> List[str]:
    """
    Fast prefix / keyword search suggestions based on active marketplace listings.
    """
    pattern = f"%{q.strip()}%"
    statement = (
        select(Listing.title_en)
        .where(Listing.status == "active")
        .where(Listing.title_en.ilike(pattern))
        .distinct()
        .limit(limit)
    )
    results = db.exec(statement).all()
    return [t for t in results if t]


@router.post("/search/intelligent-parse")
def parse_intelligent_query(
    body: dict,
) -> Any:
    """
    Parse a natural language query into structured filter entities (keywords, location,
    price bounds, condition, category hints, and multilingual synonyms).
    """
    from app.services.search_intelligence import parse_natural_language_search
    query = body.get("query", "")
    return parse_natural_language_search(query)


@router.get("/search/universal")
def search_universal(
    *,
    db: Session = Depends(deps.get_db),
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(6, ge=1, le=20),
) -> Any:
    """
    Universal marketplace search: simultaneously finds matching Products,
    Verified Shops & Sellers, and Categories for instant search dropdowns.
    """
    clean_q = q.strip()
    pattern = f"%{clean_q}%"

    # 1. Matching Products (Active listings)
    product_stmt = (
        select(Listing)
        .where(Listing.status == "active")
        .where(
            (Listing.title_en.ilike(pattern))
            | (Listing.title_so.ilike(pattern))
            | (Listing.description_en.ilike(pattern))
        )
        .order_by(Listing.boost_level.desc(), Listing.created_at.desc())
        .limit(limit)
    )
    listings = db.exec(product_stmt).all()

    # Collect seller IDs
    seller_ids = {l.user_id for l in listings if l.user_id}
    sellers_map = {}
    if seller_ids:
        sellers = db.exec(select(User).where(User.id.in_(seller_ids))).all()
        sellers_map = {s.id: s for s in sellers}

    products = []
    for l in listings:
        seller = sellers_map.get(l.user_id)
        seller_name = (seller.business_name or seller.full_name) if seller else "Seller"
        products.append({
            "id": l.id,
            "title": l.title_en or l.title_so or "Product",
            "price": l.price,
            "currency": l.currency or "KES",
            "location": l.location or "Kenya",
            "image": l.images[0] if l.images else None,
            "seller_id": l.user_id,
            "seller_name": seller_name,
            "is_verified": seller.is_verified if seller else False,
            "category_id": l.category_id,
        })

    # 2. Matching Shops & Verified Sellers
    shop_stmt = (
        select(User)
        .where(User.is_suspended == False)
        .where(
            (User.business_name.ilike(pattern))
            | (User.full_name.ilike(pattern))
        )
        .order_by(User.is_featured.desc(), User.is_verified.desc())
        .limit(4)
    )
    shop_users = db.exec(shop_stmt).all()

    shops = []
    for s in shop_users:
        shop_title = s.business_name or s.full_name or f"Shop #{s.id}"
        slug = "".join(c for c in shop_title.lower() if c.isalnum()) or f"shop{s.id}"
        shops.append({
            "id": s.id,
            "name": shop_title,
            "slug": slug,
            "avatar_url": s.avatar_url or s.logo_url,
            "location": s.location or s.market or "Nairobi",
            "is_verified": s.is_verified,
            "is_featured": s.is_featured,
        })

    # 3. Matching Categories
    category_stmt = (
        select(Category)
        .where(
            (Category.name_en.ilike(pattern))
            | (Category.name_so.ilike(pattern))
        )
        .limit(3)
    )
    cats = db.exec(category_stmt).all()
    categories = [
        {
            "id": c.id,
            "name": c.name_en or c.name_so,
            "slug": c.slug,
            "icon": getattr(c, "icon", None),
        }
        for c in cats
    ]

    return {
        "query": clean_q,
        "products": products,
        "shops": shops,
        "categories": categories,
    }


@router.post("/search/ai-shopper")
def ai_shopper(
    *,
    db: Session = Depends(deps.get_db),
    body: dict,
) -> Any:
    """
    AI-Powered Natural Language Shopper:
    Understands complex shopping intent, budget constraints, location, and questions.
    Returns recommended products and pre-formats direct inquiries ready to send in chat.
    """
    from app.services.search_intelligence import parse_natural_language_search
    query = body.get("query", "").strip()
    if not query:
        return {
            "understood": {},
            "ai_advice": "Please type what you would like to shop for.",
            "products": [],
            "shops": [],
            "primary_directed_inquiry": None,
        }

    parsed = parse_natural_language_search(query)
    clean_keywords = parsed.get("clean_keywords") or query
    min_price = parsed.get("min_price")
    max_price = parsed.get("max_price")
    detected_location = parsed.get("detected_location")
    inferred_category = parsed.get("inferred_category")

    # Detect if user is asking to chat, message, check availability, or inquire
    raw_lower = query.lower()
    chat_intent_triggers = [
        "chat", "message", "ask", "tell", "inquire", "contact", "reach",
        "deliver", "delivery", "available", "dm", "ship", "warranty", "negotiate", "can they", "do they"
    ]
    has_chat_intent = any(trigger in raw_lower for trigger in chat_intent_triggers)

    # Extract user's specific inquiry question if phrased
    buyer_question = ""
    if "deliver" in raw_lower:
        buyer_question = f"Do you offer delivery to my location ({detected_location or 'Nairobi'})?"
    elif "warranty" in raw_lower:
        buyer_question = "Does this product come with a warranty or return guarantee?"
    elif "available" in raw_lower:
        buyer_question = "Is this item currently available in stock for inspection?"
    elif has_chat_intent:
        buyer_question = f"I'd love to ask more about this item. Please confirm availability."
    else:
        buyer_question = "Is this item available? I would like to arrange delivery/inspection."

    # Build DB query for matching listings
    stmt = select(Listing).where(Listing.status == "active")

    # Text filter with keywords & multilingual synonyms
    keywords_to_try = [clean_keywords]
    if parsed.get("synonyms"):
        keywords_to_try.extend(parsed["synonyms"][:3])

    text_filters = []
    for kw in keywords_to_try:
        if kw and len(kw) > 1:
            text_filters.append(Listing.title_en.ilike(f"%{kw}%"))
            text_filters.append(Listing.title_so.ilike(f"%{kw}%"))
            text_filters.append(Listing.description_en.ilike(f"%{kw}%"))

    if text_filters:
        stmt = stmt.where(or_(*text_filters))

    if min_price is not None:
        stmt = stmt.where(Listing.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Listing.price <= max_price)
    if detected_location:
        stmt = stmt.where(Listing.location.ilike(f"%{detected_location}%"))

    # Order by boost & recency
    stmt = stmt.order_by(Listing.boost_level.desc(), Listing.created_at.desc()).limit(8)
    listings = db.exec(stmt).all()

    # Fallback: If no results with strict location/price, search without price/location cap
    if not listings and (min_price or max_price or detected_location):
        fallback_stmt = select(Listing).where(Listing.status == "active")
        if text_filters:
            fallback_stmt = fallback_stmt.where(or_(*text_filters))
        listings = db.exec(fallback_stmt.order_by(Listing.boost_level.desc()).limit(8)).all()

    # Gather sellers
    seller_ids = {l.user_id for l in listings if l.user_id}
    sellers_map = {}
    if seller_ids:
        sellers = db.exec(select(User).where(User.id.in_(seller_ids))).all()
        sellers_map = {s.id: s for s in sellers}

    products = []
    primary_directed_inquiry = None

    for idx, l in enumerate(listings):
        seller = sellers_map.get(l.user_id)
        seller_name = (seller.business_name or seller.full_name) if seller else "Seller"
        first_img = l.images[0] if l.images else ""
        price_val = int(l.price) if l.price else 0

        # Pre-format professional directed chat message
        directed_msg = (
            f"{f'[PRODUCT_IMAGE]: {first_img}' if first_img else ''}\n"
            f"🛍️ INQUIRY: {l.title_en or l.title_so or 'Product'}\n\n"
            f"Hi {seller_name}! 👋 I found your listing on Suqafuran for \"{l.title_en or l.title_so}\" (KSh {price_val:,}).\n"
            f"{buyer_question}\n\n"
            f"Please confirm availability so we can proceed. Thank you!"
        ).strip()

        prod_data = {
            "id": l.id,
            "title": l.title_en or l.title_so or "Product",
            "price": price_val,
            "currency": l.currency or "KES",
            "location": l.location or "Kenya",
            "image": first_img,
            "seller_id": l.user_id,
            "seller_name": seller_name,
            "is_verified": seller.is_verified if seller else False,
            "category_id": l.category_id,
            "directed_message": directed_msg,
            "chat_url": f"/messages?userId={l.user_id}&productId={l.id}",
        }
        products.append(prod_data)

        if idx == 0:
            primary_directed_inquiry = prod_data

    # Find matching shops in this niche
    shop_stmt = (
        select(User)
        .where(User.is_suspended == False)
        .where(
            (User.business_name.ilike(f"%{clean_keywords}%"))
            | (User.shop_description.ilike(f"%{clean_keywords}%"))
        )
        .limit(3)
    )
    matching_shops = []
    for s in db.exec(shop_stmt).all():
        shop_title = s.business_name or s.full_name or f"Shop #{s.id}"
        slug = "".join(c for c in shop_title.lower() if c.isalnum()) or f"shop{s.id}"
        matching_shops.append({
            "id": s.id,
            "name": shop_title,
            "slug": slug,
            "avatar_url": s.avatar_url or s.logo_url,
            "location": s.location or s.market or "Nairobi",
            "is_verified": s.is_verified,
        })

    # AI Advice Summary
    budget_label = ""
    if max_price:
        budget_label = f" under KSh {int(max_price):,}"
    if detected_location:
        loc_label = f" in {detected_location}"
    else:
        loc_label = ""

    if products:
        ai_advice = (
            f"Found {len(products)} matching option{'s' if len(products) > 1 else ''} for \"{clean_keywords}\"{budget_label}{loc_label}. "
            f"Select any product below to view details or start a directed chat with the verified shop directly."
        )
    else:
        ai_advice = (
            f"We couldn't find exact matches for \"{clean_keywords}\"{budget_label}. "
            f"Try broadening your search term or asking our AI shopper for related categories."
        )

    return {
        "query": query,
        "understood": {
            "keywords": clean_keywords,
            "budget": f"Under KSh {int(max_price):,}" if max_price else "Any price",
            "location": detected_location or "All Kenya",
            "intent_to_chat": has_chat_intent,
            "buyer_question": buyer_question,
        },
        "ai_advice": ai_advice,
        "products": products,
        "shops": matching_shops,
        "primary_directed_inquiry": primary_directed_inquiry,
    }


