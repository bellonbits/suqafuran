import json
import os
from sqlmodel import Session, create_engine, select
from app.core.config import settings
from app.models.listing import Category, SubCategory, Listing
from app.models.user import User
from app.core.security import get_password_hash
from datetime import datetime

# Database engine
engine = create_engine(settings.DATABASE_URL)

def seed_data():
    with Session(engine) as session:
        # 1. Create a sample user if not exists
        user = session.exec(select(User).where(User.email == "peter@example.com")).first()
        if not user:
            user = User(
                full_name="Peter Gatitu Mwangi",
                email="peter@example.com",
                phone="0793046776",
                hashed_password=get_password_hash("password123"),
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

        # 2. Categories & Subcategories
        categories_data = [
            {
                "name": "Agriculture & Food",
                "slug": "agriculture-food",
                "icon_name": "Leaf",
                "subcategories": [
                    {"name": "Vegetables", "slug": "vegetables", "attributes_schema": [
                        {"name": "brand", "label": "Brand", "type": "select", "options": ["Local", "Export", "Organic"]},
                        {"name": "type", "label": "Type", "type": "select", "options": ["Fresh", "Dried", "Frozen"]}
                    ]},
                    {"name": "Fruits", "slug": "fruits"},
                    {"name": "Grains", "slug": "grains"},
                    {"name": "Livestock", "slug": "livestock"},
                ]
            },
            {
                "name": "Vehicles",
                "slug": "vehicles",
                "icon_name": "Car",
                "subcategories": [
                    {"name": "Cars", "slug": "cars"},
                    {"name": "Motorcycles", "slug": "motorcycles"},
                    {"name": "Trucks", "slug": "trucks"},
                ]
            }
        ]

        for cat_data in categories_data:
            cat = session.exec(select(Category).where(Category.slug == cat_data["slug"])).first()
            if not cat:
                cat = Category(
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    icon_name=cat_data["icon_name"]
                )
                session.add(cat)
                session.commit()
                session.refresh(cat)
            
            for sub_data in cat_data.get("subcategories", []):
                sub = session.exec(select(SubCategory).where(SubCategory.slug == sub_data["slug"])).first()
                if not sub:
                    sub = SubCategory(
                        name=sub_data["name"],
                        slug=sub_data["slug"],
                        category_id=cat.id,
                        attributes_schema=sub_data.get("attributes_schema", [])
                    )
                    session.add(sub)
        
        session.commit()

        # 3. Sample Listings for the user
        # Active Listing
        active_ad = session.exec(select(Listing).where(Listing.title == "Fresh Organic Kales")).first()
        if not active_ad:
            active_ad = Listing(
                title="Fresh Organic Kales",
                description="Very fresh organic kales from my farm.",
                price=5600,
                location="Nairobi",
                condition="New",
                category_id=1,
                subcategory_id=1,
                status="active",
                owner_id=user.id,
                images=["https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg"]
            )
            session.add(active_ad)

        # Declined Listing (matching Jiji screenshot)
        declined_ad = session.exec(select(Listing).where(Listing.title == "Camel for Sale")).first()
        if not declined_ad:
            declined_ad = Listing(
                title="Camel for Sale",
                description="Healthy camel for sale in Mogadishu.",
                price=5600,
                location="Mogadishu",
                condition="Used",
                category_id=1,
                subcategory_id=1,
                status="reported", # Jiji's declined can map to 'reported' or a new 'declined' status
                rejection_reason="Unrelated photo",
                admin_notes={"mistakes": ["Unrelated photo"], "count": 1},
                owner_id=user.id,
                images=["https://images.pexels.com/photos/206673/pexels-photo-206673.jpeg"]
            )
            session.add(declined_ad)
        
        session.commit()
        print("✅ Production seeding completed successfully!")

if __name__ == "__main__":
    seed_data()
