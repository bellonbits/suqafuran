import re
from app.services.ai_shopper.schemas import ShoppingIntentType, IntentType


def classify_shopping_intent(query: str, history_len: int = 0) -> str:
    """
    Classifies the user query into a primary shopping/conversational intent.
    Intelligently routes between:
    - GREETING: "Hey", "Hello", "Habari", "Sasa"
    - CASUAL: "How are you", "I'm just browsing", "Tell me about yourself"
    - MARKETPLACE_INFO: "What is Suqafuran", "How do I sell", "Payment methods", "Is it safe"
    - SUPPORT: "Contact support", "Report an issue", "Call human team"
    - INSPIRATION: "Gift ideas for girlfriend", "What should I wear to a wedding", "Ideas for office"
    - COMPARE: "Compare iPhone 12 vs 13", "Which laptop is better"
    - SELLER_DISCOVERY: "Shops in Eastleigh", "Verified sellers in Nairobi"
    - PRODUCT_ALTERNATIVE: "Alternative to Samsung TV", "Cheaper options"
    - BUDGET_QUERY: "Shoes under 3000 KSh", "Budget laptops below 30k"
    - CLARIFICATION: "Make it cheaper", "Show me black", "Size 42"
    - SEARCH: Explicit item queries ("Sneakers", "iPhone 14", "Cookware set")
    """
    q = query.lower().strip()
    words = q.split()

    # 1. Greetings (natural opening without forced product search)
    greeting_pattern = r"^(hi|hello|hey|heyy|jambo|habari|habari\s+yako|sasa|mambo|good\s+(morning|afternoon|evening|day)|what'?s\s+up|sup|hujambo|niaje|salute|halo)\b"
    if re.search(greeting_pattern, q):
        # If it's just a greeting like "hello", "hey there", "good morning"
        if len(words) <= 4 and not re.search(r"\b(buy|sell|price|cost|shoes?|phones?|laptops?|cars?|clothes?|dress|tv)\b", q):
            return ShoppingIntentType.GREETING

    # 2. Casual conversations (rapport, small talk, browsing)
    casual_patterns = [
        r"\bhow\s+are\s+you\b",
        r"\bhow('s|\s+is)\s+your\s+day\b",
        r"\bhow\s+is\s+it\s+going\b",
        r"\bi('m|\s+am)\s+(just\s+)?browsing\b",
        r"\bi('m|\s+am)\s+(just\s+)?looking\s+around\b",
        r"\bi('m|\s+am)\s+bored\b",
        r"\bwho\s+are\s+you\b",
        r"\bare\s+you\s+(a\s+)?(human|robot|ai|bot)\b",
        r"\bwhat\s+can\s+you\s+do\b",
        r"\btell\s+me\s+about\s+yourself\b",
        r"\btell\s+me\s+a\s+joke\b",
        r"\bnice\s+to\s+meet\s+you\b",
        r"\bthank\s*you\b|\bthanks\b|\basante\b",
    ]
    if any(re.search(p, q) for p in casual_patterns):
        if not re.search(r"\b(buy|under|price|show\s+me\s+products|search\s+for)\b", q):
            return ShoppingIntentType.CASUAL

    # 3. Marketplace information & how-it-works guidance
    marketplace_info_patterns = [
        r"\bwhat\s+is\s+suqafuran\b",
        r"\btell\s+me\s+about\s+suqafuran\b",
        r"\bhow\s+does\s+suqafuran\s+work\b",
        r"\bhow\s+(do\s+i|to)\s+(sell|post|list)\b",
        r"\bhow\s+(do\s+i|to)\s+register\b",
        r"\bhow\s+(do\s+i|to)\s+create\s+(a\s+)?shop\b",
        r"\b(pricing|subscription)\s+plans?\b",
        r"\bverified\s+badge\b|\bhow\s+to\s+get\s+verified\b",
        r"\bpayment\s+methods?\b|\bhow\s+do\s+i\s+pay\b|\blipana\b|\bm-?pesa\b",
        r"\bis\s+it\s+safe\b|\bfraud\s+shield\b|\bsafety\s+rules?\b",
        r"\bdelivery\s+policy\b|\bhow\s+does\s+delivery\s+work\b",
        r"\breturn\s+policy\b|\brefund\s+policy\b",
    ]
    if any(re.search(p, q) for p in marketplace_info_patterns):
        return ShoppingIntentType.MARKETPLACE_INFO

    # 4. Support / Human Assistance
    support_patterns = [
        r"\bcontact\s+(support|customer\s+care|help\s+desk|human)\b",
        r"\btalk\s+to\s+(a\s+)?(human|agent|person)\b",
        r"\bcall\s+support\b|\bphone\s+number\b|\bwhatsapp\s+number\b",
        r"\breport\s+(a\s+)?(scam|fraud|fake|problem)\b",
        r"\bdispute\b|\bcomplaint\b|\bhave\s+an\s+issue\s+with\b",
    ]
    if any(re.search(p, q) for p in support_patterns):
        return ShoppingIntentType.SUPPORT

    # 5. Product comparison intent
    if re.search(r"\b(compare|comparison|versus|vs\.?|difference\s+between|which\s+(one\s+)?is\s+better)\b", q):
        return ShoppingIntentType.COMPARE

    # 6. Seller / Shop discovery intent
    if re.search(r"\b(seller|sellers|shop|shops|store|stores|dealer|dealers|vendor|vendors)\s*(in|at|near|around)?\s*([a-z]+)?\b", q) and not re.search(r"\b(how\s+to\s+sell|i\s+want\s+to\s+sell)\b", q):
        if re.search(r"\b(who\s+sells|where\s+can\s+i\s+buy|find\s+shops|show\s+shops|verified\s+sellers)\b", q):
            return ShoppingIntentType.SELLER_DISCOVERY

    # 7. Ideas & Inspiration / Shopping advice
    inspiration_patterns = [
        r"\b(gift\s+ideas?|ideas?\s+for|what\s+should\s+i\s+(buy|get|wear))\b",
        r"\b(what\s+can\s+i\s+(get|buy)\s+(for|my))\b",
        r"\b(help\s+me\s+furnish|help\s+me\s+choose|inspire\s+me|give\s+me\s+ideas)\b",
        r"\b(recommend\s+something|what\s+do\s+you\s+recommend)\b",
        r"\bi\s+don'?t\s+know\s+what\s+to\s+buy\b",
        r"\bwhat\s+to\s+wear\s+(to|for)\b",
    ]
    if any(re.search(p, q) for p in inspiration_patterns):
        return ShoppingIntentType.INSPIRATION

    # 8. Product alternative / Follow-up intent
    if re.search(r"\b(alternative|alternatives|similar\s+to|substitute|instead\s+of|replacement|cheaper\s+one|different\s+color|other\s+options)\b", q):
        return ShoppingIntentType.PRODUCT_ALTERNATIVE

    # 9. Budget specific intent
    if re.search(r"\b(under|below|less\s+than|budget|cheap|affordable|bei\s+rahisi|maximum|up\s+to)\s*(?:ksh|kes)?\s*\d+", q):
        return ShoppingIntentType.BUDGET_QUERY

    # 10. Short follow-up / Clarification in ongoing conversation
    if history_len > 0 and len(words) <= 4:
        # e.g., "make it cheaper", "show black ones", "size 42", "Nairobi CBD", "yes please", "anything better?"
        return ShoppingIntentType.CLARIFICATION

    # 11. Explicit product search
    if len(words) >= 1:
        return ShoppingIntentType.SEARCH

    return ShoppingIntentType.GENERAL


# Backward compat alias
classify_intent = classify_shopping_intent


