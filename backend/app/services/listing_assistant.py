"""
Smart Listing Assistant Service for Suqafuran.

Provides:
1. Category suggestion based on title/description tokens + database taxonomy + AI fallback.
2. Real data-backed price recommendations using statistical percentiles of comparable active and sold listings.
3. Listing creation assistant combining title refinement, category mapping, and pricing bands.
"""

from typing import Dict, Any, List, Optional, Tuple
import re
import statistics
import logging
from sqlmodel import Session, select, func, or_
from app.models.listing import Listing, Category
from app.services.search_intelligence import parse_natural_language_search

logger = logging.getLogger("listing_assistant")

# Heuristic category keyword mapping to category slugs
KEYWORD_TO_CATEGORY_SLUG = {
    # Electronics / Tech / Phones
    "iphone": "electronics",
    "samsung": "electronics",
    "tecno": "electronics",
    "infinix": "electronics",
    "oppo": "electronics",
    "xiaomi": "electronics",
    "laptop": "electronics",
    "macbook": "electronics",
    "hp": "electronics",
    "dell": "electronics",
    "lenovo": "electronics",
    "computer": "electronics",
    "kompyuta": "electronics",
    "tv": "electronics",
    "television": "electronics",
    "simu": "electronics",
    "phone": "electronics",
    "telfoon": "electronics",
    "headphone": "electronics",
    "airpods": "electronics",

    # Vehicles
    "toyota": "vehicles",
    "nissan": "vehicles",
    "subaru": "vehicles",
    "mazda": "vehicles",
    "honda": "vehicles",
    "mercedes": "vehicles",
    "bmw": "vehicles",
    "isuzu": "vehicles",
    "car": "vehicles",
    "gari": "vehicles",
    "baabuur": "vehicles",
    "motorcycle": "vehicles",
    "pikipiki": "vehicles",
    "boda": "vehicles",
    "bajaj": "vehicles",
    "lori": "vehicles",

    # Property / Real Estate
    "house": "property",
    "nyumba": "property",
    "guri": "property",
    "apartment": "property",
    "plot": "property",
    "land": "property",
    "ardhi": "property",
    "dhul": "property",
    "shamba": "property",
    "bedsitter": "property",
    "villa": "property",

    # Fashion
    "shoes": "fashion",
    "sneakers": "fashion",
    "viatu": "fashion",
    "kabaal": "fashion",
    "dress": "fashion",
    "suit": "fashion",
    "nguo": "fashion",
    "dhar": "fashion",
    "shirt": "fashion",
    "trousers": "fashion",
    "watch": "fashion",
    "handbag": "fashion",

    # Home, Furniture & Appliances
    "sofa": "home-appliances",
    "couch": "home-appliances",
    "bed": "home-appliances",
    "kitanda": "home-appliances",
    "sariir": "home-appliances",
    "fridge": "home-appliances",
    "jokofu": "home-appliances",
    "cooker": "home-appliances",
    "microwave": "home-appliances",
    "table": "home-appliances",

    # Health & Beauty
    "perfume": "health-beauty",
    "cologne": "health-beauty",
    "lotion": "health-beauty",
    "makeup": "health-beauty",
    "skincare": "health-beauty",

    # Services
    "cleaning": "services",
    "repair": "services",
    "plumber": "services",
    "electrician": "services",
    "transport": "services",
    "fundi": "services",
}

# Category baseline median price estimates (in KES) when no DB history exists
CATEGORY_PRICE_BENCHMARKS = {
    "electronics": {"min": 5000.0, "median": 28000.0, "max": 120000.0},
    "vehicles": {"min": 150000.0, "median": 1200000.0, "max": 6500000.0},
    "property": {"min": 15000.0, "median": 45000.0, "max": 150000.0},
    "fashion": {"min": 800.0, "median": 3500.0, "max": 18000.0},
    "home-appliances": {"min": 2500.0, "median": 18000.0, "max": 85000.0},
    "health-beauty": {"min": 500.0, "median": 2500.0, "max": 12000.0},
    "services": {"min": 1000.0, "median": 5000.0, "max": 30000.0},
}


def predict_category(
    db: Session,
    title: str,
    description: str = "",
) -> Dict[str, Any]:
    """
    Predicts the best category for a listing using taxonomy keyword heuristics and database lookup.
    """
    combined_text = f"{title or ''} {description or ''}".lower()
    tokens = re.findall(r"\b[a-zA-Z0-9]{2,}\b", combined_text)

    # 1. Match against known keyword slugs
    matched_slugs: Dict[str, int] = {}
    for t in tokens:
        if t in KEYWORD_TO_CATEGORY_SLUG:
            slug = KEYWORD_TO_CATEGORY_SLUG[t]
            matched_slugs[slug] = matched_slugs.get(slug, 0) + 1

    target_slug = None
    confidence = 0.5

    if matched_slugs:
        sorted_slugs = sorted(matched_slugs.items(), key=lambda x: x[1], reverse=True)
        target_slug = sorted_slugs[0][0]
        confidence = min(0.95, 0.65 + (0.10 * sorted_slugs[0][1]))

    # 2. Database category resolution
    category = None
    if target_slug:
        category = db.exec(
            select(Category).where(
                or_(
                    Category.slug == target_slug,
                    Category.slug.ilike(f"%{target_slug}%"),
                )
            )
        ).first()

    # 3. If no match, check if any Category name appears directly in the title
    if not category:
        all_categories = db.exec(select(Category)).all()
        for cat in all_categories:
            name_en = (cat.name_en or "").lower()
            if name_en and (name_en in combined_text or cat.slug in combined_text):
                category = cat
                confidence = 0.80
                break

    # 4. Fallback if still unmapped: pick first available category or defaults
    if not category:
        category = db.exec(select(Category)).first()
        confidence = 0.30

    if category:
        return {
            "category_id": category.id,
            "category_name": category.name_en or category.name_so or category.slug,
            "category_slug": category.slug,
            "confidence": round(confidence, 2),
            "source": "taxonomy_rules" if confidence >= 0.6 else "fallback",
        }

    return {
        "category_id": None,
        "category_name": "General",
        "category_slug": "general",
        "confidence": 0.0,
        "source": "none",
    }


def recommend_price(
    db: Session,
    title: str,
    category_id: Optional[int] = None,
    condition: Optional[str] = "Used",
    currency: str = "KES",
) -> Dict[str, Any]:
    """
    Computes statistically grounded price recommendations (median, min, max, confidence, demand)
    derived from existing active and sold listings.
    """
    tokens = re.findall(r"\b[a-zA-Z0-9]{3,}\b", (title or "").lower())
    significant_tokens = [
        t for t in tokens if t not in {
            "the", "and", "for", "with", "from", "sale", "used", "new", "original",
            "clean", "condition", "best", "price", "selling"
        }
    ]

    # Query comparable listings from database
    statement = select(Listing.price, Listing.views, Listing.leads).where(
        Listing.price > 0,
        or_(Listing.status == "active", Listing.is_sold == True),
    )

    if category_id:
        statement = statement.where(Listing.category_id == category_id)

    # Filter with token matches if significant tokens exist
    if significant_tokens:
        token_filters = []
        for t in significant_tokens[:3]:
            token_filters.append(Listing.title_en.ilike(f"%{t}%"))
            token_filters.append(Listing.title_so.ilike(f"%{t}%"))
        statement = statement.where(or_(*token_filters))

    rows = db.exec(statement.limit(80)).all()

    prices: List[float] = []
    total_views = 0
    total_leads = 0

    for r in rows:
        p, v, l = r[0], r[1] or 0, r[2] or 0
        if p and p > 0:
            prices.append(float(p))
            total_views += v
            total_leads += l

    sample_size = len(prices)

    if sample_size >= 3:
        prices.sort()
        # Compute real statistics
        min_p = prices[0]
        max_p = prices[-1]
        median_p = statistics.median(prices)
        
        # 25th and 75th percentiles
        q25 = prices[len(prices) // 4]
        q75 = prices[(len(prices) * 3) // 4]

        # Condition adjustments
        cond_lower = (condition or "").lower()
        if cond_lower in ["new", "brand new"]:
            suggested_price = (median_p + q75) / 2.0
        elif cond_lower in ["refurbished"]:
            suggested_price = median_p
        else: # Used
            suggested_price = (q25 + median_p) / 2.0

        avg_leads = total_leads / sample_size if sample_size else 0
        demand_level = "high" if avg_leads >= 3 else "medium" if avg_leads >= 1 else "low"
        confidence = "high" if sample_size >= 10 else "medium"

        return {
            "recommended_price": round(suggested_price, 0),
            "min_price": round(min_p, 0),
            "max_price": round(max_p, 0),
            "median_price": round(median_p, 0),
            "q25_price": round(q25, 0),
            "q75_price": round(q75, 0),
            "currency": currency,
            "sample_size": sample_size,
            "confidence": confidence,
            "demand_level": demand_level,
            "data_source": "marketplace_historical_data",
        }

    # If few or no samples, find category slug to retrieve benchmark baseline
    benchmark = None
    if category_id:
        cat = db.get(Category, category_id)
        if cat and cat.slug in CATEGORY_PRICE_BENCHMARKS:
            benchmark = CATEGORY_PRICE_BENCHMARKS[cat.slug]

    if not benchmark:
        benchmark = {"min": 1000.0, "median": 8500.0, "max": 35000.0}

    cond_lower = (condition or "").lower()
    mult = 1.25 if cond_lower in ["new", "brand new"] else 0.85 if cond_lower in ["used"] else 1.0
    rec_price = benchmark["median"] * mult

    return {
        "recommended_price": round(rec_price, 0),
        "min_price": round(benchmark["min"], 0),
        "max_price": round(benchmark["max"], 0),
        "median_price": round(benchmark["median"], 0),
        "q25_price": round(benchmark["min"] * 1.5, 0),
        "q75_price": round(benchmark["max"] * 0.75, 0),
        "currency": currency,
        "sample_size": sample_size,
        "confidence": "baseline_estimate",
        "demand_level": "medium",
        "data_source": "category_benchmarks",
    }


def suggest_listing_metadata(
    db: Session,
    raw_text: str,
    location: Optional[str] = None,
    currency: str = "KES",
) -> Dict[str, Any]:
    """
    Unified 10-Second listing intelligence endpoint:
    Given raw user input (e.g. 'iPhone 13 pro max 128gb used Nairobi'),
    parses entities, suggests category, estimates price, and formats titles.
    """
    parsed = parse_natural_language_search(raw_text)
    effective_title = parsed["clean_keywords"] or raw_text
    effective_loc = location or parsed["detected_location"] or "Nairobi"
    effective_cond = parsed["detected_condition"] or "Used"

    # Category prediction
    cat_pred = predict_category(db, title=effective_title)
    category_id = cat_pred.get("category_id")

    # Pricing recommendation
    price_rec = recommend_price(
        db,
        title=effective_title,
        category_id=category_id,
        condition=effective_cond,
        currency=currency,
    )

    clean_title = effective_title.title()
    title_en = f"{clean_title} ({effective_cond})"
    desc_en = f"Genuine {clean_title} in {effective_cond.lower()} condition. Located in {effective_loc}. Serious buyers welcome."
    desc_so = f"{clean_title} asalka ah oo xaaladdiisu tahay {effective_cond.lower()}. Waxay ku taallaa {effective_loc}. Fadlan nala soo xiriir."

    return {
        "title_en": title_en,
        "title_so": f"{clean_title} - {effective_loc}",
        "description_en": desc_en,
        "description_so": desc_so,
        "category_id": category_id,
        "category_name": cat_pred.get("category_name"),
        "category_slug": cat_pred.get("category_slug"),
        "condition": effective_cond,
        "location": effective_loc,
        "recommended_price": price_rec.get("recommended_price"),
        "price_range": {
            "min": price_rec.get("min_price"),
            "max": price_rec.get("max_price"),
        },
        "currency": currency,
        "confidence": cat_pred.get("confidence"),
        "demand_level": price_rec.get("demand_level"),
    }

