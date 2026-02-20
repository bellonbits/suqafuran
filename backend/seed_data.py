
import asyncio
import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.db.session import engine, init_db
from app.models.listing import Category, Listing
from app.models.user import User
from app.core.security import get_password_hash

# Somali Marketplace Categories (Somali + English)
SOMALI_CATEGORIES = [
    {
        "id": "food-groceries",
        "name": "Raashinka & Cuntada (Food & Groceries)",
        "icon": "utensils",
        "subcategories": [
            "1 Qudaarta (Vegetables)",
            "2 Miraha (Fruits)",
            "3 Bariiska & Baastada (Rice & Pasta)",
            "4 Hilibka (Meat)",
            "5 Kalluun & Cunto Badeed (Seafood)",
            "6 Caanaha & Caanaha La'eg (Milk & Dairy)",
            "7 Ukunta (Eggs)",
            "8 Cuntooyinka Diyaarsan (Prepared Foods)"
        ]
    },
    {
        "id": "clothing-shoes",
        "name": "Dharka & Kabaha (Clothing & Shoes)",
        "icon": "shopping-bag",
        "subcategories": [
            "1 Dharka Ragga (Men’s Clothing)",
            "2 Dharka Dumarka (Women’s Clothing)",
            "3 Dharka Carruurta (Children’s Clothing)",
            "4 Kabaha (Shoes)",
            "5 Agabka Dharka (Clothing Accessories)"
        ]
    },
    {
        "id": "household",
        "name": "Alaabta Guriga (Household Items)",
        "icon": "home",
        "subcategories": [
            "1 Qalabka Jikada (Kitchenware)",
            "2 Gogosha (Bedding)",
            "3 Alaabta Qurxinta (Home Décor)",
            "4 Qalabka Nadaafadda (Cleaning Supplies)",
            "5 Qalabka Korontada (Appliances)"
        ]
    },
    {
        "id": "electronics",
        "name": "Korontada & Elektaroonigga (Electronics)",
        "icon": "smartphone",
        "subcategories": [
            "1 Mobaylada (Mobile Phones)",
            "2 Kombiyuutarada (Computers)",
            "3 TV-yada (TVs)",
            "4 Qalabka Elektaroonigga Kale (Other Electronics)",
            "5 Qalabka Dhagaha & Codka (Audio & Headphones)"
        ]
    },
    {
        "id": "vehicles",
        "name": "Gaadiidka (Vehicles)",
        "icon": "car",
        "subcategories": [
            "1 Baabuurta (Cars)",
            "2 Mootooyinka (Motorcycles)",
            "3 Bajaajta (Tuk-tuks)",
            "4 Qalabka Gaadiidka (Vehicle Accessories)"
        ]
    },
    {
        "id": "livestock",
        "name": "Xoolaha Nool (Livestock)",
        "icon": "paw-print",
        "subcategories": [
            "1 Riyaha (Goats)",
            "2 Idaha (Sheep)",
            "3 Lo’da (Cattle)",
            "4 Digaagga (Chickens)",
            "5 Geela (Camels)"
        ]
    },
    {
        "id": "land-farms",
        "name": "Dhul & Beeraha (Land & Farms)",
        "icon": "tree-pine",
        "subcategories": [
            "1 Dhul Banaan (Vacant Land)",
            "2 Beeraha (Farms)",
            "3 Dhul Beereed (Agricultural Land)"
        ]
    }
]

# Legacy JIJI categories mapping (for backward compatibility if needed)
JIJI_CATEGORIES = SOMALI_CATEGORIES

async def create_seed_data(session: Session):
    print("Seeding categories...")
    # existing_categories = session.exec(select(Category)).all()
    # if existing_categories:
    #     print("Categories already exist. Skipping...")
    #     return

    for cat_data in SOMALI_CATEGORIES:
        category = session.exec(select(Category).where(Category.slug == cat_data["id"])).first()
        if not category:
            category = Category(
                name=cat_data["name"],
                slug=cat_data["id"],
                icon_name=cat_data["icon"],
                attributes_schema={"subcategories": cat_data["subcategories"]}
            )
            session.add(category)
            print(f"Added category: {category.name}")
        else:
             # Update existing category if name/subcategories changed
            category.name = cat_data["name"]
            category.attributes_schema = {"subcategories": cat_data["subcategories"]}
            session.add(category)
            print(f"Updated category: {category.name}")
    
    session.commit()
    print("Seeding complete.")

async def main():
    print("Creating tables...")
    # This might be redundant if using alembic, but safe for dev
    init_db() 
    
    with Session(engine) as session:
        await create_seed_data(session)

if __name__ == "__main__":
    asyncio.run(main())
