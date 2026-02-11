from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.db.session import engine
from app.models.listing import Listing, Category
from app.models.user import User
from app.core.security import get_password_hash

def seed_showcase():
    with Session(engine) as session:
        # Create Demo Users
        password_hash = get_password_hash("password123")
        
        users_data = [
            {
                "full_name": "Somali Auto Spares",
                "email": "auto@example.com",
                "hashed_password": password_hash,
                "is_verified": True,
                "response_time": "Typically responds within minutes",
                "created_at": datetime.utcnow() - timedelta(days=1095) # 3+ years
            },
            {
                "full_name": "Mogadishu Tech Hub",
                "email": "tech@example.com",
                "hashed_password": password_hash,
                "is_verified": True,
                "response_time": "Typically responds in an hour",
                "created_at": datetime.utcnow() - timedelta(days=730) # 2+ years
            },
            {
                "full_name": "Oceanic Real Estate",
                "email": "estate@example.com",
                "hashed_password": password_hash,
                "is_verified": True,
                "response_time": "Typically responds in a few hours",
                "created_at": datetime.utcnow() - timedelta(days=365) # 1+ year
            }
        ]
        
        users = []
        for u_data in users_data:
            statement = select(User).where(User.email == u_data["email"])
            existing_user = session.exec(statement).first()
            if not existing_user:
                user = User(**u_data)
                session.add(user)
                users.append(user)
            else:
                users.append(existing_user)
        
        session.commit()
        for u in users:
            session.refresh(u)

        # Ensure Categories exist
        categories = session.exec(select(Category)).all()
        cat_map = {c.slug: c.id for c in categories}
        
        # Demo Listings
        listings_data = [
            {
                "title": "Brake Pads for Toyota & Nissan",
                "description": "High quality brake pads for various models. Durability guaranteed. Wholesale and retail available.",
                "price": 25,
                "location": "Mogadishu, Banadir",
                "condition": "New",
                "category_id": cat_map.get("vehicles", 1),
                "owner_id": users[0].id,
                "boost_level": 3, # Diamond
                "images": ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800"],
                "attributes": {"Type": "Brake System", "Condition": "Premium"}
            },
            {
                "title": "Solar Panel Kit 300W",
                "description": "Complete solar kit for home use. Includes battery, controller, and panels. Efficient energy for your household.",
                "price": 450,
                "location": "Hargeisa, Maroodi Jeex",
                "condition": "New",
                "category_id": cat_map.get("electronics", 1),
                "owner_id": users[1].id,
                "boost_level": 2, # VIP
                "images": ["https://images.unsplash.com/photo-1517420812314-8e1e85ef749e?auto=format&fit=crop&q=80&w=800"],
                "attributes": {"Power": "300W", "Components": "Full Set"}
            },
            {
                "title": "iPhone 15 Pro Max 256GB Platinum",
                "description": "Brand new sealed iPhone 15 Pro Max. Global version. All colors available.",
                "price": 1250,
                "location": "Garowe, Nugaal",
                "condition": "New",
                "category_id": cat_map.get("electronics", 1),
                "owner_id": users[1].id,
                "boost_level": 3,
                "images": ["https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=800"],
                "attributes": {"Brand": "Apple", "Storage": "256GB", "Color": "Platinum"}
            },
            {
                "title": "Toyota Land Cruiser V8 Spare Parts",
                "description": "Wide range of spare parts for Land Cruiser V8. Genuine and reliable. Countrywide shipping available.",
                "price": 120,
                "location": "Kismayo, Lower Juba",
                "condition": "Used",
                "category_id": cat_map.get("vehicles", 1),
                "owner_id": users[0].id,
                "boost_level": 1,
                "images": ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800"],
                "attributes": {"Model": "Land Cruiser", "Part": "Engine/Body"}
            },
            {
                "title": "Modern Seaside Villa in Mogadishu",
                "description": "Luxurious villa with ocean view. 5 bedrooms, modern kitchen, and spacious garden. Secure location.",
                "price": 350000,
                "location": "Mogadishu, Lido",
                "condition": "New",
                "category_id": cat_map.get("property", 1),
                "owner_id": users[2].id,
                "boost_level": 2,
                "images": ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800"],
                "attributes": {"Type": "Villa", "Bedrooms": "5", "View": "Ocean"}
            }
        ]
        
        for l_data in listings_data:
            statement = select(Listing).where(Listing.title == l_data["title"])
            existing_listing = session.exec(statement).first()
            if not existing_listing:
                listing = Listing(**l_data)
                session.add(listing)
        
        session.commit()
    print("Showcase data seeded successfully!")

if __name__ == "__main__":
    seed_showcase()
