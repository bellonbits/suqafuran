import sqlite3
import os

def check_db():
    db_path = 'suqafuran.db'
    if not os.path.exists(db_path):
        print(f"DB file not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check table existence
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables found: {[t[0] for t in tables]}")
        
        if 'listing' not in [t[0] for t in tables]:
            if 'listings' in [t[0] for t in tables]:
                print("Found 'listings' table instead.")
                table_name = 'listings'
            else:
                print("Table 'listing' or 'listings' not found.")
                return
        else:
            table_name = 'listing'

        # Count listings
        cursor.execute(f"SELECT count(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"Total listings: {count}")

        # Check recent
        cursor.execute(f"SELECT id, title FROM {table_name} ORDER BY id DESC LIMIT 5")
        print("Recent listings:")
        for row in cursor.fetchall():
            print(row)

        # Check specific ID
        cursor.execute(f"SELECT id, title, owner_id FROM {table_name} WHERE id=?", (144,))
        row = cursor.fetchone()
        if row:
            print(f"Listing 144 found: {row}")
        else:
            print("Listing 144 NOT found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_db()
