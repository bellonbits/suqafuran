import re
from typing import str
from app.services.ai_shopper.schemas import ShoppingIntentType


def classify_shopping_intent(query: str, history_len: int = 0) -> str:
    """
    Classifies the user query into a primary shopping intent.
    Fast, rule-anchored classifier with regex and semantic context.
    """
    q = query.lower().strip()

    # 1. Product comparison intent
    if re.search(r"\b(compare|comparison|versus|vs\.?|difference\s+between|which\s+(one\s+)?is\s+better)\b", q):
        return ShoppingIntentType.COMPARE

    # 2. Seller discovery intent
    if re.search(r"\b(seller|sellers|shop|shops|store|stores|dealer|dealers|who\s+sells|vendor)\b", q):
        return ShoppingIntentType.SELLER_DISCOVERY

    # 3. Product alternative intent
    if re.search(r"\b(alternative|alternatives|similar\s+to|substitute|instead\s+of|replacement)\b", q):
        return ShoppingIntentType.PRODUCT_ALTERNATIVE

    # 4. Budget specific intent
    if re.search(r"\b(under|below|less\s+than|budget|cheap|affordable|bei\s+rahisi|maximum|up\s+to)\s*(?:ksh|kes)?\s*\d+", q):
        return ShoppingIntentType.BUDGET_QUERY

    # 5. Short follow-up / clarification answer in multi-turn conversation
    if history_len > 0 and len(q.split()) <= 4:
        return ShoppingIntentType.CLARIFICATION

    # 6. General search
    if len(q.split()) >= 1 and not re.search(r"^(hi|hello|hey|jambo|habari|good\s+morning|sasa)\b", q):
        return ShoppingIntentType.SEARCH

    return ShoppingIntentType.GENERAL
