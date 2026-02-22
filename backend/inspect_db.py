from sqlalchemy import create_engine, text

DB_URL = "postgresql://avnadmin:AVNS_VhxnhYRqZ0hN_5ezNt-@pg-27a6ed6a-lymwa519-0171.k.aivencloud.com:23236/defaultdb"

def inspect():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'category'"))
        columns = [row[0] for row in result]
        print(f"Columns in category table: {columns}")

if __name__ == "__main__":
    inspect()
