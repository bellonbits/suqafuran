from typing import List, Dict, Any, Optional
from sqlmodel import Session, select
from app.models.listing import Listing
from app.models.user import User
from app.services.ai_shopper.schemas import (
    ShopperProductItem,
    ProductComparisonResult,
    ProductComparisonDimension,
)


def compare_products(
    items: List[ShopperProductItem],
    user_criteria: Optional[str] = None,
) -> Optional[ProductComparisonResult]:
    """
    Compares 2 to 4 products side-by-side along concrete marketplace dimensions.
    Extracts real data without hallucinating missing attributes.
    """
    if not items or len(items) < 2:
        return None

    # 1. Price comparison
    prices = {p.id: f"KSh {int(p.price):,}" for p in items}
    min_price_item = min(items, key=lambda x: x.price)
    dim_price = ProductComparisonDimension(
        dimension_name="Price",
        values=prices,
        winner_product_id=min_price_item.id,
        note=f"Lowest price: {min_price_item.title} (KSh {int(min_price_item.price):,})",
    )

    # 2. Condition comparison
    conditions = {p.id: p.condition for p in items}
    dim_condition = ProductComparisonDimension(
        dimension_name="Condition",
        values=conditions,
        note="New / Refurbished vs Pre-owned",
    )

    # 3. Seller Trust & Verification
    seller_trust = {
        p.id: f"{p.seller_name} ({'Verified Seller' if p.is_verified else 'Community Seller'})"
        for p in items
    }
    dim_seller = ProductComparisonDimension(
        dimension_name="Seller & Trust",
        values=seller_trust,
    )

    # 4. Location & Pickup
    locations = {p.id: p.location for p in items}
    dim_location = ProductComparisonDimension(
        dimension_name="Location",
        values=locations,
    )

    dimensions = [dim_price, dim_condition, dim_seller, dim_location]

    # Strengths and limitations per item
    strengths_limitations: Dict[int, Dict[str, List[str]]] = {}
    for p in items:
        strengths = []
        limitations = []

        if p.id == min_price_item.id:
            strengths.append("Most budget-friendly option in this comparison")
        else:
            limitations.append(f"Higher price point (+KSh {int(p.price - min_price_item.price):,})")

        if p.is_verified:
            strengths.append("Sold by a verified merchant profile")

        if (p.condition or "").lower() in ["new", "brand new"]:
            strengths.append("Brand new item with intact packaging")
        elif (p.condition or "").lower() == "refurbished":
            strengths.append("Refurbished: tested functionality at a lower cost")

        strengths_limitations[p.id] = {
            "strengths": strengths or ["Good overall market choice"],
            "limitations": limitations or ["Standard market conditions apply"],
        }

    # Verdict
    overall_verdict = (
        f"Between these options, '{min_price_item.title}' offers the highest financial value at KSh {int(min_price_item.price):,}. "
        f"If condition and seller verification are your top priorities, inspect the merchant details before finalizing."
    )

    return ProductComparisonResult(
        product_ids=[p.id for p in items],
        products=items,
        dimensions=dimensions,
        strengths_and_limitations=strengths_limitations,
        overall_verdict=overall_verdict,
        best_value_product_id=min_price_item.id,
    )


def compare_marketplace_products(
    db: Session,
    product_ids: List[int],
    user_criteria: Optional[str] = None,
) -> Optional[ProductComparisonResult]:
    """
    Fetches listings from db and runs compare_products.
    """
    if len(product_ids) < 2:
        return None

    # Fetch listings
    listings = db.exec(
        select(Listing).where(Listing.id.in_(product_ids[:4]))
    ).all()

    if len(listings) < 2:
        return None

    # Fetch sellers
    seller_ids = {l.owner_id for l in listings if l.owner_id}
    sellers_map = {}
    if seller_ids:
        sellers = db.exec(select(User).where(User.id.in_(seller_ids))).all()
        sellers_map = {s.id: s for s in sellers}

    items: List[ShopperProductItem] = []
    for l in listings:
        s = sellers_map.get(l.owner_id)
        seller_name = (s.business_name or s.full_name) if s else "Seller"
        items.append(
            ShopperProductItem(
                id=l.id,
                title=l.title_en or l.title_so or "Product",
                price=float(l.price or 0.0),
                currency=l.currency or "KES",
                condition=l.condition or "Used",
                location=l.location or "Kenya",
                image=l.images[0] if (l.images and isinstance(l.images, list)) else None,
                seller_id=l.owner_id or 1,
                seller_name=seller_name,
                is_verified=bool(s.is_verified) if s else False,
                attributes=l.attributes or {},
                listing_url=f"/listing/{l.id}",
                chat_url=f"/messages?userId={l.owner_id}&productId={l.id}",
            )
        )

    return compare_products(items, user_criteria)

