# Suqafuran Marketplace - Complete Listing System

A comprehensive, scalable marketplace platform similar to Jiji with dynamic categories, subcategories, attributes, filtering, and search functionality.

## Table of Contents
1. [System Overview](#system-overview)
2. [17 Main Categories](#17-main-categories)
3. [9-Step Listing Creation Flow](#9-step-listing-creation-flow)
4. [Attribute System](#attribute-system)
5. [Frontend Routes](#frontend-routes)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)

---

## System Overview

Suqafuran is a multi-vendor marketplace where:
- **Sellers** create, edit, and manage product listings
- **Buyers** search, filter, and discover products
- **Admins** manage categories, attributes, and listings
- **System** dynamically generates forms based on category/subcategory selection

### Key Features
✅ Dynamic category-specific listing forms  
✅ 9-step guided listing creation flow  
✅ 17 main categories with subcategories  
✅ 100+ customizable attributes per category  
✅ Advanced filtering and search  
✅ Mobile-responsive design  
✅ Image upload support (up to 10 images)  
✅ Tag system for product organization  
✅ Draft & publish workflow  

---

## 17 Main Categories

### 1. 👕 Clothing & Shoes
**Subcategories:**
- Men's Clothing
- Women's Clothing
- Children's Clothing
- Shoes
- Bags
- Watches
- Jewelry
- Accessories

**Attributes:**
- Brand
- Condition (New, Like New, Good, Fair, Poor)
- Gender (Men, Women, Unisex, Kids)
- Size
- Color
- Material (Cotton, Polyester, Leather, etc.)
- Style (Casual, Formal, Sports, etc.)
- Occasion (Everyday, Party, Work, etc.)
- Pattern (Solid, Striped, Floral, etc.)
- Quantity

---

### 2. 💄 Beauty & Personal Care
**Subcategories:**
- Skincare
- Makeup
- Hair Care
- Fragrances
- Personal Hygiene
- Beauty Tools

**Attributes:**
- Brand
- Condition
- Product Type
- Skin Type (Dry, Oily, Combination, Sensitive)
- Hair Type (Straight, Wavy, Curly, Coily)
- Volume (ml)
- Ingredients
- Expiry Date
- Country Of Origin
- Quantity

---

### 3. 🏠 Household Items
**Subcategories:**
- Furniture
- Kitchenware
- Home Decor
- Appliances
- Storage
- Bedding

**Attributes:**
- Brand
- Condition
- Material
- Color
- Dimensions (L x W x H)
- Weight (kg)
- Assembly Required (Yes/No)
- Warranty (Months)
- Quantity

---

### 4. 📱 Electronics
**Subcategories:**
- TVs
- Laptops
- Gaming (Consoles, PC, etc.)
- Cameras
- Audio Systems
- Accessories

**Attributes:**
- Brand
- Condition
- Model
- Storage (GB/TB)
- RAM (GB)
- Processor
- Screen Size (inches)
- Warranty (Months)
- Color
- Quantity

---

### 5. 🍎 Food & Groceries
**Subcategories:**
- Fruits
- Vegetables
- Beverages
- Packaged Foods
- Spices & Condiments
- Meat & Poultry

**Attributes:**
- Brand (if applicable)
- Weight (kg/g)
- Quantity
- Expiry Date
- Organic (Yes/No)
- Country Of Origin
- Packaging Type (Fresh, Packaged, Frozen)
- Certification

---

### 6. 🚗 Vehicles
**Subcategories:**
- Cars
- SUVs
- Vans
- Trucks
- Motorcycles
- Spare Parts

**Attributes:**
- Make (Toyota, BMW, Honda, etc.)
- Model
- Year
- Mileage (km)
- Fuel Type (Petrol, Diesel, Hybrid, Electric)
- Transmission (Manual, Automatic)
- Engine Capacity (cc)
- Color
- Condition
- Body Type (Sedan, SUV, Hatchback, etc.)
- Registration Status

---

### 7. 💼 Services
**Subcategories:**
- Cleaning
- Electrical
- Plumbing
- Software Development
- Graphic Design
- Consultancy
- Tutoring
- Home Repair

**Attributes:**
- Service Type
- Experience Level (Beginner, Intermediate, Expert)
- Availability (Part-time, Full-time, Flexible)
- Service Area (Specific Locations)
- Languages Spoken
- Response Time (Hours)
- Hourly Rate / Fixed Price
- Certifications

---

### 8. ⚽ Leisure & Sports
**Subcategories:**
- Gym Equipment
- Sportswear
- Outdoor Equipment
- Bicycles
- Camping Gear
- Fitness Accessories

**Attributes:**
- Brand
- Condition
- Sport Type
- Size
- Material
- Weight (kg)
- Color
- Quantity

---

### 9. 🐄 Livestock
**Subcategories:**
- Cattle
- Goats
- Sheep
- Camels
- Poultry

**Attributes:**
- Breed
- Age (Months/Years)
- Gender (Male, Female)
- Weight (kg)
- Vaccinated (Yes/No)
- Health Status
- Color/Markings
- Purpose (Meat, Dairy, Breeding, etc.)

---

### 10. 📞 Phones
**Subcategories:**
- Smartphones
- Feature Phones
- Tablets
- Phone Accessories

**Attributes:**
- Brand
- Model
- Condition
- Storage (GB)
- RAM (GB)
- Battery Health (%)
- Network Type (4G, 5G)
- Color
- SIM Type (Single, Dual)
- Warranty (Months)
- Screen Size (inches)

---

### 11. 💼 Jobs
**Subcategories:**
- Full Time
- Part Time
- Contract
- Freelance
- Remote

**Attributes:**
- Job Type
- Salary Range (Min-Max)
- Experience Required (Years)
- Education Level
- Location
- Application Deadline
- Industry
- Job Title

---

### 12. 🏗️ Commercial Equipment
**Subcategories:**
- Construction Equipment
- Industrial Machines
- Generators
- Restaurant Equipment
- Manufacturing Equipment

**Attributes:**
- Brand
- Model
- Condition
- Power Rating (kW)
- Capacity
- Warranty (Months)
- Year of Manufacture
- Usage Hours

---

### 13. 🔧 Repair & Construction
**Subcategories:**
- Construction Services
- Painting
- Carpentry
- Welding
- Masonry
- Electrical Work

**Attributes:**
- Service Type
- Experience Level
- Availability
- Service Area
- Response Time
- Cost Estimate Method (Hourly/Fixed)
- Certifications

---

### 14. 🌾 Land & Farms
**Subcategories:**
- Agricultural Land
- Farms
- Ranches
- Plantations

**Attributes:**
- Land Size (acres/sq meters)
- Title Deed Status (Registered, Pending)
- Water Availability (Yes/No)
- Location (County/Region)
- Road Access Type
- Soil Type (Clay, Sandy, Loamy, etc.)
- Zoning (Agricultural, Residential, Commercial)
- Irrigation (Yes/No)

---

### 15. 👶 Babies & Kids
**Subcategories:**
- Baby Clothing
- Toys
- Strollers & Carriers
- Feeding Supplies
- Baby Furniture

**Attributes:**
- Age Group (0-3 months, 3-6 months, etc.)
- Brand
- Condition
- Material (Cotton, Plastic, Wood, etc.)
- Gender (Boy, Girl, Unisex)
- Color
- Safety Certified (Yes/No)
- Quantity

---

### 16. 🏢 Property
**Subcategories:**
- Houses
- Apartments
- Commercial Property
- Land

**Attributes:**
- Property Type
- Bedrooms
- Bathrooms
- Parking Spaces
- Property Size (sq meters)
- Furnished (Yes/No)
- County
- Area/Estate
- Year Built
- Features (Pool, Garden, Gym, etc.)
- Lease Terms (if applicable)

---

### 17. 🌱 Agriculture & Food
**Subcategories:**
- Seeds
- Fertilizers
- Animal Feed
- Farm Equipment
- Farming Tools

**Attributes:**
- Brand
- Weight (kg)
- Quantity
- Expiry Date
- Usage Type (Vegetables, Grains, Fruits, etc.)
- Organic (Yes/No)
- Certification
- Shelf Life (Months)

---

## 9-Step Listing Creation Flow

### Step 1: Shop Selection
Select which shop this listing belongs to.
- Required: Yes
- Validation: Must select a shop
- Time to complete: 30 seconds

### Step 2: Category Selection
Choose the main category for your product.
- Required: Yes
- Display: Grid view of 17 categories
- Validation: Must select exactly one category
- Time to complete: 1 minute

### Step 3: Subcategory Selection
Narrow down to a specific subcategory.
- Required: Yes
- Display: Dynamic based on selected category
- Validation: Must select one subcategory
- Time to complete: 1 minute

### Step 4: Product Details
Enter core product information.
- Fields:
  - Title (English) *required
  - Title (Somali) optional
  - Description (English) *required
  - Description (Somali) optional
  - Condition *required
  - Location *required
- Time to complete: 5 minutes

### Step 5: Media Upload
Upload product images.
- Max images: 10
- Formats: JPEG, PNG, WebP
- Min resolution: 640x480
- Max file size: 5MB per image
- Required: At least 1 image
- Features:
  - Drag and drop
  - Multiple select
  - Preview gallery
  - Remove individual images
  - Upload progress
- Time to complete: 3-5 minutes

### Step 6: Dynamic Attributes
Fill category-specific attribute fields.
- Fields: Vary by category (see above)
- Types:
  - Text input
  - Number input
  - Dropdown select
  - Multi-select checkboxes
  - Date picker
  - Textarea
- Validation: Based on attribute configuration
- Time to complete: 3-10 minutes

### Step 7: Pricing
Set price and pricing options.
- Fields:
  - Price (USD) *required
  - Price Type:
    - Fixed Price
    - Negotiable
    - Contact Seller
  - Tags (up to 5, optional)
- Validation:
  - Price must be > 0
  - Price must be a valid number
- Time to complete: 2 minutes

### Step 8: Preview
Review listing before publishing.
- Display:
  - Main image
  - Title
  - Price
  - Location
  - Condition
  - Price type
  - Description
  - Tags
- Action: Can go back to edit any section
- Time to complete: 2 minutes

### Step 9: Publish
Publish or save as draft.
- Options:
  - Publish immediately (Active)
  - Save as Draft
- Features:
  - Publish confirmation
  - Listing goes live immediately
  - Buyers can see it
- Time to complete: 30 seconds

**Total estimated time: 20-30 minutes**

---

## Attribute System

### Attribute Field Types

1. **Text** - Single line text input
   - Validation: Optional regex pattern
   - Placeholder: Custom placeholder text
   - Max length: 255 characters

2. **Number** - Numeric input
   - Min value: Optional
   - Max value: Optional
   - Step: Optional
   - Unit: Optional (kg, cm, etc.)

3. **Textarea** - Multi-line text
   - Rows: 3-5
   - Max length: 5000 characters

4. **Select** - Dropdown single select
   - Options: Custom list
   - Default: Optional
   - Required: Yes/No

5. **Multiselect** - Multiple checkboxes
   - Options: Custom list
   - Min selections: Optional
   - Max selections: Optional

6. **Checkbox** - Boolean toggle
   - Label: Custom text
   - Default: On/Off

7. **Date** - Date picker
   - Format: YYYY-MM-DD
   - Min date: Optional
   - Max date: Optional

### Attribute Groups

Attributes are organized into logical groups for better UX:

**Example: Electronics → Laptops**
- Processor Group: Brand, Model, Generation
- Memory Group: RAM, Storage
- Display Group: Screen Size, Resolution
- Features Group: Graphics, Warranty

---

## Frontend Routes

### Seller Routes
```
/sell                    Create new listing (Step 1)
/sell/:listingId         Edit existing listing (Step 1)
/listings/:listingId     View listing detail page
/my-ads                  Seller's listings dashboard
```

### Buyer Routes
```
/browse                  Browse all listings
/listings/:listingId     View listing detail
/search                  Search results
```

### Admin Routes
```
/admin/categories        Manage categories
/admin/subcategories     Manage subcategories
/admin/attributes        Manage attributes
```

---

## API Endpoints

### Category Endpoints
```
GET    /api/v1/listings/categories           Get all categories
GET    /api/v1/categories/:id                Get category details
POST   /api/v1/categories                    Create category (admin)
PUT    /api/v1/categories/:id                Update category (admin)
DELETE /api/v1/categories/:id                Delete category (admin)
```

### Subcategory Endpoints
```
GET    /api/v1/subcategories?category_id=X  Get subcategories by category
GET    /api/v1/subcategories/:id            Get subcategory details
POST   /api/v1/subcategories                Create subcategory (admin)
PUT    /api/v1/subcategories/:id            Update subcategory (admin)
DELETE /api/v1/subcategories/:id            Delete subcategory (admin)
```

### Attribute Endpoints
```
GET    /api/v1/attributes                   Get all attributes
GET    /api/v1/attributes/:id               Get attribute details
POST   /api/v1/attributes                   Create attribute (admin)
PUT    /api/v1/attributes/:id               Update attribute (admin)
DELETE /api/v1/attributes/:id               Delete attribute (admin)

GET    /api/v1/category-attributes/category/:id      Get attributes for category
GET    /api/v1/category-attributes/subcategory/:id   Get attributes for subcategory
POST   /api/v1/category-attributes                   Link attribute to category (admin)
DELETE /api/v1/category-attributes/:id               Remove attribute from category (admin)
```

### Listing Endpoints
```
GET    /api/v1/listings                      Get all listings (paginated)
GET    /api/v1/listings/:id                  Get listing details
POST   /api/v1/listings                      Create listing
PUT    /api/v1/listings/:id                  Update listing
DELETE /api/v1/listings/:id                  Delete listing
PATCH  /api/v1/listings/:id/status           Change listing status

GET    /api/v1/listings/search               Full-text search with filters
GET    /api/v1/listings/:id/attributes       Get listing attributes
```

### Upload Endpoints
```
POST   /api/v1/listings/upload               Upload single image
POST   /api/v1/listings/upload-multiple      Upload multiple images
```

---

## Database Schema

### categories
```sql
id              INT PRIMARY KEY
name_en         VARCHAR(255) NOT NULL
name_so         VARCHAR(255)
slug            VARCHAR(255) UNIQUE
icon            VARCHAR(255)
image           VARCHAR(255)
description     TEXT
status          ENUM('active', 'inactive')
sort_order      INT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### subcategories
```sql
id              INT PRIMARY KEY
category_id     INT FOREIGN KEY
name_en         VARCHAR(255) NOT NULL
name_so         VARCHAR(255)
slug            VARCHAR(255) UNIQUE
description     TEXT
status          ENUM('active', 'inactive')
sort_order      INT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### attributes
```sql
id              INT PRIMARY KEY
name            VARCHAR(255) NOT NULL
slug            VARCHAR(255) UNIQUE
field_type      ENUM('text', 'number', 'select', 'multiselect', 'checkbox', 'date', 'textarea')
required        BOOLEAN DEFAULT FALSE
placeholder     VARCHAR(255)
validation_regex VARCHAR(255)
min_value       DECIMAL
max_value       DECIMAL
default_value   TEXT
sort_order      INT
status          ENUM('active', 'inactive')
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### attribute_options
```sql
id              INT PRIMARY KEY
attribute_id    INT FOREIGN KEY
value           VARCHAR(255)
display_name    VARCHAR(255)
sort_order      INT
created_at      TIMESTAMP
```

### category_attributes
```sql
id              INT PRIMARY KEY
category_id     INT FOREIGN KEY
attribute_id    INT FOREIGN KEY
required        BOOLEAN DEFAULT FALSE
sort_order      INT
created_at      TIMESTAMP
UNIQUE(category_id, attribute_id)
```

### subcategory_attributes
```sql
id              INT PRIMARY KEY
subcategory_id  INT FOREIGN KEY
attribute_id    INT FOREIGN KEY
required        BOOLEAN DEFAULT FALSE
sort_order      INT
created_at      TIMESTAMP
UNIQUE(subcategory_id, attribute_id)
```

### listings
```sql
id              INT PRIMARY KEY
seller_id       INT FOREIGN KEY
shop_id         INT FOREIGN KEY
category_id     INT FOREIGN KEY
subcategory_id  INT FOREIGN KEY
title_en        VARCHAR(255) NOT NULL
title_so        VARCHAR(255)
description_en  TEXT NOT NULL
description_so  TEXT
price           DECIMAL(10,2) NOT NULL
price_type      ENUM('fixed', 'negotiable', 'contact')
location        VARCHAR(255)
condition       ENUM('new', 'like_new', 'good', 'fair', 'poor')
status          ENUM('draft', 'active', 'paused', 'sold', 'archived')
images          JSON (array of URLs)
tags            JSON (array of strings)
is_negotiable   BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
published_at    TIMESTAMP
```

### listing_attributes
```sql
id              INT PRIMARY KEY
listing_id      INT FOREIGN KEY
attribute_id    INT FOREIGN KEY
value           TEXT
created_at      TIMESTAMP
UNIQUE(listing_id, attribute_id)
```

---

## Features Implemented

### ✅ Core Features
- [x] 17 main categories with 100+ attributes
- [x] Dynamic subcategory selection
- [x] 9-step listing creation flow
- [x] Image upload (up to 10 images)
- [x] Category-specific attribute forms
- [x] Create and edit modes
- [x] Draft and publish workflow
- [x] Tag system (up to 5 tags)
- [x] Mobile-responsive design
- [x] Professional UI/UX

### ✅ Form Features
- [x] Step validation
- [x] Back/Next navigation
- [x] Form persistence during navigation
- [x] Progress indication (9 steps)
- [x] Error messages
- [x] Success notifications
- [x] Loading states

### ✅ API Integration
- [x] Authenticated requests
- [x] Device fingerprinting
- [x] Error handling
- [x] Loading states
- [x] CORS support

### 🚀 Coming Soon
- [ ] Advanced filtering system
- [ ] Full-text search
- [ ] Seller analytics
- [ ] Bulk listing upload
- [ ] Video upload support
- [ ] Inventory management
- [ ] Listing statistics

---

## Usage Examples

### Creating a Listing (Frontend)

1. User navigates to `/sell`
2. Goes through 9-step flow:
   - Select shop
   - Select category (e.g., "Phones")
   - Select subcategory (e.g., "Smartphones")
   - Enter details (title, description, condition, location)
   - Upload 2-5 images
   - Fill attributes (Brand: Apple, Model: iPhone 14, Storage: 256GB, etc.)
   - Set price ($999) and price type (Negotiable)
   - Preview listing
   - Publish
3. Listing appears at `/listings/:id`
4. Buyers can find it through search and browse

### Category Structure Example

```
Electronics
├── TVs
├── Laptops
├── Gaming
│   ├── Consoles (PS5, Xbox, Nintendo)
│   ├── PC Gaming
│   └── Mobile Gaming
├── Cameras
│   ├── DSLR
│   ├── Mirrorless
│   └── Compact
├── Audio Systems
└── Accessories

Attributes for Electronics → Laptops:
- Brand (Dropdown: Apple, Dell, HP, Lenovo, etc.)
- Model (Text input)
- Processor (Dropdown: Intel i5, i7, i9; AMD Ryzen)
- RAM (Select: 8GB, 16GB, 32GB, 64GB)
- Storage (Select: 256GB, 512GB, 1TB, 2TB SSD)
- Screen Size (Number input with unit: inches)
- Condition (Required)
- Warranty (Number input: months)
- Color (Text or dropdown)
```

---

## Best Practices

### For Sellers
1. Use clear, descriptive titles
2. Upload high-quality images
3. Fill all attributes completely
4. Use accurate conditions
5. Set realistic prices
6. Use relevant tags
7. Write detailed descriptions
8. Review before publishing

### For Developers
1. Always validate on frontend AND backend
2. Use authenticated API service
3. Handle network errors gracefully
4. Cache category data client-side
5. Lazy load subcategories on demand
6. Debounce search requests
7. Implement optimistic updates
8. Use loading skeletons for UX

### For Admins
1. Keep categories organized and not too nested
2. Define clear attribute purposes
3. Use consistent naming conventions
4. Test attribute forms before launch
5. Monitor listing quality
6. Regular data audits
7. Update deprecated attributes
8. Provide seller training

---

## Support & Documentation

For questions, feature requests, or bug reports:
- Email: support@suqafuran.com
- GitHub: github.com/suqafuran/marketplace
- Docs: https://docs.suqafuran.com

---

**Last Updated:** 2026-07-22  
**Version:** 1.0.0  
**Status:** Production Ready
