from sqlalchemy import text
from app.db.session import engine

with engine.connect() as conn:
    print("=== CATEGORIES ===")
    res = conn.execute(text("SELECT name, slug FROM category"))
    for row in res.fetchall():
        print(f"{row[0]} ({row[1]})")
    
    print("\n=== LISTINGS ===")
    res = conn.execute(text("SELECT title, price FROM listing"))
    for row in res.fetchall():
        print(f"{row[0]} - ${row[1]}")
    
    print("\n=== USERS ===")
    res = conn.execute(text("SELECT full_name, phone FROM \"user\""))
    for row in res.fetchall():
        print(f"{row[0]} ({row[1]})")
