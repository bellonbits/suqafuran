from sqlmodel import Session, select
from app.db.session import engine
from app.models import Category
from app.models.listing import SubCategory, SubSubCategory


CATEGORIES = [
    {
        "name": "Food & Groceries",
        "slug": "food-groceries",
        "icon_name": "utensils",
        "subcategories": [
            {"name": "Vegetables", "subs": ["Tomatoes", "Onions", "Potatoes", "Leafy Greens", "Peppers"]},
            {"name": "Fruits", "subs": ["Mangoes", "Bananas", "Citrus Fruits", "Dates", "Avocados"]},
            {"name": "Rice & Pasta", "subs": ["Basmati Rice", "Spaghetti", "Macaroni", "Broken Rice"]},
            {"name": "Meat", "subs": ["Beef", "Goat", "Lamb", "Chicken", "Camel Meat"]},
            {"name": "Seafood", "subs": ["Fresh Fish", "Dried Fish", "Prawns", "Squid"]},
            {"name": "Milk & Dairy", "subs": ["Fresh Milk", "Camel Milk", "Yoghurt", "Cheese", "Butter"]},
            {"name": "Eggs", "subs": ["Chicken Eggs", "Duck Eggs"]},
            {"name": "Prepared Foods", "subs": ["Canjeero", "Samosas", "Muufo", "Halwa", "Bur"]},
            {"name": "Spices & Condiments", "subs": ["Xawaash Mix", "Cumin", "Cardamom", "Chilli", "Salt"]},
            {"name": "Beverages", "subs": ["Soft Drinks", "Juice", "Tea", "Coffee", "Water"]},
        ],
    },
    {
        "name": "Clothing & Shoes",
        "slug": "clothing-shoes",
        "icon_name": "fashion",
        "subcategories": [
            {"name": "Men's Clothing", "subs": ["Shirts", "Trousers", "Suits", "Traditional Wear", "Sportswear"]},
            {"name": "Women's Clothing", "subs": ["Dresses", "Abayas", "Blouses", "Skirts", "Traditional Wear"]},
            {"name": "Children's Clothing", "subs": ["Boys Clothing", "Girls Clothing", "Baby Clothing", "School Uniforms"]},
            {"name": "Shoes", "subs": ["Men's Shoes", "Women's Shoes", "Children's Shoes", "Sandals", "Sports Shoes"]},
            {"name": "Clothing Accessories", "subs": ["Belts", "Bags", "Scarves", "Hats", "Sunglasses", "Jewellery"]},
        ],
    },
    {
        "name": "Household Items",
        "slug": "household-items",
        "icon_name": "home-living",
        "subcategories": [
            {"name": "Kitchenware", "subs": ["Pots & Pans", "Plates & Bowls", "Cups & Glasses", "Cutlery", "Cooking Utensils"]},
            {"name": "Bedding", "subs": ["Mattresses", "Pillows", "Bed Sheets", "Blankets", "Mosquito Nets"]},
            {"name": "Home Decor", "subs": ["Curtains", "Rugs & Carpets", "Wall Art", "Mirrors", "Vases"]},
            {"name": "Cleaning Supplies", "subs": ["Detergents", "Mops & Brooms", "Disinfectants", "Cleaning Cloths"]},
            {"name": "Appliances", "subs": ["Washing Machines", "Refrigerators", "Air Conditioners", "Water Dispensers", "Fans"]},
            {"name": "Furniture", "subs": ["Sofas", "Dining Tables", "Beds", "Wardrobes", "Office Furniture"]},
            {"name": "Garden Supplies", "subs": ["Garden Tools", "Plant Pots", "Seeds", "Fertilizers", "Water Hoses"]},
        ],
    },
    {
        "name": "Electronics",
        "slug": "electronics",
        "icon_name": "laptop",
        "subcategories": [
            {"name": "Mobile Phones", "subs": ["Samsung", "iPhone", "Tecno", "Infinix", "Huawei", "Nokia", "Other Brands"]},
            {"name": "Computers", "subs": ["Laptops", "Desktop PCs", "Tablets", "Computer Accessories", "Monitors", "Printers"]},
            {"name": "TVs", "subs": ["Smart TVs", "LED TVs", "OLED TVs", "TV Accessories"]},
            {"name": "Audio & Headphones", "subs": ["Bluetooth Speakers", "Headphones", "Earphones", "Home Theatre", "Amplifiers"]},
            {"name": "Cameras", "subs": ["DSLR Cameras", "Action Cameras", "CCTV Cameras", "Camera Accessories"]},
            {"name": "Networking", "subs": ["Routers", "Modems", "Network Cables", "WiFi Extenders"]},
            {"name": "Gaming", "subs": ["Game Consoles", "Video Games", "Controllers", "Gaming Accessories"]},
            {"name": "Other Electronics", "subs": ["Power Banks", "Chargers", "Cables & Adapters", "Smart Watches", "Drones"]},
        ],
    },
    {
        "name": "Vehicles",
        "slug": "vehicles",
        "icon_name": "car",
        "subcategories": [
            {"name": "Cars", "subs": ["Toyota", "Nissan", "Mazda", "Honda", "Mitsubishi", "Suzuki", "BMW", "Mercedes-Benz", "Other Brands"]},
            {"name": "Motorcycles", "subs": ["Dirt Bikes", "Scooters", "Sports Bikes", "Delivery Bikes"]},
            {"name": "Tuk-tuks", "subs": ["Passenger Tuk-tuks", "Cargo Tuk-tuks"]},
            {"name": "Trucks & Buses", "subs": ["Trucks", "Buses", "Minibuses", "Pickups", "Trailers"]},
            {"name": "Vehicle Parts & Accessories", "subs": ["Tyres & Rims", "Engines & Parts", "Car Batteries", "Car Lights", "Bumpers", "Car Covers", "Audio Systems"]},
            {"name": "Car Services", "subs": ["Car Repair", "Car Wash", "Towing Services", "Car Rental"]},
        ],
    },
    {
        "name": "Livestock",
        "slug": "livestock",
        "icon_name": "animals",
        "subcategories": [
            {"name": "Goats", "subs": ["Local Goats", "Dairy Goats", "Meat Goats", "Breeding Goats"]},
            {"name": "Sheep", "subs": ["Local Sheep", "Fat-tailed Sheep", "Breeding Sheep"]},
            {"name": "Cattle", "subs": ["Dairy Cows", "Beef Cattle", "Oxen", "Calves"]},
            {"name": "Poultry", "subs": ["Chickens", "Ducks", "Turkeys", "Eggs for Hatching"]},
            {"name": "Camels", "subs": ["Dairy Camels", "Racing Camels", "Pack Camels"]},
            {"name": "Pets", "subs": ["Dogs", "Cats", "Birds", "Fish", "Pet Accessories"]},
        ],
    },
    {
        "name": "Land & Farms",
        "slug": "land-farms",
        "icon_name": "agriculture",
        "subcategories": [
            {"name": "Vacant Land", "subs": ["Residential Plots", "Commercial Plots", "Industrial Land"]},
            {"name": "Farms", "subs": ["Crop Farms", "Livestock Farms", "Mixed Farms"]},
            {"name": "Agricultural Land", "subs": ["Irrigated Land", "Rain-fed Land", "Orchard Land"]},
            {"name": "Market Gardens", "subs": ["Vegetable Gardens", "Herb Gardens", "Fruit Orchards"]},
        ],
    },
    {
        "name": "Property",
        "slug": "property",
        "icon_name": "home",
        "subcategories": [
            {"name": "Houses for Rent", "subs": ["Apartments", "Villas", "Single Rooms", "Studio Flats", "Shared Housing"]},
            {"name": "Houses for Sale", "subs": ["Apartments for Sale", "Villas for Sale", "Commercial Buildings"]},
            {"name": "Offices & Commercial", "subs": ["Office Space", "Shops for Rent", "Warehouses", "Event Halls"]},
            {"name": "New Builds", "subs": ["New Apartments", "New Villas", "Off-plan Properties"]},
            {"name": "Short Stay", "subs": ["Daily Rental", "Weekly Rental", "Hotel Rooms"]},
        ],
    },
    {
        "name": "Services",
        "slug": "services",
        "icon_name": "briefcase",
        "subcategories": [
            {"name": "Building & Construction", "subs": ["Painting", "Plumbing", "Electrical Work", "Tiling", "Roofing", "Carpentry"]},
            {"name": "Computer & IT", "subs": ["Website Development", "Software", "Computer Repair", "Networking", "CCTV Installation"]},
            {"name": "Cleaning Services", "subs": ["Home Cleaning", "Office Cleaning", "Carpet Cleaning", "Post-construction Cleaning"]},
            {"name": "Repair Services", "subs": ["Phone Repair", "Appliance Repair", "Motorcycle Repair", "Furniture Repair"]},
            {"name": "Printing Services", "subs": ["Business Cards", "Banners & Posters", "T-shirt Printing", "Books & Brochures"]},
            {"name": "Legal & Financial", "subs": ["Legal Advice", "Accounting", "Tax Services", "Insurance"]},
            {"name": "Travel & Tourism", "subs": ["Flight Booking", "Hotel Booking", "Tour Packages", "Visa Services"]},
            {"name": "Education & Training", "subs": ["Language Classes", "Computer Training", "Professional Courses", "Private Tutoring"]},
            {"name": "Beauty & Wellness", "subs": ["Hair Salon", "Barber", "Spa & Massage", "Nail Care", "Makeup Artist"]},
            {"name": "Photography & Video", "subs": ["Wedding Photography", "Portrait Studio", "Video Production", "Drone Photography"]},
            {"name": "Healthcare", "subs": ["Doctor Consultations", "Pharmacy", "Dental Services", "Physiotherapy", "Home Nursing"]},
            {"name": "Other Services", "subs": ["Delivery Services", "Security Services", "Event Planning", "Pet Services", "Catering"]},
        ],
    },
    {
        "name": "Jobs",
        "slug": "jobs",
        "icon_name": "graduation-cap",
        "subcategories": [
            {"name": "Tech & IT", "subs": ["Software Developer", "Web Designer", "Network Engineer", "Data Entry", "IT Support"]},
            {"name": "Education", "subs": ["Teachers", "Tutors", "School Admin", "Training Coordinator"]},
            {"name": "Medical & Health Jobs", "subs": ["Doctors", "Nurses", "Pharmacists", "Lab Technicians", "Community Health Workers"]},
            {"name": "Sales & Marketing", "subs": ["Sales Rep", "Marketing Manager", "Brand Ambassador", "Social Media Manager"]},
            {"name": "Admin & Office", "subs": ["Receptionist", "Secretary", "Office Manager", "HR Officer", "Data Entry Clerk"]},
            {"name": "Construction & Trade", "subs": ["Electrician", "Plumber", "Mason", "Carpenter", "Painter"]},
            {"name": "Driver & Transport", "subs": ["Car Driver", "Truck Driver", "Delivery Rider", "Chauffeur"]},
            {"name": "Domestic & Cleaning", "subs": ["House Help", "Cook", "Gardener", "Nanny", "Security Guard"]},
            {"name": "Other Jobs", "subs": ["Internships", "Freelance", "Part-time", "Remote Work"]},
        ],
    },
    {
        "name": "Beauty & Personal Care",
        "slug": "health-beauty",
        "icon_name": "heart",
        "subcategories": [
            {"name": "Hair Beauty", "subs": ["Wigs & Extensions", "Hair Products", "Hair Tools", "Natural Hair Care", "Hair Colour"]},
            {"name": "Face Care", "subs": ["Foundation", "Moisturizers", "Sunscreen", "Face Wash", "Toners"]},
            {"name": "Oral Care", "subs": ["Toothbrush", "Toothpaste", "Mouthwash", "Teeth Whitening", "Dental Floss"]},
            {"name": "Body Care", "subs": ["Lotions & Creams", "Soaps", "Deodorants", "Bath Products", "Shaving"]},
            {"name": "Fragrance", "subs": ["Men's Perfume", "Women's Perfume", "Oud & Bakhur", "Body Spray", "Attar"]},
            {"name": "Makeup", "subs": ["Lipstick", "Eye Makeup", "Concealer", "Blush & Highlighter", "Nail Polish"]},
            {"name": "Tools & Accessories", "subs": ["Makeup Brushes", "Hair Dryers", "Straighteners", "Mirrors", "Tweezers"]},
            {"name": "Vitamins & Supplements", "subs": ["Multivitamins", "Protein Supplements", "Herbal Remedies", "Weight Management"]},
            {"name": "Massagers", "subs": ["Body Massagers", "Face Massagers", "Electric Massagers", "Massage Oils"]},
            {"name": "Beauty Treatments", "subs": ["Facials", "Skin Whitening", "Waxing & Threading", "Eyelash Extensions", "Henna"]},
        ],
    },
    {
        "name": "Babies & Kids",
        "slug": "babies-kids",
        "icon_name": "baby",
        "subcategories": [
            {"name": "Toys & Games", "subs": ["Educational Toys", "Dolls", "Remote Control Toys", "Board Games", "Outdoor Toys"]},
            {"name": "Kids Clothing", "subs": ["Baby Clothes", "Boys Wear", "Girls Wear", "School Uniforms", "Kids Shoes"]},
            {"name": "Baby Gear", "subs": ["Prams & Strollers", "Baby Carriers", "Car Seats", "Baby Monitors", "Cots & Beds"]},
            {"name": "Baby Food", "subs": ["Formula Milk", "Baby Cereals", "Baby Snacks", "Breast Pumps", "Feeding Bottles"]},
            {"name": "Kids Education", "subs": ["Books", "School Supplies", "Learning Games", "Art & Craft"]},
        ],
    },
    {
        "name": "Leisure & Sports",
        "slug": "leisure-sports",
        "icon_name": "activity",
        "subcategories": [
            {"name": "Sports Equipment", "subs": ["Football", "Basketball", "Volleyball", "Running Gear", "Gym Equipment", "Swimming"]},
            {"name": "Musical Instruments", "subs": ["Guitars", "Keyboards", "Drums", "Traditional Instruments", "DJ Equipment"]},
            {"name": "Books & Magazines", "subs": ["Islamic Books", "Textbooks", "Novels", "Children's Books", "Magazines"]},
            {"name": "Art & Collectibles", "subs": ["Paintings", "Sculptures", "Antiques", "Handcrafts", "Photography"]},
            {"name": "Hobbies", "subs": ["Gardening", "Fishing", "Collecting", "Travel Accessories", "Puzzle & Strategy"]},
        ],
    },
    {
        "name": "Commercial Equipment",
        "slug": "commercial-equipment",
        "icon_name": "tool",
        "subcategories": [
            {"name": "Office Equipment", "subs": ["Photocopiers", "Projectors", "Office Chairs", "Filing Cabinets", "Safes"]},
            {"name": "Industrial Machinery", "subs": ["Generators", "Compressors", "Welding Equipment", "Power Tools", "Forklifts"]},
            {"name": "Agricultural Equipment", "subs": ["Tractors", "Irrigation Pumps", "Sprayers", "Hand Tools", "Threshers"]},
            {"name": "Restaurant Equipment", "subs": ["Commercial Fridges", "Gas Cookers", "Ovens", "Food Processors", "Display Fridges"]},
            {"name": "Other Commercial", "subs": ["POS Systems", "Barcode Scanners", "Cash Registers", "Display Shelves"]},
        ],
    },
    {
        "name": "Repair & Construction",
        "slug": "repair-construction",
        "icon_name": "hammer",
        "subcategories": [
            {"name": "Building Materials", "subs": ["Cement", "Steel Rods", "Bricks & Blocks", "Roofing Sheets", "Sand & Gravel", "Paint"]},
            {"name": "Electrical Supplies", "subs": ["Cables & Wires", "Switches & Sockets", "Circuit Breakers", "LED Lights", "Inverters"]},
            {"name": "Plumbing", "subs": ["Pipes & Fittings", "Water Tanks", "Taps & Valves", "Pumps", "Geysers"]},
            {"name": "Hand & Power Tools", "subs": ["Drills", "Grinders", "Hammers", "Saws", "Screwdrivers", "Measuring Tools"]},
            {"name": "Doors, Windows & Steel", "subs": ["Steel Doors", "Wooden Doors", "Windows", "Gates & Fencing", "Locks & Keys"]},
            {"name": "Solar Energy", "subs": ["Solar Panels", "Solar Batteries", "Solar Inverters", "Solar Water Heaters", "Solar Lights"]},
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
