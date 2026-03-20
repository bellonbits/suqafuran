"""
Seed 10 realistic listings per category.
Run with: docker compose exec api python -m app.seed_listings
"""
import random
from sqlmodel import Session, select
from app.db.session import engine
from app.models.listing import Listing, Category, SubCategory
from app.models.user import User

LOCATIONS = [
    "Mogadishu, Banadir", "Hargeisa, Somaliland", "Kismayo, Jubaland",
    "Bosasso, Puntland", "Garowe, Puntland", "Berbera, Somaliland",
    "Marka, Lower Shabelle", "Baidoa, South West", "Galkayo, Mudug",
    "Jowhar, Middle Shabelle",
]

UNSPLASH = {
    "Food & Groceries": [
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600",
        "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600",
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600",
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
    ],
    "Clothing & Shoes": [
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600",
        "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600",
        "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600",
    ],
    "Household Items": [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
        "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600",
        "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600",
        "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600",
    ],
    "Electronics": [
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600",
        "https://images.unsplash.com/photo-1593344484962-796055d4a3a4?w=600",
        "https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=600",
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600",
    ],
    "Vehicles": [
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600",
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600",
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600",
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600",
    ],
    "Livestock": [
        "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600",
        "https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=600",
        "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600",
        "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600",
        "https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=600",
    ],
    "Land & Farms": [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600",
        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600",
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600",
        "https://images.unsplash.com/photo-1595408076683-5d0291d2fadc?w=600",
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600",
    ],
    "Property": [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600",
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600",
    ],
    "Services": [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600",
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600",
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600",
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600",
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600",
    ],
    "Jobs": [
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",
        "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600",
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600",
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600",
    ],
    "Beauty & Personal Care": [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600",
        "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600",
        "https://images.unsplash.com/photo-1583248369069-9d91f1640fe6?w=600",
        "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600",
    ],
    "Babies & Kids": [
        "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600",
        "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600",
    ],
    "Leisure & Sports": [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600",
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600",
        "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=600",
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600",
    ],
    "Commercial Equipment": [
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600",
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600",
        "https://images.unsplash.com/photo-1565608087341-404b25492fee?w=600",
        "https://images.unsplash.com/photo-1612810806695-30f7a8258391?w=600",
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600",
    ],
    "Repair & Construction": [
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600",
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600",
        "https://images.unsplash.com/photo-1565008576549-57569a49f3d2?w=600",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
        "https://images.unsplash.com/photo-1486328228599-85db4443971f?w=600",
    ],
}

# 10 listings per category
LISTINGS_BY_CATEGORY = {
    "Food & Groceries": [
        {"title": "Fresh Basmati Rice 25kg Bag", "description": "High-quality basmati rice imported from Pakistan. Long grain, aromatic, perfect for Somali rice dishes. Clean and well-sorted grains. Sold in 25kg sacks.", "price": 28.0, "condition": "New", "attributes": {"weight": "25kg", "origin": "Pakistan", "type": "Basmati"}},
        {"title": "Fresh Goat Meat per Kg", "description": "Freshly slaughtered goat meat from healthy local goats. Halal certified. Available daily. Order 5kg or more for free delivery within Mogadishu.", "price": 6.5, "condition": "New", "attributes": {"weight_unit": "per kg", "halal": True, "availability": "Daily"}},
        {"title": "Camel Milk – 1 Litre Fresh", "description": "Pure fresh camel milk from our farm. Rich in vitamins and nutrients. Delivered fresh daily. Known for its health benefits and unique taste.", "price": 3.0, "condition": "New", "attributes": {"volume": "1 Litre", "type": "Fresh", "fat_content": "Natural"}},
        {"title": "Xawaash Spice Mix 500g", "description": "Traditional Somali xawaash spice blend. Made from authentic spices: cardamom, cumin, coriander, black pepper, cloves and cinnamon. Perfect for rice and meat dishes.", "price": 4.5, "condition": "New", "attributes": {"weight": "500g", "ingredients": "Cardamom, Cumin, Coriander, Black Pepper", "made_in": "Somalia"}},
        {"title": "Avocado – Tray of 20", "description": "Fresh ripe avocados, grown locally. Rich creamy taste. Perfect for salads, sandwiches and dips. Available in trays of 20 pieces.", "price": 8.0, "condition": "New", "attributes": {"quantity": "20 pieces", "origin": "Local", "size": "Medium-Large"}},
        {"title": "Canjeero / Injera – 10 Pieces", "description": "Freshly made Somali canjeero. Soft, sour and perfectly fermented. Made from sorghum flour. Baked fresh every morning. Order before 8am for same-day delivery.", "price": 2.5, "condition": "New", "attributes": {"quantity": "10 pieces", "flour": "Sorghum", "freshness": "Same-day baked"}},
        {"title": "Dates (Timir) – 1kg Premium Medjool", "description": "Premium Medjool dates from Saudi Arabia. Large, soft and sweet. Perfect for Ramadan and daily consumption. Rich in natural energy.", "price": 7.0, "condition": "New", "attributes": {"weight": "1kg", "variety": "Medjool", "origin": "Saudi Arabia"}},
        {"title": "Organic Honey – 500ml Jar", "description": "Pure natural Somali honey harvested from wild bees in the highlands. No additives, no preservatives. Thick, golden and aromatic. Great for health and cooking.", "price": 12.0, "condition": "New", "attributes": {"volume": "500ml", "type": "Wild Honey", "preservatives": "None"}},
        {"title": "Fresh Prawns – 1kg Cleaned", "description": "Fresh tiger prawns caught daily from the Indian Ocean coast. Cleaned and ready to cook. Rich in protein. Available chilled or fresh.", "price": 9.0, "condition": "New", "attributes": {"weight": "1kg", "type": "Tiger Prawns", "preparation": "Cleaned & Deveined"}},
        {"title": "Bur Somali – 2kg Bag", "description": "Traditional Somali bur (corn grits) milled fresh. Perfect for breakfast porridge. Smooth texture, naturally gluten-reduced. A staple food in Somali households.", "price": 3.5, "condition": "New", "attributes": {"weight": "2kg", "grain": "Corn", "texture": "Fine Ground"}},
    ],
    "Clothing & Shoes": [
        {"title": "Men's Dirac Traditional Suit", "description": "Elegant men's traditional Somali suit (Khamiis + Macawis) made from premium cotton. Comfortable and breathable for hot climates. Available in white, navy and beige.", "price": 45.0, "condition": "New", "attributes": {"material": "Cotton", "colors": "White, Navy, Beige", "sizes": "S, M, L, XL, XXL"}},
        {"title": "Women's Abaya – Premium Nida Fabric", "description": "Modest and elegant women's abaya made from high-quality Nida fabric. Lightweight, flowing and comfortable. Comes with matching hijab. Multiple colours available.", "price": 35.0, "condition": "New", "attributes": {"material": "Nida", "includes": "Matching Hijab", "sizes": "S, M, L, XL"}},
        {"title": "Nike Air Max 270 – Size 42", "description": "Authentic Nike Air Max 270 sneakers. Excellent cushioning and stylish design. Barely used, in perfect condition. Size 42 EU (UK 8). Comes with original box.", "price": 75.0, "condition": "Used", "attributes": {"brand": "Nike", "model": "Air Max 270", "size": "42 EU", "color": "White/Black"}},
        {"title": "Girls School Uniform Set", "description": "Complete girls school uniform: white blouse, navy blue skirt and black belt. Good quality, easy to wash. Sizes available from age 5 to 14 years.", "price": 15.0, "condition": "New", "attributes": {"includes": "Blouse, Skirt, Belt", "ages": "5-14 years", "material": "Polyester-Cotton blend"}},
        {"title": "Men's Leather Oxford Shoes", "description": "Classic men's genuine leather Oxford shoes. Formal and elegant. Handcrafted with durable rubber soles. Perfect for office and events. Sizes 39–45.", "price": 55.0, "condition": "New", "attributes": {"material": "Genuine Leather", "style": "Oxford", "sizes": "39–45", "sole": "Rubber"}},
        {"title": "Women's Handbag – Genuine Leather", "description": "Premium genuine leather women's handbag. Spacious interior with multiple compartments. Gold-tone hardware. Available in black, brown and beige.", "price": 40.0, "condition": "New", "attributes": {"material": "Genuine Leather", "colors": "Black, Brown, Beige", "hardware": "Gold-tone"}},
        {"title": "Somali Wedding Dirac Dress", "description": "Stunning Somali dirac wedding dress with intricate embroidery. Made from soft silk-like fabric. Comes with matching guntiino wrap. Perfect for weddings and celebrations.", "price": 120.0, "condition": "New", "attributes": {"occasion": "Wedding", "fabric": "Silk-blend", "includes": "Dress + Guntiino wrap"}},
        {"title": "Children's Sports Shoes – Size 32", "description": "Comfortable and durable children's sports shoes. Non-slip sole, breathable mesh upper. Ideal for school and outdoor play. Sizes 28–36 available.", "price": 18.0, "condition": "New", "attributes": {"size": "32", "upper": "Mesh", "sole": "Non-slip rubber", "age_range": "7-9 years"}},
        {"title": "Men's Wristwatch – Casio Classic", "description": "Casio classic digital wristwatch. Water-resistant, durable and stylish. Long battery life. Perfect everyday watch for men. Comes with original box and warranty.", "price": 25.0, "condition": "New", "attributes": {"brand": "Casio", "water_resistant": True, "battery_life": "2 years", "color": "Black"}},
        {"title": "Traditional Guntiino Wrap – 3 Metres", "description": "Authentic Somali guntiino fabric wrap, 3 metres. Soft and vibrant colours. Used as traditional dress for women. Available in many patterns and colours.", "price": 22.0, "condition": "New", "attributes": {"length": "3 metres", "material": "Viscose", "use": "Traditional dress"}},
    ],
    "Household Items": [
        {"title": "Samsung 320L Double Door Fridge", "description": "Samsung double door refrigerator, 320 litres capacity. Energy efficient, A+ rating. Frost-free with digital temperature control. Excellent condition, 1 year old.", "price": 380.0, "condition": "Used", "attributes": {"brand": "Samsung", "capacity": "320L", "energy_rating": "A+", "frost_free": True}},
        {"title": "6-Seater Dining Table Set – Solid Wood", "description": "Beautiful solid wood dining table with 6 matching chairs. Dark mahogany finish. Sturdy and scratch-resistant. Seats 6 comfortably. Available for delivery.", "price": 290.0, "condition": "New", "attributes": {"material": "Solid Wood", "seats": 6, "finish": "Mahogany", "assembly": "Required"}},
        {"title": "Mosquito Net – King Size Double Layer", "description": "Premium double-layer mosquito net for king-size beds. Polyester mesh, treated for extra protection. Easy to hang with suspension kit included.", "price": 12.0, "condition": "New", "attributes": {"size": "King", "layers": 2, "material": "Polyester mesh", "includes": "Suspension kit"}},
        {"title": "Gas Cooker – 4 Burner Stainless Steel", "description": "Heavy duty 4-burner gas cooker with stainless steel top. Auto ignition, durable cast iron grates. Compatible with LPG gas. Brand new with warranty.", "price": 95.0, "condition": "New", "attributes": {"burners": 4, "ignition": "Auto", "material": "Stainless steel", "gas_type": "LPG"}},
        {"title": "Persian Carpet 3m x 4m", "description": "Beautiful large Persian-style carpet, 3x4 metres. Rich red and gold colours with intricate pattern. Thick pile, very comfortable underfoot. Hand-washed and clean.", "price": 150.0, "condition": "Used", "attributes": {"size": "3m x 4m", "style": "Persian", "color": "Red & Gold", "pile": "Thick"}},
        {"title": "Curtains Set – 4 Panels Blackout", "description": "Set of 4 blackout curtain panels. Blocks 95% of light. Thermal insulated, energy efficient. Ring-top header. Available in grey, beige and navy.", "price": 40.0, "condition": "New", "attributes": {"panels": 4, "type": "Blackout", "header": "Ring-top", "colors": "Grey, Beige, Navy"}},
        {"title": "Washing Machine – 7kg Automatic", "description": "Top-loading automatic washing machine, 7kg capacity. 8 wash programs including gentle and quick wash. Energy efficient. In good working condition.", "price": 220.0, "condition": "Used", "attributes": {"capacity": "7kg", "type": "Top-loading", "programs": 8, "energy_efficient": True}},
        {"title": "Bed Frame – Queen Size with Storage", "description": "Queen-size bed frame with 4 under-bed storage drawers. Strong MDF construction with fabric headboard. Easy assembly. Mattress not included.", "price": 175.0, "condition": "New", "attributes": {"size": "Queen", "storage_drawers": 4, "material": "MDF", "mattress_included": False}},
        {"title": "Water Dispenser – Hot & Cold", "description": "Free-standing water dispenser with hot and cold functions. Child safety lock on hot tap. Energy-saving mode. Fits standard 19L water bottles.", "price": 65.0, "condition": "New", "attributes": {"functions": "Hot & Cold", "bottle_size": "19L", "child_lock": True, "energy_saving": True}},
        {"title": "Standing Fan – 18 Inch Orbit Fan", "description": "Large 18-inch orbit standing fan. 3 speed settings, 90-degree oscillation. Quiet motor, height adjustable. Essential for hot Somali summers.", "price": 28.0, "condition": "New", "attributes": {"size": "18 inch", "speeds": 3, "oscillation": "90 degrees", "adjustable_height": True}},
    ],
    "Electronics": [
        {"title": "Samsung Galaxy A54 – 128GB", "description": "Samsung Galaxy A54 smartphone. 6.4-inch Super AMOLED display, 5000mAh battery, 48MP triple camera. 128GB storage, 8GB RAM. Unlocked, with charger and original box.", "price": 320.0, "condition": "New", "attributes": {"brand": "Samsung", "model": "Galaxy A54", "storage": "128GB", "ram": "8GB", "camera": "48MP"}},
        {"title": "HP Laptop – Core i5 11th Gen, 8GB RAM", "description": "HP laptop with Intel Core i5 11th generation processor. 8GB DDR4 RAM, 512GB SSD. 15.6-inch Full HD display. Windows 11 pre-installed. Excellent for work and studies.", "price": 550.0, "condition": "New", "attributes": {"brand": "HP", "processor": "Intel Core i5 11th Gen", "ram": "8GB", "storage": "512GB SSD", "display": "15.6 FHD"}},
        {"title": "Samsung 55-inch 4K Smart TV", "description": "Samsung 55-inch Crystal 4K Smart TV. Built-in Netflix, YouTube and more. HDR10+ support, slim bezel design. Remote control and wall-mount bracket included.", "price": 480.0, "condition": "New", "attributes": {"brand": "Samsung", "size": "55 inch", "resolution": "4K UHD", "smart": True, "hdr": "HDR10+"}},
        {"title": "Tecno Spark 20 – 128GB", "description": "Tecno Spark 20 smartphone. 6.56-inch display, 5000mAh battery. 128GB internal storage, 16MP selfie camera. Great value for money. Brand new, sealed box.", "price": 140.0, "condition": "New", "attributes": {"brand": "Tecno", "model": "Spark 20", "storage": "128GB", "battery": "5000mAh", "selfie_cam": "16MP"}},
        {"title": "JBL Bluetooth Speaker – Charge 5", "description": "JBL Charge 5 portable Bluetooth speaker. Waterproof IP67 rating. 20 hours playtime, built-in power bank. Deep bass, 360-degree sound. Great for outdoor use.", "price": 120.0, "condition": "New", "attributes": {"brand": "JBL", "model": "Charge 5", "waterproof": "IP67", "battery_life": "20 hours", "power_bank": True}},
        {"title": "PlayStation 4 – 500GB with 2 Controllers", "description": "Sony PlayStation 4 console, 500GB. Includes 2 wireless controllers and 5 games. HDMI cable included. In excellent working condition. All original.", "price": 200.0, "condition": "Used", "attributes": {"brand": "Sony", "model": "PS4", "storage": "500GB", "controllers": 2, "games_included": 5}},
        {"title": "TP-Link WiFi Router – AC1200 Dual Band", "description": "TP-Link Archer C54 WiFi router. AC1200 dual-band, 2.4GHz and 5GHz. Covers up to 4 rooms. Easy setup with app. Perfect for home and small office use.", "price": 35.0, "condition": "New", "attributes": {"brand": "TP-Link", "model": "Archer C54", "speed": "AC1200", "bands": "Dual (2.4GHz + 5GHz)", "coverage": "4 rooms"}},
        {"title": "Canon EOS 2000D DSLR Camera Kit", "description": "Canon EOS 2000D DSLR camera with 18-55mm lens kit. 24.1MP sensor, WiFi & NFC, Full HD video. Includes camera bag, 32GB memory card and extra battery.", "price": 380.0, "condition": "Used", "attributes": {"brand": "Canon", "model": "EOS 2000D", "megapixels": "24.1MP", "lens": "18-55mm", "includes": "Bag, 32GB Card, Extra Battery"}},
        {"title": "Apple AirPods Pro 2nd Gen", "description": "Apple AirPods Pro 2nd generation. Active noise cancellation, transparency mode. MagSafe charging case. Up to 30 hours total battery. Brand new, sealed.", "price": 220.0, "condition": "New", "attributes": {"brand": "Apple", "model": "AirPods Pro 2nd Gen", "noise_cancellation": True, "total_battery": "30 hours", "charging": "MagSafe"}},
        {"title": "Huawei Band 8 Smart Watch", "description": "Huawei Band 8 fitness smartwatch. 1.47-inch AMOLED display, 14-day battery life. Heart rate, SpO2, sleep tracking. 100+ workout modes. Lightweight at just 14g.", "price": 55.0, "condition": "New", "attributes": {"brand": "Huawei", "model": "Band 8", "display": "1.47 AMOLED", "battery_life": "14 days", "weight": "14g"}},
    ],
    "Vehicles": [
        {"title": "Toyota Land Cruiser V8 – 2012", "description": "Toyota Land Cruiser 200 Series V8, 2012 model. GXR trim, fully loaded. Leather seats, sunroof, rear camera, 4WD. Well maintained, service history available. 180,000 km.", "price": 35000.0, "condition": "Used", "attributes": {"brand": "Toyota", "model": "Land Cruiser V8", "year": 2012, "mileage": "180,000 km", "trim": "GXR", "engine": "V8 4.5L"}},
        {"title": "Toyota Corolla – 2016 Sedan", "description": "Toyota Corolla sedan, 2016, 1.6L engine. Silver colour, manual gearbox. AC, power windows, central locking. Clean interior, well maintained. 95,000 km.", "price": 12500.0, "condition": "Used", "attributes": {"brand": "Toyota", "model": "Corolla", "year": 2016, "engine": "1.6L", "gearbox": "Manual", "mileage": "95,000 km"}},
        {"title": "Honda Motorcycle – CB125F 2020", "description": "Honda CB125F motorbike, 2020. Fuel efficient, easy to ride. Single cylinder 125cc engine. Used for delivery. Good tyres, recently serviced. 22,000 km.", "price": 1800.0, "condition": "Used", "attributes": {"brand": "Honda", "model": "CB125F", "year": 2020, "engine": "125cc", "mileage": "22,000 km", "use": "Delivery"}},
        {"title": "Bajaj RE Auto Tuk-tuk – 2021", "description": "Bajaj RE three-wheeler tuk-tuk, 2021. Passenger version, seats 3. Petrol engine, fuel efficient. Good condition, used for taxi services. Ready to work.", "price": 4200.0, "condition": "Used", "attributes": {"brand": "Bajaj", "model": "RE", "year": 2021, "seats": 3, "fuel": "Petrol", "use": "Passenger Taxi"}},
        {"title": "Nissan Pickup Truck – Double Cab 2015", "description": "Nissan Navara double cab pickup, 2015. 2.5L diesel engine, 4WD. Hard cover tonneau. Bull bar and tow hitch fitted. Excellent for business and off-road use.", "price": 18500.0, "condition": "Used", "attributes": {"brand": "Nissan", "model": "Navara", "year": 2015, "engine": "2.5L Diesel", "drive": "4WD", "cabin": "Double Cab"}},
        {"title": "Toyota Hiace Minibus – 15 Seats 2014", "description": "Toyota Hiace minibus, 14-seat capacity, 2014 model. 2.7L petrol engine. Used for inter-city transport. AC, good condition. Ready for business use.", "price": 22000.0, "condition": "Used", "attributes": {"brand": "Toyota", "model": "Hiace", "year": 2014, "seats": 14, "engine": "2.7L Petrol", "use": "Passenger Transport"}},
        {"title": "Suzuki Alto – 2019, Low Mileage", "description": "Suzuki Alto 2019, 660cc engine. Automatic gearbox, very fuel efficient. Ideal city car. White colour, AC, power steering. 35,000 km only. Excellent condition.", "price": 7800.0, "condition": "Used", "attributes": {"brand": "Suzuki", "model": "Alto", "year": 2019, "engine": "660cc", "gearbox": "Automatic", "mileage": "35,000 km"}},
        {"title": "Set of 4 Tyres – 265/70 R16 Toyota Prado", "description": "Set of 4 all-terrain tyres, size 265/70 R16. Fits Toyota Prado, Hilux and Land Cruiser. 70% tread remaining. Excellent for both road and off-road use.", "price": 280.0, "condition": "Used", "attributes": {"size": "265/70 R16", "type": "All-Terrain", "quantity": 4, "tread": "70%", "compatible": "Prado, Hilux, Land Cruiser"}},
        {"title": "Pioneer Car Audio System – Double DIN", "description": "Pioneer AVH-Z5200DAB double DIN car stereo. 7-inch touchscreen, Apple CarPlay & Android Auto. Bluetooth, CD/DVD, reversing camera input. Brand new, in box.", "price": 180.0, "condition": "New", "attributes": {"brand": "Pioneer", "model": "AVH-Z5200DAB", "screen": "7 inch", "carplay": True, "android_auto": True}},
        {"title": "Car Battery – Amaron 75AH", "description": "Amaron heavy-duty car battery, 75AH, 12V. Maintenance-free sealed battery. High cold cranking amps (CCA). Fits Toyota, Nissan, Mitsubishi and most vehicles.", "price": 85.0, "condition": "New", "attributes": {"brand": "Amaron", "capacity": "75AH", "voltage": "12V", "maintenance_free": True, "compatible": "Toyota, Nissan, Mitsubishi"}},
    ],
    "Livestock": [
        {"title": "Healthy Goat – Local Breed, 2 Years Old", "description": "Healthy and well-fed local Somali goat, 2 years old. Approximately 25kg live weight. No diseases. Good for slaughter or breeding. Can arrange transport.", "price": 120.0, "condition": "New", "attributes": {"type": "Local Goat", "age": "2 years", "weight": "~25kg", "purpose": "Slaughter/Breeding"}},
        {"title": "Dairy Cow – Friesian Cross, High Producer", "description": "Friesian cross dairy cow, 4 years old. Producing 15-18 litres of milk per day. Currently lactating. Vaccinated and dewormed. Healthy and docile.", "price": 950.0, "condition": "New", "attributes": {"breed": "Friesian Cross", "age": "4 years", "milk_yield": "15-18L/day", "vaccinated": True, "lactating": True}},
        {"title": "Fat-Tailed Sheep – 3 Available", "description": "Three fat-tailed Somali sheep for sale. Each weighing approximately 30-35kg. Well fed on hay and grazing. Ideal for Eid celebrations or daily meat supply.", "price": 180.0, "condition": "New", "attributes": {"breed": "Fat-tailed Somali", "quantity": 3, "weight": "30-35kg each", "purpose": "Eid/Meat"}},
        {"title": "Racing Camel – Trained Male, 3 Years", "description": "Trained male racing camel, 3 years old. Well-built and fast. Experienced in competitions. Comes with race saddle and harness. Rare opportunity.", "price": 3500.0, "condition": "New", "attributes": {"type": "Racing Camel", "gender": "Male", "age": "3 years", "trained": True, "includes": "Race saddle & harness"}},
        {"title": "Layer Chickens – 50 Birds, 18 Weeks Old", "description": "50 layer chickens, 18 weeks old and ready to start laying. Rhode Island Red breed. Vaccinated against Newcastle and Marek's disease. Sold as a flock.", "price": 250.0, "condition": "New", "attributes": {"breed": "Rhode Island Red", "quantity": 50, "age": "18 weeks", "vaccinated": True, "status": "Ready to lay"}},
        {"title": "Pure Breed Dairy Camel – Female", "description": "Pure Somali dairy camel, female, 5 years old. Producing 10-12 litres per day. Well-trained, gentle to handle. Excellent for camel milk production business.", "price": 2800.0, "condition": "New", "attributes": {"gender": "Female", "age": "5 years", "milk_yield": "10-12L/day", "temperament": "Gentle"}},
        {"title": "Local Goats x 10 – Mixed Males & Females", "description": "Batch of 10 local Somali goats. Mix of males and females. Ages 1-2 years. Healthy, vaccinated. Great for starting a small goat herd. Priced per batch.", "price": 900.0, "condition": "New", "attributes": {"quantity": 10, "age": "1-2 years", "mix": "Male & Female", "vaccinated": True}},
        {"title": "Oxen Pair – Strong Working Bulls", "description": "A matched pair of working oxen. Fully trained for ploughing and farm work. Ages 5-6 years. Large frame, strong. Ideal for agricultural use in rural areas.", "price": 1400.0, "condition": "New", "attributes": {"type": "Working Oxen", "quantity": 2, "age": "5-6 years", "trained": True, "use": "Agriculture"}},
        {"title": "German Shepherd Puppy – 8 Weeks Old", "description": "Pure breed German Shepherd puppy, 8 weeks old. Both parents on site. Socialized with children and other animals. First vaccination done. Excellent guard dog breed.", "price": 300.0, "condition": "New", "attributes": {"breed": "German Shepherd", "age": "8 weeks", "vaccinated": True, "socialized": True}},
        {"title": "Turkey Birds – 6 Adults for Sale", "description": "6 adult turkey birds for sale, mix of males and females. Large size, around 8kg each. Healthy, free-range raised. Ideal for ceremonies and festive meals.", "price": 360.0, "condition": "New", "attributes": {"quantity": 6, "weight": "~8kg each", "raised": "Free-range", "mix": "Male & Female"}},
    ],
    "Land & Farms": [
        {"title": "Residential Plot – 15x20m Mogadishu", "description": "Residential land plot, 15m x 20m (300 sqm). Located in Wadajir district, Mogadishu. Title deed available. Close to main road, water and electricity nearby.", "price": 18000.0, "condition": "New", "attributes": {"size": "300 sqm", "dimensions": "15m x 20m", "district": "Wadajir", "title_deed": True}},
        {"title": "Farm Land – 2 Hectares, Jowhar", "description": "Fertile agricultural farm land, 2 hectares in Jowhar near the Shabelle river. Irrigated, suitable for vegetables, sorghum and sesame. Existing water pump included.", "price": 12000.0, "condition": "New", "attributes": {"size": "2 hectares", "location": "Jowhar", "water_source": "River irrigation", "pump_included": True}},
        {"title": "Commercial Plot – 20x30m Main Road", "description": "Prime commercial land on Maka Al-Mukarama road, Mogadishu. 600 sqm with road frontage. Perfect for shop, hotel or commercial building. Title deed available.", "price": 85000.0, "condition": "New", "attributes": {"size": "600 sqm", "type": "Commercial", "road": "Maka Al-Mukarama", "title_deed": True}},
        {"title": "Orchard Land – Banana & Mango Trees", "description": "5-acre orchard with established banana and mango trees. Located in Afgoye corridor. Seasonal water access. Productive land, income-generating from existing trees.", "price": 22000.0, "condition": "New", "attributes": {"size": "5 acres", "trees": "Banana & Mango", "location": "Afgoye Corridor", "water": "Seasonal"}},
        {"title": "Residential Plot – Hargeisa, 400 sqm", "description": "400 sqm residential plot in Hargeisa, Somaliland. Located in 26 June neighbourhood. Flat terrain, easy to build. Title deed and full documentation available.", "price": 14000.0, "condition": "New", "attributes": {"size": "400 sqm", "city": "Hargeisa", "neighbourhood": "26 June", "title_deed": True}},
        {"title": "Livestock Farm – 10 Acres Bosasso", "description": "10-acre livestock farm in Bosasso, Puntland. Fenced perimeter, water well on site. Currently used for goat and cattle grazing. Existing shelters and feed store.", "price": 30000.0, "condition": "New", "attributes": {"size": "10 acres", "city": "Bosasso", "fenced": True, "water_well": True, "structures": "Shelters & Feed store"}},
        {"title": "Mixed Farm – 3 Hectares Galkayo", "description": "Mixed farm of 3 hectares near Galkayo. Suitable for crop and livestock farming. Solar-powered water pump. Good access road. Documents available.", "price": 16000.0, "condition": "New", "attributes": {"size": "3 hectares", "city": "Galkayo", "water": "Solar pump", "use": "Crop & Livestock"}},
        {"title": "Vacant Land – Kismayo Beachfront 500 sqm", "description": "Rare beachfront vacant land in Kismayo, 500 sqm. Direct ocean access, stunning views. Ideal for tourism, hotel or seafood business. Title deed available.", "price": 55000.0, "condition": "New", "attributes": {"size": "500 sqm", "type": "Beachfront", "city": "Kismayo", "title_deed": True}},
        {"title": "Irrigated Farm – 1 Hectare, Marka", "description": "One hectare of irrigated farmland in Marka. Currently growing tomatoes and onions. Water pump and irrigation system already installed. Ready to use.", "price": 9500.0, "condition": "New", "attributes": {"size": "1 hectare", "city": "Marka", "irrigation": "Installed", "crops": "Tomatoes & Onions"}},
        {"title": "Industrial Land – 1 Acre Berbera Port Area", "description": "Industrial zoned land, 1 acre near Berbera port. Strategic location for logistics, warehousing or manufacturing. Road access. Full title documentation.", "price": 75000.0, "condition": "New", "attributes": {"size": "1 acre", "zone": "Industrial", "city": "Berbera", "near": "Port", "title_deed": True}},
    ],
    "Property": [
        {"title": "3-Bedroom Villa for Rent – Mogadishu", "description": "Spacious 3-bedroom villa available for rent in Hodan district. Living room, 2 bathrooms, modern kitchen, parking for 2 cars. Generator and water tank included.", "price": 800.0, "condition": "New", "attributes": {"bedrooms": 3, "bathrooms": 2, "district": "Hodan", "parking": 2, "includes": "Generator & Water tank", "rent": "Monthly"}},
        {"title": "1-Bedroom Apartment – Hargeisa City Centre", "description": "Modern 1-bedroom apartment in Hargeisa city centre. Fully furnished, AC, hot water, 24/7 security. Walking distance to shops and restaurants. Available now.", "price": 350.0, "condition": "New", "attributes": {"bedrooms": 1, "furnished": True, "city": "Hargeisa", "security": "24/7", "rent": "Monthly"}},
        {"title": "Office Space – 80 sqm Maka Al-Mukarama", "description": "Professional office space for rent, 80 sqm. Ground floor, main road frontage. Air-conditioned, reception area, 2 private offices and conference room. Fibre internet available.", "price": 1200.0, "condition": "New", "attributes": {"size": "80 sqm", "rooms": "Reception + 2 offices + Conference", "floor": "Ground", "internet": "Fibre", "ac": True}},
        {"title": "Villa for Sale – 5 Bedrooms, Mogadishu", "description": "Large 5-bedroom villa for sale in Wadajir, Mogadishu. 2-storey building, 4 bathrooms, large garden, rooftop terrace. Solar panels and rainwater harvesting. Title deed clear.", "price": 180000.0, "condition": "New", "attributes": {"bedrooms": 5, "bathrooms": 4, "floors": 2, "garden": True, "solar": True, "title_deed": True}},
        {"title": "Shop for Rent – Bakara Market", "description": "Ground floor shop for rent in Bakara Market area. 25 sqm, main road visible. High foot traffic location. Suitable for retail, phone shop or money transfer. Available immediately.", "price": 600.0, "condition": "New", "attributes": {"size": "25 sqm", "floor": "Ground", "market": "Bakara", "foot_traffic": "High", "rent": "Monthly"}},
        {"title": "2-Bedroom Apartment for Sale – Puntland", "description": "2-bedroom apartment for sale in Garowe, Puntland. 3rd floor, 110 sqm. Living room, modern kitchen, 1 bathroom. Recently built, quality finishes. Title deed available.", "price": 45000.0, "condition": "New", "attributes": {"bedrooms": 2, "size": "110 sqm", "floor": "3rd", "city": "Garowe", "title_deed": True}},
        {"title": "Hotel Room – Daily Rental Mogadishu", "description": "Comfortable hotel room available for daily rental in Mogadishu. AC, hot shower, WiFi, TV. 24/7 security. Breakfast optional. Located near airport road.", "price": 60.0, "condition": "New", "attributes": {"room_type": "Standard", "amenities": "AC, WiFi, TV, Hot shower", "breakfast": "Optional", "security": "24/7", "rent": "Daily"}},
        {"title": "Warehouse for Rent – Mogadishu Port Area", "description": "600 sqm warehouse available for rent near Mogadishu port. High roof, roller shutter doors, concrete floor. Ideal for import/export storage. 24/7 security.", "price": 2500.0, "condition": "New", "attributes": {"size": "600 sqm", "location": "Port Area", "doors": "Roller Shutter", "floor": "Concrete", "security": "24/7", "rent": "Monthly"}},
        {"title": "Event Hall – 300 Guests Capacity", "description": "Spacious event hall available for hire. Capacity 300 guests. Air-conditioned, sound system, stage. Suitable for weddings, graduations and corporate events.", "price": 800.0, "condition": "New", "attributes": {"capacity": 300, "ac": True, "sound_system": True, "stage": True, "use": "Weddings, Events, Corporate", "rent": "Per event"}},
        {"title": "Studio Flat – Furnished, Hargeisa", "description": "Furnished studio flat for rent in Hargeisa. One room with kitchenette, bathroom. AC, WiFi, 24/7 water. Ideal for single professionals or students.", "price": 200.0, "condition": "New", "attributes": {"type": "Studio", "furnished": True, "city": "Hargeisa", "wifi": True, "water": "24/7", "rent": "Monthly"}},
    ],
    "Services": [
        {"title": "Professional House Painting Service", "description": "Experienced painting team offering interior and exterior painting services. Quality paints, smooth finish. Competitive rates. Free quote available. Serving all of Mogadishu.", "price": 150.0, "condition": "New", "attributes": {"service_area": "Mogadishu", "type": "Interior & Exterior", "free_quote": True, "experience": "10 years"}},
        {"title": "Website Development – Business Website", "description": "Professional website development for businesses. Custom designed, mobile-friendly, SEO optimized. E-commerce, booking or info sites. Delivered in 2 weeks. Hosting included for 1 year.", "price": 500.0, "condition": "New", "attributes": {"delivery": "2 weeks", "mobile_friendly": True, "seo": True, "hosting": "1 year included"}},
        {"title": "Electrical Installation & Repair", "description": "Certified electrician available for home and commercial electrical work. Wiring, sockets, breakers, solar installation and fault finding. Call for same-day service.", "price": 80.0, "condition": "New", "attributes": {"certified": True, "services": "Wiring, Sockets, Solar, Fault finding", "response": "Same-day"}},
        {"title": "Catering Service – Events & Weddings", "description": "Professional catering for weddings, corporate events and celebrations. Traditional Somali cuisine and international menu options. Serving up to 500 guests. Experienced team.", "price": 8.0, "condition": "New", "attributes": {"capacity": "Up to 500 guests", "cuisine": "Somali & International", "per_person": True, "includes": "Serving staff"}},
        {"title": "Photography & Videography – Wedding Package", "description": "Complete wedding photography and videography package. 8 hours coverage, 2 photographers, edited album and highlight video. Professional equipment. Book your date now.", "price": 600.0, "condition": "New", "attributes": {"coverage": "8 hours", "photographers": 2, "includes": "Album + Highlight Video", "booking": "Required"}},
        {"title": "Home Cleaning Service – Deep Clean", "description": "Professional deep cleaning for homes and apartments. Full clean including kitchen, bathrooms, bedrooms. Eco-friendly products. 4-5 hour service. Reliable and trustworthy.", "price": 50.0, "condition": "New", "attributes": {"type": "Deep Clean", "duration": "4-5 hours", "products": "Eco-friendly", "includes": "All rooms"}},
        {"title": "Plumbing Services – Installation & Repair", "description": "Licensed plumber available for all plumbing needs. Pipe installation, tap repair, water heater installation, drainage and leak fixing. Emergency calls accepted.", "price": 60.0, "condition": "New", "attributes": {"licensed": True, "services": "Installation, Repair, Drainage", "emergency": True}},
        {"title": "English & Arabic Language Classes", "description": "Private and group language classes for English and Arabic. Experienced teachers. Morning and evening sessions. Certificate awarded on completion. Children and adults welcome.", "price": 40.0, "condition": "New", "attributes": {"languages": "English & Arabic", "sessions": "Morning & Evening", "certificate": True, "age": "Children & Adults", "per": "Monthly"}},
        {"title": "CCTV Installation – Home & Business", "description": "Professional CCTV camera installation. HD cameras, night vision, remote viewing via mobile app. 4 or 8 camera packages available. 1-year warranty on all equipment.", "price": 280.0, "condition": "New", "attributes": {"cameras": "4 or 8", "resolution": "HD", "night_vision": True, "remote_viewing": True, "warranty": "1 year"}},
        {"title": "Barbershop Service – Home Visit", "description": "Professional barber available for home visits. Men's haircut, beard trim and styling. Traditional and modern styles. Bring the barbershop experience to your home.", "price": 10.0, "condition": "New", "attributes": {"service": "Home Visit", "styles": "Traditional & Modern", "includes": "Haircut + Beard trim"}},
    ],
    "Jobs": [
        {"title": "Software Developer Needed – React & Python", "description": "Hiring a skilled software developer with 2+ years experience in React.js and Python/FastAPI. Remote work. Competitive salary. Healthcare startup in Mogadishu.", "price": 800.0, "condition": "New", "attributes": {"skills": "React.js, Python, FastAPI", "experience": "2+ years", "type": "Full-time", "remote": True, "salary": "Monthly"}},
        {"title": "School Teacher – Mathematics, Mogadishu", "description": "Primary school hiring experienced Mathematics teacher. Must have education degree and 2+ years teaching experience. Somali and English speakers welcome. Apply with CV.", "price": 300.0, "condition": "New", "attributes": {"subject": "Mathematics", "level": "Primary", "experience": "2+ years", "degree": "Required", "city": "Mogadishu"}},
        {"title": "Driver Needed – Personal Driver Hargeisa", "description": "Seeking experienced personal driver in Hargeisa. Must have valid driving licence, 5+ years experience. Clean record required. Owns a car preferred but not essential.", "price": 250.0, "condition": "New", "attributes": {"city": "Hargeisa", "licence": "Required", "experience": "5+ years", "car_owner": "Preferred", "type": "Full-time"}},
        {"title": "Nurse Vacancy – Mogadishu Private Clinic", "description": "Private clinic in Mogadishu hiring a qualified nurse. Must hold nursing certificate and have 1+ year clinical experience. Male or female. Immediate start available.", "price": 400.0, "condition": "New", "attributes": {"qualification": "Nursing Certificate", "experience": "1+ year", "type": "Full-time", "city": "Mogadishu", "start": "Immediate"}},
        {"title": "Accountant – Finance NGO Mogadishu", "description": "NGO looking for experienced accountant. CPA or accounting degree required. Familiar with QuickBooks and donor reporting. English and Somali required. Attractive package.", "price": 700.0, "condition": "New", "attributes": {"qualification": "CPA or Accounting Degree", "software": "QuickBooks", "languages": "English & Somali", "type": "Full-time"}},
        {"title": "Sales Representative – Mogadishu", "description": "FMCG company hiring sales representatives. Must have own motorbike. Target-driven with good communication skills. Commission + base salary. Immediate vacancies.", "price": 250.0, "condition": "New", "attributes": {"industry": "FMCG", "motorbike": "Required", "salary": "Base + Commission", "type": "Full-time", "city": "Mogadishu"}},
        {"title": "Electrician – Construction Project Berbera", "description": "Construction company needs qualified electrician for 6-month project in Berbera. Must have 3+ years experience in commercial wiring. Accommodation provided.", "price": 500.0, "condition": "New", "attributes": {"city": "Berbera", "experience": "3+ years", "duration": "6 months", "accommodation": "Provided", "type": "Contract"}},
        {"title": "Cook / Chef – Hotel Restaurant Kismayo", "description": "Hotel restaurant in Kismayo seeking experienced cook. Somali and international cuisine knowledge required. Full-time position with accommodation. 3+ years experience.", "price": 350.0, "condition": "New", "attributes": {"city": "Kismayo", "cuisine": "Somali & International", "experience": "3+ years", "accommodation": "Provided", "type": "Full-time"}},
        {"title": "Security Guard – Night Shift Mogadishu", "description": "Security company hiring night shift guards for commercial premises in Mogadishu. Must be physically fit, ex-military preferred. Training provided. Uniform included.", "price": 180.0, "condition": "New", "attributes": {"shift": "Night", "city": "Mogadishu", "military": "Preferred", "training": "Provided", "uniform": "Included"}},
        {"title": "Data Entry Clerk – NGO Garowe", "description": "NGO hiring data entry clerk in Garowe. Must type at 40+ WPM, familiar with Excel. Previous admin experience preferred. Part-time, 5 days a week. Training provided.", "price": 200.0, "condition": "New", "attributes": {"city": "Garowe", "skills": "Excel, Fast Typing (40+ WPM)", "type": "Part-time", "training": "Provided"}},
    ],
    "Beauty & Personal Care": [
        {"title": "Oud Al Mubakhar – Premium Bakhur 100g", "description": "Premium quality oud bakhur, 100g tin. Rich, deep woody fragrance. Traditional Somali and Arabian blend. Burned on charcoal to fill the home with beautiful scent.", "price": 18.0, "condition": "New", "attributes": {"weight": "100g", "type": "Bakhur Oud", "origin": "Arabian blend", "use": "Incense"}},
        {"title": "Henna Paste – Natural Brown Cone Set", "description": "Set of 12 natural henna cones. Ready to use, dark brown colour. Made from pure henna leaves. Perfect for hand and foot designs. Lasts 1-2 weeks.", "price": 8.0, "condition": "New", "attributes": {"quantity": "12 cones", "color": "Dark Brown", "material": "Natural Henna", "duration": "1-2 weeks"}},
        {"title": "Women's Perfume – Rose & Oud 50ml", "description": "Luxurious women's perfume, rose and oud blend. Long-lasting 12+ hours. Alcohol-free, halal certified. Imported from UAE. Comes in elegant gift box.", "price": 30.0, "condition": "New", "attributes": {"volume": "50ml", "notes": "Rose & Oud", "duration": "12+ hours", "alcohol_free": True, "halal": True}},
        {"title": "Hair Extension – Natural Black 24 Inch", "description": "Human hair extension, natural black, 24 inches. Silky smooth, no shedding, heat resistant. 100g bundle. Can be dyed and styled. Suitable for all hair types.", "price": 45.0, "condition": "New", "attributes": {"length": "24 inches", "color": "Natural Black", "weight": "100g", "heat_resistant": True, "dye_able": True}},
        {"title": "Dermaplaning Facial Tool – Skin Exfoliation", "description": "Professional dermaplaning tool for smooth skin exfoliation. Removes dead skin and peach fuzz. Painless, reusable handle with replacement blades. Includes 12 blades.", "price": 15.0, "condition": "New", "attributes": {"use": "Face Exfoliation", "blades_included": 12, "reusable": True, "gender": "Women"}},
        {"title": "Multivitamin Supplement – 90 Capsules", "description": "Complete daily multivitamin supplement, 90 capsules (3 months supply). Vitamins A, B, C, D, E and minerals. Imported, high bioavailability. Suitable for men and women.", "price": 22.0, "condition": "New", "attributes": {"capsules": 90, "supply": "3 months", "vitamins": "A, B, C, D, E", "suitable_for": "Men & Women"}},
        {"title": "Men's Grooming Kit – 7-Piece Set", "description": "Complete men's grooming kit. Includes electric trimmer, scissors, comb, cleaning brush, oil, case. Professional quality. USB rechargeable. Perfect gift for men.", "price": 38.0, "condition": "New", "attributes": {"pieces": 7, "includes": "Trimmer, Scissors, Comb, Oil, Case", "rechargeable": "USB", "gender": "Men"}},
        {"title": "Argan Oil Hair Treatment – 100ml", "description": "Pure Moroccan argan oil for hair treatment. Repairs damaged hair, adds shine and reduces frizz. 100% cold-pressed, no parabens. Suitable for all hair types.", "price": 14.0, "condition": "New", "attributes": {"volume": "100ml", "origin": "Moroccan", "type": "Cold-pressed", "benefits": "Repair, Shine, Anti-frizz", "parabens": False}},
        {"title": "Electric Face Massager – Vibration Roller", "description": "Electric facial massager with vibration mode. Reduces puffiness, improves circulation and tightens skin. USB rechargeable. Includes 2 massage heads. Easy to use.", "price": 20.0, "condition": "New", "attributes": {"type": "Vibration Roller", "heads": 2, "rechargeable": "USB", "benefits": "Anti-puffiness, Circulation, Skin tightening"}},
        {"title": "Shea Butter – Organic Unrefined 500g", "description": "100% pure organic unrefined shea butter, 500g. Rich in vitamins A and E. Excellent for skin and hair moisturizing. No additives. Imported from Ghana.", "price": 12.0, "condition": "New", "attributes": {"weight": "500g", "type": "Unrefined", "origin": "Ghana", "vitamins": "A & E", "additives": "None"}},
    ],
    "Babies & Kids": [
        {"title": "Baby Stroller – Lightweight Foldable", "description": "Lightweight foldable baby stroller for ages 0-3 years. One-hand fold, reclining seat, sunshade canopy. Safety harness, large storage basket. Weight: 6.5kg.", "price": 95.0, "condition": "New", "attributes": {"age": "0-3 years", "weight": "6.5kg", "fold": "One-hand", "includes": "Sunshade, Harness, Storage basket"}},
        {"title": "Educational Wooden Blocks – 50 Pieces", "description": "Set of 50 colourful wooden building blocks. Letters, numbers and shapes. Develops creativity and motor skills. Non-toxic paint. Suitable for ages 2-6 years.", "price": 22.0, "condition": "New", "attributes": {"pieces": 50, "material": "Wood", "paint": "Non-toxic", "age": "2-6 years", "includes": "Letters, Numbers, Shapes"}},
        {"title": "Baby Formula Milk – NAN Optipro 900g", "description": "NAN Optipro 2 follow-on formula, 900g tin. For babies 6-12 months. DHA & ARA for brain development. Easy to digest. Available in original and lactose-free.", "price": 28.0, "condition": "New", "attributes": {"brand": "NAN Optipro", "stage": 2, "age": "6-12 months", "weight": "900g", "dha": True}},
        {"title": "Children's Car Seat – Group 1 9-18kg", "description": "Forward-facing child car seat for 9-18kg (approx 1-4 years). ECE R44/04 safety certified. Side impact protection. Easy ISOFIX installation. Washable cover.", "price": 75.0, "condition": "New", "attributes": {"weight_range": "9-18kg", "age": "1-4 years", "safety": "ECE R44/04", "installation": "ISOFIX", "washable": True}},
        {"title": "Remote Control Car – Kids Racing Car", "description": "Kids remote control racing car. Rechargeable battery, works on carpet and hard floor. 2.4GHz signal, 30 minute play time. Age 3+. Available in red, blue and yellow.", "price": 30.0, "condition": "New", "attributes": {"age": "3+", "charge": "Rechargeable", "play_time": "30 minutes", "surface": "All surfaces", "colors": "Red, Blue, Yellow"}},
        {"title": "School Bag – Waterproof Backpack Age 6-12", "description": "Durable waterproof school backpack for primary school children, ages 6-12. Padded back support, multiple compartments, reflective strips. Lightweight at 500g.", "price": 18.0, "condition": "New", "attributes": {"age": "6-12 years", "material": "Waterproof", "weight": "500g", "reflective": True, "compartments": "Multiple"}},
        {"title": "Cot Bed – Convertible 2-in-1 with Mattress", "description": "Convertible 2-in-1 cot bed. Converts from cot to toddler bed. Adjustable mattress height. Solid pine wood. Mattress included. Fits up to age 5 years.", "price": 130.0, "condition": "New", "attributes": {"type": "2-in-1 Convertible", "material": "Pine Wood", "mattress_included": True, "height_adjustable": True, "age": "0-5 years"}},
        {"title": "Baby Monitor – Video & Audio 2-Camera Set", "description": "Digital video baby monitor with 2 cameras. 5-inch parent display, night vision, temperature sensor. Two-way talk. 300m range. No WiFi needed.", "price": 85.0, "condition": "New", "attributes": {"cameras": 2, "display": "5 inch", "night_vision": True, "temp_sensor": True, "range": "300m", "wifi_needed": False}},
        {"title": "Kids Bicycle – 16-inch Wheels Age 4-7", "description": "Children's bicycle with 16-inch wheels. Suitable for ages 4-7 years. Includes training wheels, front basket and bell. Adjustable seat height. Available in pink and blue.", "price": 55.0, "condition": "New", "attributes": {"wheel_size": "16 inch", "age": "4-7 years", "includes": "Training wheels, Basket, Bell", "colors": "Pink, Blue", "adjustable_seat": True}},
        {"title": "Breast Pump – Electric Double Pump", "description": "Electric double breast pump with 2 suction modes and 9 levels. BPA-free, hospital-grade silicone. USB rechargeable, portable. Includes 4 bottles and storage bags.", "price": 65.0, "condition": "New", "attributes": {"type": "Electric Double", "modes": 2, "levels": 9, "bpa_free": True, "rechargeable": "USB", "includes": "4 Bottles + Storage bags"}},
    ],
    "Leisure & Sports": [
        {"title": "Football – Adidas FIFA Quality Pro", "description": "Adidas FIFA Quality Pro match football. Size 5, thermally bonded panels. Used in official competitions. Excellent grip and flight stability. Suitable for all surfaces.", "price": 45.0, "condition": "New", "attributes": {"brand": "Adidas", "size": 5, "standard": "FIFA Quality Pro", "surface": "All surfaces"}},
        {"title": "Gym Equipment Set – Dumbbell Rack 5-25kg", "description": "Complete dumbbell set with rack, 5kg to 25kg. Rubber-coated, non-slip grip handles. Wall-mounted rack included. Perfect for home gym. Total weight 150kg.", "price": 280.0, "condition": "New", "attributes": {"range": "5-25kg", "coating": "Rubber", "rack_included": True, "total_weight": "150kg"}},
        {"title": "Acoustic Guitar – Yamaha F310", "description": "Yamaha F310 acoustic guitar. Full size, spruce top, nato neck. Great for beginners and intermediate players. Comes with bag, extra strings, picks and tuner.", "price": 95.0, "condition": "New", "attributes": {"brand": "Yamaha", "model": "F310", "size": "Full", "level": "Beginner-Intermediate", "includes": "Bag, Strings, Picks, Tuner"}},
        {"title": "Islamic Books Set – Quran & Hadith Collection", "description": "Complete set of essential Islamic books. Includes Quran with Somali translation, Riyadh Al-Saliheen, Fortress of the Muslim and more. 8 volumes. Quality binding.", "price": 35.0, "condition": "New", "attributes": {"volumes": 8, "includes": "Quran (Somali translation), Hadith collections", "binding": "Quality hardback", "language": "Arabic & Somali"}},
        {"title": "Basketball – Spalding NBA Official Size 7", "description": "Spalding NBA official game basketball, size 7. Indoor/outdoor composite leather. Deep channel design for better grip. Suitable for all playing levels.", "price": 38.0, "condition": "New", "attributes": {"brand": "Spalding", "size": 7, "material": "Composite Leather", "surface": "Indoor & Outdoor"}},
        {"title": "Fishing Rod & Reel Combo – 1.8m", "description": "Complete fishing rod and reel combo. 1.8m fibreglass rod, 200m monofilament line, 12 lures and tackle box included. Ideal for sea and river fishing in Somalia.", "price": 40.0, "condition": "New", "attributes": {"rod_length": "1.8m", "material": "Fibreglass", "line": "200m Monofilament", "includes": "12 lures + Tackle box", "type": "Sea & River"}},
        {"title": "Running Shoes – Asics Gel Nimbus 25", "description": "Asics Gel Nimbus 25 premium running shoes. Maximum cushioning, 4D guidance system. Breathable upper, great for long-distance running. Sizes 40-46 available.", "price": 130.0, "condition": "New", "attributes": {"brand": "Asics", "model": "Gel Nimbus 25", "type": "Long Distance", "cushioning": "Maximum", "sizes": "40-46"}},
        {"title": "Jigsaw Puzzle – 1000 Pieces World Map", "description": "1000-piece world map jigsaw puzzle. High-quality cardboard pieces, vibrant colours. Complete world map with countries and capitals. For ages 12+. Great family activity.", "price": 15.0, "condition": "New", "attributes": {"pieces": 1000, "theme": "World Map", "age": "12+", "material": "Quality Cardboard"}},
        {"title": "Volleyball Set – Net, Ball & Poles", "description": "Complete volleyball set for beach and indoor play. Regulation-size net with steel poles, official size 5 ball. Easy setup, includes carry bag. Suitable for all ages.", "price": 60.0, "condition": "New", "attributes": {"includes": "Net, Poles, Ball, Bag", "ball_size": 5, "surface": "Beach & Indoor", "pole_material": "Steel"}},
        {"title": "Swimming Goggles – Anti-Fog UV Protection", "description": "Professional swimming goggles with anti-fog coating and UV 400 protection. Silicone seal, adjustable strap. Available in 6 colours. Suitable for pool and open water.", "price": 12.0, "condition": "New", "attributes": {"anti_fog": True, "uv_protection": "UV 400", "seal": "Silicone", "colors": 6, "use": "Pool & Open water"}},
    ],
    "Commercial Equipment": [
        {"title": "Commercial Refrigerator – 600L Display", "description": "Commercial upright display refrigerator, 600 litres. Glass door, interior LED lighting. Ideal for shops, restaurants and bakeries. Energy efficient, digital thermostat.", "price": 750.0, "condition": "New", "attributes": {"capacity": "600L", "type": "Display", "door": "Glass", "lighting": "LED", "thermostat": "Digital"}},
        {"title": "Diesel Generator – 15kVA Soundproof", "description": "15kVA soundproof diesel generator. Automatic voltage regulator, electric start. Low fuel consumption. Ideal for offices, shops and construction sites. With warranty.", "price": 2800.0, "condition": "New", "attributes": {"power": "15kVA", "type": "Soundproof", "fuel": "Diesel", "start": "Electric", "avr": True}},
        {"title": "Commercial Gas Oven – 6 Burner Restaurant", "description": "Heavy-duty 6-burner commercial gas oven for restaurants and catering. Stainless steel body, large oven compartment, griddle plate. LPG compatible. Brand new.", "price": 850.0, "condition": "New", "attributes": {"burners": 6, "material": "Stainless Steel", "oven": True, "griddle": True, "gas_type": "LPG"}},
        {"title": "POS System – Touch Screen Cash Register", "description": "All-in-one POS touch screen system. 15-inch display, thermal receipt printer, cash drawer, barcode scanner. Windows-based, restaurant and retail software included.", "price": 480.0, "condition": "New", "attributes": {"display": "15 inch", "includes": "Printer, Cash drawer, Scanner", "os": "Windows", "software": "Restaurant & Retail"}},
        {"title": "Canon Photocopier – A3 Multifunction", "description": "Canon imageRUNNER 2206N multifunction A3 copier. Print, copy and scan. 20 pages per minute. Network ready. Compact and reliable for small offices. Lightly used.", "price": 650.0, "condition": "Used", "attributes": {"brand": "Canon", "model": "imageRUNNER 2206N", "size": "A3", "speed": "20 ppm", "functions": "Print, Copy, Scan"}},
        {"title": "Water Pump – 2HP Submersible Pump", "description": "2HP submersible water pump. Stainless steel impeller, 40m head. Suitable for wells, boreholes and water tanks. Automatic thermal overload protection. Warranty included.", "price": 180.0, "condition": "New", "attributes": {"power": "2HP", "type": "Submersible", "head": "40m", "material": "Stainless Steel impeller", "protection": "Thermal overload"}},
        {"title": "Industrial Sewing Machine – Brother", "description": "Brother industrial straight-stitch sewing machine. 5500 stitches per minute, automatic thread trimmer. Built-in light. Ideal for tailoring shops and garment factories.", "price": 420.0, "condition": "New", "attributes": {"brand": "Brother", "speed": "5500 spm", "type": "Straight-stitch", "auto_trim": True, "light": "Built-in"}},
        {"title": "Food Processor – Commercial 7L", "description": "Commercial food processor, 7-litre bowl. 3-speed settings, dough hook, slicing and shredding attachments. 1500W motor. Ideal for bakeries and restaurants.", "price": 320.0, "condition": "New", "attributes": {"capacity": "7L", "power": "1500W", "speeds": 3, "includes": "Dough hook, Slicer, Shredder"}},
        {"title": "Tractor – Massey Ferguson 240 2WD", "description": "Massey Ferguson 240 2WD tractor. 47HP diesel engine. Power steering, rear hydraulics. Comes with front bucket and disc plough. Well maintained, 3000 hours.", "price": 22000.0, "condition": "Used", "attributes": {"brand": "Massey Ferguson", "model": "MF 240", "power": "47HP", "drive": "2WD", "hours": "3000", "implements": "Front bucket, Disc plough"}},
        {"title": "Display Shelving – 5-Tier Metal Rack", "description": "Heavy-duty 5-tier metal display shelving unit. 200cm tall, 100cm wide. Adjustable shelves, 150kg per shelf capacity. Easy assembly. Ideal for shops and warehouses.", "price": 85.0, "condition": "New", "attributes": {"tiers": 5, "height": "200cm", "width": "100cm", "capacity": "150kg per shelf", "adjustable": True}},
    ],
    "Repair & Construction": [
        {"title": "Portland Cement – 50kg Bag", "description": "High-strength Portland cement, 50kg bags. Grade 42.5N. Used for foundations, columns, slabs and general construction. Available in bulk orders with delivery.", "price": 12.0, "condition": "New", "attributes": {"weight": "50kg", "grade": "42.5N", "type": "Portland", "use": "Foundations, Columns, Slabs"}},
        {"title": "Solar Panel – 300W Monocrystalline", "description": "300W monocrystalline solar panel. High efficiency 20.5%, 25-year power warranty. Suitable for home and commercial systems. Waterproof and dust resistant.", "price": 120.0, "condition": "New", "attributes": {"wattage": "300W", "type": "Monocrystalline", "efficiency": "20.5%", "warranty": "25 years", "weatherproof": True}},
        {"title": "Bosch Drill Machine – 800W Corded", "description": "Bosch PSB 800-2 RE corded drill. 800W motor, hammer function. Variable speed, reversible. 13mm keyless chuck. Includes drill bits set (10 pieces). 2-year warranty.", "price": 65.0, "condition": "New", "attributes": {"brand": "Bosch", "power": "800W", "hammer": True, "chuck": "13mm Keyless", "includes": "10 drill bits", "warranty": "2 years"}},
        {"title": "Steel Door – Security Door with Lock", "description": "Heavy-duty steel security door, 210cm x 90cm. Multi-point locking system, anti-drill hinges. Powder-coated finish in black. Fits standard door frames. Includes fitting guide.", "price": 180.0, "condition": "New", "attributes": {"dimensions": "210cm x 90cm", "locking": "Multi-point", "hinges": "Anti-drill", "finish": "Powder-coated Black"}},
        {"title": "Solar Battery – 200AH Lithium LiFePO4", "description": "200AH LiFePO4 lithium solar battery. 3000+ cycle life, 95% depth of discharge. Built-in BMS protection. Lightweight at 22kg. Compatible with all solar inverters.", "price": 380.0, "condition": "New", "attributes": {"capacity": "200AH", "type": "LiFePO4 Lithium", "cycles": "3000+", "dod": "95%", "bms": True, "weight": "22kg"}},
        {"title": "PPR Water Pipes – 25mm, 100m Roll", "description": "High-quality PPR hot and cold water pipes, 25mm diameter, 100-metre roll. Temperature resistant up to 95°C. Corrosion-free, long-lasting. Comes with free fittings kit.", "price": 55.0, "condition": "New", "attributes": {"diameter": "25mm", "length": "100m", "material": "PPR", "temp_resistance": "95°C", "includes": "Fittings kit"}},
        {"title": "Grinder – Angle Grinder 9-Inch 2200W", "description": "Heavy-duty 9-inch angle grinder, 2200W. Variable speed dial, anti-vibration handle. Disc guard included. Suitable for metal cutting, grinding and tile work.", "price": 75.0, "condition": "New", "attributes": {"size": "9 inch", "power": "2200W", "variable_speed": True, "anti_vibration": True, "use": "Metal cutting, Grinding, Tiles"}},
        {"title": "LED Floodlight – 100W Outdoor", "description": "100W outdoor LED floodlight. Daylight white 6500K, 10,000 lumens. IP65 waterproof. Energy efficient, replaces 500W halogen. Suitable for construction sites and stadiums.", "price": 28.0, "condition": "New", "attributes": {"wattage": "100W", "lumens": "10,000lm", "colour": "6500K Daylight", "waterproof": "IP65", "replaces": "500W Halogen"}},
        {"title": "Paint – Exterior Weatherproof 20 Litres", "description": "Premium exterior weatherproof wall paint, 20 litres. Covers 80-100 sqm, 2 coats. UV resistant, mould and algae resistant. Available in white, beige and grey.", "price": 45.0, "condition": "New", "attributes": {"volume": "20L", "coverage": "80-100 sqm", "coats": 2, "uv_resistant": True, "colors": "White, Beige, Grey"}},
        {"title": "Solar Inverter – 3kW Hybrid Inverter", "description": "3kW hybrid solar inverter with built-in MPPT charge controller. Works with grid, solar and battery. LCD display, remote monitoring app. 5-year warranty.", "price": 320.0, "condition": "New", "attributes": {"power": "3kW", "type": "Hybrid", "mppt": "Built-in", "monitoring": "App", "warranty": "5 years"}},
    ],
}


def seed_listings():
    with Session(engine) as session:
        # Get or create a seed user
        seed_user = session.exec(select(User).where(User.email == "seed@suqafuran.com")).first()
        if not seed_user:
            # Use the first existing user
            seed_user = session.exec(select(User)).first()
        if not seed_user:
            print("No users found. Please create a user first.")
            return

        owner_id = seed_user.id
        print(f"Seeding listings as user: {seed_user.email} (id={owner_id})")

        # Get all categories
        categories = session.exec(select(Category)).all()
        cat_map = {c.name: c for c in categories}

        total_created = 0
        total_skipped = 0

        for cat_name, listings in LISTINGS_BY_CATEGORY.items():
            cat = cat_map.get(cat_name)
            if not cat:
                print(f"  Category not found: {cat_name}")
                continue

            # Get subcategories for this category
            subcats = session.exec(
                select(SubCategory).where(SubCategory.category_id == cat.id)
            ).all()

            images = UNSPLASH.get(cat_name, [])

            for i, item in enumerate(listings):
                # Check if listing with same title already exists
                from app.models.listing import Listing as ListingModel
                existing = session.exec(
                    select(ListingModel).where(
                        ListingModel.title == item["title"],
                        ListingModel.category_id == cat.id,
                    )
                ).first()
                if existing:
                    print(f"  skip: {item['title'][:50]}")
                    total_skipped += 1
                    continue

                # Pick a subcategory if available
                sub = subcats[i % len(subcats)] if subcats else None

                # Pick 2 images
                img_list = [images[i % len(images)], images[(i + 1) % len(images)]] if images else []

                listing = ListingModel(
                    title=item["title"],
                    description=item["description"],
                    price=item["price"],
                    location=LOCATIONS[i % len(LOCATIONS)],
                    condition=item["condition"],
                    category_id=cat.id,
                    subcategory_id=sub.id if sub else None,
                    status="active",
                    currency="USD",
                    images=img_list,
                    attributes=item.get("attributes", {}),
                    owner_id=owner_id,
                )
                session.add(listing)
                print(f"  + {item['title'][:60]}")
                total_created += 1

            session.commit()
            print(f"[{cat_name}] done")

        print(f"\nSeeding complete: {total_created} created, {total_skipped} skipped.")


if __name__ == "__main__":
    seed_listings()
