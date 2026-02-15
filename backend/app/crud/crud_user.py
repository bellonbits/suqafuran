from datetime import datetime
from typing import Optional
from sqlmodel import Session, select
from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserCreate, UserUpdate


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return db.exec(statement).first()


def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
    statement = select(User).where(User.phone == phone)
    return db.exec(statement).first()


def create_user(db: Session, phone: str, password: str, full_name: Optional[str] = None, email: Optional[str] = None) -> User:
    db_obj = User(
        phone=phone,
        full_name=full_name,
        email=email,
        hashed_password=get_password_hash(password),
        is_active=True,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def authenticate(
    db: Session, email: str, password: str
) -> Optional[User]:
    # Try by email first
    user = get_user_by_email(db, email=email)
    # If not found, try by phone (treating email param as username/phone)
    if not user:
        user = get_user_by_phone(db, phone=email)
    
    if not user:
        return None
    if not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def update_user(db: Session, db_obj: User, user_in: UserUpdate) -> User:
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"]
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db_obj.updated_at = datetime.utcnow()
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def verify_user(db: Session, db_obj: User) -> User:
    db_obj.is_verified = True
    db_obj.updated_at = datetime.utcnow()
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def create_social_user(db: Session, email: str, full_name: str, provider: str) -> User:
    # Use a dummy password for social users
    import uuid
    dummy_password = str(uuid.uuid4())
    db_obj = User(
        full_name=full_name,
        email=email,
        hashed_password=get_password_hash(dummy_password),
        is_active=True,
        is_verified=False, # Verify them? Usually social is trusted.
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
