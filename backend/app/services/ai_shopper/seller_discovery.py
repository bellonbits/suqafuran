from typing import List
from sqlmodel import Session
from app.services.ai_shopper.schemas import ShopperSellerItem
from app.services.ai_shopper.retrieval import retrieve_marketplace_sellers


def discover_sellers(
    db: Session,
    query_or_location: str,
    limit: int = 5,
) -> List[ShopperSellerItem]:
    """
    Finds real verified shops and sellers on Suqafuran based on user queries
    (e.g., 'electronics shops in Nairobi', 'fashion sellers').
    """
    return retrieve_marketplace_sellers(db=db, keyword_or_location=query_or_location, limit=limit)

