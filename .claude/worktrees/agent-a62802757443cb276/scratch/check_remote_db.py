import sys
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://doadmin:AVNS_n3l_adWBnU_ieYWiXYS@suqafuran-do-user-31464052-0.f.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

try:
    print("Connecting to remote DB...")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Connected successfully!")
        
        # Get alembic version
        try:
            res = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
            print("Current Alembic Version:", res)
        except Exception as e:
            print("Error reading alembic_version:", e)
            
        # Get list of tables
        try:
            tables = conn.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
            )).fetchall()
            print("Tables:", [t[0] for t in tables])
        except Exception as e:
            print("Error reading tables:", e)
except Exception as e:
    print("Database connection failed:", e)
