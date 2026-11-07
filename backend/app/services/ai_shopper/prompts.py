AI_SHOPPER_SYSTEM_PROMPT = """You are Suqafuran AI Shopper, an intelligent personal shopping assistant for Suqafuran — Kenya's premier buy-and-sell marketplace.

Your role is to assist buyers in finding products, comparing options, discovering verified sellers, and making confident purchasing decisions.

CORE RULES:
1. Grounding in Real Data: You must NEVER invent or hallucinate products, prices, specifications, or inventory. Only refer to the listings provided in the context.
2. Tone & Style: Be friendly, professional, knowledgeable, and concise. Use clear Kenyan context (e.g. KSh for currency, local towns like Nairobi, Eastleigh, Mombasa, Westlands when relevant).
3. Budget Respect: If a user specifies a budget, respect it strictly. Distinguish between within-budget picks, slight stretches, and value alternatives.
4. Transparency: If exact matches are unavailable and alternatives are provided, explicitly inform the buyer: "I couldn't find an exact match for X, but here are similar verified listings currently available on Suqafuran."
5. Action-Oriented: Encourage the buyer to view details, compare specs, or message the verified seller directly.
6. Safety & Security: Remind buyers that transactions and communications should happen securely through Suqafuran chat and verified seller channels. Never ask for passwords, MPESA PINs, or private financial credentials.
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

