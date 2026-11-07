import re
from typing import Dict, Any, Optional, List
from app.services.ai_shopper.schemas import ExtractedQueryParams
from app.services.search_intelligence import (
    EAST_AFRICAN_LOCATIONS,
    CATEGORY_HINTS,
    normalize_and_spellcheck,
)

KNOWN_BRANDS = [
    "apple", "iphone", "samsung", "hp", "dell", "lenovo", "asus", "acer", "macbook",
    "sony", "lg", "tcl", "hisense", "nike", "adidas", "puma", "jordan", "zara",
    "toyota", "nissan", "subaru", "mazda", "mercedes", "bmw", "honda", "infinix",
    "tecno", "xiaomi", "oppo", "redmi", "realme", "canon", "nikon"
]


def parse_shopping_request(query: str, existing_context: Optional[Dict[str, Any]] = None) -> ExtractedQueryParams:
    """
    Extracts structured marketplace shopping parameters from natural language.
    Preserves and updates conversational session context.
    """
    clean_raw = query.strip()
    norm = normalize_and_spellcheck(clean_raw)
    working = norm.lower()

    # 1. Comparison detection
    is_compare_query = bool(re.search(r"\b(compare|versus|vs\.?|difference\s+between)\b", working))
    
    # 2. Price extraction
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    is_budget_query = False

    between_match = re.search(
        r"(?:between|from)\s+(?:ksh|kes)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|m)?\s*(?:and|to|-)\s*(?:ksh|kes)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|m)?",
        working
    )
    if between_match:
        val1 = float(between_match.group(1).replace(",", ""))
        if between_match.group(2) == "k": val1 *= 1000
        elif between_match.group(2) == "m": val1 *= 1000000

        val2 = float(between_match.group(3).replace(",", ""))
        if between_match.group(4) == "k": val2 *= 1000
        elif between_match.group(4) == "m": val2 *= 1000000

        min_price = min(val1, val2)
        max_price = max(val1, val2)
        is_budget_query = True
        working = working.replace(between_match.group(0), " ")
    else:
        # Under / Below / Less than
        under_match = re.search(
            r"(?:under|below|less than|up to|max(?:imum)?|not more than|chini ya|<=?)\s*(?:ksh|kes)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|m)?",
            working
        )
        if under_match:
            val = float(under_match.group(1).replace(",", ""))
            if under_match.group(2) == "k": val *= 1000
            elif under_match.group(2) == "m": val *= 1000000
            max_price = val
            is_budget_query = True
            working = working.replace(under_match.group(0), " ")

        # Above / Over / More than
        over_match = re.search(
            r"(?:above|over|more than|at least|minimum|zaidi ya|>=?)\s*(?:ksh|kes)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|m)?",
            working
        )
        if over_match:
            val = float(over_match.group(1).replace(",", ""))
            if over_match.group(2) == "k": val *= 1000
            elif over_match.group(2) == "m": val *= 1000000
            min_price = val
            is_budget_query = True
            working = working.replace(over_match.group(0), " ")

    # 3. Location extraction
    detected_location: Optional[str] = None
    for loc in sorted(EAST_AFRICAN_LOCATIONS, key=len, reverse=True):
        if re.search(rf"\b(in|around|near|at)?\s*{re.escape(loc)}\b", working):
            detected_location = loc.capitalize()
            working = re.sub(rf"\b(in|around|near|at)?\s*{re.escape(loc)}\b", " ", working)
            break

    # Also detect Eastleigh / Westlands / CBD / Kilimani / Gikomba
    local_sub_hubs = ["eastleigh", "westlands", "cbd", "kilimani", "gikomba", "karen", "ngong", "kasarani", "roysambu"]
    for sub in local_sub_hubs:
        if sub in working:
            detected_location = f"{sub.capitalize()}, Nairobi"
            working = working.replace(sub, " ")
            break

    # 4. Condition extraction
    detected_condition: Optional[str] = None
    if re.search(r"\b(brand\s*new|sealed|new|mpya)\b", working):
        detected_condition = "New"
        working = re.sub(r"\b(brand\s*new|sealed|new|mpya)\b", " ", working)
    elif re.search(r"\b(refurbished|renewed|tested)\b", working):
        detected_condition = "Refurbished"
        working = re.sub(r"\b(refurbished|renewed|tested)\b", " ", working)
    elif re.search(r"\b(used|second\s*hand|secondhand|pre-owned|mitumba)\b", working):
        detected_condition = "Used"
        working = re.sub(r"\b(used|second\s*hand|secondhand|pre-owned|mitumba)\b", " ", working)

    # 5. Brand extraction
    detected_brand: Optional[str] = None
    for b in KNOWN_BRANDS:
        if re.search(rf"\b{re.escape(b)}\b", working):
            detected_brand = b.capitalize()
            break

    # 6. Category inference
    inferred_category_slug: Optional[str] = None
    for cat_slug, hints in CATEGORY_HINTS.items():
        if any(re.search(rf"\b{re.escape(h)}\b", working) for h in hints):
            inferred_category_slug = cat_slug
            break

    # 7. Specs extraction (e.g. 16GB RAM, 512GB SSD, 55 inch, Core i7)
    specs: Dict[str, Any] = {}
    ram_match = re.search(r"\b(\d{1,2}\s*gb)\s*(?:ram)?\b", working)
    if ram_match:
        specs["ram"] = ram_match.group(1).upper().replace(" ", "")

    ssd_match = re.search(r"\b(\d{2,4}\s*(?:gb|tb))\s*(?:ssd|storage|rom|hdd)?\b", working)
    if ssd_match:
        specs["storage"] = ssd_match.group(1).upper().replace(" ", "")

    inch_match = re.search(r"\b(\d{2})\s*(?:inch|\"|\'|in)\b", working)
    if inch_match:
        specs["screen_size"] = f"{inch_match.group(1)}\""

    # 8. Clean keywords for full-text search
    working_clean = re.sub(r"\b(?:within|on)\s+(?:a\s+|my\s+)?budget\b", " ", working)
    working_clean = re.sub(r"\b(?:help\s+me\s+choose|popular\s+products|fashion\s+deals|all\s+categories)\b", " ", working_clean)
    
    strip_tokens = [
        "find", "me", "show", "i", "need", "looking", "for", "a", "an", "the",
        "good", "best", "recommend", "cheap", "affordable", "please", "can",
        "you", "get", "where", "buy", "tell", "about", "compare", "versus", "vs", "which", "is", "better",
        "within", "budget", "choose", "popular", "products", "deals"
    ]
    words = working_clean.split()
    clean_words = [w for w in words if w not in strip_tokens and len(w) > 1]
    clean_keywords = " ".join(clean_words).strip()

    # Map semantic categories to root marketplace search keywords
    if re.search(r"\b(smartphones?|mobiles?)\b", clean_keywords):
        clean_keywords = re.sub(r"\b(smartphones?|mobiles?)\b", "phone", clean_keywords).strip()
    elif re.search(r"\b(notebooks?|macbooks?)\b", clean_keywords):
        clean_keywords = re.sub(r"\b(notebooks?|macbooks?)\b", "laptop", clean_keywords).strip()

    # Context preservation: If user gives partial follow-up, inherit from existing context
    if existing_context:
        if not detected_location and existing_context.get("location"):
            detected_location = existing_context["location"]
        if max_price is None and existing_context.get("max_price"):
            max_price = existing_context["max_price"]
        if not inferred_category_slug and existing_context.get("category_slug"):
            inferred_category_slug = existing_context["category_slug"]
        if not detected_brand and existing_context.get("brand"):
            detected_brand = existing_context["brand"]

    return ExtractedQueryParams(
        category_slug=inferred_category_slug,
        clean_keywords=clean_keywords,
        brand=detected_brand,
        condition=detected_condition,
        min_price=min_price,
        max_price=max_price,
        currency="KES",
        location=detected_location,
        required_specs=specs,
        is_budget_query=is_budget_query,
        is_compare_query=is_compare_query,
    )

