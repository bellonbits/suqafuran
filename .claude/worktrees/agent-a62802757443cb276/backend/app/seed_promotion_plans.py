from sqlmodel import Session, select
from app.db.session import engine
from app.models.promotion import PromotionPlan

def seed_promotion_plans():
    plans = [
        {"name": "Standard Boost", "description": "Basic visibility boost", "price_usd": 15.0, "duration_days": 7},
        {"name": "Premium Boost", "description": "Enhanced visibility boost", "price_usd": 30.0, "duration_days": 14},
        {"name": "Diamond Boost", "description": "Maximum visibility boost", "price_usd": 45.0, "duration_days": 30},
    ]
    
    with Session(engine) as session:
        for plan_data in plans:
            statement = select(PromotionPlan).where(PromotionPlan.name == plan_data["name"])
            existing = session.exec(statement).first()
            if existing:
                print(f"Updating plan: {plan_data['name']}")
                existing.price_usd = plan_data["price_usd"]
                existing.description = plan_data["description"]
                existing.duration_days = plan_data["duration_days"]
                session.add(existing)
            else:
                print(f"Adding plan: {plan_data['name']}")
                plan = PromotionPlan(**plan_data)
                session.add(plan)
        
        session.commit()
    print("Promotion plans seeded successfully!")

if __name__ == "__main__":
    seed_promotion_plans()
