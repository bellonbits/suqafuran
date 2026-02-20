from sqlmodel import Session, select
from app.db.session import engine
from app.models import Category

def seed_categories():
    categories = [
        {"name": "Raashinka & Cuntada (Food & Groceries)", "slug": "food-groceries", "icon_name": "utensils"},
        {"name": "Dharka & Kabaha (Clothing & Shoes)", "slug": "clothing-shoes", "icon_name": "fashion"},
        {"name": "Alaabta Guriga (Household Items)", "slug": "household-items", "icon_name": "home-living"},
        {"name": "Korontada & Elektaroonigga (Electronics)", "slug": "electronics", "icon_name": "laptop"},
        {"name": "Gaadiidka (Vehicles)", "slug": "vehicles", "icon_name": "car"},
        {"name": "Xoolaha Nool (Livestock)", "slug": "livestock", "icon_name": "animals"},
        {"name": "Dhul & Beeraha (Land & Farms)", "slug": "land-farms", "icon_name": "agriculture"},
    ]
    
    with Session(engine) as session:
        for cat_data in categories:
            # Check if exists
            statement = select(Category).where(Category.slug == cat_data["slug"])
            existing_cat = session.exec(statement).first()
            if not existing_cat:
                cat = Category(**cat_data)
                session.add(cat)
            else:
                # Update name if changed
                existing_cat.name = cat_data["name"]
                existing_cat.icon_name = cat_data["icon_name"]
                session.add(existing_cat)
        session.commit()
    print("Categories synced successfully!")

if __name__ == "__main__":
    seed_categories()
