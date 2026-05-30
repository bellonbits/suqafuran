from sqlalchemy import create_engine, text
from app.core.config import settings

def inspect_raw_alcayn():
    engine = create_engine(str(settings.DATABASE_URL))
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, document_type, document_urls, selfie_url, proof_of_address_url, video_selfie_url FROM verificationrequest WHERE id_number = 'P01746118'")).all()
        print(f"Raw records: {len(result)}")
        for r in result:
            print(f"ID: {r[0]}")
            print(f"  document_type: {r[1]}")
            print(f"  document_urls: {r[2]} (type: {type(r[2])})")
            print(f"  selfie_url: {r[3]}")
            print(f"  proof_of_address_url: {r[4]}")
            print(f"  video_selfie_url: {r[5]}")

if __name__ == "__main__":
    inspect_raw_alcayn()
