from typing import List, Dict, Any, Optional, Tuple
from sqlmodel import Session, select, or_, and_, desc
from app.models.listing import Listing, Category
from app.models.user import User
from app.services.ai_shopper.schemas import (
    ExtractedQueryParams,
    ShopperProductItem,
    ShopperSellerItem,
)
from app.services.search_intelligence import expand_synonyms


def retrieve_marketplace_listings(
    db: Session,
    params: ExtractedQueryParams,
    limit: int = 10,
) -> Tuple[List[ShopperProductItem], bool]:
    """
    Retrieves real active listings from PostgreSQL matching the extracted shopping parameters.
    Returns: (list_of_products, is_fallback)
    """
    stmt = (
        select(Listing)
        .where(Listing.status == "active")
        .where(Listing.is_sold == False)
    )

    # 1. Text filter
    clean_kw = params.clean_keywords.strip()
    synonyms = expand_synonyms(clean_kw) if clean_kw else []
    all_terms = [clean_kw] + [s for s in synonyms if s != clean_kw][:3]
    all_terms = [t for t in all_terms if t and len(t) > 1]

    text_clauses = []
    for term in all_terms:
        text_clauses.append(Listing.title_en.ilike(f"%{term}%"))
        text_clauses.append(Listing.title_so.ilike(f"%{term}%"))
        text_clauses.append(Listing.description_en.ilike(f"%{term}%"))

    if text_clauses:
        stmt = stmt.where(or_(*text_clauses))

    # 2. Budget / Price limits
    if params.min_price is not None:
        stmt = stmt.where(Listing.price >= params.min_price)
    if params.max_price is not None:
        stmt = stmt.where(Listing.price <= params.max_price)

    # 3. Location
    if params.location:
        # Match city or neighbourhood
        loc_term = params.location.split(",")[0].strip()
        stmt = stmt.where(Listing.location.ilike(f"%{loc_term}%"))

    # 4. Condition
    if params.condition:
        stmt = stmt.where(Listing.condition.ilike(f"%{params.condition}%"))

    # 5. Category (by slug or id)
    if params.category_id:
        stmt = stmt.where(Listing.category_id == params.category_id)
    elif params.category_slug:
        cat = db.exec(select(Category).where(Category.slug == params.category_slug)).first()
        if cat:
            stmt = stmt.where(Listing.category_id == cat.id)

    # Order by boost level, views, and recency
    stmt = stmt.order_by(
        desc(Listing.boost_level),
        desc(Listing.views),
        desc(Listing.created_at)
    ).limit(limit)

    raw_listings = db.exec(stmt).all()
    is_fallback = False

    # 6. Fallback if no exact matches: broaden search (remove price cap or strict location)
    if not raw_listings and (params.max_price or params.location or text_clauses):
        fallback_stmt = (
            select(Listing)
            .where(Listing.status == "active")
            .where(Listing.is_sold == False)
        )
        if text_clauses:
            fallback_stmt = fallback_stmt.where(or_(*text_clauses))
        elif params.category_id:
            fallback_stmt = fallback_stmt.where(Listing.category_id == params.category_id)

        raw_listings = db.exec(
            fallback_stmt.order_by(desc(Listing.boost_level), desc(Listing.created_at)).limit(limit)
        ).all()
        if raw_listings:
            is_fallback = True

    # 7. Ultimate fallback: retrieve active featured marketplace listings
    if not raw_listings:
        raw_listings = db.exec(
            select(Listing)
            .where(Listing.status == "active")
            .where(Listing.is_sold == False)
            .order_by(desc(Listing.boost_level), desc(Listing.created_at))
            .limit(limit)
        ).all()
        is_fallback = True

    # Map raw listings to ShopperProductItem with seller info
    seller_ids = {l.owner_id for l in raw_listings if l.owner_id}
    sellers_map = {}
    if seller_ids:
        sellers = db.exec(select(User).where(User.id.in_(seller_ids))).all()
        sellers_map = {s.id: s for s in sellers}

    products: List[ShopperProductItem] = []
    for l in raw_listings:
        seller = sellers_map.get(l.owner_id)
        seller_name = (seller.business_name or seller.full_name) if seller else "Verified Seller"
        is_verified = bool(seller.is_verified) if seller else False
        first_img = l.images[0] if (l.images and isinstance(l.images, list)) else None
        price_val = float(l.price or 0.0)
        title_str = l.title_en or l.title_so or "Marketplace Item"

        # Directed chat message
        directed_msg = (
            f"{f'[PRODUCT_IMAGE]: {first_img}' if first_img else ''}\n"
            f"🛍️ INQUIRY: {title_str}\n\n"
            f"Hi {seller_name}! 👋 I found your listing on Suqafuran for \"{title_str}\" (KSh {int(price_val):,}).\n"
            f"Is this item currently available? I would like to arrange delivery/inspection.\n\n"
            f"Please confirm availability so we can proceed. Thank you!"
        ).strip()

        products.append(
            ShopperProductItem(
                id=l.id,
                title=title_str,
                price=price_val,
                compare_at_price=float(l.compare_at_price) if l.compare_at_price else None,
                currency=l.currency or "KES",
                condition=l.condition or "Used",
                location=l.location or "Kenya",
                image=first_img,
                seller_id=l.owner_id or 1,
                seller_name=seller_name,
                is_verified=is_verified,
                category_id=l.category_id,
                attributes=l.attributes or {},
                match_score=1.0 if not is_fallback else 0.75,
                directed_message=directed_msg,
                listing_url=f"/listing/{l.id}",
                chat_url=f"/messages?userId={l.owner_id}&productId={l.id}",
            )
        )

    return products, is_fallback


def retrieve_marketplace_sellers(
    db: Session,
    keyword_or_location: str,
    limit: int = 4,
) -> List[ShopperSellerItem]:
    """
    Discovers actual registered shops and verified sellers.
    """
    clean = keyword_or_location.strip().lower()
    stmt = (
        select(User)
        .where(User.is_active == True)
        .where(User.business_name.isnot(None))
    )

    if clean:
        stmt = stmt.where(
            or_(
                User.business_name.ilike(f"%{clean}%"),
                User.full_name.ilike(f"%{clean}%"),
            )
        )

    # Prioritize verified and high-tier sellers
    stmt = stmt.order_by(desc(User.is_verified), desc(User.profile_views)).limit(limit)
    sellers = db.exec(stmt).all()

    results: List[ShopperSellerItem] = []
    for s in sellers:
        shop_title = s.business_name or s.full_name or f"Shop #{s.id}"
        slug = "".join(c for c in shop_title.lower() if c.isalnum()) or f"shop{s.id}"
        results.append(
            ShopperSellerItem(
                id=s.id,
                name=shop_title,
                slug=slug,
                avatar_url=s.avatar_url,
                location="Nairobi",
                is_verified=bool(s.is_verified),
                shop_url=f"/shop/{slug}",
            )
        )
    return results

