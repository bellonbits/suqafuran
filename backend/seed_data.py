
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

# Jiji-style Categories from frontend/src/utils/jijiCategories.ts
JIJI_CATEGORIES = [
    {"id": "animals", "name": "Animals", "icon": "animals"},
    {"id": "beauties", "name": "Beauties", "icon": "beauties"},
    {"id": "commercial", "name": "Commercial", "icon": "commercial"},
    {"id": "food-agriculture", "name": "Food & Agriculture", "icon": "food"},
    {"id": "kids-toys", "name": "Kids & Toys", "icon": "toys"},
    {"id": "cars", "name": "Cars", "icon": "cars"},
    {"id": "phones", "name": "Phones", "icon": "phones"},
    {"id": "electronics", "name": "Electronics", "icon": "electronics"},
    {"id": "fashion", "name": "Fashion", "icon": "fashion"},
    {"id": "repair-construction", "name": "Repair & Construction", "icon": "repair"},
    {"id": "real-estate", "name": "Real Estate", "icon": "home"},
    {"id": "jobs", "name": "Jobs", "icon": "briefcase"},
    {"id": "services", "name": "Services", "icon": "services"}
]

SAMPLE_LISTINGS = {
    "animals": [
        {"title": "German Shepherd Puppies", "price": 150.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?q=80&w=400"]},
        {"title": "Dairy Cow for Sale", "price": 800.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=400"]},
        {"title": "Somali Camel", "price": 1200.0, "location": "Garowe", "images": ["https://images.unsplash.com/photo-1550828553-e3612d9779a2?q=80&w=400"]},
        {"title": "Goat Herd (5)", "price": 400.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=400"]},
        {"title": "Local Chickens", "price": 10.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=400"]},
        {"title": "Persian Cat", "price": 200.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=400"]},
        {"title": "Horse for Riding", "price": 1500.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1553284965-83675da5161f?q=80&w=400"]},
        {"title": "Sheep Ram", "price": 120.0, "location": "Kismayo", "images": ["https://images.unsplash.com/photo-1484557985045-edf25e08da73?q=80&w=400"]},
        {"title": "Pet Rabbits", "price": 25.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1585110396067-c396c5620e3f?q=80&w=400"]},
        {"title": "Exotic Parrot", "price": 300.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1552728089-57bdde30ebd1?q=80&w=400"]},
    ],
    "cars": [
        {"title": "Toyota Land Cruiser V8", "price": 45000.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1594535182308-8ff2489ae1b8?q=80&w=400"]},
        {"title": "Toyota Corolla Fielder", "price": 8500.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1623869675781-80aa31052a56?q=80&w=400"]},
        {"title": "Hyundai Tucson 2020", "price": 18000.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=400"]},
        {"title": "Suzuki Swift", "price": 5000.0, "location": "Kismayo", "images": ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=400"]},
        {"title": "Toyota Hilux", "price": 28000.0, "location": "Garowe", "images": ["https://images.unsplash.com/photo-1591147781075-8f522a2bb7a8?q=80&w=400"]},
        {"title": "Toyota Vitz", "price": 4500.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=400"]},
        {"title": "Mercedes C200", "price": 15000.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1616789916328-c1164a66e6c2?q=80&w=400"]},
        {"title": "Nissan Patrol", "price": 35000.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1559416523-140ddc3d238c?q=80&w=400"]},
        {"title": "Bajaj Auto Rickshaw", "price": 2500.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1596423985160-5a396265017a?q=80&w=400"]},
        {"title": "Honda Fit", "price": 5500.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1568844293986-8d0400bd4745?q=80&w=400"]},
    ],
    "phones": [
        {"title": "iPhone 14 Pro Max", "price": 1100.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?q=80&w=400"]},
        {"title": "Samsung Galaxy S24 Ultra", "price": 1200.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=400"]},
        {"title": "Tecno Spark 10", "price": 150.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1598327105666-5b89351aff23?q=80&w=400"]},
        {"title": "Google Pixel 7", "price": 450.0, "location": "Garowe", "images": ["https://images.unsplash.com/photo-1596742578443-7682e525c489?q=80&w=400"]},
        {"title": "Infinix Note 30", "price": 180.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=400"]},
        {"title": "iPhone 11 (Used)", "price": 300.0, "location": "Kismayo", "images": ["https://images.unsplash.com/photo-1574661845663-0d3a77864834?q=80&w=400"]},
        {"title": "Samsung A54", "price": 350.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1620061320478-43406f527c9b?q=80&w=400"]},
        {"title": "Nokia Brick Phone", "price": 20.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1582239023531-bc6600c02580?q=80&w=400"]},
        {"title": "Xiaomi Redmi Note 12", "price": 200.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1598327105666-5b89351aff23?q=80&w=400"]},
        {"title": "iPhone X", "price": 250.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=400"]},
    ],
    "electronics": [
        {"title": "Smart TV 55 inch", "price": 400.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1593784653277-e88295304a0e?q=80&w=400"]},
        {"title": "HP Laptop Core i7", "price": 550.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=400"]},
        {"title": "Sony Playstation 5", "price": 600.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=400"]},
        {"title": "Canon DSLR Camera", "price": 450.0, "location": "Garowe", "images": ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400"]},
        {"title": "JBL Bluetooth Speaker", "price": 80.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1618413233373-d6c572cc2513?q=80&w=400"]},
        {"title": "Washing Machine", "price": 300.0, "location": "Kismayo", "images": ["https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=400"]},
        {"title": "Refrigerator", "price": 400.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1571175443880-49e1d58b794a?q=80&w=400"]},
        {"title": "Microwave Oven", "price": 90.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1585659722983-3a675dabf23d?q=80&w=400"]},
        {"title": "Gaming PC Setup", "price": 1200.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=400"]},
        {"title": "Air Conditioner", "price": 350.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1614631378873-10d68c9826f4?q=80&w=400"]},
    ],
    "fashion": [
        {"title": "Men's Suit", "price": 80.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=400"]},
        {"title": "Traditional Dirac", "price": 45.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?q=80&w=400"]},
        {"title": "Nike Sneakers", "price": 60.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400"]},
        {"title": "Ladies Handbag", "price": 35.0, "location": "Garowe", "images": ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=400"]},
        {"title": "Gold Necklace", "price": 450.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=400"]},
        {"title": "Men's Watch", "price": 100.0, "location": "Kismayo", "images": ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=400"]},
        {"title": "Cotton T-Shirts (Bundle)", "price": 20.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400"]},
        {"title": "Abaya", "price": 40.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?q=80&w=400"]},
        {"title": "Leather Boots", "price": 70.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=400"]},
        {"title": "Sunglasses", "price": 15.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=400"]},
    ],
     "real-estate": [
        {"title": "3 Bedroom Apartment", "price": 450.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=400"]},
        {"title": "Villa for Sale", "price": 150000.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?q=80&w=400"]},
        {"title": "Office Space", "price": 800.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=400"]},
        {"title": "Land Plot (40x60)", "price": 12000.0, "location": "Garowe", "images": ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=400"]},
        {"title": "Shop for Rent", "price": 300.0, "location": "Kismayo", "images": ["https://images.unsplash.com/photo-1534073828943-f801091a7d58?q=80&w=400"]},
        {"title": "Furnished Studio", "price": 350.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=400"]},
        {"title": "Warehouse", "price": 1000.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=400"]},
        {"title": "Guest House", "price": 600.0, "location": "Hargeisa", "images": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400"]},
        {"title": "Beachfront Land", "price": 50000.0, "location": "Kismayo", "images": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400"]},
        {"title": "Duplex House", "price": 900.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1600596542815-2250657d2fc5?q=80&w=400"]},
    ],
}

async def create_seed_data(session: Session):
    # 1. Ensure a default admin/user exists
    user = session.exec(select(User).where(User.email == "admin@suqafuran.com")).first()
    if not user:
        print("Creating default user...")
        user = User(
            email="admin@suqafuran.com",
            password_hash=get_password_hash("admin123"),
            full_name="Admin User",
            is_active=True,
            is_superuser=True
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    
    print(f"Using user: {user.email} (ID: {user.id})")

    # 2. Seed Categories
    print("Seeding Categories...")
    db_categories = {}
    for cat_data in JIJI_CATEGORIES:
        # Check if exists
        cat = session.exec(select(Category).where(Category.slug == cat_data["id"])).first()
        if not cat:
            cat = Category(
                name=cat_data["name"],
                slug=cat_data["id"],
                icon_name=cat_data["icon"],
                attributes_schema={}
            )
            session.add(cat)
            session.commit()
            session.refresh(cat)
            print(f"Created category: {cat.name}")
        else:
            print(f"Category already exists: {cat.name}")
        
        db_categories[cat.slug] = cat.id

    # 3. Seed Listings
    print("Seeding Listings...")
    
    # Generic placeholder for categories without specific sample data
    generic_listing = {"title": "Sample Item", "price": 50.0, "location": "Mogadishu", "images": ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400"]}

    for cat_slug, cat_id in db_categories.items():
        # Get samples for this category, or create generic ones if missing
        samples = SAMPLE_LISTINGS.get(cat_slug, [])
        
        # If less than 10 samples, fill with duplicates/generics
        while len(samples) < 10:
             samples.append({
                 "title": f"Generic {cat_slug.title()} Item {len(samples)+1}",
                 "price": 100.0 + len(samples) * 10,
                 "location": "Mogadishu",
                 "images": ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=400"]
             })
        
        # Create listings
        count = 0
        for item in samples:
            # Check for dupes to avoid spamming if running multiple times (simple check by title)
            existing = session.exec(select(Listing).where(Listing.title == item["title"], Listing.category_id == cat_id)).first()
            if not existing:
                listing = Listing(
                    title=item["title"],
                    description=f"This is a great deal for {item['title']}. Contact me for more details.",
                    price=item["price"],
                    location=item["location"],
                    condition="Used",
                    category_id=cat_id,
                    owner_id=user.id,
                    status="active",
                    images=item["images"]
                )
                session.add(listing)
                count += 1
        
        session.commit()
        print(f"Added {count} listings to {cat_slug}")

async def main():
    print("Creating tables...")
    # This might be redundant if using alembic, but safe for dev
    init_db() 
    
    with Session(engine) as session:
        await create_seed_data(session)

if __name__ == "__main__":
    asyncio.run(main())
