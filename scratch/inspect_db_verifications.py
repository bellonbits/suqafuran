from sqlmodel import Session, create_engine, select
from app.core.config import settings
from app.models.verification import VerificationRequest

def inspect_db():
    engine = create_engine(str(settings.DATABASE_URL))
    with Session(engine) as session:
        requests = session.exec(select(VerificationRequest)).all()
        print(f"Total requests found: {len(requests)}")
        for r in requests:
            print(f"\nRequest ID: {r.id}")
            print(f"  document_urls: {r.document_urls} (type: {type(r.document_urls)})")
            print(f"  selfie_url: {r.selfie_url} (type: {type(r.selfie_url)})")
            print(f"  proof_of_address_url: {r.proof_of_address_url} (type: {type(r.proof_of_address_url)})")
            print(f"  video_selfie_url: {r.video_selfie_url} (type: {type(r.video_selfie_url)})")

if __name__ == "__main__":
    inspect_db()
