from sqlalchemy import text, inspect
from app.db.session import engine

def main():
    inspector = inspect(engine)
    
    print("Checking listing table...")
    columns = [c['name'] for c in inspector.get_columns('listing')]
    print(f"Columns in listing: {columns}")
    
    for col in ['views', 'leads']:
        if col in columns:
            print(f"  - Column '{col}' exists.")
        else:
            print(f"  - Column '{col}' MISSING!")
            
    print("\nChecking user table...")
    columns = [c['name'] for c in inspector.get_columns('user')]
    print(f"Columns in user: {columns}")
    
    if 'profile_views' in columns:
        print("  - Column 'profile_views' exists.")
    else:
        print("  - Column 'profile_views' MISSING!")

if __name__ == "__main__":
    main()
