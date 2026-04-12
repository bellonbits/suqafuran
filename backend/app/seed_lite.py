import sqlite3
import json
import os

# Jiji style components
basic_condition = {"name": "condition", "label": "Condition", "type": "select", "options": ["Brand New", "Used", "Refurbished"], "required": True}
size_field = {"name": "size", "label": "Size", "type": "text", "required": False}
color_field = {"name": "color", "label": "Color", "type": "text", "required": False}
brand_field = {"name": "brand", "label": "Brand", "type": "text", "required": False}
qty_field = {"name": "quantity", "label": "Quantity available", "type": "number", "required": False}

food_fields = [
    brand_field,
    {"name": "type", "label": "Type*", "type": "text", "required": True},
    {"name": "specialty", "label": "Specialty", "type": "text", "required": False},
    {"name": "dietary_needs", "label": "Dietary Needs", "type": "text", "required": False}
]

SCHEMAS = {
    "cars": [
        {"name": "make", "label": "Make", "type": "text", "required": True},
        {"name": "model", "label": "Model", "type": "text", "required": True},
        {"name": "year", "label": "Year of Manufacture", "type": "number", "required": True},
        {"name": "transmission", "label": "Transmission", "type": "select", "options": ["Automatic", "Manual"], "required": True},
        {"name": "fuel", "label": "Fuel Type", "type": "select", "options": ["Petrol", "Diesel", "Hybrid", "Electric"], "required": True},
        {"name": "mileage", "label": "Mileage (km)", "type": "number", "required": False},
        {"name": "body_type", "label": "Body Type", "type": "select", "options": ["Saloon/Sedan", "SUV", "Hatchback", "Pickup", "Station Wagon"], "required": False},
    ],
    "motorcycles": [
        {"name": "make", "label": "Make", "type": "text", "required": True},
        {"name": "engine_capacity", "label": "Engine Capacity (cc)", "type": "number", "required": False},
    ],
    "tuk-tuks": [
        {"name": "make", "label": "Make", "type": "text", "required": True},
        {"name": "fuel", "label": "Fuel Type", "type": "select", "options": ["Petrol", "Diesel", "Electric"], "required": True},
    ],
    "trucks-buses": [
        {"name": "make", "label": "Make", "type": "text", "required": True},
        {"name": "payload_capacity", "label": "Payload Capacity (Tons)", "type": "number", "required": False},
    ],
    "vehicle-parts-accessories": [brand_field, basic_condition],
    "car-services": [{"name": "service_type", "label": "Service Type", "type": "text", "required": False}],

    "mobile-phones": [
        {"name": "brand", "label": "Brand", "type": "select", "options": ["Apple", "Samsung", "Nokia", "Tecno", "Infinix", "Huawei", "Xiaomi", "Other"], "required": True},
        {"name": "model", "label": "Model", "type": "text", "required": True},
        {"name": "storage", "label": "Internal Storage", "type": "select", "options": ["16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"], "required": True},
        {"name": "ram", "label": "RAM", "type": "select", "options": ["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB"], "required": False},
    ],
    "computers": [
        {"name": "brand", "label": "Brand", "type": "select", "options": ["Apple", "HP", "Dell", "Lenovo", "Asus", "Acer", "Other"], "required": True},
        {"name": "processor", "label": "Processor", "type": "select", "options": ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen", "Apple M1/M2/M3", "Other"], "required": False},
        {"name": "ram", "label": "RAM", "type": "select", "options": ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"], "required": True},
        {"name": "storage_type", "label": "Storage Type", "type": "select", "options": ["HDD", "SSD"], "required": True},
        {"name": "storage_size", "label": "Storage Size", "type": "text", "required": True},
    ],
    "tvs": [
        brand_field,
        {"name": "screen_size", "label": "Screen Size (inches)", "type": "number", "required": True},
        {"name": "resolution", "label": "Resolution", "type": "select", "options": ["HD", "FHD (1080p)", "4K UHD", "8K"], "required": False},
    ],
    "audio-headphones": [brand_field, basic_condition],
    "cameras": [brand_field, {"name": "megapixels", "label": "Megapixels", "type": "number", "required": False}],
    "networking": [brand_field, basic_condition],
    "gaming": [brand_field, {"name": "platform", "label": "Platform", "type": "select", "options": ["PlayStation", "Xbox", "Nintendo", "PC"], "required": False}],
    "other-electronics": [brand_field, basic_condition],

    "houses-for-rent": [
        {"name": "bedrooms", "label": "Bedrooms", "type": "select", "options": ["1", "2", "3", "4", "5+"], "required": True},
        {"name": "bathrooms", "label": "Bathrooms", "type": "select", "options": ["1", "2", "3", "4", "5+"], "required": True},
        {"name": "furnished", "label": "Furnished", "type": "select", "options": ["Yes", "No"], "required": True},
        {"name": "property_size", "label": "Property Size (sqm)", "type": "number", "required": False},
    ],
    "houses-for-sale": [
        {"name": "bedrooms", "label": "Bedrooms", "type": "select", "options": ["1", "2", "3", "4", "5+"], "required": True},
        {"name": "bathrooms", "label": "Bathrooms", "type": "select", "options": ["1", "2", "3", "4", "5+"], "required": True},
        {"name": "property_size", "label": "Property Size (sqm)", "type": "number", "required": False},
    ],
    "offices-commercial": [
        {"name": "property_size", "label": "Property Size (sqm)", "type": "number", "required": True},
        {"name": "parking", "label": "Parking Spaces", "type": "number", "required": False},
    ],
    "new-builds": [{"name": "completion_status", "label": "Completion Status", "type": "select", "options": ["Off-plan", "Under Construction", "Ready to Move Details"], "required": True}],
    "short-stay": [{"name": "rental_period", "label": "Rental Period", "type": "select", "options": ["Daily", "Weekly"], "required": True}, {"name": "furnished", "label": "Furnished", "type": "select", "options": ["Yes", "No"], "required": True}],

    "vegetables": food_fields,
    "fruits": food_fields,
    "rice-pasta": food_fields,
    "meat": food_fields,
    "seafood": food_fields,
    "milk-dairy": food_fields,
    "eggs": food_fields,
    "prepared-foods": food_fields,
    "spices-condiments": food_fields,
    "beverages": food_fields,

    "mens-clothing": [size_field, color_field, brand_field],
    "womens-clothing": [size_field, color_field, brand_field],
    "childrens-clothing": [size_field, color_field, {"name": "age_range", "label": "Age Range", "type": "text", "required": False}],
    "shoes": [{"name": "shoe_size", "label": "Shoe Size", "type": "text", "required": True}, color_field, brand_field],
    "clothing-accessories": [color_field, brand_field],

    "kitchenware": [basic_condition, brand_field],
    "bedding": [size_field, color_field],
    "home-decor": [color_field, basic_condition],
    "cleaning-supplies": [qty_field, brand_field],
    "appliances": [brand_field, basic_condition],
    "furniture": [basic_condition, color_field],
    "garden-supplies": [qty_field],

    "goats": [{"name": "breed", "label": "Breed", "type": "text", "required": False}, {"name": "age", "label": "Age (months)", "type": "number", "required": False}, {"name": "gender", "label": "Gender", "type": "select", "options": ["Male", "Female"], "required": False}],
    "sheep": [{"name": "breed", "label": "Breed", "type": "text", "required": False}, {"name": "age", "label": "Age (months)", "type": "number", "required": False}, {"name": "gender", "label": "Gender", "type": "select", "options": ["Male", "Female"], "required": False}],
    "cattle": [{"name": "breed", "label": "Breed", "type": "text", "required": False}, {"name": "age", "label": "Age (years)", "type": "number", "required": False}, {"name": "gender", "label": "Gender", "type": "select", "options": ["Male", "Female"], "required": False}],
    "poultry": [{"name": "type", "label": "Bird Type", "type": "text", "required": False}],
    "camels": [{"name": "breed", "label": "Breed", "type": "text", "required": False}, {"name": "age", "label": "Age (years)", "type": "number", "required": False}, {"name": "gender", "label": "Gender", "type": "select", "options": ["Male", "Female"], "required": False}],
    "pets": [{"name": "breed", "label": "Breed", "type": "text", "required": False}, {"name": "age", "label": "Age", "type": "text", "required": False}],

    "vacant-land": [{"name": "plot_size", "label": "Plot Size (sqm)", "type": "number", "required": True}, {"name": "zoning", "label": "Zoning", "type": "select", "options": ["Residential", "Commercial", "Industrial"], "required": False}],
    "farms": [{"name": "farm_size", "label": "Farm Size (hectares)", "type": "number", "required": True}, {"name": "water_access", "label": "Water Access", "type": "select", "options": ["Yes", "No"], "required": False}],
    "agricultural-land": [{"name": "plot_size", "label": "Plot Size (hectares)", "type": "number", "required": True}],
    "market-gardens": [{"name": "plot_size", "label": "Plot Size (sqm)", "type": "number", "required": True}],

    "building-construction": [{"name": "service_type", "label": "Service Level", "type": "text"}],
    "computer-it": [{"name": "service_type", "label": "Service Level", "type": "text"}],
    "tech-it": [{"name": "job_type", "label": "Job Type", "type": "select", "options": ["Full-time", "Part-time", "Contract", "Internship"], "required": True}, {"name": "experience", "label": "Experience Level", "type": "select", "options": ["Entry Level", "Mid Level", "Senior Level"], "required": True}],
    "hair-beauty": [brand_field],
    "fragrance": [brand_field, {"name": "volume", "label": "Volume (ml)", "type": "number", "required": False}],
    "toys-games": [basic_condition, {"name": "age_group", "label": "Age Group", "type": "select", "options": ["0-2 years", "3-5 years", "6-9 years", "10+ years"], "required": False}],
    "kids-clothing": [size_field, color_field],
    "office-equipment": [basic_condition, brand_field],
    "building-materials": [qty_field],
    "solar-energy": [brand_field, {"name": "wattage", "label": "Wattage (W)", "type": "number", "required": False}],
}

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'suqafuran.db')

def seed_schemas():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Ensure subcategory table exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subcategory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR NOT NULL,
                slug VARCHAR NOT NULL UNIQUE,
                icon_name VARCHAR,
                image_url VARCHAR,
                category_id INTEGER,
                attributes_schema JSON
            )
        """)

        updated_count = 0
        for slug, schema in SCHEMAS.items():
            cursor.execute("UPDATE subcategory SET attributes_schema = ? WHERE slug = ?", (json.dumps(schema), slug))
            if cursor.rowcount > 0:
                print(f"Updated schema for subcategory: {slug}")
                updated_count += 1
        
        conn.commit()
        print(f"Successfully seeded schemas for {updated_count} subcategories!")
    except Exception as e:
        print(f"Error seeding schemas: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_schemas()
