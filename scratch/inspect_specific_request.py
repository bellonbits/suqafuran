from sqlmodel import Session, create_engine, select
from app.core.config import settings
from app.models.verification import VerificationRequest

def inspect_request():
    engine = create_engine(str(settings.DATABASE_URL))
    with Session(engine) as session:
        requests = session.exec(select(VerificationRequest).where(VerificationRequest.id_number == "JBS-85392080")).all()
        print(f"Matching requests: {len(requests)}")
        for r in requests:
            print(f"Request ID: {r.id}")
            print(f"  status: {r.status}")
            print(f"  selfie_url: {r.selfie_url} (type: {type(r.selfie_url)})")
            print(f"  document_urls: {r.document_urls} (type: {type(r.document_urls)})")
            print(f"  proof_of_address_url: {r.proof_of_address_url}")
            print(f"  video_selfie_url: {r.video_selfie_url}")

if __name__ == "__main__":
    inspect_request()
