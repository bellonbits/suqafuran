AI_SHOPPER_SYSTEM_PROMPT = """You are Suqafuran AI Shopper, an intelligent conversational shopping assistant for Suqafuran — Kenya's modern marketplace.

Your role is to assist buyers with natural conversation, understand their intent, respect their constraints, and recommend genuine marketplace listings.

CORE RULES:
1. Zero Hallucination: NEVER invent products, prices, discounts, ratings, seller names, or availability. Every recommendation must originate from the actual listings provided in the context.
2. Hard Budget Constraint: If the user states a maximum budget, NEVER recommend or suggest products exceeding that budget. If no products exist under their budget, state that honestly and politely, and offer practical alternatives (e.g., expanding the budget or checking related categories).
3. Kenyan Marketplace Context: Communicate naturally in friendly, polite, simple English appropriate for Kenya. Use KSh for currency and recognize local areas (Nairobi, Eastleigh, Westlands, Gikomba, Kilimani, Mombasa, etc.).
4. Conversational Continuity: Maintain session context across follow-up queries (e.g. "show me cheaper ones", "other colors", "near Nairobi").
5. Identity: Be helpful, warm, and honest. Never pretend to be human.
6. Safety: Remind buyers to inspect products and agree on delivery/payment safely via Suqafuran chat. Never ask for M-Pesa PINs or passwords.
"""

def build_shopper_context_prompt(
    user_query: str,
    intent: str,
    extracted_params: dict,
    products: list,
    sellers: list,
    is_fallback: bool = False,
) -> str:
    product_lines = []
    for idx, p in enumerate(products[:6], 1):
        verified_tag = " [Verified Seller]" if p.get("is_verified") else ""
        product_lines.append(
            f"{idx}. {p.get('title')} — KSh {int(p.get('price', 0)):,} | "
            f"Condition: {p.get('condition', 'N/A')} | "
            f"Seller: {p.get('seller_name', 'Shop')}{verified_tag} | "
            f"Location: {p.get('location', 'Kenya')}"
        )

    products_text = "\n".join(product_lines) if product_lines else "No specific listings returned."

    seller_lines = []
    for s in sellers[:3]:
        seller_lines.append(f"- {s.get('name')} ({s.get('location', 'Nairobi')})")
    sellers_text = "\n".join(seller_lines) if seller_lines else "None"

    status_note = (
        "NOTE: Exact matches were not found in current inventory. The above are recommended alternatives or popular verified listings on Suqafuran."
        if is_fallback else
        "NOTE: The above listings match the user's search criteria."
    )

    return f"""USER SHOPPING REQUEST: "{user_query}"
DETECTED INTENT: {intent}
UNDERSTOOD PARAMETERS: {extracted_params}

{status_note}

AVAILABLE MARKETPLACE LISTINGS:
{products_text}

FEATURED SHOPS / SELLERS:
{sellers_text}

INSTRUCTIONS:
Write a helpful, concise shopping response (2-4 sentences) summarizing the best options for the user based strictly on the available listings above. Mention 1 or 2 standout items by name and price, and invite the user to inspect details or ask any follow-up question.
"""

