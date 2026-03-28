"""
Seed realistic Jiji-style listings — 3-5 per subcategory.
Deletes ALL existing listings first, then seeds fresh.

Run with:
  docker compose exec api python -m app.seed_listings
"""
import random
from sqlmodel import Session, select, delete
from sqlalchemy import text
from app.db.session import engine
from app.models.listing import Listing, Category, SubCategory
from app.models.user import User
from app.models.favorite import Favorite
from app.models.interaction import Interaction
from app.models.meeting_deal import Meeting, Deal
from app.models.message import Message
from app.models.trust import Report
from app.models.promotion import Promotion, PromotionCode

LOCATIONS = [
    "Mogadishu, Banadir", "Hargeisa, Somaliland", "Kismayo, Jubaland",
    "Bosasso, Puntland", "Garowe, Puntland", "Berbera, Somaliland",
    "Marka, Lower Shabelle", "Baidoa, South West", "Galkayo, Mudug",
    "Jowhar, Middle Shabelle",
]

# category_slug → subcategory_name (must match seed_categories.py exactly) → listings
LISTINGS_DATA = {

    # ───────────────────────────────────────────────
    # FOOD & GROCERIES  (slug: food-groceries)
    # ───────────────────────────────────────────────
    "food-groceries": {
        "Vegetables": [
            {"title": "Fresh Tomatoes – 10kg Crate (Local Farm)",
             "description": "Ripe, firm local tomatoes. No pesticides. Perfect for cooking and sauces. Same-day delivery in Mogadishu.",
             "price": 8.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600"],
             "attributes": {"weight": "10kg", "origin": "Local Farm"}},
            {"title": "Red Onions – 25kg Sack (Tanzania)",
             "description": "Dry, firm red onions imported from Tanzania. Wholesale price for bulk orders.",
             "price": 18.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1508747703725-719777637510?w=600"],
             "attributes": {"weight": "25kg", "origin": "Tanzania"}},
            {"title": "Sweet Potatoes – 5kg (Afgooye)",
             "description": "Orange-fleshed sweet potatoes from Afgooye farms. Fresh stock daily.",
             "price": 4.5, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=600"],
             "attributes": {"weight": "5kg", "origin": "Afgooye"}},
        ],
        "Fruits": [
            {"title": "Piri Piri Mangoes – Crate of 30",
             "description": "Sweet ripe mangoes from Lower Shabelle. Juicy and fragrant. Bulk orders welcome.",
             "price": 12.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1553279768-865429fa0078?w=600"],
             "attributes": {"quantity": "30 pieces", "variety": "Piri Piri"}},
            {"title": "Fresh Bananas – Bunch (~20 Fingers)",
             "description": "Locally grown ripe bananas. Available every morning. Great for breakfast.",
             "price": 3.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600"],
             "attributes": {"quantity": "~20 fingers"}},
            {"title": "Medjool Dates – 1kg Premium Box (Saudi)",
             "description": "Large, soft Medjool dates from Saudi Arabia. No preservatives. Perfect for Ramadan.",
             "price": 9.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=600"],
             "attributes": {"weight": "1kg", "variety": "Medjool", "origin": "Saudi Arabia"}},
        ],
        "Rice & Pasta": [
            {"title": "Basmati Rice – 25kg Sack (Pakistan)",
             "description": "Premium long-grain aromatic basmati. Fluffy when cooked. Ideal for Somali bariis.",
             "price": 30.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600"],
             "attributes": {"weight": "25kg", "variety": "Basmati", "origin": "Pakistan"}},
            {"title": "Spaghetti – Case of 20 x 500g Packs",
             "description": "Durum wheat spaghetti. 8-minute cook time. Popular for Somali pasta dishes.",
             "price": 22.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1551462147-37885acc36f1?w=600"],
             "attributes": {"weight_per_pack": "500g", "quantity": "20 packs"}},
        ],
        "Meat": [
            {"title": "Fresh Goat Meat – Per Kg (Halal)",
             "description": "Freshly slaughtered halal goat meat daily from 7am. Free delivery within Mogadishu for 5kg+.",
             "price": 7.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=600"],
             "attributes": {"unit": "Per kg", "halal": True}},
            {"title": "Camel Meat – 2kg Fresh Cut (Halal)",
             "description": "Premium fresh camel meat, lean and nutritious. Available weekends. Call to pre-order.",
             "price": 16.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600"],
             "attributes": {"weight": "2kg", "halal": True}},
            {"title": "Whole Chicken – Fresh 1.2–1.5kg (Halal)",
             "description": "Fresh whole chicken, locally raised. Halal. Can be cut on request. Great for Somali cooking.",
             "price": 5.5, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600"],
             "attributes": {"weight": "1.2–1.5kg", "halal": True}},
        ],
        "Seafood": [
            {"title": "Tiger Prawns – 1kg Cleaned (Indian Ocean)",
             "description": "Fresh tiger prawns, cleaned and deveined. Rich in protein. Same-day delivery.",
             "price": 10.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600"],
             "attributes": {"weight": "1kg", "type": "Tiger Prawns"}},
            {"title": "Dried Fish (Booraha) – 2kg Pack",
             "description": "Traditional Somali sun-dried salted fish. Long shelf life. Used in rice, pasta and stews.",
             "price": 8.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600"],
             "attributes": {"weight": "2kg", "type": "Dried & Salted"}},
        ],
        "Milk & Dairy": [
            {"title": "Fresh Camel Milk – 1 Litre (Daily Delivery)",
             "description": "Pure camel milk from our Mogadishu-area farm. No additives. Delivered fresh daily.",
             "price": 3.5, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600"],
             "attributes": {"volume": "1L", "delivery": "Daily"}},
            {"title": "Plain Yoghurt – 500g Tub",
             "description": "Locally made thick, creamy plain yoghurt. From fresh cow milk. No artificial flavours.",
             "price": 2.5, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600"],
             "attributes": {"weight": "500g", "type": "Plain, Full-fat"}},
        ],
        "Eggs": [
            {"title": "Fresh Eggs – Tray of 30 (Free-Range Local)",
             "description": "Fresh chicken eggs from local free-range farms. Rich yolk. Collected daily.",
             "price": 7.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=600"],
             "attributes": {"quantity": "30 eggs", "type": "Free-range"}},
        ],
        "Prepared Foods": [
            {"title": "Canjeero – Pack of 10 (Fresh Daily)",
             "description": "Freshly baked Somali canjeero from sorghum flour. Soft and perfectly sour. Order before 8am.",
             "price": 2.5, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600"],
             "attributes": {"quantity": "10 pieces", "flour": "Sorghum"}},
            {"title": "Samosas – Box of 20 (Minced Beef)",
             "description": "Crispy homemade samosas with spiced minced beef. Fried fresh. Great for gatherings and iftar.",
             "price": 6.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600"],
             "attributes": {"quantity": "20 pieces", "filling": "Minced Beef"}},
        ],
        "Beverages": [
            {"title": "Somali Spiced Tea Blend – 250g (Shaah Cadeys)",
             "description": "Cardamom, ginger and black tea blend. Makes the perfect shaah cadeys. About 80 cups.",
             "price": 3.5, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600"],
             "attributes": {"weight": "250g", "blend": "Cardamom, Ginger, Black Tea"}},
        ],
    },

    # ───────────────────────────────────────────────
    # CLOTHING & SHOES  (slug: clothing-shoes)
    # ───────────────────────────────────────────────
    "clothing-shoes": {
        "Men's Clothing": [
            {"title": "Men's Khamiis & Macawis Set – Premium Cotton",
             "description": "White khamiis and macawis, breathable cotton. Sizes S–XXL. Perfect for daily wear and prayers.",
             "price": 40.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600"],
             "attributes": {"material": "Cotton", "includes": "Khamiis + Macawis", "sizes": "S–XXL"}},
            {"title": "Men's 2-Piece Formal Suit – Navy Blue Slim Fit",
             "description": "Polyester-viscose blend, wrinkle-resistant. Jacket and matching trousers. For business and events.",
             "price": 75.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600"],
             "attributes": {"color": "Navy Blue", "fit": "Slim", "includes": "Jacket + Trousers"}},
            {"title": "Men's Polo Shirt – Pack of 3 (M/L/XL)",
             "description": "Piqué cotton polo shirts. White, black and grey. Breathable for Somali climate.",
             "price": 28.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600"],
             "attributes": {"quantity": "3 shirts", "fabric": "Piqué Cotton", "colors": "White, Black, Grey"}},
        ],
        "Women's Clothing": [
            {"title": "Women's Abaya – Premium Nida with Matching Hijab",
             "description": "Lightweight flowing Nida abaya. Includes matching hijab. Sizes S–XL. Black, navy, dark green.",
             "price": 38.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1591085686350-798c0f9faa1f?w=600"],
             "attributes": {"fabric": "Nida", "includes": "Abaya + Hijab"}},
            {"title": "Somali Wedding Dirac – Silk Blend with Gold Embroidery",
             "description": "Gold-embroidered silk-blend dirac with guntiino wrap. Perfect for weddings, engagements and Eid.",
             "price": 130.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600"],
             "attributes": {"fabric": "Silk Blend", "includes": "Dirac + Guntiino"}},
            {"title": "Casual Floral Chiffon Dress – Sizes 8–16",
             "description": "Below-knee chiffon dress with floral print. Pink, blue and yellow. Modest and comfortable.",
             "price": 22.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600"],
             "attributes": {"fabric": "Chiffon", "colors": "Pink, Blue, Yellow", "sizes": "8–16"}},
        ],
        "Children's Clothing": [
            {"title": "Boys School Uniform – 3 Sets (Ages 5–14)",
             "description": "White shirt, khaki trousers and belt. Pack of 3 complete sets. Easy-wash fabric.",
             "price": 30.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600"],
             "attributes": {"includes": "Shirt + Trousers + Belt", "sets": 3, "ages": "5–14"}},
            {"title": "Baby Cotton Romper Set – 5 Pieces (0–12 Months)",
             "description": "Soft 100% cotton rompers in various patterns. Snap buttons for easy changing.",
             "price": 18.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600"],
             "attributes": {"quantity": "5 pieces", "material": "100% Cotton", "age": "0–12 months"}},
        ],
        "Men Shoes": [
            {"title": "Nike Air Max 270 – Size 42 EU (Authentic, Used)",
             "description": "Authentic Nike Air Max 270. White/black. Barely worn, original box. UK 8 / EU 42.",
             "price": 85.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
             "attributes": {"brand": "Nike", "model": "Air Max 270", "size": "42 EU"}},
            {"title": "Men's Genuine Leather Oxford Shoes – Sizes 40–45",
             "description": "Classic formal Oxford shoes. Genuine leather, durable rubber sole. Black and brown. Sizes 40–45.",
             "price": 55.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600"],
             "attributes": {"material": "Genuine Leather", "style": "Oxford", "sizes": "40–45"}},
        ],
        "Women Shoes": [
            {"title": "Women's Flat Sandals – Adjustable Strap, 5 Colours",
             "description": "Comfortable faux leather sandals with adjustable ankle strap. Sizes 36–41.",
             "price": 15.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600"],
             "attributes": {"heel": "Flat", "sizes": "36–41"}},
            {"title": "Women's Block Heel Court Shoes – Office & Formal",
             "description": "Elegant block heel court shoes. Faux suede, sizes 36–41. Black and nude colours.",
             "price": 28.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600"],
             "attributes": {"heel_height": "5cm", "sizes": "36–41"}},
        ],
        "Clothing Accessories": [
            {"title": "Women's PU Leather Handbag – Black/Brown/Tan",
             "description": "Spacious PU leather bag. Multiple pockets, zip closure, gold-tone hardware.",
             "price": 35.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"],
             "attributes": {"material": "PU Leather", "hardware": "Gold-tone", "colors": "Black, Brown, Tan"}},
            {"title": "Casio Classic Digital Watch – 5-Year Battery",
             "description": "Casio digital watch. Water-resistant, shock-resistant. Stopwatch and alarm functions.",
             "price": 22.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"],
             "attributes": {"brand": "Casio", "water_resistant": True, "battery": "5 years"}},
        ],
    },

    # ───────────────────────────────────────────────
    # HOUSEHOLD ITEMS  (slug: household-items)
    # ───────────────────────────────────────────────
    "household-items": {
        "Furniture": [
            {"title": "L-Shape 7-Seater Corner Sofa",
             "description": "Premium fabric upholstery, firm cushions, wooden frame. Delivery available in Mogadishu.",
             "price": 350.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"],
             "attributes": {"seats": 7, "shape": "L-Shape", "upholstery": "Fabric"}},
            {"title": "Solid Wood Dining Table – 6 Chairs (Mahogany)",
             "description": "160x90cm solid wood table with 6 chairs. Dark mahogany finish, scratch-resistant surface.",
             "price": 280.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600"],
             "attributes": {"material": "Solid Wood", "seats": 6, "dimensions": "160x90cm"}},
            {"title": "Queen Bed Frame with 4 Storage Drawers",
             "description": "Queen-size MDF bed frame with 4 under-bed storage drawers and fabric headboard. Mattress not included.",
             "price": 165.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600"],
             "attributes": {"size": "Queen", "drawers": 4, "mattress_included": False}},
        ],
        "Appliances": [
            {"title": "Samsung 320L Frost-Free Double Door Fridge",
             "description": "Energy-saving A+ rated, digital temperature control. 1 year old, excellent condition.",
             "price": 380.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600"],
             "attributes": {"brand": "Samsung", "capacity": "320L", "energy_rating": "A+"}},
            {"title": "7kg Top-Load Automatic Washing Machine",
             "description": "8 wash programs including quick-wash and gentle. Energy-efficient. Good working condition.",
             "price": 210.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600"],
             "attributes": {"capacity": "7kg", "type": "Top-load", "programs": 8}},
            {"title": "4-Burner Gas Cooker – Stainless Steel, Auto Ignition",
             "description": "Heavy-duty 4-burner gas cooker. Cast iron grates, LPG compatible. Brand new with 1-year warranty.",
             "price": 95.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600"],
             "attributes": {"burners": 4, "ignition": "Auto", "gas": "LPG"}},
        ],
        "Bedding": [
            {"title": "Queen Orthopedic Spring Mattress – 20cm",
             "description": "Medium-firm support, hypoallergenic cover, breathable fabric. Ideal for back support and deep sleep.",
             "price": 195.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600"],
             "attributes": {"size": "Queen", "thickness": "20cm", "type": "Spring Orthopedic"}},
            {"title": "King 7-Piece Duvet Set – 300TC 100% Cotton",
             "description": "Duvet cover, 2 pillowcases, 2 cushion covers, 2 fitted sheets. Machine washable.",
             "price": 45.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600"],
             "attributes": {"pieces": 7, "size": "King", "material": "100% Cotton", "thread_count": 300}},
        ],
        "Kitchenware": [
            {"title": "7-Piece Non-Stick Marble Cookware Set",
             "description": "3 pots, 2 frying pans, glass lids, steamer. Marble coating, suitable for gas and electric cookers.",
             "price": 55.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600"],
             "attributes": {"pieces": 7, "coating": "Marble Non-Stick"}},
        ],
        "Home Decor": [
            {"title": "Persian-Style Carpet 3m x 4m – Red & Gold",
             "description": "Rich red and gold pattern, thick pile. Adds elegance to any living room. Machine washable.",
             "price": 145.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600"],
             "attributes": {"size": "3m x 4m", "style": "Persian", "colors": "Red & Gold"}},
        ],
        "Cleaning Supplies": [
            {"title": "Ariel Bio Washing Powder – 5kg Drum",
             "description": "Removes tough stains. Works hot and cold. Suitable for machine and hand washing.",
             "price": 14.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600"],
             "attributes": {"brand": "Ariel", "weight": "5kg", "type": "Bio"}},
        ],
        "Garden Supplies": [
            {"title": "5-Piece Garden Tool Set – Steel & Wood Handles",
             "description": "Spade, fork, hoe, hand trowel, hand fork. Steel heads, wooden handles. For home garden and small farms.",
             "price": 32.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600"],
             "attributes": {"pieces": 5, "handles": "Wooden", "heads": "Steel"}},
        ],
    },

    # ───────────────────────────────────────────────
    # ELECTRONICS  (slug: electronics)
    # ───────────────────────────────────────────────
    "electronics": {
        "Mobile Phones": [
            {"title": "Samsung Galaxy A54 5G – 128GB/8GB (New, Sealed)",
             "description": "6.4\" Super AMOLED, 5000mAh, 48MP camera. Dual SIM, unlocked. Sealed box with charger.",
             "price": 320.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=600"],
             "attributes": {"brand": "Samsung", "model": "Galaxy A54", "storage": "128GB", "ram": "8GB"}},
            {"title": "iPhone 13 – 256GB Midnight, Battery 92% (Unlocked)",
             "description": "A15 Bionic, 12MP dual camera, Face ID. Unlocked for all networks. Cable and box included.",
             "price": 580.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1633053699186-1bb7ef5f6d4f?w=600"],
             "attributes": {"brand": "Apple", "model": "iPhone 13", "storage": "256GB", "battery_health": "92%"}},
            {"title": "Tecno Spark 20 – 128GB (Brand New Sealed)",
             "description": "6.56\" display, 5000mAh battery, 16MP selfie cam. Budget phone, great value. Dual SIM.",
             "price": 145.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600"],
             "attributes": {"brand": "Tecno", "model": "Spark 20", "storage": "128GB"}},
            {"title": "Infinix Hot 40 Pro – 256GB/8GB RAM",
             "description": "6.78\" HD+ display, 5000mAh, 50MP camera. Android 13. Great camera for the price.",
             "price": 190.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1585065910113-52e0f5bc5b38?w=600"],
             "attributes": {"brand": "Infinix", "model": "Hot 40 Pro", "storage": "256GB", "ram": "8GB"}},
        ],
        "Computers": [
            {"title": "HP 15\" Laptop – Core i5 11th Gen, 512GB SSD",
             "description": "8GB RAM, Full HD display, Windows 11. USB-C charging. Brand new, ideal for work and studies.",
             "price": 550.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600"],
             "attributes": {"brand": "HP", "processor": "Core i5 11th Gen", "ram": "8GB", "storage": "512GB SSD"}},
            {"title": "Lenovo ThinkPad L14 – Core i7, 16GB RAM (Used)",
             "description": "14\" FHD, fingerprint reader, backlit keyboard. 512GB SSD. Business-grade, fast and durable.",
             "price": 680.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600"],
             "attributes": {"brand": "Lenovo", "model": "ThinkPad L14", "ram": "16GB", "storage": "512GB SSD"}},
            {"title": "Apple iPad 10th Gen – 64GB WiFi Blue",
             "description": "10.9\" Liquid Retina, A14 Bionic. WiFi only. Great for browsing and entertainment. Like new.",
             "price": 420.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"],
             "attributes": {"brand": "Apple", "model": "iPad 10th Gen", "storage": "64GB", "color": "Blue"}},
        ],
        "TVs": [
            {"title": "Samsung 55\" 4K Crystal UHD Smart TV (2023)",
             "description": "Built-in Netflix, YouTube, Prime Video. HDR10+, 3x HDMI. Remote and wall-mount kit included.",
             "price": 490.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600"],
             "attributes": {"brand": "Samsung", "size": "55 inch", "resolution": "4K UHD", "hdr": "HDR10+"}},
            {"title": "Hisense 43\" Full HD Smart TV (WiFi, Netflix)",
             "description": "Built-in WiFi, Netflix, YouTube. 3 HDMI, 2 USB. Good condition, remote included.",
             "price": 210.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=600"],
             "attributes": {"brand": "Hisense", "size": "43 inch", "resolution": "Full HD"}},
        ],
        "Audio & Headphones": [
            {"title": "JBL Charge 5 – IP67 Waterproof Bluetooth Speaker",
             "description": "20-hour battery, built-in power bank. Deep bass, 360° sound. Perfect for outdoor and beach.",
             "price": 125.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"],
             "attributes": {"brand": "JBL", "model": "Charge 5", "waterproof": "IP67", "battery": "20 hours"}},
            {"title": "Sony WH-1000XM5 Wireless Headphones – Like New",
             "description": "Industry-best noise cancellation. 30-hour battery, fast charge. Multipoint Bluetooth. Original box.",
             "price": 260.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"],
             "attributes": {"brand": "Sony", "model": "WH-1000XM5", "battery": "30 hours"}},
        ],
        "Cameras": [
            {"title": "Canon EOS 2000D DSLR – 18-55mm Kit Lens",
             "description": "24.1MP, Full HD video, WiFi. Includes 32GB SD, camera bag and extra battery. Great for beginners.",
             "price": 370.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=600"],
             "attributes": {"brand": "Canon", "megapixels": "24.1MP", "lens": "18-55mm"}},
        ],
        "Gaming": [
            {"title": "PlayStation 5 Digital Edition – Brand New Sealed",
             "description": "Latest-gen gaming. DualSense controller, 825GB SSD. Extremely fast load times. Sealed.",
             "price": 480.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600"],
             "attributes": {"brand": "Sony", "model": "PS5 Digital", "storage": "825GB"}},
            {"title": "Xbox Series X – 1TB with FIFA 24, COD & Forza",
             "description": "1TB SSD, 4K at 120fps. 3 games included. Excellent condition, barely used.",
             "price": 430.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600"],
             "attributes": {"brand": "Microsoft", "model": "Xbox Series X", "storage": "1TB", "games": 3}},
        ],
        "Networking": [
            {"title": "TP-Link WiFi 6 Router – AX1800 Dual Band",
             "description": "Archer AX21, covers 4–5 rooms. MU-MIMO, OFDMA. Easy setup via Tether app.",
             "price": 55.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600"],
             "attributes": {"brand": "TP-Link", "model": "Archer AX21", "standard": "WiFi 6", "speed": "AX1800"}},
        ],
        "Other Electronics": [
            {"title": "Anker PowerCore 20000mAh Power Bank",
             "description": "USB-A + USB-C ports, fast charge. Charges an iPhone 5 times. Compact and reliable.",
             "price": 40.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600"],
             "attributes": {"brand": "Anker", "capacity": "20000mAh", "ports": "USB-A + USB-C"}},
        ],
    },

    # ───────────────────────────────────────────────
    # VEHICLES  (slug: vehicles)
    # ───────────────────────────────────────────────
    "vehicles": {
        "Cars": [
            {"title": "Toyota Land Cruiser V8 GXR 2012 – Fully Loaded",
             "description": "200 Series, leather seats, sunroof, rear camera, 4WD. Full service history. 180,000 km. Negotiable.",
             "price": 35000.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600"],
             "attributes": {"brand": "Toyota", "model": "Land Cruiser V8", "year": 2012, "mileage": "180,000 km"}},
            {"title": "Toyota Corolla 2016 – Silver Manual, 95,000 km",
             "description": "1.6L manual. AC, power windows, central locking. Clean inside and out. Well maintained.",
             "price": 12500.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600"],
             "attributes": {"brand": "Toyota", "model": "Corolla", "year": 2016, "mileage": "95,000 km"}},
            {"title": "Suzuki Alto 2019 – Automatic, Only 35,000 km",
             "description": "660cc automatic. Very fuel-efficient city car. AC, power steering. White. Excellent condition.",
             "price": 7800.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600"],
             "attributes": {"brand": "Suzuki", "model": "Alto", "year": 2019, "mileage": "35,000 km"}},
            {"title": "Nissan X-Trail 2015 – 4WD, Sunroof, 7 Seats",
             "description": "2.5L petrol, CVT, push-start, reversing camera, sunroof. 120,000 km. Priced to sell.",
             "price": 16500.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600"],
             "attributes": {"brand": "Nissan", "model": "X-Trail", "year": 2015, "seats": 7, "drive": "4WD"}},
        ],
        "Motorcycles": [
            {"title": "Honda CB125F – 2020, 22,000 km (Delivery Ready)",
             "description": "125cc single cylinder. Fuel-efficient, reliable. Good tyres, recently serviced.",
             "price": 1800.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
             "attributes": {"brand": "Honda", "model": "CB125F", "year": 2020, "engine": "125cc"}},
            {"title": "Bajaj Boxer 150 – 2021, Low Mileage",
             "description": "150cc, strong for rough roads. 18,000 km. New tyres, recent service.",
             "price": 1500.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600"],
             "attributes": {"brand": "Bajaj", "model": "Boxer 150", "year": 2021, "engine": "150cc"}},
        ],
        "Tuk-tuks": [
            {"title": "Bajaj RE Passenger Tuk-tuk – 2021, 3 Seats",
             "description": "Petrol engine, fuel-efficient. Good condition, ready for taxi work immediately.",
             "price": 4200.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600"],
             "attributes": {"brand": "Bajaj", "model": "RE", "year": 2021, "seats": 3}},
        ],
        "Trucks & Buses": [
            {"title": "Toyota Hiace Minibus 2014 – 14 Seats, AC",
             "description": "2.7L petrol, AC fitted. Used for inter-city transport. Good mechanical condition.",
             "price": 22000.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1506107525659-2af4cd8a97e0?w=600"],
             "attributes": {"brand": "Toyota", "model": "Hiace", "year": 2014, "seats": 14}},
            {"title": "Nissan Navara Double Cab – 2015 Diesel 4WD",
             "description": "2.5L diesel, 4WD. Hard tonneau cover, bull bar, tow hitch. 140,000 km.",
             "price": 18500.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600"],
             "attributes": {"brand": "Nissan", "model": "Navara", "year": 2015, "drive": "4WD"}},
        ],
        "Vehicle Parts & Accessories": [
            {"title": "All-Terrain Tyres 265/70 R16 – Set of 4 (70% Tread)",
             "description": "Fits Toyota Prado, Hilux and Land Cruiser. Good for road and off-road.",
             "price": 280.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600"],
             "attributes": {"size": "265/70 R16", "quantity": 4, "tread": "70%"}},
            {"title": "Pioneer Double DIN Stereo – 7\" CarPlay & Android Auto",
             "description": "Apple CarPlay, Android Auto, Bluetooth, reversing camera input. Brand new in box.",
             "price": 185.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1547245324-d777c6f05e80?w=600"],
             "attributes": {"brand": "Pioneer", "screen": "7 inch", "carplay": True, "android_auto": True}},
            {"title": "Amaron Car Battery 75AH 12V – Maintenance-Free",
             "description": "High CCA. Fits Toyota, Nissan, Mitsubishi, Honda. Brand new, 18-month warranty.",
             "price": 85.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600"],
             "attributes": {"brand": "Amaron", "capacity": "75AH", "voltage": "12V"}},
        ],
        "Car Services": [
            {"title": "Mobile Car Wash & Full Valet – We Come to You",
             "description": "Interior, exterior cleaning, vacuuming, tyre polish, dashboard dressing. Book by WhatsApp.",
             "price": 15.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600"],
             "attributes": {"service": "Full Valet", "mobile": True}},
        ],
    },

    # ───────────────────────────────────────────────
    # LIVESTOCK  (slug: livestock)
    # ───────────────────────────────────────────────
    "livestock": {
        "Somali Goats": [
            {"title": "Healthy Local Goat – 2 Years Old, ~25kg",
             "description": "Disease-free, vaccinated. Good for slaughter or breeding. Transport can be arranged.",
             "price": 120.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=600"],
             "attributes": {"age": "2 years", "weight": "~25kg", "vaccinated": True}},
            {"title": "Dairy Goat – Nubian Cross, 3 Litres/Day",
             "description": "3 years old, producing 2.5–3 litres per day. Gentle and recently vaccinated.",
             "price": 250.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600"],
             "attributes": {"breed": "Nubian Cross", "age": "3 years", "milk_yield": "2.5–3L/day"}},
            {"title": "Batch of 10 Local Goats – Mixed 1–2 Years",
             "description": "Mix of males and females. All vaccinated. Perfect for starting or expanding a goat herd.",
             "price": 900.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600"],
             "attributes": {"quantity": 10, "ages": "1–2 years", "vaccinated": True}},
        ],
        "Somali Sheep": [
            {"title": "Fat-Tailed Somali Sheep – ~35kg, Eid Ready",
             "description": "Well-fed, prime condition. Perfect for Eid celebrations. Priced per animal.",
             "price": 190.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600"],
             "attributes": {"breed": "Fat-tailed Somali", "weight": "~35kg"}},
            {"title": "3 Fat-Tailed Sheep – Family Batch",
             "description": "3 sheep, 28–32kg each. Same flock, open-grazing raised. Vaccinated.",
             "price": 500.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=600"],
             "attributes": {"quantity": 3, "weight": "28–32kg each", "vaccinated": True}},
        ],
        "Cattle": [
            {"title": "Friesian Cross Dairy Cow – 15–18 Litres/Day",
             "description": "4 years old. Currently lactating. Vaccinated and dewormed. Docile, easy to handle.",
             "price": 950.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600"],
             "attributes": {"breed": "Friesian Cross", "age": "4 years", "milk_yield": "15–18L/day"}},
            {"title": "Boran Beef Bull – Large Frame ~400kg",
             "description": "Healthy, well-muscled Boran bull. Ideal for slaughter or breeding programme.",
             "price": 1200.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600"],
             "attributes": {"breed": "Boran", "weight": "~400kg", "gender": "Bull"}},
        ],
        "Poultry": [
            {"title": "50 Rhode Island Red Layers – 18 Weeks (Ready to Lay)",
             "description": "Vaccinated against Newcastle and Marek's. Sold as full flock. Transport available.",
             "price": 250.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1548967434-8f4f0b7e7a2e?w=600"],
             "attributes": {"breed": "Rhode Island Red", "quantity": 50, "age": "18 weeks"}},
            {"title": "100 Day-Old Ross 308 Broiler Chicks",
             "description": "Vaccinated at hatchery. Fast growth to 2.5kg in 42 days. Minimum batch 100.",
             "price": 80.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600"],
             "attributes": {"breed": "Ross 308 Broiler", "quantity": 100, "age": "Day-old"}},
        ],
        "Camels": [
            {"title": "Dairy Camel – Female, 5 Years, 10–12L/Day",
             "description": "Pure Somali dairy camel. Very gentle. Excellent for camel milk production business.",
             "price": 2800.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600"],
             "attributes": {"gender": "Female", "age": "5 years", "milk_yield": "10–12L/day"}},
            {"title": "Trained Racing Camel – Male, 3 Years",
             "description": "Experienced in competitions. Comes with race saddle and halter.",
             "price": 3500.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600"],
             "attributes": {"type": "Racing", "gender": "Male", "age": "3 years", "trained": True}},
        ],
        "Pets": [
            {"title": "German Shepherd Puppy – Pure Breed, 8 Weeks",
             "description": "Both parents on site. First vaccination done. Socialized with children. Excellent guard dog.",
             "price": 300.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1568572933382-74d440642117?w=600"],
             "attributes": {"breed": "German Shepherd", "age": "8 weeks", "vaccinated": True}},
        ],
    },

    # ───────────────────────────────────────────────
    # LAND & FARMS  (slug: land-farms)
    # ───────────────────────────────────────────────
    "land-farms": {
        "Vacant Land": [
            {"title": "400m² Residential Plot for Sale – Hodan, Mogadishu",
             "description": "Legal title deed. Paved road access and electricity. Quiet residential area. Price negotiable.",
             "price": 45000.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600"],
             "attributes": {"area": "400m²", "district": "Hodan", "title_deed": True}},
            {"title": "600m² Commercial Plot – Hamarweyne Main Road",
             "description": "Prime location, high foot traffic. Perfect for shop, office or hotel. Clean title deed.",
             "price": 90000.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1558618047-f7a3ee836e3e?w=600"],
             "attributes": {"area": "600m²", "type": "Commercial", "title_deed": True}},
        ],
        "Farms": [
            {"title": "5-Hectare Farm – Afgooye (Borehole + Storage Shed)",
             "description": "Fertile soil, existing borehole for irrigation, storage shed. Title deed available. Currently growing sesame.",
             "price": 38000.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600"],
             "attributes": {"area": "5 hectares", "location": "Afgooye", "borehole": True}},
        ],
        "Agricultural Land": [
            {"title": "3-Acre Irrigated Land – Jowhar (River Access)",
             "description": "Direct access to the Shabelle River for irrigation. Ideal for vegetables, maize or sesame.",
             "price": 22000.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600"],
             "attributes": {"area": "3 acres", "location": "Jowhar", "irrigation": "River Access"}},
        ],
        "Market Gardens": [
            {"title": "Half-Acre Vegetable Garden – Afgooye (Drip Irrigation)",
             "description": "Currently producing tomatoes, onions and peppers. Drip irrigation system installed.",
             "price": 12000.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600"],
             "attributes": {"area": "0.5 acres", "crops": "Tomatoes, Onions, Peppers", "irrigation": "Drip"}},
        ],
    },

    # ───────────────────────────────────────────────
    # PROPERTY  (slug: property)
    # ───────────────────────────────────────────────
    "property": {
        "Houses for Rent": [
            {"title": "3-Bedroom Villa for Rent – Hodan, Mogadishu ($600/mo)",
             "description": "Walled compound, parking for 2 cars. Living room, kitchen, 2 bathrooms. Available immediately.",
             "price": 600.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600"],
             "attributes": {"bedrooms": 3, "bathrooms": 2, "parking": True, "rent": "Monthly"}},
            {"title": "Studio Apartment for Rent – Hargeisa City Centre ($180/mo)",
             "description": "1 room + bathroom, kitchenette. Fully tiled, air conditioning. Perfect for professionals.",
             "price": 180.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600"],
             "attributes": {"type": "Studio", "ac": True, "rent": "Monthly"}},
            {"title": "2-Bedroom Apartment – Bosasso Near Port ($350/mo)",
             "description": "Tiled floors, separate kitchen. 24h electricity via generator. Ideal for business workers.",
             "price": 350.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"],
             "attributes": {"bedrooms": 2, "electricity": "24h Generator", "rent": "Monthly"}},
        ],
        "Houses for Sale": [
            {"title": "4-Bedroom House – Wadajir, Mogadishu ($120K)",
             "description": "300m² plot, fully tiled, gated compound, solar panels installed. Clean title deed.",
             "price": 120000.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600"],
             "attributes": {"bedrooms": 4, "bathrooms": 3, "solar": True, "title_deed": True}},
            {"title": "3-Floor Commercial Building for Sale – Hargeisa",
             "description": "Ground floor shops, 2 upper floors offices. All utilities connected. Strong rental income.",
             "price": 280000.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600"],
             "attributes": {"floors": 3, "type": "Commercial"}},
        ],
        "Offices & Commercial": [
            {"title": "Furnished Office Space 50m² – Mogadishu Business Centre",
             "description": "2 private offices, meeting room access, high-speed internet. Short or long-term lease.",
             "price": 400.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=600"],
             "attributes": {"area": "50m²", "furnished": True, "internet": "High-speed"}},
            {"title": "Shop Space for Rent – Bakaaraha Market Area ($250/mo)",
             "description": "30m², ground floor. High foot traffic, steel shutters, storage room, electricity.",
             "price": 250.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"],
             "attributes": {"area": "30m²", "floor": "Ground", "storage": True}},
        ],
        "New Builds": [
            {"title": "Brand New 3-Bedroom Villa – Hamar Jajab, Mogadishu",
             "description": "Just completed. Modern design, quality tiles, fitted kitchen. Solar-ready, gated compound.",
             "price": 95000.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600"],
             "attributes": {"bedrooms": 3, "status": "Brand New", "solar_ready": True}},
        ],
        "Short Stay": [
            {"title": "Furnished Room – Daily/Weekly Rent, AC + WiFi (Mogadishu)",
             "description": "Clean furnished room. Private bathroom, AC, WiFi. Ideal for business travellers.",
             "price": 35.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600"],
             "attributes": {"bathroom": "Private", "ac": True, "wifi": True, "rent": "Daily/Weekly"}},
        ],
    },

    # ───────────────────────────────────────────────
    # SERVICES  (slug: services)
    # ───────────────────────────────────────────────
    "services": {
        "Building & Construction": [
            {"title": "Professional House Painting – Interior & Exterior",
             "description": "Materials supplied. Free inspection and quote. Mogadishu and surroundings.",
             "price": 0.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600"],
             "attributes": {"service": "Painting", "coverage": "Interior & Exterior"}},
            {"title": "Licensed Electrician – Wiring, Sockets & Lighting",
             "description": "Home and commercial electrical installations. Solar connections. Free estimate.",
             "price": 0.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600"],
             "attributes": {"service": "Electrical", "licensed": True}},
            {"title": "Expert Tiling Service – Floors & Walls",
             "description": "Ceramic, porcelain and marble. Labour-only or supply-and-fix packages available.",
             "price": 0.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600"],
             "attributes": {"service": "Tiling", "types": "Ceramic, Porcelain, Marble"}},
        ],
        "Computer & IT": [
            {"title": "Website Design & Development – Business Sites from $150",
             "description": "Mobile responsive, SEO ready. Business, portfolio and e-commerce. WhatsApp to discuss.",
             "price": 150.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1547658719-da2b51169166?w=600"],
             "attributes": {"service": "Web Development", "types": "Business, Portfolio, E-commerce"}},
            {"title": "Laptop & Computer Repair – All Brands, Same-Day",
             "description": "Screen replacement, virus removal, data recovery, RAM/SSD upgrades. All brands.",
             "price": 0.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1588702547923-7408f207e0b4?w=600"],
             "attributes": {"service": "Computer Repair", "turnaround": "Same-day"}},
        ],
        "Cleaning Services": [
            {"title": "Home Deep Cleaning – 3-Bedroom from $30",
             "description": "All rooms, kitchen, bathrooms, windows, floors. Eco-friendly products. Team of 3.",
             "price": 30.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600"],
             "attributes": {"service": "Deep Cleaning", "type": "Residential"}},
        ],
        "Repair Services": [
            {"title": "Phone Screen Repair – All Models, 30-Minute Service",
             "description": "iPhone, Samsung, Tecno, Infinix and all brands. 30-minute turnaround. 90-day warranty.",
             "price": 0.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=600"],
             "attributes": {"service": "Screen Repair", "turnaround": "30 minutes", "warranty": "90 days"}},
        ],
        "Printing Services": [
            {"title": "Business Cards – 500 Full Colour (24h Turnaround)",
             "description": "350gsm matt or gloss laminate. Free design if needed. Collect or delivery.",
             "price": 18.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600"],
             "attributes": {"quantity": 500, "finish": "Matt or Gloss", "turnaround": "24 hours"}},
        ],
        "Legal & Financial": [
            {"title": "Accounting & Bookkeeping for Small Businesses",
             "description": "Monthly accounts, payroll, financial statements. Competitive rates. Remote or on-site.",
             "price": 80.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600"],
             "attributes": {"service": "Accounting", "type": "Small Business"}},
        ],
        "Travel & Tourism": [
            {"title": "Flight Ticket Booking – All Destinations",
             "description": "Dubai, Nairobi, Istanbul, Addis Ababa and more. Quick confirmation. Call or WhatsApp.",
             "price": 0.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600"],
             "attributes": {"service": "Flight Booking", "destinations": "Domestic & International"}},
        ],
        "Education & Training": [
            {"title": "English Language Classes – All Levels",
             "description": "Group or private 1-on-1 tutoring. Certified teacher. Online via Zoom available.",
             "price": 30.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600"],
             "attributes": {"subject": "English", "levels": "Beginner to Advanced"}},
        ],
        "Beauty & Wellness": [
            {"title": "Mobile Hair Salon – We Come to You (Mogadishu)",
             "description": "Braiding, weaving, relaxer, treatments and styling. All tools and products brought to you.",
             "price": 20.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600"],
             "attributes": {"service": "Mobile Hair Salon", "mobile": True}},
        ],
        "Photography & Video": [
            {"title": "Wedding & Event Photography – Full Day Coverage",
             "description": "5 years experience. Edited photos delivered in 7 days. Drone shots available as add-on.",
             "price": 250.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600"],
             "attributes": {"service": "Photography", "specialty": "Wedding & Events", "delivery": "7 days"}},
        ],
        "Other Services": [
            {"title": "Somali Catering – Weddings & Events (50+ Guests)",
             "description": "Bariis iskukaris, hilib, muufo. Weddings, Eid, corporate events. Get a quote.",
             "price": 0.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1555244162-803834f70033?w=600"],
             "attributes": {"service": "Catering", "cuisine": "Somali", "min_guests": 50}},
            {"title": "Event Planning & Décor – Weddings & Parties",
             "description": "Full décor setup: backdrop, flowers, lighting, table arrangements. Contact for pricing.",
             "price": 0.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=600"],
             "attributes": {"service": "Event Planning & Décor"}},
        ],
    },

    # ───────────────────────────────────────────────
    # JOBS  (slug: jobs)
    # ───────────────────────────────────────────────
    "jobs": {
        "Tech & IT": [
            {"title": "Full Stack Developer Wanted – React + Python/FastAPI",
             "description": "2+ years experience. React, FastAPI, PostgreSQL. Remote possible. Competitive salary.",
             "price": 800.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600"],
             "attributes": {"role": "Full Stack Developer", "skills": "React, Python, PostgreSQL"}},
            {"title": "IT Support Technician – Full Time (Mogadishu)",
             "description": "Windows, networking, printer troubleshooting. 1+ year experience. Mon–Fri 8am–5pm.",
             "price": 400.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600"],
             "attributes": {"role": "IT Support", "type": "Full Time"}},
        ],
        "Education": [
            {"title": "English Teacher Wanted – Private School, Mogadishu",
             "description": "Teaching degree or TEFL required. Grades 7–12. Competitive salary package.",
             "price": 500.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600"],
             "attributes": {"role": "English Teacher", "grades": "7–12"}},
        ],
        "Medical & Health Jobs": [
            {"title": "Registered Nurse Wanted – Hargeisa Hospital",
             "description": "2+ years experience required. Competitive salary plus accommodation allowance.",
             "price": 600.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600"],
             "attributes": {"role": "Registered Nurse", "experience": "2+ years"}},
        ],
        "Sales & Marketing": [
            {"title": "FMCG Sales Representative – Mogadishu Territory",
             "description": "Motorbike required. Commission + base salary. Strong Somali communication skills.",
             "price": 350.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=600"],
             "attributes": {"role": "Sales Rep", "industry": "FMCG", "motorbike": True}},
        ],
        "Admin & Office": [
            {"title": "Female Receptionist – International NGO, Garowe",
             "description": "Fluent English and Somali. Computer literate. 1 year experience minimum. Apply with CV.",
             "price": 300.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=600"],
             "attributes": {"role": "Receptionist", "organization": "NGO", "languages": "English & Somali"}},
        ],
        "Construction & Trade": [
            {"title": "Skilled Electrician Needed – Large Construction Project",
             "description": "Full building wiring and panels. 3+ years commercial experience. Good daily rate.",
             "price": 0.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600"],
             "attributes": {"role": "Electrician", "experience": "3+ years"}},
        ],
        "Driver & Transport": [
            {"title": "Professional Driver Wanted – Private Car, Mogadishu",
             "description": "Valid Somali driving licence, 3+ years experience. Non-smoker, punctual and trustworthy.",
             "price": 280.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600"],
             "attributes": {"role": "Private Driver", "experience": "3+ years"}},
        ],
        "Domestic & Cleaning": [
            {"title": "Live-in House Helper Wanted – Mogadishu",
             "description": "Cleaning, cooking, laundry. Female preferred, 25–45. Good salary + accommodation.",
             "price": 150.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600"],
             "attributes": {"role": "House Help", "type": "Live-in", "duties": "Cleaning, Cooking, Laundry"}},
        ],
        "Other Jobs": [
            {"title": "Freelance Graphic Designer Wanted – Remote Work",
             "description": "Canva, Illustrator or Photoshop required. Social media, branding and print design.",
             "price": 0.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600"],
             "attributes": {"role": "Graphic Designer", "type": "Freelance/Remote"}},
        ],
    },

    # ───────────────────────────────────────────────
    # BEAUTY & PERSONAL CARE  (slug: health-beauty)
    # ───────────────────────────────────────────────
    "health-beauty": {
        "Hair Beauty": [
            {"title": "Brazilian Body Wave Wig – 24 Inch, 180% Density",
             "description": "Human hair, 13x4 lace frontal. Pre-plucked natural hairline. Can be dyed and styled.",
             "price": 95.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600"],
             "attributes": {"length": "24 inch", "density": "180%", "type": "13x4 Lace Front"}},
            {"title": "Moroccan Argan Oil Hair Treatment – 250ml",
             "description": "Repairs damaged hair, reduces frizz, adds shine. No parabens or sulphates.",
             "price": 12.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600"],
             "attributes": {"volume": "250ml", "type": "Argan Oil Treatment"}},
        ],
        "Face Care": [
            {"title": "Vitamin C Brightening Serum – 30ml",
             "description": "Hyaluronic acid and niacinamide. Fades dark spots, brightens skin. Dermatologist-tested.",
             "price": 18.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"],
             "attributes": {"volume": "30ml", "key_ingredient": "Vitamin C + Hyaluronic Acid"}},
        ],
        "Oral Care": [
            {"title": "Oral-B Pro 1000 Rechargeable Electric Toothbrush",
             "description": "Removes 100% more plaque than manual. 2-minute timer. Includes replacement brush head.",
             "price": 35.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600"],
             "attributes": {"brand": "Oral-B", "model": "Pro 1000", "rechargeable": True}},
        ],
        "Body Care": [
            {"title": "Shea Butter Body Lotion – 400ml (Unscented)",
             "description": "Deeply moisturising, fast-absorbing. Unscented, suitable for sensitive skin.",
             "price": 9.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1556228841-a3c527ebefe5?w=600"],
             "attributes": {"volume": "400ml", "key_ingredient": "Shea Butter", "scent": "Unscented"}},
        ],
        "Fragrance": [
            {"title": "Lattafa Oud Al Shuyukh – 100ml EDP",
             "description": "Rich Oriental oud. Oud, rose and amber notes. Long-lasting. For men and women.",
             "price": 28.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"],
             "attributes": {"brand": "Lattafa", "volume": "100ml", "notes": "Oud, Rose, Amber"}},
            {"title": "Oud & Bakhur Set – 5 Varieties with Charcoal Burner",
             "description": "Premium bakhur from Arabia and Somalia. Includes charcoal oud burner. Perfect gift.",
             "price": 35.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1548183585-aa11d31d07b5?w=600"],
             "attributes": {"varieties": 5, "includes": "Bakhur + Charcoal Burner"}},
        ],
        "Makeup": [
            {"title": "MAC Matte Lipstick – 6 Shade Collection (Authentic)",
             "description": "Ruby Woo, Velvet Teddy, Lady Danger and more. Long-lasting, full coverage. With MAC box.",
             "price": 55.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1586495777744-4e6232bf2919?w=600"],
             "attributes": {"brand": "MAC", "type": "Matte", "shades": 6, "authentic": True}},
        ],
        "Tools & Accessories": [
            {"title": "Professional Ceramic Hair Straightener – 230°C",
             "description": "Heats to 230°C in 30 seconds. Adjustable temperature. Suitable for all hair types.",
             "price": 28.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600"],
             "attributes": {"plates": "Ceramic", "max_temp": "230°C"}},
        ],
        "Vitamins & Supplements": [
            {"title": "Complete Multivitamin – 180 Tablets (3-Month Supply)",
             "description": "23 vitamins and minerals: D3, B12, Zinc, Iron. Men and women. No artificial colours.",
             "price": 22.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"],
             "attributes": {"count": 180, "supply": "3 months"}},
        ],
        "Massagers": [
            {"title": "Deep Tissue Percussion Massage Gun",
             "description": "6 speeds, 6 massage heads. Rechargeable, 3-hour battery. For muscle recovery and relaxation.",
             "price": 45.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"],
             "attributes": {"speeds": 6, "heads": 6, "battery": "3 hours", "rechargeable": True}},
        ],
        "Beauty Treatments": [
            {"title": "Henna Design – Home Visit (Mogadishu & Hargeisa)",
             "description": "Professional henna (xinnii). Bridal, Eid and regular designs. Natural henna paste.",
             "price": 15.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=600"],
             "attributes": {"service": "Henna Design", "visit": "Home Visit", "occasions": "Bridal, Eid, Regular"}},
        ],
    },

    # ───────────────────────────────────────────────
    # BABIES & KIDS  (slug: babies-kids)
    # ───────────────────────────────────────────────
    "babies-kids": {
        "Toys & Games": [
            {"title": "LEGO Classic 500-Piece Brick Set – Ages 4+",
             "description": "Multiple colours. Develops creativity and fine motor skills. Building ideas booklet included.",
             "price": 35.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600"],
             "attributes": {"brand": "LEGO", "pieces": 500, "ages": "4+"}},
            {"title": "Kids Electric Ride-On Car – 12V, Remote Control",
             "description": "Parental remote control, 2-speed forward and reverse. MP3, LED lights, seat belt. Ages 3–6.",
             "price": 85.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
             "attributes": {"battery": "12V", "remote_control": True, "ages": "3–6"}},
        ],
        "Kids Clothing": [
            {"title": "Girls Party Dress – 5 Styles, Ages 3–8",
             "description": "Tulle skirt, sparkle detail. Pink, white, blue, purple, red. Eid, birthdays and parties.",
             "price": 20.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1604671368394-2240d0b1bb6c?w=600"],
             "attributes": {"styles": 5, "ages": "3–8 years"}},
        ],
        "Baby Gear": [
            {"title": "Lightweight Foldable Baby Pram – UV Sunshade Included",
             "description": "Aluminium frame, reclining seat. Foldable for car. Adjustable footrest, shopping basket. Birth–15kg.",
             "price": 120.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600"],
             "attributes": {"frame": "Aluminium", "foldable": True, "max_weight": "15kg"}},
            {"title": "Convertible Infant Car Seat – ISOFIX, Group 0+1 (0–18kg)",
             "description": "Side-impact protection, 5-point harness. Adjustable recline. Easy ISOFIX installation.",
             "price": 95.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1541692641319-981cc79ee10a?w=600"],
             "attributes": {"group": "0+1", "max_weight": "18kg", "isofix": True}},
        ],
        "Baby Food": [
            {"title": "Aptamil Profutura Stage 1 – 800g (0–6 Months, UK Import)",
             "description": "Enriched with DHA, ARA and prebiotics. 800g tin, approximately 100 feeds.",
             "price": 38.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=600"],
             "attributes": {"brand": "Aptamil", "stage": "Stage 1 (0–6 months)", "weight": "800g"}},
        ],
        "Kids Education": [
            {"title": "10 Islamic Storybooks – Arabic & English (Ages 4–10)",
             "description": "Illustrated stories of prophets and Islamic values. Bilingual Arabic & English text.",
             "price": 30.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600"],
             "attributes": {"quantity": 10, "languages": "Arabic & English", "ages": "4–10"}},
        ],
    },

    # ───────────────────────────────────────────────
    # SPORTS  (slug: leisure-sports)
    # ───────────────────────────────────────────────
    "leisure-sports": {
        "Football Boots": [
            {"title": "Adidas Predator Edge – FG Firm Ground, Size 42",
             "description": "Synthetic upper with grip zones. Firm ground cleats. Great for natural grass pitches.",
             "price": 65.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
             "attributes": {"brand": "Adidas", "model": "Predator Edge", "size": "42 EU", "ground": "FG"}},
            {"title": "Nike Mercurial Superfly 9 – Black/Gold Size 41",
             "description": "Speed-focused boot, flyknit collar, 12 stud configuration. Barely worn.",
             "price": 90.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"],
             "attributes": {"brand": "Nike", "model": "Mercurial Superfly 9", "size": "41 EU"}},
        ],
        "Jerseys & Kits": [
            {"title": "Somalia National Team Home Jersey 2024 – Official Replica",
             "description": "Official replica jersey. Sky blue, star badge. Sizes S–XXL. Polyester, moisture-wicking.",
             "price": 30.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1600267175161-cfaa711b4a81?w=600"],
             "attributes": {"team": "Somalia National", "season": "2024", "sizes": "S–XXL"}},
            {"title": "Kids Full Football Kit – Jersey + Shorts + Socks (Ages 6–14)",
             "description": "3-piece kit in club colors. Breathable fabric. Ages 6–14 in multiple sizes.",
             "price": 22.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600"],
             "attributes": {"includes": "Jersey, Shorts, Socks", "ages": "6–14"}},
        ],
        "Football Balls": [
            {"title": "Adidas Tiro Club Football – Size 5 (Training)",
             "description": "Machine-stitched, durable for hard pitches. 100% latex bladder for excellent air retention.",
             "price": 25.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600"],
             "attributes": {"brand": "Adidas", "size": 5, "type": "Training"}},
            {"title": "Nike Flight Match Ball – Size 5, Official Weight",
             "description": "Aerow Trac grooves for consistent flight. For match play. White/blue.",
             "price": 45.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600"],
             "attributes": {"brand": "Nike", "model": "Flight", "size": 5, "type": "Match"}},
        ],
        "Goalkeeper Gear": [
            {"title": "Reusch Attrakt Starter – GK Gloves Size 9",
             "description": "4mm foam palm, finger protection spines, latex contact zones. Good grip on wet balls.",
             "price": 38.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600"],
             "attributes": {"brand": "Reusch", "model": "Attrakt Starter", "size": 9}},
        ],
        "Training Equipment": [
            {"title": "Football Training Set – 10 Cones + Ladder + Poles",
             "description": "10 agility cones, 1x6m speed ladder, 6 training poles. For individual and team drills.",
             "price": 35.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600"],
             "attributes": {"includes": "10 cones, speed ladder, 6 poles"}},
            {"title": "Portable Football Goal – 3x2m, Foldable Steel Frame",
             "description": "Steel frame with net. Easy to assemble and fold for storage. For training and casual play.",
             "price": 55.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=600"],
             "attributes": {"size": "3m x 2m", "material": "Steel", "foldable": True}},
        ],
    },

    # ───────────────────────────────────────────────
    # COMMERCIAL EQUIPMENT  (slug: commercial-equipment)
    # ───────────────────────────────────────────────
    "commercial-equipment": {
        "Industrial Machinery": [
            {"title": "10KVA Silent Diesel Generator – Electric Start",
             "description": "Soundproof canopy, auto transfer switch. For shops, offices, small factories. 1-year warranty.",
             "price": 2800.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600"],
             "attributes": {"power": "10KVA", "fuel": "Diesel", "type": "Silent/Soundproof"}},
            {"title": "MIG 200A Inverter Welding Machine",
             "description": "Steel, stainless and aluminium welding. Fan-cooled, overheat protection. Includes gun and cable.",
             "price": 280.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1597149237071-a92a17268e61?w=600"],
             "attributes": {"type": "MIG", "amperage": "200A"}},
        ],
        "Office Equipment": [
            {"title": "Ricoh MP C2004 A3/A4 Colour Photocopier",
             "description": "Print, scan, copy, fax. 20ppm. Excellent working condition.",
             "price": 1200.0, "condition": "Used",
             "images": ["https://images.unsplash.com/photo-1612810806695-30f7a8258391?w=600"],
             "attributes": {"brand": "Ricoh", "model": "MP C2004", "functions": "Print, Scan, Copy, Fax"}},
            {"title": "30L Digital Safe Box – Fire-Resistant, Wall-Mountable",
             "description": "4-digit PIN + emergency key. Fire-resistant up to 60 minutes. Stores cash and documents.",
             "price": 95.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600"],
             "attributes": {"capacity": "30L", "lock": "Digital PIN + Key", "fire_resistant": True}},
        ],
        "Agricultural Equipment": [
            {"title": "Honda GX160 2-Inch Petrol Water Pump",
             "description": "500L/min flow rate. For irrigation and water transfer. Easy start, low maintenance. Brand new.",
             "price": 190.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600"],
             "attributes": {"brand": "Honda", "size": "2 inch", "fuel": "Petrol", "flow": "500 L/min"}},
        ],
        "Restaurant Equipment": [
            {"title": "Commercial 6-Burner Gas Cooker – Heavy Duty Stainless",
             "description": "Cast iron burners, stainless steel body. LPG compatible. Brand new with warranty.",
             "price": 350.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600"],
             "attributes": {"burners": 6, "material": "Stainless Steel", "gas": "LPG"}},
            {"title": "500L Commercial Chest Freezer – 2-Year Warranty",
             "description": "Reaches -22°C. Energy-saving compressor. For restaurants, butcheries and shops.",
             "price": 480.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600"],
             "attributes": {"capacity": "500L", "temperature": "-22°C", "warranty": "2 years"}},
        ],
        "Other Commercial": [
            {"title": "Complete POS System – Touchscreen, Scanner & Printer",
             "description": "15\" touchscreen, barcode scanner, receipt printer, cash drawer. POS software included.",
             "price": 320.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600"],
             "attributes": {"screen": "15 inch", "includes": "Scanner, Printer, Cash Drawer"}},
        ],
    },

    # ───────────────────────────────────────────────
    # REPAIR & CONSTRUCTION  (slug: repair-construction)
    # ───────────────────────────────────────────────
    "repair-construction": {
        "Building Materials": [
            {"title": "Dangote Portland Cement OPC 42.5N – 50kg Bag",
             "description": "High strength. For foundations, concrete slabs, plastering and blockwork. Per bag or bulk.",
             "price": 9.5, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600"],
             "attributes": {"brand": "Dangote", "grade": "OPC 42.5N", "weight": "50kg"}},
            {"title": "Box Profile Roofing Sheets 0.47mm – Per Sheet",
             "description": "Available 2m, 2.5m and 3m. Pre-painted: red, blue, green, silver. Rust-resistant.",
             "price": 14.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600"],
             "attributes": {"gauge": "0.47mm", "lengths": "2m, 2.5m, 3m"}},
            {"title": "12mm Steel Rebar – Bundle of 20 x 12m Bars (Grade 60)",
             "description": "High-tensile deformed bars. For foundations, columns and slabs.",
             "price": 120.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
             "attributes": {"size": "12mm", "length": "12m per bar", "quantity": "20 bars", "grade": "Grade 60"}},
        ],
        "Electrical Supplies": [
            {"title": "12W E27 LED Bulbs – Pack of 10 (Warm White 3000K)",
             "description": "1200 lumens. Energy-saving, replaces 80W incandescent. 25,000-hour lifespan.",
             "price": 15.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
             "attributes": {"wattage": "12W", "base": "E27", "quantity": 10, "colour_temp": "3000K"}},
        ],
        "Plumbing": [
            {"title": "110mm uPVC Sewer Pipe – 6m Length (Class D)",
             "description": "For underground drainage, toilet waste and sewer connections. Smooth bore, easy to install.",
             "price": 18.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
             "attributes": {"diameter": "110mm", "length": "6m", "material": "uPVC", "class": "Class D"}},
        ],
        "Hand & Power Tools": [
            {"title": "DeWalt 18V Brushless Cordless Drill – 2 Batteries + Fast Charger",
             "description": "13mm keyless chuck, 21 torque settings, 2-speed. Includes 2x 2Ah batteries and carry case.",
             "price": 145.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600"],
             "attributes": {"brand": "DeWalt", "voltage": "18V", "type": "Brushless", "batteries": 2}},
        ],
        "Doors, Windows & Steel": [
            {"title": "Heavy-Duty Steel Security Door – 90x210cm, 3-Point Lock",
             "description": "1.5mm steel sheet, reinforced hinges, 3-point locking system. Powder-coated finish. With frame.",
             "price": 180.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"],
             "attributes": {"size": "90cm x 210cm", "material": "1.5mm Steel", "lock": "3-point"}},
        ],
        "Solar Energy": [
            {"title": "400W Monocrystalline Solar Panel – 25-Year Warranty",
             "description": "21% efficiency, anti-reflective tempered glass, IP68 junction box. Aluminium frame.",
             "price": 120.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600"],
             "attributes": {"wattage": "400W", "type": "Monocrystalline", "efficiency": "21%"}},
            {"title": "200Ah 12V LiFePO4 Lithium Solar Battery",
             "description": "3000+ charge cycles, 80% DoD. Built-in BMS, no maintenance. Lightweight.",
             "price": 380.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600"],
             "attributes": {"capacity": "200Ah", "voltage": "12V", "chemistry": "LiFePO4", "cycles": "3000+"}},
            {"title": "5kW Hybrid Solar Inverter – WiFi Monitoring",
             "description": "Handles solar, grid and battery. Pure sine wave, built-in MPPT, LCD display.",
             "price": 550.0, "condition": "New",
             "images": ["https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600"],
             "attributes": {"power": "5kW", "type": "Hybrid", "output": "Pure Sine Wave", "wifi": True}},
        ],
    },
}


# ─────────────────────────────────────────────
# RUNNER
# ─────────────────────────────────────────────

def seed_listings():
    with Session(engine) as session:

        # 1 — Delete all existing listings (truncate cascade handles all FK deps)
        print("🗑  Deleting all existing listings...")
        session.exec(text("TRUNCATE TABLE favorite, interaction, meeting, deal, message, report, promotion, promotioncode, listing RESTART IDENTITY CASCADE"))
        session.commit()
        print("✅ All listings deleted.\n")

        # 2 — Find seed user (first admin, or first user)
        owner = session.exec(select(User).where(User.is_admin == True)).first()
        if not owner:
            owner = session.exec(select(User)).first()
        if not owner:
            print("❌ No users found. Create a user first, then re-run.")
            return
        print(f"👤 Using owner: {owner.email}\n")

        # 3 — Build lookup maps
        cat_map = {c.slug: c for c in session.exec(select(Category)).all()}
        subcat_map: dict[tuple, SubCategory] = {}
        for sc in session.exec(select(SubCategory)).all():
            subcat_map[(sc.category_id, sc.name)] = sc

        # 4 — Insert listings
        total = 0
        for cat_slug, subcategories in LISTINGS_DATA.items():
            cat = cat_map.get(cat_slug)
            if not cat:
                print(f"⚠️  Category slug not found: '{cat_slug}' — skipping")
                continue
            print(f"📂 {cat.name}")
            for subcat_name, listings in subcategories.items():
                sc = subcat_map.get((cat.id, subcat_name))
                if not sc:
                    print(f"   ⚠️  Subcategory not found: '{subcat_name}' — skipping")
                    continue
                for data in listings:
                    session.add(Listing(
                        title=data["title"],
                        description=data["description"],
                        price=data["price"],
                        location=random.choice(LOCATIONS),
                        condition=data.get("condition", "New"),
                        category_id=cat.id,
                        subcategory_id=sc.id,
                        images=data.get("images", []),
                        attributes=data.get("attributes", {}),
                        status="active",
                        owner_id=owner.id,
                        boost_level=random.choice([0, 0, 0, 1]),
                        currency="USD",
                    ))
                    total += 1
                print(f"   ✓ {subcat_name} — {len(listings)} listing(s)")

        session.commit()
        print(f"\n🎉 Done! Seeded {total} listings across all categories.")


if __name__ == "__main__":
    seed_listings()
