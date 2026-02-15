import sys
import os

# Add the backend directory to sys.path to ensure imports work
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User, UserVerifiedLevel
from app.core.security import get_password_hash

def create_admin():
    phone_input = "+254 706 070 747"
    # Normalize phone: remove spaces
    phone = phone_input.replace(" ", "")
    
    print(f"Checking for user with phone: {phone}")
    
    with Session(engine) as session:
        user = session.exec(select(User).where(User.phone == phone)).first()
        
        if user:
            print(f"User found: {user.full_name} (ID: {user.id})")
            changes_made = False
            
            if not user.is_admin:
                print("Promoting to Admin...")
                user.is_admin = True
                changes_made = True
            
            if not user.is_verified:
                 print("Marking as Verified...")
                 user.is_verified = True
                 changes_made = True
            
            if user.verified_level != UserVerifiedLevel.trusted.value:
                print("Upgrading verification level to Trusted...")
                user.verified_level = UserVerifiedLevel.trusted.value
                changes_made = True
                
            if changes_made:
                session.add(user)
                session.commit()
                session.refresh(user)
                print("User updated successfully.")
            else:
                print("User is already an Admin and fully verified.")
        else:
            print("User not found. Creating new Admin user...")
            password = "AdminPassword@123"
            user = User(
                phone=phone,
                full_name="Super Admin",
                hashed_password=get_password_hash(password),
                is_active=True,
                is_verified=True,
                is_admin=True,
                verified_level=UserVerifiedLevel.trusted.value
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            print(f"Admin user created successfully.")
            print(f"Phone: {phone}")
            print(f"Password: {password}")

if __name__ == "__main__":
    try:
        create_admin()
    except Exception as e:
        import traceback
        traceback.print_exc()
