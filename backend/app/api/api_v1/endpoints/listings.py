from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlmodel import Session
from app.api import deps
from app.crud import crud_listing
from app.models.listing import Listing, ListingBase, ListingRead
from app.models.user import User
from app.core.config import settings
import uuid
import os

router = APIRouter()


@router.post("/upload")
async def upload_image(
    *,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload an image for a listing.
    """
    extension = file.filename.split(".")[-1].lower()
    if extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File extension not allowed")
    
    # Check file size (simulated, better to check actual content if possible)
    # FastAPI doesn't easily give size without reading it
    contents = await file.read(settings.MAX_FILE_SIZE + 1)
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    filename = f"{uuid.uuid4()}.{extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    return {"filename": filename, "url": f"/api/v1/listings/images/{filename}"}


@router.post("/upload-multiple")
async def upload_multiple_images(
    *,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload multiple images for a listing.
    """
    results = []
    for file in files:
        extension = file.filename.split(".")[-1].lower()
        if extension not in settings.ALLOWED_EXTENSIONS:
            continue
            
        contents = await file.read(settings.MAX_FILE_SIZE + 1)
        if len(contents) > settings.MAX_FILE_SIZE:
            continue
            
        filename = f"{uuid.uuid4()}.{extension}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        results.append({"filename": filename, "url": f"/api/v1/listings/images/{filename}"})
    
    return results


@router.get("/categories", response_model=List[Any])
def read_categories(
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve categories.
    """
    return crud_listing.get_categories(db)


@router.get("/categories/{slug}/attributes", response_model=dict)
def read_category_attributes(
    *,
    db: Session = Depends(deps.get_db),
    slug: str,
) -> Any:
    """
    Get dynamic attribute schema for a specific category.
    """
    category = crud_listing.get_category_by_slug(db, slug=slug)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category.attributes_schema


@router.get("/me", response_model=List[ListingRead])
def read_my_listings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve listings of current user.
    """
    return crud_listing.get_listings(db, skip=skip, limit=limit, owner_id=current_user.id)


@router.get("/", response_model=List[ListingRead])
def read_listings(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    q: Optional[str] = None,
    location: Optional[str] = None,
    attrs: Optional[str] = None,
) -> Any:
    """
    Retrieve listings.
    """
    attributes = None
    if attrs:
        import json
        try:
            attributes = json.loads(attrs)
        except:
            pass

    listings = crud_listing.get_listings(
        db, skip=skip, limit=limit, category_id=category_id, search=q, location=location, attributes=attributes
    )
    return listings


@router.post("/", response_model=Listing)
def create_listing(
    *,
    db: Session = Depends(deps.get_db),
    listing_in: ListingBase,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new listing.
    """
    listing = crud_listing.create_listing(
        db=db, listing_in=listing_in, owner_id=current_user.id
    )
    return listing


@router.get("/{id}", response_model=ListingRead)
def read_listing(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get listing by ID.
    """
    listing = crud_listing.get_listing(db=db, id=id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.put("/{id}", response_model=ListingRead)
def update_listing(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    listing_in: ListingBase,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a listing.
    """
    listing = crud_listing.get_listing(db=db, id=id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not current_user.is_admin and (listing.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough privileges")
    listing = crud_listing.update_listing(db=db, db_obj=listing, listing_in=listing_in)
    return listing


@router.patch("/{id}", response_model=ListingRead)
def patch_listing(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    listing_in: dict,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Partially update a listing.
    """
    listing = crud_listing.get_listing(db=db, id=id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not current_user.is_admin and (listing.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough privileges")
    
    for field, value in listing_in.items():
        if hasattr(listing, field):
            setattr(listing, field, value)
    
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@router.delete("/{id}", response_model=ListingRead)
def delete_listing(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a listing.
    """
    listing = crud_listing.get_listing(db=db, id=id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not current_user.is_admin and (listing.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough privileges")
    listing = crud_listing.remove_listing(db=db, id=id)
    return listing


from app.crud import crud_wallet
from datetime import datetime, timedelta

@router.post("/{id}/boost", response_model=dict)
def apply_listing_boost(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    boost_level: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Apply a boost to a specific listing.
    """
    BOOST_PRICES = {
        1: {"name": "Basic", "price": 500, "days": 7},
        2: {"name": "VIP", "price": 1500, "days": 14},
        3: {"name": "Diamond", "price": 3000, "days": 30},
    }
    
    if boost_level not in BOOST_PRICES:
        raise HTTPException(status_code=400, detail="Invalid boost level")
    
    listing = crud_listing.get_listing(db, id=id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    wallet = crud_wallet.get_wallet_by_user_id(db, user_id=current_user.id)
    if not wallet or wallet.balance < BOOST_PRICES[boost_level]["price"]:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    boost_config = BOOST_PRICES[boost_level]
    crud_wallet.deduct_funds(db, wallet=wallet, amount=boost_config["price"], description=f"Boost: {listing.title}")
    
    listing.boost_level = boost_level
    listing.boost_expires_at = datetime.utcnow() + timedelta(days=boost_config["days"])
    db.add(listing)
    db.commit()
    return {"message": "Success", "expires_at": listing.boost_expires_at}
