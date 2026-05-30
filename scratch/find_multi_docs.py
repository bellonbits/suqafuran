from sqlmodel import Session, create_engine, select
from app.core.config import settings
from app.models.verification import VerificationRequest

def find_multi_docs():
    engine = create_engine(str(settings.DATABASE_URL))
    with Session(engine) as session:
        requests = session.exec(select(VerificationRequest)).all()
        found = False
        for r in requests:
            if r.document_urls and len(r.document_urls) > 1:
                print(f"Request ID {r.id} (User ID {r.user_id}) has {len(r.document_urls)} document URLs:")
                for url in r.document_urls:
                    print(f"  - {url}")
                found = True
        if not found:
            print("No requests found with more than 1 document URL in document_urls!")

if __name__ == "__main__":
    find_multi_docs()
