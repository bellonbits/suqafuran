from typing import List
from app.services.ai_shopper.schemas import ExtractedQueryParams, ShopperProductItem


def rank_and_explain_recommendations(
    products: List[ShopperProductItem],
    params: ExtractedQueryParams,
) -> List[ShopperProductItem]:
    """
    Ranks products using a multi-factor scoring model and generates honest explanations.
    """
    if not products:
        return []

    target_budget = params.max_price
    target_brand = (params.brand or "").lower()
    target_condition = (params.condition or "").lower()

    scored = []
    for p in products:
        score = 50.0  # baseline
        reasons = []

        # 1. Budget Fit
        if target_budget:
            if p.price <= target_budget:
                savings = target_budget - p.price
                pct_savings = (savings / target_budget) * 100
                score += 25.0
                if pct_savings >= 10:
                    reasons.append(f"Under your budget by KSh {int(savings):,}")
                else:
                    reasons.append(f"Fits within your KSh {int(target_budget):,} budget")
            elif p.price <= target_budget * 1.15:
                # Slightly above budget but worth considering
                score += 10.0
                reasons.append(f"Slightly above budget (KSh {int(p.price):,}) but high value")
            else:
                score -= 15.0

        # 2. Brand Match
        if target_brand and target_brand in p.title.lower():
            score += 20.0
            reasons.append(f"Matches preferred brand {params.brand}")

        # 3. Condition Match
        if target_condition and target_condition in (p.condition or "").lower():
            score += 10.0
            reasons.append(f"Matches {p.condition} condition")

        # 4. Seller Trust
        if p.is_verified:
            score += 15.0
            reasons.append("Offered by an ID/Business-verified shop")

        # 5. Compare at price discount
        if p.compare_at_price and p.compare_at_price > p.price:
            discount = int(p.compare_at_price - p.price)
            score += 10.0
            reasons.append(f"Active deal (Was KSh {int(p.compare_at_price):,})")

        explanation = ". ".join(reasons) if reasons else "Active verified listing on Suqafuran"
        p.match_score = score
        p.recommendation_reason = explanation
        scored.append((score, p))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored]

