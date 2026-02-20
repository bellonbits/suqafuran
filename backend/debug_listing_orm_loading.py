import sys
import os
sys.path.append(os.getcwd())

from sqlmodel import Session
from app.db.session import engine
from app.crud import crud_listing

def check():
    with Session(engine) as session:
        try:
            print("Calling crud_listing.get_listing(session, 144)...")
            listing = crud_listing.get_listing(session, 144)
            if listing:
                print(f"Listing found: {listing.title}")
                print(f"Owner: {listing.owner}")
            else:
                print("Listing 144 NOT found by crud.")
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    check()
