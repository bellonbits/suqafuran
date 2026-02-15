import sys
import os

# Add the current directory to sys.path to ensure imports work
sys.path.append(os.getcwd())

from sqlmodel import SQLModel, create_engine
from app.core.config import settings
from app.models.message import Message
# Import other models to ensure they are registered if needed, but Message is the target.

def fix_db():
    # Attempt to use DATABASE_URL, fallback to constructing it if needed or check env
    db_url = str(settings.DATABASE_URL)
    print(f"Connecting to DB: {db_url}")
    engine = create_engine(db_url)
    
    print("Creating tables if they don't exist...")
    SQLModel.metadata.create_all(engine)
    print("Done.")

if __name__ == "__main__":
    fix_db()
