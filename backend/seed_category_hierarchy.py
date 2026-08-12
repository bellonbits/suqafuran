"""
Bulk-seed category -> subcategory -> sub-subcategory -> brands.

Idempotent: matches existing rows by slug and updates them in place,
so this is safe to re-run after editing HIERARCHY.

Usage:
    python3 seed_category_hierarchy.py            # prints a plan, asks to confirm
    python3 seed_category_hierarchy.py --yes       # skips the confirmation prompt
    python3 seed_category_hierarchy.py --dry-run   # prints the plan and exits, no writes
"""
import argparse
import sys
from typing import Optional

from sqlmodel import Session, select

from app.db.session import engine
from app.models.listing import Category, SubSubCategory
from app.models.subcategory import Subcategory
from app.core.config import settings


# Edit this to describe what you want seeded. Any field left out of an
# existing row is left untouched -- only the fields you provide are written.
HIERARCHY = [
    {
        "name_en": "Electronics",
        "name_so": "Elektaroonik",
        "slug": "electronics",
        "icon_name": "Smartphone",
        "subcategories": [
            {
                "name_en": "Phones",
                "name_so": "Taleefanno",
                "slug": "phones",
                "subsubcategories": [
                    {
                        "name_en": "Smartphones",
                        "name_so": "Taleefanno Casri ah",
                        "slug": "smartphones",
                        "brands": ["Apple", "Samsung", "Tecno", "Infinix", "Itel", "Xiaomi", "Huawei"],
                    },
                    {
                        "name_en": "Accessories",
                        "name_so": "Alaabta Dheeriga ah",
                        "slug": "phone-accessories",
                        "brands": ["Anker", "Baseus", "Belkin"],
                    },
                ],
            },
        ],
    },
]


def upsert_category(session: Session, data: dict) -> Category:
    existing = session.exec(select(Category).where(Category.slug == data["slug"])).first()
    if existing:
        for field in ("name_en", "name_so", "icon_name", "image_url"):
            if field in data:
                setattr(existing, field, data[field])
        session.add(existing)
        session.commit()
        session.refresh(existing)
        print(f"  updated category: {existing.name_en} (id={existing.id})")
        return existing

    category = Category(
        name_en=data["name_en"],
        name_so=data.get("name_so"),
        slug=data["slug"],
        icon_name=data.get("icon_name", "Folder"),
        image_url=data.get("image_url"),
    )
    session.add(category)
    session.commit()
    session.refresh(category)
    print(f"  created category: {category.name_en} (id={category.id})")
    return category


def upsert_subcategory(session: Session, category_id: int, data: dict) -> Subcategory:
    existing = session.exec(select(Subcategory).where(Subcategory.slug == data["slug"])).first()
    if existing:
        existing.category_id = category_id
        for field in ("name_en", "name_so", "icon_name", "image_url"):
            if field in data:
                setattr(existing, field, data[field])
        session.add(existing)
        session.commit()
        session.refresh(existing)
        print(f"    updated subcategory: {existing.name_en} (id={existing.id})")
        return existing

    subcategory = Subcategory(
        category_id=category_id,
        name_en=data["name_en"],
        name_so=data.get("name_so"),
        slug=data["slug"],
        icon_name=data.get("icon_name"),
        image_url=data.get("image_url"),
    )
    session.add(subcategory)
    session.commit()
    session.refresh(subcategory)
    print(f"    created subcategory: {subcategory.name_en} (id={subcategory.id})")
    return subcategory


def upsert_subsubcategory(session: Session, subcategory_id: int, data: dict) -> SubSubCategory:
    existing = session.exec(select(SubSubCategory).where(SubSubCategory.slug == data["slug"])).first()
    if existing:
        existing.subcategory_id = subcategory_id
        for field in ("name_en", "name_so", "image_url", "brands"):
            if field in data:
                setattr(existing, field, data[field])
        session.add(existing)
        session.commit()
        session.refresh(existing)
        print(f"      updated sub-subcategory: {existing.name_en} (id={existing.id}, brands={existing.brands})")
        return existing

    subsubcategory = SubSubCategory(
        subcategory_id=subcategory_id,
        name_en=data["name_en"],
        name_so=data.get("name_so"),
        slug=data["slug"],
        image_url=data.get("image_url"),
        brands=data.get("brands"),
    )
    session.add(subsubcategory)
    session.commit()
    session.refresh(subsubcategory)
    print(f"      created sub-subcategory: {subsubcategory.name_en} (id={subsubcategory.id}, brands={subsubcategory.brands})")
    return subsubcategory


def print_plan(hierarchy: list) -> None:
    for cat in hierarchy:
        print(f"- {cat['name_en']} ({cat['slug']})")
        for sub in cat.get("subcategories", []):
            print(f"  - {sub['name_en']} ({sub['slug']})")
            for ssub in sub.get("subsubcategories", []):
                brands = ssub.get("brands", [])
                print(f"    - {ssub['name_en']} ({ssub['slug']}) -- brands: {', '.join(brands) if brands else '(none)'}")


def seed(session: Session, hierarchy: list) -> None:
    for cat_data in hierarchy:
        category = upsert_category(session, cat_data)
        for sub_data in cat_data.get("subcategories", []):
            subcategory = upsert_subcategory(session, category.id, sub_data)
            for ssub_data in sub_data.get("subsubcategories", []):
                upsert_subsubcategory(session, subcategory.id, ssub_data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--yes", action="store_true", help="Skip the confirmation prompt")
    parser.add_argument("--dry-run", action="store_true", help="Print the plan and exit without writing")
    args = parser.parse_args()

    host = settings.DATABASE_URL.split("@")[-1].split("/")[0] if "@" in settings.DATABASE_URL else settings.DATABASE_URL
    print(f"Target database: {host}\n")
    print("Plan:")
    print_plan(HIERARCHY)

    if args.dry_run:
        print("\n--dry-run: no changes written.")
        return

    if not args.yes:
        confirm = input("\nApply these changes? [y/N] ").strip().lower()
        if confirm != "y":
            print("Aborted.")
            sys.exit(1)

    with Session(engine) as session:
        seed(session, HIERARCHY)

    print("\nDone.")


if __name__ == "__main__":
    main()
