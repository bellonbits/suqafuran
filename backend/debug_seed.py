import traceback
import sys
from datetime import datetime, timedelta
from sqlmodel import Session, select, delete
from app.db.session import engine
from app.models import Listing, Category, User
from app.core.security import get_password_hash

def debug_seed():
    with Session(engine) as session:
        try:
            # Create Demo Users
            password_hash = get_password_hash("password123")
            
            users_data = [
                {
                    "full_name": "Somali Auto Spares",
                    "phone": "+252610000001",
                    "email": "auto@example.com",
                    "hashed_password": password_hash,
                    "is_verified": True,
                    "response_time": "Typically responds within minutes",
                    "verified_level": "guest",
                    "created_at": datetime.utcnow() - timedelta(days=1095)
                },
                {
                    "full_name": "Mogadishu Tech Hub",
                    "phone": "+252610000002",
                    "email": "tech@example.com",
                    "hashed_password": password_hash,
                    "is_verified": True,
                    "verified_level": "guest",
                    "response_time": "Typically responds in an hour",
                    "created_at": datetime.utcnow() - timedelta(days=730)
                },
                {
                    "full_name": "Oceanic Real Estate",
                    "phone": "+252610000003",
                    "email": "estate@example.com",
                    "hashed_password": password_hash,
                    "is_verified": True,
                    "verified_level": "guest",
                    "response_time": "Typically responds in a few hours",
                    "created_at": datetime.utcnow() - timedelta(days=365)
                },
                {
                    "full_name": "Guled Livestock",
                    "phone": "+252610000004",
                    "email": "guled@example.com",
                    "hashed_password": password_hash,
                    "is_verified": True,
                    "verified_level": "guest",
                    "response_time": "Responds immediately",
                    "created_at": datetime.utcnow() - timedelta(days=500)
                }
            ]
            
            users = []
            for u_data in users_data:
                statement = select(User).where(User.phone == u_data["phone"])
                existing_user = session.exec(statement).first()
                if not existing_user:
                    print(f"Adding user: {u_data['full_name']} with phone {u_data['phone']}")
                    user = User(**u_data)
                    session.add(user)
                    users.append(user)
                else:
                    print(f"User exists: {u_data['full_name']}")
                    users.append(existing_user)
            
            print("Committing users...")
            session.commit()
            for u in users:
                session.refresh(u)

            # Update Categories
            new_categories = [
                {"name": "Raashinka & Cuntada", "slug": "food-groceries", "icon_name": "utensils"},
                {"name": "Dharka & Kabaha", "slug": "clothing-shoes", "icon_name": "fashion"},
                {"name": "Alaabta Guriga", "slug": "household-items", "icon_name": "home-living"},
                {"name": "Korontada & Elektaroonigga", "slug": "electronics", "icon_name": "laptop"},
                {"name": "Gaadiidka", "slug": "vehicles", "icon_name": "car"},
                {"name": "Xoolaha Nool", "slug": "livestock", "icon_name": "animals"},
                {"name": "Dhul & Beeraha", "slug": "land-farms", "icon_name": "agriculture"}
            ]

            cat_map = {}
            for cat_data in new_categories:
                statement = select(Category).where(Category.slug == cat_data["slug"])
                cat = session.exec(statement).first()
                if not cat:
                    print(f"Adding category: {cat_data['name']}")
                    cat = Category(**cat_data)
                    session.add(cat)
                    session.commit()
                    session.refresh(cat)
                else:
                    print(f"Updating category: {cat_data['name']}")
                    cat.name = cat_data['name']
                    cat.icon_name = cat_data["icon_name"]
                    session.add(cat)
                    session.commit()
                    session.refresh(cat)
                cat_map[cat.slug] = cat.id
            
            print(f"Category map: {cat_map}")
            
            # Listings
            listings_data = [
                {
                    "title": "Bariis Basmati ah (25kg)",
                    "description": "Bariis aad u tayo sarreeya oo laga keenay dalka Hindiya.",
                    "price": 32,
                    "location": "Mogadishu, Banadir",
                    "condition": "New",
                    "category_id": cat_map["food-groceries"],
                    "owner_id": users[0].id,
                    "boost_level": 1,
                    "images": ["https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800"],
                    "attributes": {"Weight": "25kg", "Origin": "India"}
                },
                {
                    "title": "Toyota Land Cruiser Prado 2022",
                    "description": "Baabuur aad u nadiif ah.",
                    "price": 55000,
                    "location": "Mogadishu, Banadir",
                    "condition": "Used",
                    "category_id": cat_map["vehicles"],
                    "owner_id": users[0].id,
                    "boost_level": 3,
                    "images": ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800"],
                    "attributes": {"Year": "2022", "Engine": "V6", "Fuel": "Petrol"}
                }
            ]
            
            for l_data in listings_data:
                statement = select(Listing).where(Listing.title == l_data["title"])
                existing_listing = session.exec(statement).first()
                if not existing_listing:
                    print(f"Adding listing: {l_data['title']}")
                    listing = Listing(**l_data)
                    session.add(listing)
            
            print("Committing listings...")
            session.commit()
            print("Success!")

        except Exception as e:
            print(f"\n--- ERROR CAUGHT ---")
            print(f"Message: {e}")
            traceback.print_exc()
            orig = getattr(e, 'orig', None)
            if orig and hasattr(orig, 'diag'):
                diag = orig.diag
                print(f"Table: {diag.table_name}")
                print(f"Column: {diag.column_name}")
                print(f"Primary: {diag.message_primary}")
                print(f"Detail: {diag.message_detail}")

if __name__ == "__main__":
    debug_seed()
