"""
AI-Powered Marketplace Recommendation Engine for Suqafuran.

Provides:
1. Content-based similarity ('Similar Listings') based on category, price, location, condition, and keyword semantics.
2. Personalized recommendations ('For You') combining user interaction signals, category affinities, and boost prioritization.
3. Cold-start fallback leveraging popularity, leads, and promotion weighting.
"""

from typing import List, Dict, Any, Optional, Set
import re
from datetime import datetime, timedelta
from sqlmodel import Session, select, func, or_
from app.models.listing import Listing
from app.models.interaction import Interaction


def _tokenize(text: str) -> Set[str]:
    """Tokenize and normalize text into non-trivial keyword tokens."""
    if not text:
        return set()
    tokens = re.findall(r"\b[a-zA-Z0-9]{3,}\b", text.lower())
    stop_words = {
        "the", "and", "for", "with", "from", "this", "that", "good", "best", "clean",
        "sale", "selling", "original", "used", "new", "available", "contact", "call"
    }
    return {t for t in tokens if t not in stop_words}


def get_similar_listings(
    db: Session,
    listing_id: int,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Find listings similar to the given listing_id using multi-dimensional attribute scoring.
    """
    target = db.get(Listing, listing_id)
    if not target:
        return []

    target_tokens = _tokenize(f"{target.title_en or ''} {target.title_so or ''}")
    target_price = float(target.price or 0.0)
    target_category = target.category_id
    target_subcategory = target.subcategory_id
    target_location = (target.location or "").strip().lower()

    # Retrieve candidate active listings
    query = (
        select(Listing)
        .where(Listing.status == "active")
        .where(Listing.is_sold == False)
        .where(Listing.id != listing_id)
    )

    if target_category:
        # Bias candidates towards same category or similar price band
        query = query.where(
            or_(
                Listing.category_id == target_category,
                Listing.subcategory_id == target_subcategory,
            )
        )

    candidates = db.exec(query.limit(100)).all()

    scored_items = []
    for cand in candidates:
        score = 0.0
        reasons = []

        # 1. Category / Subcategory similarity (Up to 40 pts)
        if target_subcategory and cand.subcategory_id == target_subcategory:
            score += 40.0
            reasons.append("Exact subcategory match")
        elif target_category and cand.category_id == target_category:
            score += 25.0
            reasons.append("Same product category")

        # 2. Price proximity (Up to 25 pts)
        cand_price = float(cand.price or 0.0)
        if target_price > 0 and cand_price > 0:
            diff_ratio = abs(cand_price - target_price) / max(target_price, cand_price)
            if diff_ratio <= 0.20:
                score += 25.0
                reasons.append("Very similar price range")
            elif diff_ratio <= 0.40:
                score += 15.0
                reasons.append("Comparable price range")
            elif diff_ratio <= 0.70:
                score += 5.0

        # 3. Location proximity (Up to 15 pts)
        cand_loc = (cand.location or "").strip().lower()
        if target_location and cand_loc and (target_location in cand_loc or cand_loc in target_location):
            score += 15.0
            reasons.append(f"Nearby in {cand.location}")

        # 4. Condition match (Up to 10 pts)
        if target.condition and cand.condition and target.condition.lower() == cand.condition.lower():
            score += 10.0
            reasons.append(f"Condition: {cand.condition}")

        # 5. Title token overlap (Up to 20 pts)
        cand_tokens = _tokenize(f"{cand.title_en or ''} {cand.title_so or ''}")
        overlap = len(target_tokens.intersection(cand_tokens))
        if overlap > 0:
            token_pts = min(20.0, overlap * 7.0)
            score += token_pts
            reasons.append("Matching title keywords")

        # 6. Boost multiplier from Phase 6
        boost = cand.boost_level or 0
        if boost > 0:
            multiplier = 1.0 + (0.15 * min(boost, 5))
            score *= multiplier
            reasons.append("Boosted listing")

        scored_items.append((score, cand, reasons))

    # Sort descending by score
    scored_items.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, cand, reasons in scored_items[:limit]:
        title = cand.title_en or cand.title_so or "Untitled"
        results.append({
            "id": cand.id,
            "title": title,
            "price": cand.price,
            "currency": cand.currency or "KES",
            "location": cand.location,
            "condition": cand.condition,
            "category_id": cand.category_id,
            "subcategory_id": cand.subcategory_id,
            "images": cand.images[:1] if cand.images else [],
            "boost_level": cand.boost_level or 0,
            "similarity_score": round(score, 1),
            "reasons": reasons[:3],
        })

    return results


def get_personalized_recommendations(
    db: Session,
    user_id: Optional[int] = None,
    guest_viewed_ids: Optional[List[int]] = None,
    limit: int = 12,
) -> List[Dict[str, Any]]:
    """
    Produce personalized listing recommendations for an authenticated user or guest session.
    """
    interacted_listing_ids: List[int] = []

    # 1. Collect user interactions from DB if user_id is provided
    if user_id:
        user_interactions = db.exec(
            select(Interaction.listing_id)
            .where(Interaction.buyer_id == user_id)
            .order_by(Interaction.created_at.desc())
            .limit(30)
        ).all()
        interacted_listing_ids.extend([lid for lid in user_interactions if lid])

    # 2. Append guest viewed listing IDs if provided
    if guest_viewed_ids:
        interacted_listing_ids.extend([int(gid) for gid in guest_viewed_ids if gid])

    # Remove duplicates while preserving order
    seen: Set[int] = set()
    history_ids = [lid for lid in interacted_listing_ids if not (lid in seen or seen.add(lid))]

    preferred_categories: Dict[int, int] = {}
    preferred_locations: Dict[str, int] = {}
    price_samples: List[float] = []

    if history_ids:
        history_listings = db.exec(
            select(Listing).where(Listing.id.in_(history_ids[:20]))
        ).all()
        for h in history_listings:
            if h.category_id:
                preferred_categories[h.category_id] = preferred_categories.get(h.category_id, 0) + 1
            if h.location:
                loc = h.location.strip().lower()
                preferred_locations[loc] = preferred_locations.get(loc, 0) + 1
            if h.price and h.price > 0:
                price_samples.append(float(h.price))

    median_price = (
        sorted(price_samples)[len(price_samples) // 2]
        if price_samples
        else None
    )

    # Candidate active listings (excluding listings user owns and already viewed)
    candidate_query = (
        select(Listing)
        .where(Listing.status == "active")
        .where(Listing.is_sold == False)
    )

    if user_id:
        candidate_query = candidate_query.where(Listing.owner_id != user_id)

    if history_ids:
        candidate_query = candidate_query.where(~Listing.id.in_(history_ids))

    # Fetch top candidates (order primarily by views, boost, and recency)
    candidates = db.exec(
        candidate_query
        .order_by(Listing.boost_level.desc(), Listing.created_at.desc())
        .limit(150)
    ).all()

    scored_items = []
    for cand in candidates:
        score = 10.0  # Base score for any active listing
        reasons = []

        # Category affinity
        if cand.category_id and cand.category_id in preferred_categories:
            weight = preferred_categories[cand.category_id]
            affinity_pts = min(40.0, weight * 15.0)
            score += affinity_pts
            reasons.append("Matches your interested categories")

        # Location affinity
        cand_loc = (cand.location or "").strip().lower()
        if cand_loc and cand_loc in preferred_locations:
            score += 20.0
            reasons.append(f"Available in your preferred city ({cand.location})")

        # Price proximity to user median
        if median_price and cand.price and cand.price > 0:
            diff_ratio = abs(float(cand.price) - median_price) / max(median_price, float(cand.price))
            if diff_ratio <= 0.30:
                score += 15.0
                reasons.append("Fits your typical price preference")

        # Popularity and leads signals
        views = cand.views or 0
        leads = cand.leads or 0
        if views > 20:
            score += min(15.0, views * 0.1)
        if leads > 2:
            score += min(15.0, leads * 1.5)
            reasons.append("Trending product with high buyer interest")

        # Boost multiplier from Phase 6
        boost = cand.boost_level or 0
        if boost > 0:
            multiplier = 1.0 + (0.20 * min(boost, 5))
            score *= multiplier
            reasons.append("Featured seller promotion")

        # Cold start fallback reason if no specific preference matched
        if not reasons:
            reasons.append("Popular on Suqafuran")

        scored_items.append((score, cand, reasons))

    scored_items.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, cand, reasons in scored_items[:limit]:
        title = cand.title_en or cand.title_so or "Untitled"
        results.append({
            "id": cand.id,
            "title": title,
            "price": cand.price,
            "currency": cand.currency or "KES",
            "location": cand.location,
            "condition": cand.condition,
            "category_id": cand.category_id,
            "subcategory_id": cand.subcategory_id,
            "images": cand.images[:1] if cand.images else [],
            "boost_level": cand.boost_level or 0,
            "recommendation_score": round(score, 1),
            "reasons": reasons[:2],
        })

    return results

