from sqlmodel import Session, select
from app.db.session import engine
from app.models import Category
from app.models.listing import SubCategory, SubSubCategory


CATEGORIES = [
    {
        "name": "Raashinka & Cuntada (Food & Groceries)",
        "slug": "food-groceries",
        "icon_name": "utensils",
        "subcategories": [
            {"name": "Qudaarta (Vegetables)", "subs": ["Tomatoes", "Onions", "Potatoes", "Leafy Greens", "Peppers"]},
            {"name": "Miraha (Fruits)", "subs": ["Mangoes", "Bananas", "Citrus Fruits", "Dates", "Avocados"]},
            {"name": "Bariiska & Baastada (Rice & Pasta)", "subs": ["Basmati Rice", "Spaghetti", "Macaroni", "Broken Rice"]},
            {"name": "Hilibka (Meat)", "subs": ["Beef", "Goat", "Lamb", "Chicken", "Camel Meat"]},
            {"name": "Kalluun & Cunto Badeed (Seafood)", "subs": ["Fresh Fish", "Dried Fish", "Prawns", "Squid"]},
            {"name": "Caanaha & Caanaha La'eg (Milk & Dairy)", "subs": ["Fresh Milk", "Camel Milk", "Yoghurt", "Cheese", "Butter"]},
            {"name": "Ukunta (Eggs)", "subs": ["Chicken Eggs", "Duck Eggs"]},
            {"name": "Cuntooyinka Diyaarsan (Prepared Foods)", "subs": ["Canjeero", "Samosas", "Muufo", "Halwa", "Bur"]},
            {"name": "Shucuuraha & Xawaash (Spices & Condiments)", "subs": ["Xawaash Mix", "Cumin", "Cardamom", "Chilli", "Salt"]},
            {"name": "Cabitaanka (Beverages)", "subs": ["Soft Drinks", "Juice", "Tea", "Coffee", "Water"]},
        ],
    },
    {
        "name": "Dharka & Kabaha (Clothing & Shoes)",
        "slug": "clothing-shoes",
        "icon_name": "fashion",
        "subcategories": [
            {"name": "Dharka Ragga (Men's Clothing)", "subs": ["Shirts", "Trousers", "Suits", "Traditional Wear", "Sportswear"]},
            {"name": "Dharka Dumarka (Women's Clothing)", "subs": ["Dresses", "Abayas", "Blouses", "Skirts", "Traditional Wear"]},
            {"name": "Dharka Carruurta (Children's Clothing)", "subs": ["Boys Clothing", "Girls Clothing", "Baby Clothing", "School Uniforms"]},
            {"name": "Kabaha (Shoes)", "subs": ["Men's Shoes", "Women's Shoes", "Children's Shoes", "Sandals", "Sports Shoes"]},
            {"name": "Agabka Dharka (Clothing Accessories)", "subs": ["Belts", "Bags", "Scarves", "Hats", "Sunglasses", "Jewellery"]},
        ],
    },
    {
        "name": "Alaabta Guriga (Household Items)",
        "slug": "household-items",
        "icon_name": "home-living",
        "subcategories": [
            {"name": "Qalabka Jikada (Kitchenware)", "subs": ["Pots & Pans", "Plates & Bowls", "Cups & Glasses", "Cutlery", "Cooking Utensils"]},
            {"name": "Gogosha (Bedding)", "subs": ["Mattresses", "Pillows", "Bed Sheets", "Blankets", "Mosquito Nets"]},
            {"name": "Alaabta Qurxinta (Home Décor)", "subs": ["Curtains", "Rugs & Carpets", "Wall Art", "Mirrors", "Vases"]},
            {"name": "Qalabka Nadaafadda (Cleaning Supplies)", "subs": ["Detergents", "Mops & Brooms", "Disinfectants", "Cleaning Cloths"]},
            {"name": "Qalabka Korontada (Appliances)", "subs": ["Washing Machines", "Refrigerators", "Air Conditioners", "Water Dispensers", "Fans"]},
            {"name": "Fadhiga & Miisaska (Furniture)", "subs": ["Sofas", "Dining Tables", "Beds", "Wardrobes", "Office Furniture"]},
            {"name": "Qalabka Beerta (Garden Supplies)", "subs": ["Garden Tools", "Plant Pots", "Seeds", "Fertilizers", "Water Hoses"]},
        ],
    },
    {
        "name": "Korontada & Elektaroonigga (Electronics)",
        "slug": "electronics",
        "icon_name": "laptop",
        "subcategories": [
            {"name": "Mobaylada (Mobile Phones)", "subs": ["Samsung", "iPhone", "Tecno", "Infinix", "Huawei", "Nokia", "Other Brands"]},
            {"name": "Kombiyuutarada (Computers)", "subs": ["Laptops", "Desktop PCs", "Tablets", "Computer Accessories", "Monitors", "Printers"]},
            {"name": "TV-yada (TVs)", "subs": ["Smart TVs", "LED TVs", "OLED TVs", "TV Accessories"]},
            {"name": "Qalabka Dhagaha & Codka (Audio & Headphones)", "subs": ["Bluetooth Speakers", "Headphones", "Earphones", "Home Theatre", "Amplifiers"]},
            {"name": "Qalabka Sawirka (Cameras)", "subs": ["DSLR Cameras", "Action Cameras", "CCTV Cameras", "Camera Accessories"]},
            {"name": "Qalabka Networking (Networking)", "subs": ["Routers", "Modems", "Network Cables", "WiFi Extenders"]},
            {"name": "Qalabka Ciyaaraha (Gaming)", "subs": ["Game Consoles", "Video Games", "Controllers", "Gaming Accessories"]},
            {"name": "Qalabka Elektaroonigga Kale (Other Electronics)", "subs": ["Power Banks", "Chargers", "Cables & Adapters", "Smart Watches", "Drones"]},
        ],
    },
    {
        "name": "Gaadiidka (Vehicles)",
        "slug": "vehicles",
        "icon_name": "car",
        "subcategories": [
            {"name": "Baabuurta (Cars)", "subs": ["Toyota", "Nissan", "Mazda", "Honda", "Mitsubishi", "Suzuki", "BMW", "Mercedes-Benz", "Other Brands"]},
            {"name": "Mootooyinka (Motorcycles)", "subs": ["Dirt Bikes", "Scooters", "Sports Bikes", "Delivery Bikes"]},
            {"name": "Bajaajta (Tuk-tuks)", "subs": ["Passenger Tuk-tuks", "Cargo Tuk-tuks"]},
            {"name": "Gaari Weyn (Trucks & Buses)", "subs": ["Trucks", "Buses", "Minibuses", "Pickups", "Trailers"]},
            {"name": "Qalabka Gaadiidka (Vehicle Parts & Accessories)", "subs": ["Tyres & Rims", "Engines & Parts", "Car Batteries", "Car Lights", "Bumpers", "Car Covers", "Audio Systems"]},
            {"name": "Adeegyada Gaadiidka (Car Services)", "subs": ["Car Repair", "Car Wash", "Towing Services", "Car Rental"]},
        ],
    },
    {
        "name": "Xoolaha Nool (Livestock)",
        "slug": "livestock",
        "icon_name": "animals",
        "subcategories": [
            {"name": "Riyaha (Goats)", "subs": ["Local Goats", "Dairy Goats", "Meat Goats", "Breeding Goats"]},
            {"name": "Idaha (Sheep)", "subs": ["Local Sheep", "Fat-tailed Sheep", "Breeding Sheep"]},
            {"name": "Lo'da (Cattle)", "subs": ["Dairy Cows", "Beef Cattle", "Oxen", "Calves"]},
            {"name": "Digaagga (Poultry)", "subs": ["Chickens", "Ducks", "Turkeys", "Eggs for Hatching"]},
            {"name": "Geela (Camels)", "subs": ["Dairy Camels", "Racing Camels", "Pack Camels"]},
            {"name": "Xayawaanka Guriga (Pets)", "subs": ["Dogs", "Cats", "Birds", "Fish", "Pet Accessories"]},
        ],
    },
    {
        "name": "Dhul & Beeraha (Land & Farms)",
        "slug": "land-farms",
        "icon_name": "agriculture",
        "subcategories": [
            {"name": "Dhul Banaan (Vacant Land)", "subs": ["Residential Plots", "Commercial Plots", "Industrial Land"]},
            {"name": "Beeraha (Farms)", "subs": ["Crop Farms", "Livestock Farms", "Mixed Farms"]},
            {"name": "Dhul Beereed (Agricultural Land)", "subs": ["Irrigated Land", "Rain-fed Land", "Orchard Land"]},
            {"name": "Beerista Qudaarta (Market Gardens)", "subs": ["Vegetable Gardens", "Herb Gardens", "Fruit Orchards"]},
        ],
    },
    {
        "name": "Guryaha & Hantida (Property)",
        "slug": "property",
        "icon_name": "home",
        "subcategories": [
            {"name": "Guryo Ijaar ah (Houses for Rent)", "subs": ["Apartments", "Villas", "Single Rooms", "Studio Flats", "Shared Housing"]},
            {"name": "Guryo Iib ah (Houses for Sale)", "subs": ["Apartments for Sale", "Villas for Sale", "Commercial Buildings"]},
            {"name": "Xafiisyo (Offices & Commercial)", "subs": ["Office Space", "Shops for Rent", "Warehouses", "Event Halls"]},
            {"name": "New Builds", "subs": ["New Apartments", "New Villas", "Off-plan Properties"]},
            {"name": "Short Stay (Short Let)", "subs": ["Daily Rental", "Weekly Rental", "Hotel Rooms"]},
        ],
    },
    {
        "name": "Adeegyo (Services)",
        "slug": "services",
        "icon_name": "briefcase",
        "subcategories": [
            {"name": "Dhismaha & Hagaajinta (Building & Construction)", "subs": ["Painting", "Plumbing", "Electrical Work", "Tiling", "Roofing", "Carpentry"]},
            {"name": "Kompiyuutarka & IT (Computer & IT)", "subs": ["Website Development", "Software", "Computer Repair", "Networking", "CCTV Installation"]},
            {"name": "Nadaafadda (Cleaning Services)", "subs": ["Home Cleaning", "Office Cleaning", "Carpet Cleaning", "Post-construction Cleaning"]},
            {"name": "Hagaajinta (Repair Services)", "subs": ["Phone Repair", "Appliance Repair", "Car Repair", "Furniture Repair"]},
            {"name": "Daabacaadda (Printing Services)", "subs": ["Business Cards", "Banners & Posters", "T-shirt Printing", "Books & Brochures"]},
            {"name": "Sharciga & Maaliyadda (Legal & Financial)", "subs": ["Legal Advice", "Accounting", "Tax Services", "Insurance"]},
            {"name": "Safarku & Dalxiiska (Travel & Tourism)", "subs": ["Flight Booking", "Hotel Booking", "Tour Packages", "Visa Services"]},
            {"name": "Barashada & Tababarka (Education & Training)", "subs": ["Language Classes", "Computer Training", "Professional Courses", "Private Tutoring"]},
            {"name": "Qurxinta & Caafimaadka (Beauty & Wellness)", "subs": ["Hair Salon", "Barber", "Spa & Massage", "Nail Care", "Makeup Artist"]},
            {"name": "Sawirada & Muuqaalka (Photography & Video)", "subs": ["Wedding Photography", "Portrait Studio", "Video Production", "Drone Photography"]},
            {"name": "Daawo & Caafimaad (Healthcare)", "subs": ["Doctor Consultations", "Pharmacy", "Dental Services", "Physiotherapy", "Home Nursing"]},
            {"name": "Adeegyada Kale (Other Services)", "subs": ["Delivery Services", "Security Services", "Event Planning", "Pet Services", "Catering"]},
        ],
    },
    {
        "name": "Shaqooyin (Jobs)",
        "slug": "jobs",
        "icon_name": "graduation-cap",
        "subcategories": [
            {"name": "Teknoolajiyada & IT (Tech & IT)", "subs": ["Software Developer", "Web Designer", "Network Engineer", "Data Entry", "IT Support"]},
            {"name": "Waxbarashada (Education)", "subs": ["Teachers", "Tutors", "School Admin", "Training Coordinator"]},
            {"name": "Caafimaadka (Healthcare)", "subs": ["Doctors", "Nurses", "Pharmacists", "Lab Technicians", "Community Health Workers"]},
            {"name": "Iibka & Suuqgeynta (Sales & Marketing)", "subs": ["Sales Rep", "Marketing Manager", "Brand Ambassador", "Social Media Manager"]},
            {"name": "Maamulka & Xafiiska (Admin & Office)", "subs": ["Receptionist", "Secretary", "Office Manager", "HR Officer", "Data Entry Clerk"]},
            {"name": "Dhismaha & Ganacsiga (Construction & Trade)", "subs": ["Electrician", "Plumber", "Mason", "Carpenter", "Painter"]},
            {"name": "Darawal & Gadiid (Driver & Transport)", "subs": ["Car Driver", "Truck Driver", "Delivery Rider", "Chauffeur"]},
            {"name": "Guriga & Nadaafadda (Domestic & Cleaning)", "subs": ["House Help", "Cook", "Gardener", "Nanny", "Security Guard"]},
            {"name": "Shaqooyin Kale (Other Jobs)", "subs": ["Internships", "Freelance", "Part-time", "Remote Work"]},
        ],
    },
    {
        "name": "Caafimaadka & Quruxda (Health & Beauty)",
        "slug": "health-beauty",
        "icon_name": "heart",
        "subcategories": [
            {"name": "Qurxinta Wajiga (Makeup & Skincare)", "subs": ["Foundation", "Lipstick", "Eye Makeup", "Moisturizers", "Sunscreen"]},
            {"name": "Daryeelka Timaha (Hair Care)", "subs": ["Wigs & Extensions", "Hair Products", "Hair Tools", "Natural Hair Care"]},
            {"name": "Udgoonka (Perfumes & Fragrances)", "subs": ["Men's Perfume", "Women's Perfume", "Oud & Bakhur", "Body Spray"]},
            {"name": "Daryeelka Jirka (Body Care)", "subs": ["Lotions & Creams", "Soaps", "Deodorants", "Bath Products"]},
            {"name": "Vitamiinnada (Vitamins & Supplements)", "subs": ["Multivitamins", "Protein Supplements", "Herbal Remedies", "Weight Management"]},
            {"name": "Qalabka Caafimaadka (Medical Equipment)", "subs": ["Blood Pressure Monitors", "Thermometers", "Wheelchairs", "First Aid Kits"]},
        ],
    },
    {
        "name": "Carruurta & Dhallaanka (Babies & Kids)",
        "slug": "babies-kids",
        "icon_name": "baby",
        "subcategories": [
            {"name": "Ciyaaraha & Basbaasada (Toys & Games)", "subs": ["Educational Toys", "Dolls", "Remote Control Toys", "Board Games", "Outdoor Toys"]},
            {"name": "Dharka Carruurta (Kids Clothing)", "subs": ["Baby Clothes", "Boys Wear", "Girls Wear", "School Uniforms", "Shoes"]},
            {"name": "Qalabka Dhallaanka (Baby Gear)", "subs": ["Prams & Strollers", "Baby Carriers", "Car Seats", "Baby Monitors", "Cots & Beds"]},
            {"name": "Cuntada Dhallaanka (Baby Food)", "subs": ["Formula Milk", "Baby Cereals", "Baby Snacks", "Breast Pumps", "Feeding Bottles"]},
            {"name": "Waxbarashada Carruurta (Kids Education)", "subs": ["Books", "School Supplies", "Learning Games", "Art & Craft"]},
        ],
    },
    {
        "name": "Ciyaaraha & Madadaalada (Leisure & Sports)",
        "slug": "leisure-sports",
        "icon_name": "activity",
        "subcategories": [
            {"name": "Ciyaaraha Kulaylaha (Sports Equipment)", "subs": ["Football", "Basketball", "Volleyball", "Running Gear", "Gym Equipment", "Swimming"]},
            {"name": "Muusigga (Musical Instruments)", "subs": ["Guitars", "Keyboards", "Drums", "Traditional Instruments", "DJ Equipment"]},
            {"name": "Buugaagta & Majalada (Books & Magazines)", "subs": ["Islamic Books", "Textbooks", "Novels", "Children's Books", "Magazines"]},
            {"name": "Fanka & Farshaxanka (Art & Collectibles)", "subs": ["Paintings", "Sculptures", "Antiques", "Handcrafts", "Photography"]},
            {"name": "Masoo-galka & Tacsiinta (Hobbies)", "subs": ["Gardening", "Fishing", "Photography", "Travel Accessories", "Board Games"]},
        ],
    },
    {
        "name": "Qalabka Ganacsiga (Commercial Equipment)",
        "slug": "commercial-equipment",
        "icon_name": "tool",
        "subcategories": [
            {"name": "Qalabka Xafiiska (Office Equipment)", "subs": ["Photocopiers", "Projectors", "Office Chairs", "Filing Cabinets", "Safes"]},
            {"name": "Qalabka Warshada (Industrial Machinery)", "subs": ["Generators", "Compressors", "Welding Equipment", "Power Tools", "Forklifts"]},
            {"name": "Qalabka Beeraha (Agricultural Equipment)", "subs": ["Tractors", "Irrigation Pumps", "Sprayers", "Hand Tools", "Threshers"]},
            {"name": "Qalabka Maqaayadda (Restaurant Equipment)", "subs": ["Commercial Fridges", "Gas Cookers", "Ovens", "Food Processors", "Display Fridges"]},
            {"name": "Qalabka Ganacsiga Kale (Other Commercial)", "subs": ["POS Systems", "Barcode Scanners", "Cash Registers", "Display Shelves"]},
        ],
    },
    {
        "name": "Hagaajinta & Dhismaha (Repair & Construction)",
        "slug": "repair-construction",
        "icon_name": "hammer",
        "subcategories": [
            {"name": "Agabka Dhismaha (Building Materials)", "subs": ["Cement", "Steel Rods", "Bricks & Blocks", "Roofing Sheets", "Sand & Gravel", "Paint"]},
            {"name": "Qalabka Korontada (Electrical Supplies)", "subs": ["Cables & Wires", "Switches & Sockets", "Circuit Breakers", "LED Lights", "Inverters"]},
            {"name": "Biyo & Barafka (Plumbing)", "subs": ["Pipes & Fittings", "Water Tanks", "Taps & Valves", "Pumps", "Geysers"]},
            {"name": "Alaabtda Qoraalka (Hand & Power Tools)", "subs": ["Drills", "Grinders", "Hammers", "Saws", "Screwdrivers", "Measuring Tools"]},
            {"name": "Alwaaxda & Bir (Doors, Windows & Steel)", "subs": ["Steel Doors", "Wooden Doors", "Windows", "Gates & Fencing", "Locks & Keys"]},
            {"name": "Tamarta Qorraxda (Solar Energy)", "subs": ["Solar Panels", "Solar Batteries", "Solar Inverters", "Solar Water Heaters", "Solar Lights"]},
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
        .replace("/", "-")
        .replace(",", "")
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

            # Remove old subcategories (cascades to subsubcategories)
            old_subs = session.exec(
                select(SubCategory).where(SubCategory.category_id == cat_id)
            ).all()
            for sub in old_subs:
                session.delete(sub)
            session.flush()

            # Insert subcategories + sub-sub-categories
            for sub_data in cat_data["subcategories"]:
                sub = SubCategory(
                    name=sub_data["name"],
                    slug=make_slug(sub_data["name"]),
                    category_id=cat_id,
                )
                session.add(sub)
                session.flush()
                print(f"  + {sub_data['name']}")

                for ssub_name in sub_data.get("subs", []):
                    ssub = SubSubCategory(
                        name=ssub_name,
                        slug=make_slug(ssub_name),
                        subcategory_id=sub.id,
                    )
                    session.add(ssub)
                    print(f"    - {ssub_name}")

        session.commit()
    print("\nAll categories, subcategories and sub-subcategories seeded successfully.")


if __name__ == "__main__":
    seed_categories()
