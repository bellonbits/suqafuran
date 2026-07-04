# Category to Banner Image Mapping

## Available Banner Images
Location: `/new-frontend/public/categories/`

| Image File | Use Case | File Size |
|---|---|---|
| `baby.png` | Babies & Kids products | 2.3M |
| `car.png` | Vehicles & Transportation | 6.2M |
| `electronics.png` | Electronics & Tech devices | 7.7M |
| `grocery.jpg` | Food & Groceries | 743K |
| `house.png` | Home & Household items | 1.6M |
| `livestock.png` | Livestock, Pets, Animals, Agriculture | 2.9M |
| `phones.png` | Mobile Phones & Tablets | 4.2M |
| `services.png` | Services, Construction, Jobs | 1.8M |
| `shoes.png` | Clothing, Fashion, Shoes | 3.7M |
| `skincare.jpg` | Beauty & Personal Care | 736K |
| `sport.jpg` | Sports & Leisure activities | 484K |

---

## Exact Category Mapping

### 📱 ELECTRONICS (Main ID: 4) → `electronics.png`
- Audio & Headphones
- Computers
- TVs
- Cameras
- Networking
- Gaming
- Other Electronics

### 📞 MOBILE PHONES (Main ID: 16) → `phones.png`
- Tablets
- Phone Accessories
- Smart Watches

### 👕 CLOTHING & SHOES (Main ID: 2) → `shoes.png`
- Men's Clothing
- Women's Clothing
- Children's Clothing
- Shoes
- Clothing Accessories
- Watches & Sunglasses

### 🍎 FOOD & GROCERIES (Main ID: 1) → `grocery.jpg`
- Eggs
- Spices & Condiments
- Bakery
- Snacks
- Vegetables
- Fruits
- Rice & Pasta
- Meat
- Seafood
- Milk & Dairy
- Prepared Foods
- Beverages

### 🏠 HOUSEHOLD ITEMS (Main ID: 3) → `house.png`
- Kitchenware
- Bedding
- Home Decor
- Cleaning Supplies
- Appliances
- Furniture
- Garden Supplies

### 🏘️ PROPERTY (Main ID: 8) → `house.png`
- Houses for Rent
- Houses for Sale
- Offices & Commercial
- New Builds
- Short Stay

### 💄 BEAUTY & PERSONAL CARE (Main ID: 11) → `skincare.png`
- Hair Beauty
- Face Care
- Oral Care
- Body Care
- Fragrance
- Makeup
- Tools & Accessories
- Vitamins & Supplements
- Massagers
- Beauty Treatments

### ⚽ LEISURE & SPORTS (Main ID: 13) → `sport.jpg`
- Football Shoes
- Training Bags
- Football Nets
- Football Tracksuit
- Match Shorts
- Football Ball
- Sports Equipment
- Musical Instruments
- Books & Magazines
- Art & Collectibles
- Hobbies

### 🚗 VEHICLES (Main ID: 5) → `car.png`
- Trucks
- Cars
- Motorcycles
- Tuk-tuks
- Trucks & Buses
- Vehicle Parts & Accessories
- Car Services

### 🐄 LIVESTOCK (Main ID: 6) → `livestock.png`
- Wildlife
- Sea Food
- Goats
- Sheep
- Cattle
- Poultry
- Camels
- Pets

### 👶 BABIES & KIDS (Main ID: 12) → `baby.png`
- Toys & Games
- Kids Clothing
- Baby Gear
- Baby Food
- Kids Education

### 🔧 SERVICES (Main ID: 9) → `services.png`
- Building & Construction
- Computer & IT
- Cleaning Services
- Repair Services
- Printing Services
- Legal & Financial
- Travel & Tourism
- Education & Training
- Beauty & Wellness
- Photography & Video
- Healthcare
- Other Services

### 🔨 REPAIR & CONSTRUCTION (Main ID: 15) → `services.png`
- Building Materials
- Electrical Supplies
- Hand & Power Tools
- Doors, Windows & Steel
- Solar Energy
- Plumbing

### 💼 JOBS (Main ID: 10) → `services.png`
- Tech & IT
- Education
- Medical & Health Jobs
- Sales & Marketing
- Admin & Office
- Construction & Trade
- Driver & Transport
- Domestic & Cleaning
- Other Jobs

### 🌾 LAND & FARMS (Main ID: 7) → `livestock.png`
- Vacant Land
- Farms
- Agricultural Land
- Market Gardens

### 🌾 AGRICULTURE & FOOD (Main ID: 17) → `livestock.png`
- Grains
- Livestock

### 🏭 COMMERCIAL EQUIPMENT (Main ID: 14) → `services.png`
- Office Equipment
- Industrial Machinery
- Agricultural Equipment
- Restaurant Equipment
- Other Commercial

---

## How It Works

1. **Shops Page** loads listings from API
2. **For each listing**, extracts `subcategory_id`
3. **Subcategory name** is looked up from categories API
4. **StoreCard component** uses subcategory name to find matching banner image
5. **Fallback chain**: Subcategory → Main Category → Default (grocery.jpg)

## Example Flow

```
Listing: "iPhone 14"
  → category_id: 16 (Phones)
  → subcategory_id: 23 (Mobile Phones)
  → Subcategory name: "Mobile Phones"
  → Banner lookup: CATEGORY_BANNER_MAP["mobile phones"]
  → Result: /categories/phones.png ✅
```

---

**Last Updated**: 2026-07-04
**Total Categories**: 17 main categories, 100+ subcategories
**Banner Coverage**: 11 images covering all categories
