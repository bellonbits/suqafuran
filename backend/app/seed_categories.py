from sqlmodel import Session, select
from app.db.session import engine
from app.models import Category
from app.models.listing import SubCategory, SubSubCategory


CATEGORIES = [
    {
        "name": "Food & Groceries",
        "name_so": "Raashinka & Badeecadaha",
        "slug": "food-groceries",
        "icon_name": "utensils",
        "subcategories": [
            {"name": "Vegetables", "name_so": "Khudaarta", "subs": [
                ("Tomatoes", "Yaanyo"),
                ("Onions", "Basal"),
                ("Potatoes", "Baradho"),
                ("Leafy Greens", "Cagaarka Caleenta ah"),
                ("Peppers", "Filfisha"),
            ]},
            {"name": "Fruits", "name_so": "Mirooyinka", "subs": [
                ("Mangoes", "Cambe"),
                ("Bananas", "Moos"),
                ("Citrus Fruits", "Liinta & Cambuulada"),
                ("Dates", "Tamar"),
                ("Avocados", "Afokadho"),
            ]},
            {"name": "Rice & Pasta", "name_so": "Bariis & Baasto", "subs": [
                ("Basmati Rice", "Bariis Basmati"),
                ("Spaghetti", "Isbaaketi"),
                ("Macaroni", "Makarooni"),
                ("Broken Rice", "Bariis Jabsan"),
            ]},
            {"name": "Meat", "name_so": "Hilib", "subs": [
                ("Beef", "Hilib Lo'"),
                ("Goat", "Hilib Ari"),
                ("Lamb", "Hilib Wiyil"),
                ("Chicken", "Hilib Digaag"),
                ("Camel Meat", "Hilib Geel"),
            ]},
            {"name": "Seafood", "name_so": "Cuntada Badda", "subs": [
                ("Fresh Fish", "Kalluun Daadir ah"),
                ("Dried Fish", "Kalluun Engegan"),
                ("Prawns", "Garnaalada"),
                ("Squid", "Xoolaha Badda Kale"),
            ]},
            {"name": "Milk & Dairy", "name_so": "Caanaha & Alaabtoodda", "subs": [
                ("Fresh Milk", "Caano Daadir ah"),
                ("Camel Milk", "Caano Geel"),
                ("Yoghurt", "Yogurt (Caano La Qaniinay)"),
                ("Cheese", "Buuro"),
                ("Butter", "Subag"),
            ]},
            {"name": "Eggs", "name_so": "Ukunta", "subs": [
                ("Chicken Eggs", "Ukunta Digaag"),
                ("Duck Eggs", "Ukunta Bato"),
            ]},
            {"name": "Prepared Foods", "name_so": "Cunto Diyaar ah", "subs": [
                ("Canjeero", "Canjeero"),
                ("Samosas", "Sambuse"),
                ("Muufo", "Muufo"),
                ("Halwa", "Xalwo"),
                ("Bur", "Bur"),
            ]},
            {"name": "Spices & Condiments", "name_so": "Xawaashka & Kaydka", "subs": [
                ("Xawaash Mix", "Xawaash"),
                ("Cumin", "Kamuun"),
                ("Cardamom", "Hayl (Xawaash)"),
                ("Chilli", "Filfil Geel"),
                ("Salt", "Cusbo"),
            ]},
            {"name": "Beverages", "name_so": "Cabitaanaha", "subs": [
                ("Soft Drinks", "Khanyarada"),
                ("Juice", "Casiirta"),
                ("Tea", "Shaah"),
                ("Coffee", "Qaxwo"),
                ("Water", "Biyo"),
            ]},
        ],
    },
    {
        "name": "Clothing & Shoes",
        "name_so": "Dharka & Kabaha",
        "slug": "clothing-shoes",
        "icon_name": "fashion",
        "subcategories": [
            {"name": "Men's Clothing", "name_so": "Dharka Ragga", "subs": [
                ("Shirts", "Shaadh"),
                ("Trousers", "Surwaal"),
                ("Suits", "Suud"),
                ("Traditional Wear", "Dharka Dhaqanka"),
                ("Sportswear", "Dharka Ciyaaraha"),
            ]},
            {"name": "Women's Clothing", "name_so": "Dharka Dumarka", "subs": [
                ("Dresses", "Qoomiyadaha"),
                ("Abayas", "Abaayadaha"),
                ("Blouses", "Buluusada"),
                ("Skirts", "Tiro"),
                ("Traditional Wear", "Dharka Dhaqanka Dumareed"),
            ]},
            {"name": "Children's Clothing", "name_so": "Dharka Caruurta", "subs": [
                ("Boys Clothing", "Dharka Wiilasha"),
                ("Girls Clothing", "Dharka Gabdhaha"),
                ("Baby Clothing", "Dharka Ilmaha Yaryar"),
                ("School Uniforms", "Uniifoornka Dugsiga"),
            ]},
            {"name": "Shoes", "name_so": "Kabaha", "subs": [
                ("Men's Shoes", "Kabo Rag"),
                ("Women's Shoes", "Kabo Dumar"),
                ("Children's Shoes", "Kabo Caruur"),
                ("Sandals", "Kabo Furan"),
                ("Sports Shoes", "Kabo Ciyaareed"),
            ]},
            {"name": "Clothing Accessories", "name_so": "Qalabka Dharka", "subs": [
                ("Belts", "Suunaha"),
                ("Bags", "Baqashada"),
                ("Scarves", "Shaashada"),
                ("Hats", "Koofiyadaha"),
                ("Sunglasses", "Muraayadda Qoraxda"),
                ("Jewellery", "Dahab & Xidho"),
            ]},
        ],
    },
    {
        "name": "Household Items",
        "name_so": "Alaabta Guriga",
        "slug": "household-items",
        "icon_name": "home-living",
        "subcategories": [
            {"name": "Kitchenware", "name_so": "Qalabka Jikada", "subs": [
                ("Pots & Pans", "Digsiyo & Xaarooyinka"),
                ("Plates & Bowls", "Saxaano & Weelasha"),
                ("Cups & Glasses", "Koobab & Dhalooyinka"),
                ("Cutlery", "Qalab Cunno"),
                ("Cooking Utensils", "Qalabka Karinta"),
            ]},
            {"name": "Bedding", "name_so": "Alaabta Sariirta", "subs": [
                ("Mattresses", "Jiindada Sariirta"),
                ("Pillows", "Barku"),
                ("Bed Sheets", "Xeedhooyinka Sariirta"),
                ("Blankets", "Dhar Kulul"),
                ("Mosquito Nets", "Keheddooyinka"),
            ]},
            {"name": "Home Decor", "name_so": "Qurxinta Guriga", "subs": [
                ("Curtains", "Daahanka Albaabka"),
                ("Rugs & Carpets", "Jaamalada & Kaarpadaha"),
                ("Wall Art", "Sawirrada Darbiga"),
                ("Mirrors", "Muraayad"),
                ("Vases", "Weelasha Ubaxa"),
            ]},
            {"name": "Cleaning Supplies", "name_so": "Qalabka Nadiifinta", "subs": [
                ("Detergents", "Saboonka Dharka"),
                ("Mops & Brooms", "Qalabka Barida"),
                ("Disinfectants", "Daawooyinka Nadiifinta"),
                ("Cleaning Cloths", "Maro Nadiifinta"),
            ]},
            {"name": "Appliances", "name_so": "Mishiimaha Guriga", "subs": [
                ("Washing Machines", "Mishiinta Dharka"),
                ("Refrigerators", "Qaboojiyeyaasha"),
                ("Air Conditioners", "Qaboojiyaha Hawada"),
                ("Water Dispensers", "Mishiimaha Biyaha"),
                ("Fans", "Marwaxadaha"),
            ]},
            {"name": "Furniture", "name_so": "Alaabta Guriga (Xaraasha)", "subs": [
                ("Sofas", "Kursi Fid ah"),
                ("Dining Tables", "Miiska Cuntada"),
                ("Beds", "Sariirta"),
                ("Wardrobes", "Kaabadaha Dharka"),
                ("Office Furniture", "Alaabta Xafiiska"),
            ]},
            {"name": "Garden Supplies", "name_so": "Qalabka Beerta", "subs": [
                ("Garden Tools", "Qalab Beer"),
                ("Plant Pots", "Weelasha Dhirta"),
                ("Seeds", "Abuuraha"),
                ("Fertilizers", "Bacriminta"),
                ("Water Hoses", "Tuubada Biyaha"),
            ]},
        ],
    },
    {
        "name": "Electronics",
        "name_so": "Korontada & Elektaroonik",
        "slug": "electronics",
        "icon_name": "laptop",
        "subcategories": [
            {"name": "Mobile Phones", "name_so": "Taleefammada Gacanta", "subs": [
                ("Samsung", "Samsung"),
                ("iPhone", "iPhone"),
                ("Tecno", "Tecno"),
                ("Infinix", "Infinix"),
                ("Huawei", "Huawei"),
                ("Nokia", "Nokia"),
                ("Other Brands", "Summadaha Kale"),
            ]},
            {"name": "Computers", "name_so": "Kombiyuutarrada", "subs": [
                ("Laptops", "Laab-Toob"),
                ("Desktop PCs", "Kombiyuutarka Miiska"),
                ("Tablets", "Tableedyada"),
                ("Computer Accessories", "Qalabka Kombiyuutarka"),
                ("Monitors", "Shaashaddaha"),
                ("Printers", "Printeraska"),
            ]},
            {"name": "TVs", "name_so": "Televizhinada", "subs": [
                ("Smart TVs", "TV Casri ah"),
                ("LED TVs", "TV LED"),
                ("OLED TVs", "TV OLED"),
                ("TV Accessories", "Qalabka TV"),
            ]},
            {"name": "Audio & Headphones", "name_so": "Codka & Dhegaha", "subs": [
                ("Bluetooth Speakers", "Cajalad Bluetooth"),
                ("Headphones", "Dhegaha Weyn"),
                ("Earphones", "Dhegaha Yaryar"),
                ("Home Theatre", "Masraxa Guriga"),
                ("Amplifiers", "Kordhiyaha Codka"),
            ]},
            {"name": "Cameras", "name_so": "Kamaradaha", "subs": [
                ("DSLR Cameras", "Kamarad DSLR"),
                ("Action Cameras", "Kamaradaha Ficilka"),
                ("CCTV Cameras", "Kamaradaha Amniga"),
                ("Camera Accessories", "Qalabka Kamaradaha"),
            ]},
            {"name": "Networking", "name_so": "Shabakadaha", "subs": [
                ("Routers", "Routerrada"),
                ("Modems", "Modeemada"),
                ("Network Cables", "Wayrarka Shabakadda"),
                ("WiFi Extenders", "Kordhiska WiFi"),
            ]},
            {"name": "Gaming", "name_so": "Ciyaaraha Elektaroonik", "subs": [
                ("Game Consoles", "Mishiimaha Ciyaaraha"),
                ("Video Games", "Ciyaaraha Fiidiyoowga"),
                ("Controllers", "Qabashada Ciyaaraha"),
                ("Gaming Accessories", "Qalabka Ciyaaraha"),
            ]},
            {"name": "Other Electronics", "name_so": "Korontada Kale", "subs": [
                ("Power Banks", "Baatariyaha Gacanta"),
                ("Chargers", "Shaajiyeyaasha"),
                ("Cables & Adapters", "Wayrarka & Adaptedarrada"),
                ("Smart Watches", "Saacadaha Casriga ah"),
                ("Drones", "Diyaaradaha Yaryar (Drone)"),
            ]},
        ],
    },
    {
        "name": "Vehicles",
        "name_so": "Gaadidka",
        "slug": "vehicles",
        "icon_name": "car",
        "subcategories": [
            {"name": "Cars", "name_so": "Baabuurta", "subs": [
                ("Toyota", "Toyota"),
                ("Nissan", "Nissan"),
                ("Mazda", "Mazda"),
                ("Honda", "Honda"),
                ("Mitsubishi", "Mitsubishi"),
                ("Suzuki", "Suzuki"),
                ("BMW", "BMW"),
                ("Mercedes-Benz", "Mercedes-Benz"),
                ("Other Brands", "Summadaha Kale"),
            ]},
            {"name": "Motorcycles", "name_so": "Mootoorada", "subs": [
                ("Dirt Bikes", "Baaskiil Ciidda"),
                ("Scooters", "Skuuterrada"),
                ("Sports Bikes", "Motooyinka Ciyaaraha"),
                ("Delivery Bikes", "Mooto Gaadhsiinta"),
            ]},
            {"name": "Tuk-tuks", "name_so": "Tuktukada", "subs": [
                ("Passenger Tuk-tuks", "Tuktuk Rakaabka"),
                ("Cargo Tuk-tuks", "Tuktuk Xamuulka"),
            ]},
            {"name": "Trucks & Buses", "name_so": "Gaadidka Weyn", "subs": [
                ("Trucks", "Gaadiga Xamuulka"),
                ("Buses", "Basaska"),
                ("Minibuses", "Bas-yarida (Coaster)"),
                ("Pickups", "Biigabka"),
                ("Trailers", "Treelarka"),
            ]},
            {"name": "Vehicle Parts & Accessories", "name_so": "Qaybaha & Qalabka Baabuurta", "subs": [
                ("Tyres & Rims", "Tayrarka & Rinta"),
                ("Engines & Parts", "Matoorada & Qaybihiisa"),
                ("Car Batteries", "Baatariyada Baabuurta"),
                ("Car Lights", "Nalka Baabuurta"),
                ("Bumpers", "Bumperka"),
                ("Car Covers", "Daboolka Baabuurta"),
                ("Audio Systems", "Nidaamka Codka Baabuurta"),
            ]},
            {"name": "Car Services", "name_so": "Adeegyada Baabuurta", "subs": [
                ("Car Repair", "Dayactirka Baabuurta"),
                ("Car Wash", "Maydhka Baabuurta"),
                ("Towing Services", "Adeegga Jiidista"),
                ("Car Rental", "Kirid Baabuur"),
            ]},
        ],
    },
    {
        "name": "Livestock",
        "name_so": "Xoolaha",
        "slug": "livestock",
        "icon_name": "animals",
        "subcategories": [
            {"name": "Goats", "name_so": "Riyo", "subs": [
                ("Local Goats", "Riyo Maxalliga ah"),
                ("Dairy Goats", "Riyo Caanaha"),
                ("Meat Goats", "Riyo Hilibka"),
                ("Breeding Goats", "Riyo Taranka"),
            ]},
            {"name": "Sheep", "name_so": "Ido", "subs": [
                ("Local Sheep", "Ido Maxalliga ah"),
                ("Fat-tailed Sheep", "Ido Baraska"),
                ("Breeding Sheep", "Ido Taranka"),
            ]},
            {"name": "Cattle", "name_so": "Lo'da", "subs": [
                ("Dairy Cows", "Lo' Caanaha"),
                ("Beef Cattle", "Lo' Hilibka"),
                ("Oxen", "Dibi"),
                ("Calves", "Weylaha"),
            ]},
            {"name": "Poultry", "name_so": "Shimbiraha Guriga", "subs": [
                ("Chickens", "Digaagga"),
                ("Ducks", "Batada"),
                ("Turkeys", "Turkeeyada"),
                ("Eggs for Hatching", "Ukunta Qarqarka"),
            ]},
            {"name": "Camels", "name_so": "Geela", "subs": [
                ("Dairy Camels", "Geel Caanaha"),
                ("Racing Camels", "Geel Tartanka"),
                ("Pack Camels", "Geel Xamuulka"),
            ]},
            {"name": "Pets", "name_so": "Xayawaanka Guriga", "subs": [
                ("Dogs", "Eey"),
                ("Cats", "Muqudi"),
                ("Birds", "Shimbir"),
                ("Fish", "Kalluun"),
                ("Pet Accessories", "Qalabka Xayawaanka"),
            ]},
        ],
    },
    {
        "name": "Land & Farms",
        "name_so": "Dhulka & Beeraha",
        "slug": "land-farms",
        "icon_name": "agriculture",
        "subcategories": [
            {"name": "Vacant Land", "name_so": "Dhul Banaan", "subs": [
                ("Residential Plots", "Dhul Guryo"),
                ("Commercial Plots", "Dhul Ganacsi"),
                ("Industrial Land", "Dhul Warshadeed"),
            ]},
            {"name": "Farms", "name_so": "Beeraha", "subs": [
                ("Crop Farms", "Beer Beernaansha"),
                ("Livestock Farms", "Beeraha Xoolaha"),
                ("Mixed Farms", "Beer Isku Dhafan"),
            ]},
            {"name": "Agricultural Land", "name_so": "Dhul Beeraansha", "subs": [
                ("Irrigated Land", "Dhul La Waraabiyay"),
                ("Rain-fed Land", "Dhul Roobka ku Xidhan"),
                ("Orchard Land", "Dhul Beeraha Miraha"),
            ]},
            {"name": "Market Gardens", "name_so": "Beerta Suuqa", "subs": [
                ("Vegetable Gardens", "Beerta Khudaarta"),
                ("Herb Gardens", "Beerta Dhirta Daawada"),
                ("Fruit Orchards", "Beeraha Miraha"),
            ]},
        ],
    },
    {
        "name": "Property",
        "name_so": "Guryo & Hanti Dhisme",
        "slug": "property",
        "icon_name": "home",
        "subcategories": [
            {"name": "Houses for Rent", "name_so": "Guri Kiro", "subs": [
                ("Apartments", "Falaat Kiro"),
                ("Villas", "Villa Kiro"),
                ("Single Rooms", "Qol Keliya"),
                ("Studio Flats", "Suudyo"),
                ("Shared Housing", "Guri Wadaag"),
            ]},
            {"name": "Houses for Sale", "name_so": "Guri Iibka", "subs": [
                ("Apartments for Sale", "Falaat Iibka"),
                ("Villas for Sale", "Villa Iibka"),
                ("Commercial Buildings", "Dhismaha Ganacsiga"),
            ]},
            {"name": "Offices & Commercial", "name_so": "Xafiisyada & Ganacsiga", "subs": [
                ("Office Space", "Meel Xafiis"),
                ("Shops for Rent", "Dukaan Kiro"),
                ("Warehouses", "Goleelayaasha"),
                ("Event Halls", "Daawashada Munaasabadaha"),
            ]},
            {"name": "New Builds", "name_so": "Dhismo Cusub", "subs": [
                ("New Apartments", "Falaat Cusub"),
                ("New Villas", "Villa Cusub"),
                ("Off-plan Properties", "Hanti Qorshe ah"),
            ]},
            {"name": "Short Stay", "name_so": "Joogsi Gaaban", "subs": [
                ("Daily Rental", "Kiro Maalinleh"),
                ("Weekly Rental", "Kiro Usbuucleh"),
                ("Hotel Rooms", "Qolka Huteelka"),
            ]},
        ],
    },
    {
        "name": "Services",
        "name_so": "Adeegyada",
        "slug": "services",
        "icon_name": "briefcase",
        "subcategories": [
            {"name": "Building & Construction", "name_so": "Dhismo & Dhisnaansha", "subs": [
                ("Painting", "Rinjiyaynta"),
                ("Plumbing", "Gellid Tuubo"),
                ("Electrical Work", "Shaqada Korontada"),
                ("Tiling", "Dhigista Marmarka"),
                ("Roofing", "Saqafka"),
                ("Carpentry", "Shaqada Khashab"),
            ]},
            {"name": "Computer & IT", "name_so": "Kombiyuutar & IT", "subs": [
                ("Website Development", "Horumarinta Websaydka"),
                ("Software", "Barnaamijyada"),
                ("Computer Repair", "Dayactirka Kombiyuutarka"),
                ("Networking", "Shabakadaha"),
                ("CCTV Installation", "Rakibidda Kamaradaha Amniga"),
            ]},
            {"name": "Cleaning Services", "name_so": "Adeegyada Nadiifinta", "subs": [
                ("Home Cleaning", "Nadiifinta Guriga"),
                ("Office Cleaning", "Nadiifinta Xafiiska"),
                ("Carpet Cleaning", "Nadiifinta Kaarpadaha"),
                ("Post-construction Cleaning", "Nadiifinta Dhismaha ka Dib"),
            ]},
            {"name": "Repair Services", "name_so": "Adeegyada Dayactirka", "subs": [
                ("Phone Repair", "Dayactirka Taleefanka"),
                ("Appliance Repair", "Dayactirka Mishiimaha"),
                ("Motorcycle Repair", "Dayactirka Mootorka"),
                ("Furniture Repair", "Dayactirka Alaabta Guriga"),
            ]},
            {"name": "Printing Services", "name_so": "Adeegyada Daabacaadda", "subs": [
                ("Business Cards", "Kaarka Shirkadda"),
                ("Banners & Posters", "Baneerrada & Bosteerrada"),
                ("T-shirt Printing", "Daabacaada Shaadka"),
                ("Books & Brochures", "Buugaagta & Warqadaha"),
            ]},
            {"name": "Legal & Financial", "name_so": "Sharciga & Maaliyadda", "subs": [
                ("Legal Advice", "Tallo Sharci"),
                ("Accounting", "Xisaabinta"),
                ("Tax Services", "Adeegyada Canshuurta"),
                ("Insurance", "Caymiska"),
            ]},
            {"name": "Travel & Tourism", "name_so": "Socdaalka & Dalxiiska", "subs": [
                ("Flight Booking", "Tikeeda Diyaaradda"),
                ("Hotel Booking", "Dalbo Huteelka"),
                ("Tour Packages", "Baakidka Dalxiiska"),
                ("Visa Services", "Adeegyada Fiisaha"),
            ]},
            {"name": "Education & Training", "name_so": "Waxbarasho & Tababar", "subs": [
                ("Language Classes", "Fasalada Luuqadda"),
                ("Computer Training", "Tababarka Kombiyuutarka"),
                ("Professional Courses", "Koorsooyin Xirfadeed"),
                ("Private Tutoring", "Macallin Gaar ah"),
            ]},
            {"name": "Beauty & Wellness", "name_so": "Quruxda & Caafimaadka", "subs": [
                ("Hair Salon", "Saloon Timo"),
                ("Barber", "Xallaalaha Ragga"),
                ("Spa & Massage", "Masaajka & Nasashada"),
                ("Nail Care", "Daryeelka Cidiyaha"),
                ("Makeup Artist", "Farshaxanka Quruxda"),
            ]},
            {"name": "Photography & Video", "name_so": "Sawir & Muuqaal", "subs": [
                ("Wedding Photography", "Sawirada Arooska"),
                ("Portrait Studio", "Istuudhiyaha Muuqaalka"),
                ("Video Production", "Soo Saarista Muuqaalka"),
                ("Drone Photography", "Sawirada Diyaaradaha Yaryar"),
            ]},
            {"name": "Healthcare", "name_so": "Caafimaad", "subs": [
                ("Doctor Consultations", "La-talinta Dhakhtarka"),
                ("Pharmacy", "Daawada"),
                ("Dental Services", "Adeegyada Ilkaha"),
                ("Physiotherapy", "Nadiifinta Jirka"),
                ("Home Nursing", "Kalkaalinta Guriga"),
            ]},
            {"name": "Other Services", "name_so": "Adeegyada Kale", "subs": [
                ("Delivery Services", "Adeegyada Gaadhsiinta"),
                ("Security Services", "Adeegyada Amniga"),
                ("Event Planning", "Qorsheynta Munaasabadaha"),
                ("Pet Services", "Adeegyada Xayawaanka"),
                ("Catering", "Cunto Diyaarinta"),
            ]},
        ],
    },
    {
        "name": "Jobs",
        "name_so": "Shaqooyinka",
        "slug": "jobs",
        "icon_name": "graduation-cap",
        "subcategories": [
            {"name": "Tech & IT", "name_so": "Farsamada & IT", "subs": [
                ("Software Developer", "Horumariye Barnaamijyada"),
                ("Web Designer", "Naqshadeeye Websaydka"),
                ("Network Engineer", "Injineer Shabakadaha"),
                ("Data Entry", "Gelinta Xogta"),
                ("IT Support", "Taageerada IT"),
            ]},
            {"name": "Education", "name_so": "Waxbarashada", "subs": [
                ("Teachers", "Macallimiinta"),
                ("Tutors", "Macallimiinta Gaarka ah"),
                ("School Admin", "Maamulka Dugsiga"),
                ("Training Coordinator", "Xiriiriyaha Tababarka"),
            ]},
            {"name": "Medical & Health Jobs", "name_so": "Shaqooyinka Caafimaadka", "subs": [
                ("Doctors", "Dhakhtarada"),
                ("Nurses", "Kalkaalisada"),
                ("Pharmacists", "Khabiirrada Daawada"),
                ("Lab Technicians", "Farsamaynta Shaybaadhka"),
                ("Community Health Workers", "Shaqaalaha Caafimaadka Bulshada"),
            ]},
            {"name": "Sales & Marketing", "name_so": "Iibka & Suuqgeynta", "subs": [
                ("Sales Rep", "Wakiilka Iibka"),
                ("Marketing Manager", "Maamulaha Suuqgeynta"),
                ("Brand Ambassador", "Safiirada Calaamadda"),
                ("Social Media Manager", "Maamulaha Warbaahinta Bulshada"),
            ]},
            {"name": "Admin & Office", "name_so": "Maamulka & Xafiiska", "subs": [
                ("Receptionist", "Soo Dhaweeye"),
                ("Secretary", "Xoghaye"),
                ("Office Manager", "Maamulaha Xafiiska"),
                ("HR Officer", "Saraakiisha Shaqaalaha"),
                ("Data Entry Clerk", "Gooni-u-gelinaha Xogta"),
            ]},
            {"name": "Construction & Trade", "name_so": "Dhismo & Ganacsiga", "subs": [
                ("Electrician", "Takhniishiyaha Korontada"),
                ("Plumber", "Farsamaynta Tuubooyinka"),
                ("Mason", "Dhismaynta Dhagaxda"),
                ("Carpenter", "Shaqada Khashab"),
                ("Painter", "Rinjiyaaha"),
            ]},
            {"name": "Driver & Transport", "name_so": "Darawalka & Gaadiidka", "subs": [
                ("Car Driver", "Darawalka Baabuurka"),
                ("Truck Driver", "Darawalka Gaadiga Xamuulka"),
                ("Delivery Rider", "Rider Gaadhsiinta"),
                ("Chauffeur", "Shofeerka"),
            ]},
            {"name": "Domestic & Cleaning", "name_so": "Shaqada Guriga & Nadiifinta", "subs": [
                ("House Help", "Caawiye Guri"),
                ("Cook", "Kariye"),
                ("Gardener", "Beeraye"),
                ("Nanny", "Xannaanada Caruurta"),
                ("Security Guard", "Gaashaanle"),
            ]},
            {"name": "Other Jobs", "name_so": "Shaqooyinka Kale", "subs": [
                ("Internships", "Tababarka Shaqada"),
                ("Freelance", "Shaqo Xor ah"),
                ("Part-time", "Shaqo Wakhti Xad"),
                ("Remote Work", "Shaqo Fog"),
            ]},
        ],
    },
    {
        "name": "Beauty & Personal Care",
        "name_so": "Caafimaadka & Quruxda",
        "slug": "health-beauty",
        "icon_name": "heart",
        "subcategories": [
            {"name": "Hair Beauty", "name_so": "Quruxda Timaha", "subs": [
                ("Wigs & Extensions", "Timaha Gees-gees & Kordhinta"),
                ("Hair Products", "Alaabta Timaha"),
                ("Hair Tools", "Qalabka Timaha"),
                ("Natural Hair Care", "Daryeelka Timaha Dabiiciga ah"),
                ("Hair Colour", "Midabka Timaha"),
            ]},
            {"name": "Face Care", "name_so": "Daryeelka Wejiga", "subs": [
                ("Foundation", "Aasaaska Quruxda"),
                ("Moisturizers", "Biyaynta Maqaarka"),
                ("Sunscreen", "Difaaca Qoraxda"),
                ("Face Wash", "Maydhka Wejiga"),
                ("Toners", "Toonerrada"),
            ]},
            {"name": "Oral Care", "name_so": "Daryeelka Afka", "subs": [
                ("Toothbrush", "Burush Ilkaha"),
                ("Toothpaste", "Jeerin Ilkaha"),
                ("Mouthwash", "Maydhka Afka"),
                ("Teeth Whitening", "Caddeynta Ilkaha"),
                ("Dental Floss", "Fiilada Ilkaha"),
            ]},
            {"name": "Body Care", "name_so": "Daryeelka Jirka", "subs": [
                ("Lotions & Creams", "Suux & Kiriimada"),
                ("Soaps", "Saboonka"),
                ("Deodorants", "Dufcaanka"),
                ("Bath Products", "Alaabta Qubeyska"),
                ("Shaving", "Xiirka"),
            ]},
            {"name": "Fragrance", "name_so": "Udgoonida", "subs": [
                ("Men's Perfume", "Cadar Rag"),
                ("Women's Perfume", "Cadar Dumar"),
                ("Oud & Bakhur", "Cuud & Bakhuur"),
                ("Body Spray", "Sumbuul Jirka"),
                ("Attar", "Itr"),
            ]},
            {"name": "Makeup", "name_so": "Isqurxinta", "subs": [
                ("Lipstick", "Casuurta Bushimaha"),
                ("Eye Makeup", "Qurxinta Indha"),
                ("Concealer", "Xijaabka Cuyuubta"),
                ("Blush & Highlighter", "Casaanka & Iftiiminta"),
                ("Nail Polish", "Midabka Cidiyaha"),
            ]},
            {"name": "Tools & Accessories", "name_so": "Qalabka & Agabka", "subs": [
                ("Makeup Brushes", "Burushyada Quruxda"),
                ("Hair Dryers", "Qalabka Engejinta Timaha"),
                ("Straighteners", "Qalabka Toosinta Timaha"),
                ("Mirrors", "Muraayad"),
                ("Tweezers", "Qabashadaha Yaryar"),
            ]},
            {"name": "Vitamins & Supplements", "name_so": "Fiitamiinnada & Kaabayaasha", "subs": [
                ("Multivitamins", "Fiitamiinnada Dhammaystiran"),
                ("Protein Supplements", "Kaabayaasha Borotiinka"),
                ("Herbal Remedies", "Daawada Dhirta"),
                ("Weight Management", "Maaraynta Miisaanka"),
            ]},
            {"name": "Massagers", "name_so": "Masaajidhayaasha", "subs": [
                ("Body Massagers", "Masaajidhayaasha Jirka"),
                ("Face Massagers", "Masaajidhayaasha Wejiga"),
                ("Electric Massagers", "Masaajidhayaasha Korontada"),
                ("Massage Oils", "Saliidda Masaajka"),
            ]},
            {"name": "Beauty Treatments", "name_so": "Daawaynta Quruxda", "subs": [
                ("Facials", "Daawaynta Wejiga"),
                ("Skin Whitening", "Caddeynta Maqaarka"),
                ("Waxing & Threading", "Saaridda Timaha"),
                ("Eyelash Extensions", "Kordhinta Baarista Indha"),
                ("Henna", "Xenna"),
            ]},
        ],
    },
    {
        "name": "Babies & Kids",
        "name_so": "Carruurta & Ilmaha",
        "slug": "babies-kids",
        "icon_name": "baby",
        "subcategories": [
            {"name": "Toys & Games", "name_so": "Ciyaaraha & Qalabka Carruurta", "subs": [
                ("Educational Toys", "Ciyaaraha Waxbarashada"),
                ("Dolls", "Ciyaaraha Gabdhaha"),
                ("Remote Control Toys", "Ciyaaraha Kontaroolka"),
                ("Board Games", "Ciyaaraha Miiska"),
                ("Outdoor Toys", "Ciyaaraha Dibadda"),
            ]},
            {"name": "Kids Clothing", "name_so": "Dharka Carruurta", "subs": [
                ("Baby Clothes", "Dharka Ilmaha"),
                ("Boys Wear", "Dharka Wiilasha"),
                ("Girls Wear", "Dharka Gabdhaha"),
                ("School Uniforms", "Uniifoornka Dugsiga"),
                ("Kids Shoes", "Kabaha Carruurta"),
            ]},
            {"name": "Baby Gear", "name_so": "Qalabka Ilmaha", "subs": [
                ("Prams & Strollers", "Gaadiga Ilmaha"),
                ("Baby Carriers", "Qaadista Ilmaha"),
                ("Car Seats", "Kursiga Baabuurka"),
                ("Baby Monitors", "Kormeeraha Ilmaha"),
                ("Cots & Beds", "Sariirta Ilmaha"),
            ]},
            {"name": "Baby Food", "name_so": "Cuntada Ilmaha", "subs": [
                ("Formula Milk", "Caano Budo"),
                ("Baby Cereals", "Xaboobo Ilmaha"),
                ("Baby Snacks", "Cuntooyinka Ilmaha"),
                ("Breast Pumps", "Qaadista Caanaha"),
                ("Feeding Bottles", "Dhalooyinka Caanaha"),
            ]},
            {"name": "Kids Education", "name_so": "Waxbarashada Carruurta", "subs": [
                ("Books", "Buugaagta"),
                ("School Supplies", "Agabka Dugsiga"),
                ("Learning Games", "Ciyaaraha Waxbarashada"),
                ("Art & Craft", "Farshaxanka & Gacmaha"),
            ]},
        ],
    },
    {
        "name": "Leisure & Sports",
        "name_so": "Ciyaaraha & Xiisaha",
        "slug": "leisure-sports",
        "icon_name": "activity",
        "subcategories": [
            {"name": "Sports Equipment", "name_so": "Qalabka Ciyaaraha", "subs": [
                ("Football", "Kubbadda Cagta"),
                ("Basketball", "Kubbadda Kubada"),
                ("Volleyball", "Foolbaal"),
                ("Running Gear", "Qalabka Orodka"),
                ("Gym Equipment", "Qalabka Jimicsiga"),
                ("Swimming", "Dabaasha"),
            ]},
            {"name": "Musical Instruments", "name_so": "Qalabka Muusigga", "subs": [
                ("Guitars", "Geetarrada"),
                ("Keyboards", "Kiboodhyada"),
                ("Drums", "Duudka"),
                ("Traditional Instruments", "Qalabka Muusigga Dhaqanka"),
                ("DJ Equipment", "Qalabka DJ-ga"),
            ]},
            {"name": "Books & Magazines", "name_so": "Buugaagta & Joornaalada", "subs": [
                ("Islamic Books", "Buugaagta Islaamiga"),
                ("Textbooks", "Buugaagta Waxbarashada"),
                ("Novels", "Sheekooyin"),
                ("Children's Books", "Buugaagta Carruurta"),
                ("Magazines", "Joornaalada"),
            ]},
            {"name": "Art & Collectibles", "name_so": "Fanka & Ururinada", "subs": [
                ("Paintings", "Sawirrada"),
                ("Sculptures", "Muruqyada"),
                ("Antiques", "Qadiimka"),
                ("Handcrafts", "Gacmaha Shaqada"),
                ("Photography", "Sawir Qaadis"),
            ]},
            {"name": "Hobbies", "name_so": "Xiisaha", "subs": [
                ("Gardening", "Beernaanshaha"),
                ("Fishing", "Kalluun Dhacsiga"),
                ("Collecting", "Ururinada"),
                ("Travel Accessories", "Qalabka Socdaalka"),
                ("Puzzle & Strategy", "Qaabka & Istiraatiijiyadda"),
            ]},
        ],
    },
    {
        "name": "Commercial Equipment",
        "name_so": "Qalabka Ganacsiga",
        "slug": "commercial-equipment",
        "icon_name": "tool",
        "subcategories": [
            {"name": "Office Equipment", "name_so": "Qalabka Xafiiska", "subs": [
                ("Photocopiers", "Koobi-qaadayaasha"),
                ("Projectors", "Proyektarrada"),
                ("Office Chairs", "Kursiyadda Xafiiska"),
                ("Filing Cabinets", "Kaabadaha Diiwaannada"),
                ("Safes", "Sanduuqyada Ammaanka"),
            ]},
            {"name": "Industrial Machinery", "name_so": "Mishiinada Warshadaha", "subs": [
                ("Generators", "Jenareetorada"),
                ("Compressors", "Kombresirada"),
                ("Welding Equipment", "Qalabka Shiidmaha Birta"),
                ("Power Tools", "Qalabka Korontada"),
                ("Forklifts", "Forkliftyada"),
            ]},
            {"name": "Agricultural Equipment", "name_so": "Qalabka Beeraha", "subs": [
                ("Tractors", "Teraktarrada"),
                ("Irrigation Pumps", "Bambiga Waraabiska"),
                ("Sprayers", "Shaashiyaha"),
                ("Hand Tools", "Qalabka Gacanta"),
                ("Threshers", "Tumayaasha"),
            ]},
            {"name": "Restaurant Equipment", "name_so": "Qalabka Makhaayadda", "subs": [
                ("Commercial Fridges", "Qaboojiyeyaasha Ganacsiga"),
                ("Gas Cookers", "Kuleyliyaha Gaaska"),
                ("Ovens", "Fuurnahyada"),
                ("Food Processors", "Mishiimaha Cuntada"),
                ("Display Fridges", "Qaboojiyeyaasha Muuqaalka"),
            ]},
            {"name": "Other Commercial", "name_so": "Ganacsiga Kale", "subs": [
                ("POS Systems", "Nidaamyada Lacag-bixinta"),
                ("Barcode Scanners", "Iskankada Barkoodka"),
                ("Cash Registers", "Reejistarka Lacagta"),
                ("Display Shelves", "Rafoofka Muuqaalka"),
            ]},
        ],
    },
    {
        "name": "Repair & Construction",
        "name_so": "Dayactirka & Dhismaha",
        "slug": "repair-construction",
        "icon_name": "hammer",
        "subcategories": [
            {"name": "Building Materials", "name_so": "Agabka Dhismaha", "subs": [
                ("Cement", "Siminto"),
                ("Steel Rods", "Biraha Dhismaha"),
                ("Bricks & Blocks", "Dhagaxaha & Koobabka"),
                ("Roofing Sheets", "Xaashi Saqafka"),
                ("Sand & Gravel", "Ciid & Dhoobo"),
                ("Paint", "Rinji"),
            ]},
            {"name": "Electrical Supplies", "name_so": "Alaabta Korontada", "subs": [
                ("Cables & Wires", "Wayrarka & Kaablooyinka"),
                ("Switches & Sockets", "Switshaska & Sokeyada"),
                ("Circuit Breakers", "Jeebiyeyaasha Korontada"),
                ("LED Lights", "Nalka LED"),
                ("Inverters", "Invertarrada"),
            ]},
            {"name": "Plumbing", "name_so": "Tuubooyinka", "subs": [
                ("Pipes & Fittings", "Tuubooyinka & Qalabkooda"),
                ("Water Tanks", "Tangiyadda Biyaha"),
                ("Taps & Valves", "Maroojiyaha & Fiilashada"),
                ("Pumps", "Bambiyadda"),
                ("Geysers", "Kuleyliyaha Biyaha"),
            ]},
            {"name": "Hand & Power Tools", "name_so": "Qalabka Gacanta & Korontada", "subs": [
                ("Drills", "Qaladyada Godista"),
                ("Grinders", "Xoolyeyaasha"),
                ("Hammers", "Durbaan"),
                ("Saws", "Meeska Gooynta"),
                ("Screwdrivers", "Scruudrayfarrada"),
                ("Measuring Tools", "Qalabka Cabbirka"),
            ]},
            {"name": "Doors, Windows & Steel", "name_so": "Albaabada, Daaqadaha & Birta", "subs": [
                ("Steel Doors", "Albaabada Birta"),
                ("Wooden Doors", "Albaabada Khashab"),
                ("Windows", "Daaqadaha"),
                ("Gates & Fencing", "Albaabada Weyn & Xariga"),
                ("Locks & Keys", "Diigsiga & Furaha"),
            ]},
            {"name": "Solar Energy", "name_so": "Tamarta Qoraxda", "subs": [
                ("Solar Panels", "Boorasha Qoraxda"),
                ("Solar Batteries", "Baatariyada Qoraxda"),
                ("Solar Inverters", "Invertarrada Qoraxda"),
                ("Solar Water Heaters", "Kuleyliyaha Biyaha Qoraxda"),
                ("Solar Lights", "Nalka Qoraxda"),
            ]},
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
                    select(Category).where(Category.name_en == cat_data["name"])
                ).first()

            if not existing:
                cat = Category(
                    name_en=cat_data["name"],
                    name_so=cat_data.get("name_so"),
                    slug=cat_data["slug"],
                    icon_name=cat_data["icon_name"],
                )
                session.add(cat)
                session.flush()
                cat_id = cat.id
                print(f"Created category: {cat_data['name']}")
            else:
                existing.name_en = cat_data["name"]
                existing.name_so = cat_data.get("name_so")
                existing.slug = cat_data["slug"]
                existing.icon_name = cat_data["icon_name"]
                session.add(existing)
                session.flush()
                cat_id = existing.id
                print(f"Updated category: {cat_data['name']}")

            # Upsert subcategories + sub-sub-categories (never delete — listings may reference them)
            for sub_data in cat_data["subcategories"]:
                sub_slug = make_slug(sub_data["name"])
                existing_sub = session.exec(
                    select(SubCategory).where(
                        SubCategory.category_id == cat_id,
                        SubCategory.slug == sub_slug,
                    )
                ).first()
                if not existing_sub:
                    existing_sub = session.exec(
                        select(SubCategory).where(
                            SubCategory.category_id == cat_id,
                            SubCategory.name_en == sub_data["name"],
                        )
                    ).first()

                if existing_sub:
                    existing_sub.name_en = sub_data["name"]
                    existing_sub.name_so = sub_data.get("name_so")
                    existing_sub.slug = sub_slug
                    session.add(existing_sub)
                    session.flush()
                    sub_id = existing_sub.id
                    print(f"  ~ {sub_data['name']}")
                else:
                    new_sub = SubCategory(
                        name_en=sub_data["name"],
                        name_so=sub_data.get("name_so"),
                        slug=sub_slug,
                        category_id=cat_id,
                    )
                    session.add(new_sub)
                    session.flush()
                    sub_id = new_sub.id
                    print(f"  + {sub_data['name']}")

                for ssub in sub_data.get("subs", []):
                    ssub_name, ssub_name_so = ssub if isinstance(ssub, tuple) else (ssub, None)
                    ssub_slug = make_slug(ssub_name)
                    existing_ssub = session.exec(
                        select(SubSubCategory).where(
                            SubSubCategory.subcategory_id == sub_id,
                            SubSubCategory.slug == ssub_slug,
                        )
                    ).first()
                    if existing_ssub:
                        existing_ssub.name_en = ssub_name
                        existing_ssub.name_so = ssub_name_so
                        session.add(existing_ssub)
                        print(f"    ~ {ssub_name}")
                    else:
                        session.add(SubSubCategory(
                            name_en=ssub_name,
                            name_so=ssub_name_so,
                            slug=ssub_slug,
                            subcategory_id=sub_id,
                        ))
                        print(f"    + {ssub_name}")

        session.commit()
    print("\nAll categories, subcategories and sub-subcategories seeded successfully.")


if __name__ == "__main__":
    seed_categories()
