import psycopg2

dsn = "postgresql://avnadmin:AVNS_VhxnhYRqZ0hN_5ezNt-@pg-27a6ed6a-lymwa519-0171.k.aivencloud.com:23236/defaultdb?sslmode=require"

plans = [
    ("Standard Boost", "Basic visibility boost", 5.0, 7),
    ("Premium Boost", "Enhanced visibility boost", 15.0, 14),
    ("Diamond Boost", "Maximum visibility boost", 30.0, 30),
]

try:
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    for name, desc, price, duration in plans:
        cur.execute("SELECT id FROM promotionplan WHERE name = %s", (name,))
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO promotionplan (name, description, price_usd, duration_days) VALUES (%s, %s, %s, %s)",
                (name, desc, price, duration)
            )
            print(f"Added plan: {name}")
    conn.commit()
    print("Promotion plans processed successfully.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
