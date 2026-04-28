"""
Delete ALL seeded/mock listings from the database.

This removes listings, their images, favorites, interactions, messages,
reports, promotions and deals — but leaves users, categories, and 
promotion plans untouched.

Run inside Docker:
  docker compose exec api python delete_seeded_listings.py
"""
from sqlmodel import Session, select, delete
from sqlalchemy import text
from app.db.session import engine
from app.models.listing import Listing
from app.models.favorite import Favorite
from app.models.interaction import Interaction
from app.models.meeting_deal import Meeting, Deal
from app.models.message import Message
from app.models.trust import Report
from app.models.promotion import Promotion


def delete_all_listings():
    with Session(engine) as session:
        # Count before
        count = session.exec(select(Listing)).all()
        print(f"Found {len(count)} listings in database.")

        if not count:
            print("No listings to delete. Done.")
            return

        confirm = input(f"\n⚠️  This will permanently delete ALL {len(count)} listings.\nType 'yes' to confirm: ").strip()
        if confirm.lower() != "yes":
            print("Aborted.")
            return

        # Get all listing IDs
        listing_ids = [l.id for l in count]

        # Delete related records first (foreign key order)
        print("Deleting promotions...")
        session.exec(delete(Promotion).where(Promotion.listing_id.in_(listing_ids)))

        print("Deleting reports...")
        session.exec(delete(Report).where(Report.listing_id.in_(listing_ids)))

        print("Deleting deals...")
        session.exec(delete(Deal).where(Deal.listing_id.in_(listing_ids)))

        print("Deleting meetings...")
        session.exec(delete(Meeting).where(Meeting.listing_id.in_(listing_ids)))

        print("Deleting messages...")
        session.exec(delete(Message).where(Message.listing_id.in_(listing_ids)))

        print("Deleting favorites...")
        session.exec(delete(Favorite).where(Favorite.listing_id.in_(listing_ids)))

        print("Deleting interactions...")
        session.exec(delete(Interaction).where(Interaction.listing_id.in_(listing_ids)))

        print("Deleting listings...")
        session.exec(delete(Listing).where(Listing.id.in_(listing_ids)))

        session.commit()
        print(f"\n✅ Successfully deleted {len(listing_ids)} listings and all related data.")
        print("The marketplace is now clean and ready for real products!")


if __name__ == "__main__":
    delete_all_listings()
