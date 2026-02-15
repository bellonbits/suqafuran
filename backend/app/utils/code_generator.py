"""
Promotion Code Generator Utility

Generates unique promotion codes in the format: YYYYMMDD-XXX-YYY
- YYYYMMDD: Current date
- XXX: Sequential number (001, 002, etc., resets daily)
- YYY: Random 3-digit number
"""

from datetime import datetime
import random
from sqlmodel import Session, select
from app.models.promotion import Promotion


def generate_promotion_code(db: Session) -> str:
    """
    Generate a unique promotion code.
    
    Format: YYYYMMDD-XXX-YYY
    Example: 20260215-004-729
    
    Args:
        db: Database session
        
    Returns:
        Unique promotion code string
    """
    today = datetime.utcnow().strftime("%Y%m%d")
    
    # Get count of promotions created today to determine sequential number
    statement = select(Promotion).where(
        Promotion.promotion_code.like(f"{today}-%")
    )
    today_promotions = db.exec(statement).all()
    sequential = len(today_promotions) + 1
    
    # Generate random 3-digit suffix
    random_suffix = random.randint(100, 999)
    
    # Format: YYYYMMDD-XXX-YYY
    code = f"{today}-{sequential:03d}-{random_suffix}"
    
    # Verify uniqueness (extremely unlikely to collide, but safety check)
    existing = db.exec(select(Promotion).where(Promotion.promotion_code == code)).first()
    if existing:
        # Regenerate with different random suffix
        random_suffix = random.randint(100, 999)
        code = f"{today}-{sequential:03d}-{random_suffix}"
    
    return code
