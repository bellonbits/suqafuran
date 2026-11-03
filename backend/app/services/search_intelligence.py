"""
Search Query Intelligence & Semantic Enrichment Service.

Provides:
1. Natural language query parsing (extracts keyword, category, price constraints, location, condition).
2. East African multilingual synonym expansion (English, Swahili, Somali).
3. African city & geographic hub recognition.
4. Fuzzy spell correction and token normalization for zero-result mitigation.
"""

from typing import Dict, Any, List, Optional, Set, Tuple
import re

# Comprehensive East African multilingual synonym mappings
SYNONYM_GROUPS: List[Set[str]] = [
    # Vehicles
    {"car", "cars", "gari", "magari", "baabuur", "motokaa", "vehicle", "automobile"},
    {"motorcycle", "motorcycles", "pikipiki", "boda", "bodaboda", "bajaj", "mootada"},
    {"truck", "lori", "malori", "baabuur xamuul", "tipper"},
    # Phones & Computers
    {"phone", "phones", "simu", "telfoon", "telefoon", "smartphone", "smartphones", "mobile"},
    {"laptop", "laptops", "kompyuta", "computer", "computers", "notebook", "macbook"},
    {"tv", "tvs", "television", "runtaa", "televisheni", "screen"},
    # Real Estate & Land
    {"house", "houses", "nyumba", "guri", "apartment", "apartments", "mansion", "villa"},
    {"land", "plot", "plots", "ardhi", "dhul", "shamba", "mashamba"},
    # Fashion & Shoes
    {"shoes", "shoe", "viatu", "kiatu", "kabaal", "sneakers", "boots", "loafers"},
    {"clothes", "clothing", "nguo", "dhar", "dress", "shirts", "shirt", "trousers"},
    {"bag", "bags", "mkoba", "mikoba", "boorso"},
    # Home & Appliances
    {"sofa", "sofas", "couch", "kiti", "viti", "kursi"},
    {"bed", "beds", "kitanda", "vitanda", "sariir"},
    {"fridge", "refrigerator", "jokofu", "qaboojiye"},
    # Jobs & Services
    {"job", "jobs", "kazi", "shaqo", "vacancy", "vacancies"},
]

# Major East African geographic hubs
EAST_AFRICAN_LOCATIONS = {
    # Kenya
    "nairobi", "mombasa", "kisumu", "nakuru", "eldoret", "thika", "malindi",
    "kilifi", "machakos", "meru", "garissa", "kitale", "nyeri", "naivasha",
    # Somalia / Somaliland
    "mogadishu", "hargeisa", "garowe", "bosaso", "kismayo", "berbera", "burao",
    "baidoa", "galkayo",
    # Uganda
    "kampala", "entebbe", "jinja", "gulu", "mbarara",
    # Tanzania
    "dar es salaam", "arusha", "dodoma", "mwanza", "zanzibar",
    # Rwanda
    "kigali",
}

# Category hints
CATEGORY_HINTS = {
    "electronics": ["phone", "simu", "telfoon", "laptop", "kompyuta", "tv", "camera", "tablet", "ipad", "iphone", "samsung"],
    "vehicles": ["car", "gari", "baabuur", "toyota", "nissan", "subaru", "mercedes", "motorcycle", "pikipiki", "boda", "truck", "lori"],
    "property": ["house", "nyumba", "guri", "apartment", "plot", "land", "ardhi", "dhul", "shamba", "rent", "kodi"],
    "fashion": ["shoes", "viatu", "kabaal", "clothes", "nguo", "dhar", "dress", "suit", "sneakers", "bag", "mkoba"],
    "home-appliances": ["sofa", "kitanda", "sariir", "fridge", "jokofu", "cooker", "bed", "furniture"],
    "services": ["service", "fundi", "cleaning", "repair", "plumber", "electrician", "kazi"],
}

# Common typos dictionary for fuzzy fallback
COMMON_TYPOS = {
    "iphne": "iphone",
    "iphoen": "iphone",
    "samsng": "samsung",
    "samusng": "samsung",
    "toyta": "toyota",
    "nairbi": "nairobi",
    "mombas": "mombasa",
    "lapotp": "laptop",
    "leptop": "laptop",
    "tv": "television",
    "kompyutr": "kompyuta",
    "shos": "shoes",
    "boda": "bodaboda",
    "suv": "car",
}


def expand_synonyms(query: str) -> List[str]:
    """
    Given a search term or query, returns a deduplicated list of multilingual synonyms.
    """
    terms = query.lower().split()
    expanded_set: Set[str] = set()

    for term in terms:
        for group in SYNONYM_GROUPS:
            if term in group:
                expanded_set.update(group)

    # Return terms excluding original words if available, or combined
    return sorted(list(expanded_set))


def normalize_and_spellcheck(query: str) -> str:
    """Correct frequent typos and strip punctuation."""
    words = re.findall(r"\b[\w'-]+\b", query.lower())
    corrected = [COMMON_TYPOS.get(w, w) for w in words]
    return " ".join(corrected)


def parse_natural_language_search(query: str) -> Dict[str, Any]:
    """
    Parses a natural language search query into structured filters and expanded terms.
    E.g. "clean used iphone 13 in nairobi under 50k" ->
    {
        "original_query": "clean used iphone 13 in nairobi under 50k",
        "clean_keywords": "iphone 13",
        "detected_location": "Nairobi",
        "min_price": None,
        "max_price": 50000.0,
        "detected_condition": "Used",
        "inferred_category": "electronics",
        "synonyms": ["simu", "telfoon", "smartphone"],
        "is_budget_query": True
    }
    """
    if not query:
        return {
            "original_query": "",
            "clean_keywords": "",
            "detected_location": None,
            "min_price": None,
            "max_price": None,
            "detected_condition": None,
            "inferred_category": None,
            "synonyms": [],
            "is_budget_query": False,
        }

    raw = query.strip()
    working = raw.lower()

    detected_location: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    detected_condition: Optional[str] = None
    inferred_category: Optional[str] = None
    is_budget_query = False

    # 1. Price extraction (e.g. "between 10k and 30k", "under 50k", "below 20000", "over 10k")
    between_match = re.search(
        r"(?:between|from)\s+(\d+(?:\.\d+)?)\s*(k|m)?\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)\s*(k|m)?",
        working,
    )
    if between_match:
        val1 = float(between_match.group(1))
        if between_match.group(2) == "k":
            val1 *= 1000
        elif between_match.group(2) == "m":
            val1 *= 1000000

        val2 = float(between_match.group(3))
        if between_match.group(4) == "k":
            val2 *= 1000
        elif between_match.group(4) == "m":
            val2 *= 1000000

        min_price = min(val1, val2)
        max_price = max(val1, val2)
        working = working.replace(between_match.group(0), " ")

    # Max price (under / below / less than)
    under_match = re.search(
        r"(?:under|below|less than|max(?:imum)?|chini ya)\s*(?:kes|usd|\$)?\s*(\d+(?:\.\d+)?)\s*(k|m)?",
        working,
    )
    if under_match:
        val = float(under_match.group(1))
        if under_match.group(2) == "k":
            val *= 1000
        elif under_match.group(2) == "m":
            val *= 1000000
        max_price = val
        working = working.replace(under_match.group(0), " ")

    # Min price (above / over / more than)
    over_match = re.search(
        r"(?:above|over|more than|min(?:imum)?|zaidi ya)\s*(?:kes|usd|\$)?\s*(\d+(?:\.\d+)?)\s*(k|m)?",
        working,
    )
    if over_match:
        val = float(over_match.group(1))
        if over_match.group(2) == "k":
            val *= 1000
        elif over_match.group(2) == "m":
            val *= 1000000
        min_price = val
        working = working.replace(over_match.group(0), " ")

    # Cheap / Budget qualifiers
    if re.search(r"\b(cheap|affordable|bei rahisi|jaban|bargain)\b", working):
        is_budget_query = True
        working = re.sub(r"\b(cheap|affordable|bei rahisi|jaban|bargain)\b", " ", working)

    # 2. Condition extraction
    if re.search(r"\b(brand new|mpya|cusub|new)\b", working):
        detected_condition = "New"
        working = re.sub(r"\b(brand new|mpya|cusub|new)\b", " ", working)
    elif re.search(r"\b(used|second hand|iliyotumika|la isticmaalay)\b", working):
        detected_condition = "Used"
        working = re.sub(r"\b(used|second hand|iliyotumika|la isticmaalay)\b", " ", working)
    elif re.search(r"\b(refurbished)\b", working):
        detected_condition = "Refurbished"
        working = re.sub(r"\b(refurbished)\b", " ", working)

    # 3. Location extraction
    # Strip optional "in", "at", "ndani ya", "ku yaala" before location
    for loc in EAST_AFRICAN_LOCATIONS:
        pattern = rf"\b(?:in|at|around|karibu|ku yaala)?\s*{re.escape(loc)}\b"
        if re.search(pattern, working):
            detected_location = loc.title()
            working = re.sub(pattern, " ", working)
            break

    # 4. Inferred Category extraction
    for cat_slug, hints in CATEGORY_HINTS.items():
        if any(h in working for h in hints):
            inferred_category = cat_slug
            break

    # 5. Clean remaining keywords
    # Remove filler words
    filler_words = {
        "looking", "for", "need", "want", "selling", "sale", "buy", "clean",
        "original", "genuine", "good", "best", "available", "with", "and", "the"
    }
    raw_tokens = normalize_and_spellcheck(working).split()
    filtered_tokens = [t for t in raw_tokens if t not in filler_words and len(t) > 1]
    clean_keywords = " ".join(filtered_tokens)

    # Synonyms for the clean keyword
    synonyms = expand_synonyms(clean_keywords)

    return {
        "original_query": raw,
        "clean_keywords": clean_keywords if clean_keywords else raw,
        "detected_location": detected_location,
        "min_price": min_price,
        "max_price": max_price,
        "detected_condition": detected_condition,
        "inferred_category": inferred_category,
        "synonyms": synonyms,
        "is_budget_query": is_budget_query,
    }

