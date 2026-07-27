from sqlalchemy import create_engine, inspect, text
from app.core.config import settings

def debug_db():
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    inspector = inspect(engine)
    
    print("--- Tables ---")
    tables = inspector.get_table_names()
    print(tables)
    
    if 'message' in tables:
        print("Table 'message' FOUND.")
    else:
        print("Table 'message' NOT FOUND.")

    print("\n--- Enums ---")
    with engine.connect() as conn:
        try:
            result = conn.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'meetingresponse'"))
            print("meetingresponse values:", [row[0] for row in result])
        except Exception as e:
            print("Error checking enum:", e)

if __name__ == "__main__":
    debug_db()
