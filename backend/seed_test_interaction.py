from sqlmodel import Session, create_engine, select
from app.models.user import User
from app.models.listing import Listing
from app.models.interaction import Interaction

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL or "sqlite:///./suqafuran.db")

def seed_test_interaction():
    with Session(engine) as db:
        # Get a buyer and a seller's listing
        buyer = db.exec(select(User).where(User.is_admin == False)).first()
        if not buyer:
            print("No non-admin user found")
            return
            
        listing = db.exec(select(Listing).where(Listing.owner_id != buyer.id)).first()
        if not listing:
            print("No listing found for another user")
            return
            
        print(f"Creating interaction for Buyer(id={buyer.id}) on Listing(id={listing.id}, title='{listing.title}')")
        
        interaction = Interaction(
            listing_id=listing.id,
            buyer_id=buyer.id,
            type="call"
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        print(f"Created interaction id: {interaction.id}")

if __name__ == "__main__":
    seed_test_interaction()
