from sqlmodel import Session, select
from app.db.session import engine
from app.models import Category
from app.models.listing import SubCategory


CATEGORIES = [
    {
        "name": "Raashinka & Cuntada (Food & Groceries)",
        "slug": "food-groceries",
        "icon_name": "utensils",
        "subcategories": [
            "Qudaarta (Vegetables)",
            "Miraha (Fruits)",
            "Bariiska & Baastada (Rice & Pasta)",
            "Hilibka (Meat)",
            "Kalluun & Cunto Badeed (Seafood)",
            "Caanaha & Caanaha La'eg (Milk & Dairy)",
            "Ukunta (Eggs)",
            "Cuntooyinka Diyaarsan (Prepared Foods)",
        ],
    },
    {
        "name": "Dharka & Kabaha (Clothing & Shoes)",
        "slug": "clothing-shoes",
        "icon_name": "fashion",
        "subcategories": [
            "Dharka Ragga (Men's Clothing)",
            "Dharka Dumarka (Women's Clothing)",
            "Dharka Carruurta (Children's Clothing)",
            "Kabaha (Shoes)",
            "Agabka Dharka (Clothing Accessories)",
        ],
    },
    {
        "name": "Alaabta Guriga (Household Items)",
        "slug": "household-items",
        "icon_name": "home-living",
        "subcategories": [
            "Qalabka Jikada (Kitchenware)",
            "Gogosha (Bedding)",
            "Alaabta Qurxinta (Home Décor)",
            "Qalabka Nadaafadda (Cleaning Supplies)",
            "Qalabka Korontada (Appliances)",
        ],
    },
    {
        "name": "Korontada & Elektaroonigga (Electronics)",
        "slug": "electronics",
        "icon_name": "laptop",
        "subcategories": [
            "Mobaylada (Mobile Phones)",
            "Kombiyuutarada (Computers)",
            "TV-yada (TVs)",
            "Qalabka Elektaroonigga Kale (Other Electronics)",
            "Qalabka Dhagaha & Codka (Audio & Headphones)",
        ],
    },
    {
        "name": "Gaadiidka (Vehicles)",
        "slug": "vehicles",
        "icon_name": "car",
        "subcategories": [
            "Baabuurta (Cars)",
            "Mootooyinka (Motorcycles)",
            "Bajaajta (Tuk-tuks)",
            "Qalabka Gaadiidka (Vehicle Accessories)",
        ],
    },
    {
        "name": "Xoolaha Nool (Livestock)",
        "slug": "livestock",
        "icon_name": "animals",
        "subcategories": [
            "Riyaha (Goats)",
            "Idaha (Sheep)",
            "Lo'da (Cattle)",
            "Digaagga (Chickens)",
            "Geela (Camels)",
        ],
    },
    {
        "name": "Dhul & Beeraha (Land & Farms)",
        "slug": "land-farms",
        "icon_name": "agriculture",
        "subcategories": [
            "Dhul Banaan (Vacant Land)",
            "Beeraha (Farms)",
            "Dhul Beereed (Agricultural Land)",
        ],
    },
]


def make_slug(name: str) -> str:
    return (
        name.lower()
        .replace(" ", "-")
        .replace("(", "")
        .replace(")", "")
        .replace("'", "")
        .replace("&", "and")
        .replace(".", "")
        .strip("-")
    )


def seed_categories():
    with Session(engine) as session:
        for cat_data in CATEGORIES:
            # Upsert category — find by slug OR name
            existing = session.exec(
                select(Category).where(Category.slug == cat_data["slug"])
            ).first()
            if not existing:
                existing = session.exec(
                    select(Category).where(Category.name == cat_data["name"])
                ).first()

            if not existing:
                cat = Category(
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    icon_name=cat_data["icon_name"],
                )
                session.add(cat)
                session.flush()
                cat_id = cat.id
                print(f"Created category: {cat_data['name']}")
            else:
                existing.name = cat_data["name"]
                existing.slug = cat_data["slug"]
                existing.icon_name = cat_data["icon_name"]
                session.add(existing)
                session.flush()
                cat_id = existing.id
                print(f"Updated category: {cat_data['name']}")

            # Remove old subcategories for this category
            old_subs = session.exec(
                select(SubCategory).where(SubCategory.category_id == cat_id)
            ).all()
            for sub in old_subs:
                session.delete(sub)
            session.flush()

            # Insert fresh subcategories
            for sub_name in cat_data["subcategories"]:
                sub = SubCategory(
                    name=sub_name,
                    slug=make_slug(sub_name),
                    category_id=cat_id,
                )
                session.add(sub)
                print(f"  + {sub_name}")

        session.commit()
    print("\nAll categories and subcategories seeded successfully.")


if __name__ == "__main__":
    seed_categories()
