from app.db.session import SessionLocal
from app.models.listing import Listing

def check_listing():
    db = SessionLocal()
    try:
        listing = db.get(Listing, 144)
        if listing:
            print(f"Listing 144 found: {listing.title}")
            print(f"Owner ID: {listing.owner_id}")
        else:
            print("Listing 144 NOT found in DB.")
            
            # List some existing IDs
            listings = db.query(Listing).limit(5).all()
            print("Some existing listings:", [l.id for l in listings])
    finally:
        db.close()

if __name__ == "__main__":
    check_listing()
