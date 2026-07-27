import sys
import os

# Add the parent directory to sys.path if needed, but running from backend usually works if we add current dir
sys.path.append(os.getcwd())

from sqlmodel import Session, select
from app.db.session import engine
from app.models.listing import Listing

def check_listings():
    with Session(engine) as session:
        try:
            # Check all listings count
            stmt = select(Listing)
            listings = session.exec(stmt).all()
            print(f"Total listings in DB: {len(listings)}")
            
            # Get top 5 recent listings
            recent_listings = session.exec(select(Listing).order_by(Listing.id.desc()).limit(5)).all()
            print(f"Recent Database Listings:")
            for l in recent_listings:
                print(f"ID: {l.id} (Type: {type(l.id)}), Title: {l.title}, Owner: {l.owner_id}")
                
            # Specific check for 144
            l144 = session.get(Listing, 144)
            from app.models.user import User
            if l144:
                print(f"Listing 144 found: {l144.title}")
                print(f"Owner ID: {l144.owner_id}")
                owner = session.get(User, l144.owner_id)
                if owner:
                    print(f"Owner found: {owner.full_name}")
                else:
                    print(f"Owner {l144.owner_id} NOT found!")
            else:
                print("Listing 144 NOT found directly.")

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    check_listings()
