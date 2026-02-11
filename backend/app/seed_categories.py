from sqlmodel import Session, select
from app.db.session import engine
from app.models.listing import Category

def seed_categories():
    categories = [
        {"name": "Vehicles", "slug": "vehicles", "icon_name": "car"},
        {"name": "Property", "slug": "property", "icon_name": "home"},
        {"name": "Electronics", "slug": "electronics", "icon_name": "smartphone"},
        {"name": "Jobs", "slug": "jobs", "icon_name": "briefcase"},
        {"name": "Home & Furniture", "slug": "home-furniture", "icon_name": "sofa"},
        {"name": "Sports", "slug": "sports", "icon_name": "dumbbell"},
        {"name": "Health & Beauty", "slug": "health-beauty", "icon_name": "heart"},
        {"name": "Fashion", "slug": "fashion", "icon_name": "watch"},
        {"name": "Services", "slug": "services", "icon_name": "tool"},
        {"name": "Others", "slug": "others", "icon_name": "tag"},
    ]
    
    with Session(engine) as session:
        for cat_data in categories:
            # Check if exists
            statement = select(Category).where(Category.slug == cat_data["slug"])
            existing_cat = session.exec(statement).first()
            if not existing_cat:
                cat = Category(**cat_data)
                session.add(cat)
        session.commit()
    print("Categories seeded successfully!")

if __name__ == "__main__":
    seed_categories()
