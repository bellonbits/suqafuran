from datetime import datetime
from sqlmodel import Session, select
from app.db.session import engine
from app.models import User
from app.core.security import get_password_hash

def test_seed():
    with Session(engine) as session:
        try:
            phone = "+252610000022"
            safe_now = datetime.utcnow().replace(microsecond=0)
            u = User(
                full_name="No Microsecond User",
                phone=phone,
                email="nomicro@example.com",
                hashed_password="...",
                created_at=safe_now,
                updated_at=safe_now
            )
            print("Adding user with no-microsecond timestamps...")
            session.add(u)
            print("Committing...")
            session.commit()
            print("Successfully seeded test user!")
        except Exception as e:
            print(f"ERROR: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_seed()
