"""Bulk product management endpoints."""

from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel
from datetime import datetime
from typing import List
from app.api import deps
from app.models.listings import Listing
from app.models.bulk import ProductTitleChange
from app.services.title_suggester import TitleSuggester

router = APIRouter()
title_suggester = TitleSuggester()


class ProductForSuggestion(BaseModel):
    id: str
    current_title: str
    category: str
    brand: str


class SuggestTitlesRequest(BaseModel):
    products: List[ProductForSuggestion]
    template: str = "{brand} {category} - {feature}, {color}"


class BulkUpdateRequest(BaseModel):
    updates: List[dict]  # [{"id": "...", "new_title": "..."}, ...]


@router.post("/suggest-titles")
async def suggest_titles(
    request: SuggestTitlesRequest,
    db: Session = Depends(deps.get_db),
):
    """Generate AI-powered title suggestions for products."""

    suggestions = {}

    for product in request.products:
        try:
            suggestion = title_suggester.generate_title(
                current_title=product.current_title,
                category=product.category,
                brand=product.brand,
                template=request.template,
            )
            suggestions[product.id] = suggestion
        except Exception as e:
            # Fallback to current title if suggestion fails
            suggestions[product.id] = product.current_title

    return {
        "suggestions": suggestions,
        "count": len(suggestions),
    }


@router.post("/bulk-update")
async def bulk_update_titles(
    request: BulkUpdateRequest,
    db: Session = Depends(deps.get_db),
):
    """Apply bulk title updates to listings."""

    updated_count = 0

    for update in request.updates:
        listing_id = update.get("id")
        new_title = update.get("new_title")

        if not listing_id or not new_title:
            continue

        # Get listing
        listing = db.exec(
            select(Listing).where(Listing.id == listing_id)
        ).first()

        if not listing:
            continue

        # Store old title for audit trail
        old_title = listing.title

        # Update title
        listing.title = new_title
        listing.updated_at = datetime.utcnow()

        # Log change
        change = ProductTitleChange(
            listing_id=listing_id,
            old_title=old_title,
            new_title=new_title,
            changed_at=datetime.utcnow(),
        )
        db.add(change)

        updated_count += 1

    db.commit()

    return {
        "success": True,
        "updated_count": updated_count,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/title-history/{listing_id}")
async def get_title_history(
    listing_id: str,
    db: Session = Depends(deps.get_db),
):
    """Get title change history for a specific product."""

    changes = db.exec(
        select(ProductTitleChange)
        .where(ProductTitleChange.listing_id == listing_id)
        .order_by(ProductTitleChange.changed_at.desc())
    ).all()

    return {
        "listing_id": listing_id,
        "history": [
            {
                "old_title": change.old_title,
                "new_title": change.new_title,
                "changed_at": change.changed_at.isoformat(),
            }
            for change in changes
        ],
        "total_changes": len(changes),
    }
