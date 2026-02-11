import sys
import os

# Add the current directory to sys.path to allow imports from app
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.db.session import Session, engine
from app.models.user import User
from app.models.listing import Listing, Category
from app.models.verification import VerificationRequest
from app.models.message import Message
from app.models.favorite import Favorite
from app.models.notification import Notification
from app.core.security import get_password_hash
from sqlmodel import select

def create_admin():
    with Session(engine) as session:
        # Check if admin already exists
        email = "admin@suqafuran.com"
        statement = select(User).where(User.email == email)
        existing_admin = session.exec(statement).first()
        
        if existing_admin:
            print(f"Admin user with email {email} already exists!")
            # Optionally update to make sure it's an admin
            existing_admin.is_admin = True
            existing_admin.is_active = True
            existing_admin.is_verified = True
            session.add(existing_admin)
            session.commit()
            print("Verified existing account has admin privileges.")
            return

        admin_user = User(
            full_name="System Admin",
            email=email,
            hashed_password=get_password_hash("admin123456"),
            is_active=True,
            is_verified=True,
            is_admin=True
        )
        session.add(admin_user)
        session.commit()
        print("Admin user created successfully!")
        print(f"Email: {email}")
        print("Password: admin123456")

if __name__ == "__main__":
    create_admin()
