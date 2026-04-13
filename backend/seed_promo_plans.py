import os
import sys

# Ensure backend directory is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from sqlmodel import Session, select
from app.db.session import engine
from app.models.promotion import PromotionPlan

def seed_promo_plans():
    promo_plans = [
        {"name": "Top", "price_usd": 3.50, "duration_days": 7, "description": "Top results for 7 days"},
        {"name": "Premium", "price_usd": 11.53, "duration_days": 30, "description": "Premium positioning for 30 days"},
        {"name": "VIP", "price_usd": 18.84, "duration_days": 30, "description": "Guaranteed 1st page visibility with VIP badge"},
    ]

    with Session(engine) as session:
        for p_data in promo_plans:
            existing = session.exec(select(PromotionPlan).where(PromotionPlan.name == p_data["name"])).first()
            if not existing:
                plan = PromotionPlan(**p_data)
                session.add(plan)
                print(f"Added plan: {p_data['name']}")
            else:
                existing.price_usd = p_data["price_usd"]
                existing.duration_days = p_data["duration_days"]
                existing.description = p_data["description"]
                session.add(existing)
                print(f"Updated plan: {p_data['name']}")
        
        session.commit()
        print("Seeded Jiji-equivalent promotion plans.")

if __name__ == "__main__":
    seed_promo_plans()
