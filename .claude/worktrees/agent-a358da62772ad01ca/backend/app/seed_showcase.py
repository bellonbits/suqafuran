from datetime import datetime, timedelta
from sqlmodel import Session, select, delete
from app.db.session import engine
from app.models import Listing, Category, User
from app.core.security import get_password_hash

def seed_showcase():
    with Session(engine) as session:
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
                "created_at": datetime.utcnow() - timedelta(days=1095) # 3+ years
            },
            {
                "full_name": "Mogadishu Tech Hub",
                "phone": "+252610000002",
                "email": "tech@example.com",
                "hashed_password": password_hash,
                "is_verified": True,
                "response_time": "Typically responds in an hour",
                "created_at": datetime.utcnow() - timedelta(days=730) # 2+ years
            },
            {
                "full_name": "Oceanic Real Estate",
                "phone": "+252610000003",
                "email": "estate@example.com",
                "hashed_password": password_hash,
                "is_verified": True,
                "response_time": "Typically responds in a few hours",
                "created_at": datetime.utcnow() - timedelta(days=365) # 1+ year
            },
            {
                "full_name": "Guled Livestock",
                "phone": "+252610000004",
                "email": "guled@example.com",
                "hashed_password": password_hash,
                "is_verified": True,
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
                users.append(existing_user)
        
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

        # Clear old categories to avoid slug unique constraint issues during mapping update
        # but better to just update or insert
        cat_map = {}
        for cat_data in new_categories:
            statement = select(Category).where(Category.slug == cat_data["slug"])
            cat = session.exec(statement).first()
            if not cat:
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
        
        # Demo Listings
        listings_data = [
            {
                "title": "Bariis Basmati ah (25kg)",
                "description": "Bariis aad u tayo sarreeya oo laga keenay dalka Hindiya. Aad u macaan.",
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
                "description": "Baabuur aad u nadiif ah, V6 engine, Full option. Wuxuu joogaa Muqdisho.",
                "price": 55000,
                "location": "Mogadishu, Banadir",
                "condition": "Used",
                "category_id": cat_map["vehicles"],
                "owner_id": users[0].id,
                "boost_level": 3,
                "images": ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800"],
                "attributes": {"Year": "2022", "Engine": "V6", "Fuel": "Petrol"}
            },
            {
                "title": "Geel Lo’aad ah (Awr)",
                "description": "Geel aad u shilis oo ku haboon qaliinka ama dhaqashada. Waxay ku yaalaan duleedka Muqdisho.",
                "price": 1200,
                "location": "Muqdisho, Banadir",
                "condition": "New",
                "category_id": cat_map["livestock"],
                "owner_id": users[3].id,
                "boost_level": 2,
                "images": ["https://images.unsplash.com/photo-1590503043232-261536761002?auto=format&fit=crop&q=80&w=800"],
                "attributes": {"Type": "Awr", "Age": "5 Years"}
            },
            {
                "title": "iPhone 15 Pro Max 512GB",
                "description": "IPhone 15 Pro Max oo cusub, sealed. Global version.",
                "price": 1350,
                "location": "Hargeisa, Maroodi Jeex",
                "condition": "New",
                "category_id": cat_map["electronics"],
                "owner_id": users[1].id,
                "boost_level": 3,
                "images": ["https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=800"],
                "attributes": {"Brand": "Apple", "Storage": "512GB"}
            },
            {
                "title": "Beer ku taal Afgooye (5 Hectare)",
                "description": "Beer weyn oo qani ku ah camuudda bacrin ah. Waxay ku dhowdahay webiga.",
                "price": 45000,
                "location": "Afgooye, Lower Shabelle",
                "condition": "New",
                "category_id": cat_map["land-farms"],
                "owner_id": users[2].id,
                "boost_level": 1,
                "images": ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800"],
                "attributes": {"Size": "5 Hectare", "Source": "River side"}
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
    print("Showcase data seeded successfully with Somali context!")

if __name__ == "__main__":
    seed_showcase()
