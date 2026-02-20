from sqlmodel import Session, select, create_engine
from app.models.listing import Category
from app.core.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

def check_categories():
    with Session(engine) as session:
        categories = session.exec(select(Category)).all()
        print(f"Total Categories found: {len(categories)}")
        for cat in categories:
            print(f"- {cat.name} (Slug: {cat.slug}) | Subcats: {len(cat.attributes_schema.get('subcategories', []))}")

if __name__ == "__main__":
    check_categories()
