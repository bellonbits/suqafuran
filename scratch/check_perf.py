import os
import time
from sqlalchemy import create_engine, text

# PostgreSQL DB URL from .env
DB_URL = "postgresql://doadmin:AVNS_n3l_adWBnU_ieYWiXYS@suqafuran-do-user-31464052-0.f.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

def check():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("Connected to DB.")
        
        # 1. Print all categories
        result = conn.execute(text("SELECT id, name_en, slug FROM category"))
        categories = result.fetchall()
        print("\n--- Categories ---")
        for cat in categories:
            print(f"ID: {cat[0]}, Name: {cat[1]}, Slug: {cat[2]}")
            
        # Let's find Electronics category ID
        electronics_id = None
        for cat in categories:
            if "electronics" in cat[2].lower():
                electronics_id = cat[0]
                
        print(f"\nElectronics Category ID: {electronics_id}")
        
        if electronics_id is not None:
            # Run query with EXPLAIN ANALYZE for category_id = electronics_id
            query_str = """
                EXPLAIN ANALYZE
                SELECT s.id, s.user_id, s.shop_name, s.owner_name,
                       s.shop_address, s.location_lat, s.location_lng,
                       s.verification_status, s.is_active, s.created_at,
                       COALESCE(s.shop_page_banner, u.shop_page_banner) as shop_page_banner,
                       MAX(l.created_at) as latest_listing,
                       COUNT(l.id) as listing_count
                FROM sellers s
                INNER JOIN listing l ON CAST(l.owner_id AS VARCHAR) = s.user_id AND l.status = 'active'
                LEFT JOIN "user" u ON CAST(u.id AS VARCHAR) = s.user_id
                WHERE s.verification_status = 'verified'
                  AND s.is_active = true
                  AND l.category_id = :category_id
                GROUP BY s.id, s.user_id, s.shop_name, s.owner_name,
                         s.shop_address, s.location_lat, s.location_lng,
                         s.verification_status, s.is_active, s.created_at,
                         s.shop_page_banner, u.shop_page_banner
                ORDER BY latest_listing DESC, s.id DESC
                LIMIT 50
            """
            print("\n--- Running EXPLAIN ANALYZE for Electronics category shops query ---")
            start = time.time()
            res = conn.execute(text(query_str), {"category_id": electronics_id})
            rows = res.fetchall()
            for r in rows:
                print(r[0])
            print(f"Time taken: {time.time() - start:.4f}s")
            
            # Let's inspect the order/orders tables structure in PostgreSQL
            res = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'order' OR table_name = 'orders'
            """))
            print("\n--- Columns in order/orders tables ---")
            for col in res.fetchall():
                print(f"Table/Col: {col[0]}, Type: {col[1]}")

if __name__ == "__main__":
    check()
