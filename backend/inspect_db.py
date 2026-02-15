from sqlalchemy import create_engine, inspect
from app.core.config import settings

def check_columns():
    engine = create_engine(str(settings.DATABASE_URL))
    inspector = inspect(engine)
    columns = inspector.get_columns('verificationrequest')
    with open('columns_detailed.txt', 'w') as f:
        for c in columns:
            f.write(f"{c['name']}\n")
    print(f"SCRIPTDONE: {len(columns)} columns")

if __name__ == "__main__":
    try:
        check_columns()
    except Exception as e:
        print(f"Error checking columns: {e}")
