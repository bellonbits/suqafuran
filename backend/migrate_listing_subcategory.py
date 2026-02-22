import sqlite3
import os

from sqlalchemy import create_engine, text

DB_URL = "postgresql://avnadmin:AVNS_VhxnhYRqZ0hN_5ezNt-@pg-27a6ed6a-lymwa519-0171.k.aivencloud.com:23236/defaultdb"

def migrate():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        try:
            # Add subcategory_id to listing table
            conn.execute(text("ALTER TABLE listing ADD COLUMN subcategory_id INTEGER REFERENCES subcategory(id)"))
            conn.commit()
            print("Added subcategory_id column to listing table.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("subcategory_id column already exists.")
            else:
                print(f"Error adding column: {e}")
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
