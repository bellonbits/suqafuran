from sqlmodel import Session
from sqlalchemy import create_engine
from app.core.config import settings
from app.models import User
import traceback

engine_echo = create_engine(settings.DATABASE_URL, echo=True)

def debug_user():
    with Session(engine_echo) as session:
        try:
            u = User(
                full_name="Default Enum User",
                phone="+252610000098",
                email="default_enum@example.com",
                hashed_password="..."
            )
            print("Adding user...")
            session.add(u)
            print("Committing...")
            session.commit()
            print("Success!")
        except Exception as e:
            print(f"FAILED: {e}")
            traceback.print_exc()
            if hasattr(e, 'orig') and hasattr(e.orig, 'diag'):
                diag = e.orig.diag
                print(f"Table: {diag.table_name}")
                print(f"Column: {diag.column_name}")
                print(f"Primary: {diag.message_primary}")

if __name__ == "__main__":
    debug_user()
