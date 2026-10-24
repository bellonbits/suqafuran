from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User
from app.models.listing import Listing
from app.models.meeting_deal import Deal
from app.models.notification import Notification
from app.services.trust_service import trust_service
from pydantic import BaseModel

router = APIRouter()


class MarkPurchasedIn(BaseModel):
    listing_id: int


def _seller_name(user: Optional[User]) -> str:
    if not user:
        return "The seller"
    return user.business_name or user.full_name or "The seller"


@router.post("/mark-purchased", response_model=Deal)
def mark_purchased(
    *,
    db: Session = Depends(deps.get_db),
    payload: MarkPurchasedIn,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Buyer indicates they purchased a listing. Creates or updates the Deal
    record for this (listing, buyer, seller) and notifies the seller to
    confirm. Does NOT close the listing or touch trust scores yet -- that
    only happens once the seller also confirms (see /seller-confirm).
    """
    listing = db.get(Listing, payload.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't confirm a purchase on your own listing")

    deal = db.exec(
        select(Deal).where(
            Deal.listing_id == listing.id,
            Deal.buyer_id == current_user.id,
            Deal.seller_id == listing.owner_id,
        )
    ).first()

    if not deal:
        deal = Deal(listing_id=listing.id, buyer_id=current_user.id, seller_id=listing.owner_id)

    deal.buyer_confirmed = True
    deal.buyer_confirmed_at = datetime.utcnow()
    db.add(deal)
    db.commit()
    db.refresh(deal)

    buyer_name = current_user.full_name or "A buyer"
    listing_title = listing.title_en
    notification = Notification(
        user_id=listing.owner_id,
        type="purchase_confirmation_requested",
        data={
            "deal_id": deal.id,
            "listing_id": listing.id,
            "message": f"{buyer_name} indicated they purchased \"{listing_title}\". Confirm the sale?",
        },
    )
    db.add(notification)
    db.commit()

    return deal


@router.post("/{deal_id}/seller-confirm", response_model=Deal)
def seller_confirm(
    *,
    db: Session = Depends(deps.get_db),
    deal_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Seller confirms a buyer-reported purchase. Only closes the listing
    and boosts trust scores once BOTH sides have confirmed."""
    deal = db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to confirm this deal")

    deal.seller_confirmed = True
    deal.seller_confirmed_at = datetime.utcnow()

    if deal.buyer_confirmed:
        deal.outcome = "bought"
        listing = db.get(Listing, deal.listing_id)
        if listing:
            listing.status = "closed"
            db.add(listing)
        trust_service.update_trust_score(db, deal.buyer_id, 50, "Successful deal completion")
        trust_service.update_trust_score(db, deal.seller_id, 50, "Successful deal completion")

    db.add(deal)
    db.commit()
    db.refresh(deal)

    if deal.outcome == "bought":
        listing = db.get(Listing, deal.listing_id)
        notification = Notification(
            user_id=deal.buyer_id,
            type="purchase_confirmed",
            data={
                "deal_id": deal.id,
                "listing_id": deal.listing_id,
                "message": f"{_seller_name(db.get(User, deal.seller_id))} confirmed your purchase of \"{listing.title_en if listing else 'the listing'}\".",
            },
        )
        db.add(notification)
        db.commit()

    return deal


@router.post("/{deal_id}/seller-deny", response_model=Deal)
def seller_deny(
    *,
    db: Session = Depends(deps.get_db),
    deal_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Seller indicates this purchase did not happen."""
    deal = db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this deal")

    deal.outcome = "not_bought"
    db.add(deal)
    db.commit()
    db.refresh(deal)

    listing = db.get(Listing, deal.listing_id)
    notification = Notification(
        user_id=deal.buyer_id,
        type="purchase_denied",
        data={
            "deal_id": deal.id,
            "listing_id": deal.listing_id,
            "message": f"{_seller_name(db.get(User, deal.seller_id))} indicated this purchase didn't happen for \"{listing.title_en if listing else 'the listing'}\".",
        },
    )
    db.add(notification)
    db.commit()

    return deal


@router.get("/", response_model=Optional[Deal])
def get_deal(
    *,
    db: Session = Depends(deps.get_db),
    listing_id: int,
    buyer_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Fetch the current deal state for a listing+buyer pair. Callable by
    the buyer, the seller, or an admin."""
    deal = db.exec(
        select(Deal).where(Deal.listing_id == listing_id, Deal.buyer_id == buyer_id)
    ).first()

    if deal:
        allowed = current_user.id in (deal.buyer_id, deal.seller_id) or current_user.is_admin
    else:
        listing = db.get(Listing, listing_id)
        allowed = bool(listing) and (
            current_user.id in (buyer_id, listing.owner_id) or current_user.is_admin
        )

    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized to view this deal")

    return deal


class SellerMarkSoldIn(BaseModel):
    listing_id: int
    buyer_id: int


@router.get("/listing/{listing_id}/chat-buyers", response_model=Any)
def get_listing_chat_buyers(
    *,
    db: Session = Depends(deps.get_db),
    listing_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    List all buyers who exchanged in-app messages on this listing.
    """
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view buyers for this listing")

    from app.models.message import Message
    buyer_ids_1 = db.exec(
        select(Message.sender_id).where(Message.listing_id == listing_id, Message.receiver_id == current_user.id)
    ).all()
    buyer_ids_2 = db.exec(
        select(Message.receiver_id).where(Message.listing_id == listing_id, Message.sender_id == current_user.id)
    ).all()

    unique_buyer_ids = list(set([b for b in (buyer_ids_1 + buyer_ids_2) if b != current_user.id]))
    buyers = []
    for b_id in unique_buyer_ids:
        u = db.get(User, b_id)
        if u:
            buyers.append({
                "id": u.id,
                "full_name": u.full_name or "Buyer",
                "avatar_url": u.avatar_url,
            })
    return buyers


@router.post("/seller-mark-sold", response_model=Deal)
def seller_mark_sold(
    *,
    db: Session = Depends(deps.get_db),
    payload: SellerMarkSoldIn,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Seller taps 'Mark as sold' and selects which buyer purchased the item.
    Sets listing status to 'sold' and sends buyer a purchase confirmation request.
    """
    listing = db.get(Listing, payload.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to mark this listing as sold")

    buyer = db.get(User, payload.buyer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Selected buyer not found")

    deal = db.exec(
        select(Deal).where(
            Deal.listing_id == listing.id,
            Deal.buyer_id == buyer.id,
            Deal.seller_id == current_user.id,
        )
    ).first()

    if not deal:
        deal = Deal(listing_id=listing.id, buyer_id=buyer.id, seller_id=current_user.id)

    deal.seller_confirmed = True
    deal.seller_confirmed_at = datetime.utcnow()

    # Mark listing as sold
    listing.is_sold = True
    listing.sold_at = datetime.utcnow()
    listing.status = "sold"
    db.add(listing)

    db.add(deal)
    db.commit()
    db.refresh(deal)

    # Prompt buyer to confirm verified purchase
    seller_name = _seller_name(current_user)
    notification = Notification(
        user_id=buyer.id,
        type="purchase_confirmation_requested",
        data={
            "deal_id": deal.id,
            "listing_id": listing.id,
            "message": f"{seller_name} marked \"{listing.title_en}\" as sold to you. Did you buy this item? Confirm to create a verified sale record.",
        },
    )
    db.add(notification)
    db.commit()

    return deal


@router.post("/{deal_id}/buyer-confirm", response_model=Deal)
def buyer_confirm_purchase(
    *,
    db: Session = Depends(deps.get_db),
    deal_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Buyer confirms they purchased the item, establishing a verified sale record
    and boosting trust scores for both parties.
    """
    deal = db.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal.buyer_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to confirm this deal")

    deal.buyer_confirmed = True
    deal.buyer_confirmed_at = datetime.utcnow()
    deal.outcome = "bought"

    # Boost trust scores for verified peer-to-peer transaction
    trust_service.update_trust_score(db, deal.buyer_id, 50, "Verified offline deal completion")
    trust_service.update_trust_score(db, deal.seller_id, 50, "Verified offline deal completion")

    db.add(deal)
    db.commit()
    db.refresh(deal)

    listing = db.get(Listing, deal.listing_id)
    notification = Notification(
        user_id=deal.seller_id,
        type="purchase_confirmed",
        data={
            "deal_id": deal.id,
            "listing_id": deal.listing_id,
            "message": f"{current_user.full_name or 'The buyer'} confirmed the purchase of \"{listing.title_en if listing else 'your item'}\".",
        },
    )
    db.add(notification)
    db.commit()

    return deal
