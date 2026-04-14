"""
Add missing subcategories to the "Mobile Phones & Tablets" category
and ensure all name_so fields are populated.

Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING.

Usage (inside Docker):
    docker exec suqafuran_api python patch_phones_subcategories.py
"""
import json
from sqlmodel import Session, select
from app.db.session import engine
from app.models.listing import Category, SubCategory

PHONE_CATEGORY_SLUG = "mobile-phones-tablets"

NEW_SUBCATEGORIES = [
    {
        "name_en": "Tablets",
        "name_so": "Tableedyada",
        "slug": "tablets",
    },
    {
        "name_en": "Phone Accessories",
        "name_so": "Qalabka Taleefanka",
        "slug": "phone-accessories",
    },
    {
        "name_en": "Smart Watches",
        "name_so": "Saacadaha Casriga ah",
        "slug": "smart-watches",
    },
]

# Also fix existing "Mobile Phones" subcategory name_so if missing
EXISTING_FIXES = {
    "mobile-phones": "Taleefammada Gacanta",
}


def patch():
    with Session(engine) as session:
        cat = session.exec(
            select(Category).where(Category.slug == PHONE_CATEGORY_SLUG)
        ).first()

        if not cat:
            print(f"ERROR: Category '{PHONE_CATEGORY_SLUG}' not found.")
            return

        print(f"Found category: {cat.name_en!r} (id={cat.id})")

        # Fix name_so on the root category if missing
        if not cat.name_so:
            cat.name_so = "Taleefammada & Tableedyada"
            session.add(cat)
            print(f"  Fixed root category name_so → {cat.name_so!r}")

        # Fix existing subcategories (e.g. Mobile Phones name_so)
        existing_subs = session.exec(
            select(SubCategory).where(SubCategory.category_id == cat.id)
        ).all()

        for sub in existing_subs:
            fix_so = EXISTING_FIXES.get(sub.slug)
            if fix_so and not sub.name_so:
                sub.name_so = fix_so
                session.add(sub)
                print(f"  Fixed existing sub {sub.name_en!r} name_so → {fix_so!r}")

        existing_slugs = {sub.slug for sub in existing_subs}

        # Add new subcategories
        for sub_data in NEW_SUBCATEGORIES:
            if sub_data["slug"] in existing_slugs:
                print(f"  SKIP (already exists): {sub_data['name_en']!r}")
                continue

            new_sub = SubCategory(
                name_en=sub_data["name_en"],
                name_so=sub_data["name_so"],
                slug=sub_data["slug"],
                category_id=cat.id,
                attributes_schema=json.dumps({}),
            )
            session.add(new_sub)
            print(f"  ADDED: {sub_data['name_en']!r} / {sub_data['name_so']!r}")

        session.commit()
        print("\nDone.")


if __name__ == "__main__":
    patch()
