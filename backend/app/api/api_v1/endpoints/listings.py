from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, BackgroundTasks
from sqlmodel import Session, select, func
from app.api import deps
from app.crud import crud_listing
from app.models.listing import Listing, ListingBase, ListingRead, Category, SubCategory, SubSubCategory
from app.models.user import User
from app.models.audit import AuditLog
from app.models.marketing_code import MarketingCode
from app.services.cache_service import cache
from app.core.config import settings
import uuid
import os
from app.services.storage_service import storage_service
from app.services.screening_service import calculate_listing_risk
from datetime import datetime, timedelta

router = APIRouter()


@router.post("/upload")
async def upload_image(
    *,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks,
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
    
    try:
        url = await storage_service.upload_file(contents, filename)
        
        # AI Image Intelligence moved to background to prevent blocking UI
        from app.services.ai_service import ai_service
        background_tasks.add_task(ai_service.analyze_image, url)
        
        return {
            "filename": filename, 
            "url": url,
            "analysis": "processing_in_background"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")


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
        
        try:
            url = await storage_service.upload_file(contents, filename)
            results.append({"filename": filename, "url": url})
        except Exception as e:
            # For multiple uploads, we might just skip the failed ones or log them
            continue
    
    return results


@router.get("/categories", response_model=List[Any])
@cache.cached(prefix="categories", ttl=3600)
def read_categories(
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve categories with subcategories.
    """
    import json
    
    categories = crud_listing.get_categories(db)
    result = []
    
    for cat in categories:
        cat_attrs = cat.attributes_schema
        if isinstance(cat_attrs, str):
            try: cat_attrs = json.loads(cat_attrs)
            except: cat_attrs = {}

        subcategories = []
        for sub in (cat.subcategories or []):
            sub_attrs = sub.attributes_schema
            if isinstance(sub_attrs, str):
                try: sub_attrs = json.loads(sub_attrs)
                except: sub_attrs = []
            
            subcategories.append({
                "id": sub.id,
                "name_en": sub.name_en,
                "name_so": sub.name_so,
                "slug": sub.slug,
                "image_url": sub.image_url,
                "attributes_schema": sub_attrs,
                "subsubcategories": [
                    {
                        "id": ssub.id,
                        "name_en": ssub.name_en,
                        "name_so": ssub.name_so,
                        "slug": ssub.slug,
                        "image_url": ssub.image_url,
                    }
                    for ssub in (sub.subsubcategories or [])
                ],
            })

        cat_dict = {
            "id": cat.id,
            "name_en": cat.name_en,
            "name_so": cat.name_so,
            "slug": cat.slug,
            "icon_name": cat.icon_name,
            "image_url": cat.image_url,
            "attributes_schema": cat_attrs,
            "subcategories": subcategories,
        }
        result.append(cat_dict)
    
    # Store in cache
    _categories_cache["data"] = result
    _categories_cache["timestamp"] = current_time
    return result


@router.post("/categories", response_model=Any)
def create_category(
    *,
    db: Session = Depends(deps.get_db),
    category_in: dict,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create a new category (Admin only).
    """
    # Check if slug exists
    if crud_listing.get_category_by_slug(db, category_in["slug"]):
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    cat = Category(
        name_en=category_in["name_en"],
        name_so=category_in.get("name_so"),
        slug=category_in["slug"],
        icon_name=category_in["icon_name"],
        image_url=category_in.get("image_url"),
        attributes_schema=category_in.get("attributes_schema", {})
    )
    return crud_listing.create_category(db, category_in=cat)


@router.patch("/categories/{id}", response_model=Any)
def update_category(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    category_in: dict,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Update a category (Admin only).
    """
    category = db.get(Category, id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for field, value in category_in.items():
        if hasattr(category, field):
            setattr(category, field, value)
    
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{id}", response_model=Any)
def delete_category(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Delete a category (Admin only).
    """
    return crud_listing.remove_category(db, id=id)


@router.post("/subcategories", response_model=Any)
def create_subcategory(
    *,
    db: Session = Depends(deps.get_db),
    subcategory_in: dict,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create a new subcategory (Admin only).
    """
    from app.models.listing import SubCategory
    # Check if slug exists
    if crud_listing.get_subcategory_by_slug(db, subcategory_in["slug"]):
        raise HTTPException(status_code=400, detail="Subcategory slug already exists")
    
    subcat = SubCategory(
        name_en=subcategory_in["name_en"],
        name_so=subcategory_in.get("name_so"),
        slug=subcategory_in["slug"],
        image_url=subcategory_in.get("image_url"),
        category_id=subcategory_in["category_id"],
        attributes_schema=subcategory_in.get("attributes_schema", {})
    )
    return crud_listing.create_subcategory(db, subcategory_in=subcat)


@router.patch("/subcategories/{id}", response_model=Any)
def update_subcategory(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    subcategory_in: dict,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Update a subcategory (Admin only).
    """
    from app.models.listing import SubCategory
    subcat = db.get(SubCategory, id)
    if not subcat:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    
    return crud_listing.update_subcategory(db, db_obj=subcat, subcategory_in=subcategory_in)


@router.delete("/subcategories/{id}", response_model=Any)
def delete_subcategory(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Delete a subcategory (Admin only).
    """
    return crud_listing.remove_subcategory(db, id=id)


@router.post("/subsubcategories", response_model=Any)
def create_subsubcategory(
    *,
    db: Session = Depends(deps.get_db),
    subsubcategory_in: dict,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create a new sub-subcategory (Admin only).
    """
    # Check if slug exists
    if db.exec(select(SubSubCategory).where(SubSubCategory.slug == subsubcategory_in["slug"])).first():
        raise HTTPException(status_code=400, detail="Sub-subcategory slug already exists")
    
    subsubcat = SubSubCategory(
        name_en=subsubcategory_in["name_en"],
        name_so=subsubcategory_in.get("name_so"),
        slug=subsubcategory_in["slug"],
        image_url=subsubcategory_in.get("image_url"),
        subcategory_id=subsubcategory_in["subcategory_id"]
    )
    db.add(subsubcat)
    db.commit()
    db.refresh(subsubcat)
    return subsubcat


@router.patch("/subsubcategories/{id}", response_model=Any)
def update_subsubcategory(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    subsubcategory_in: dict,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Update a sub-subcategory (Admin only).
    """
    subsubcat = db.get(SubSubCategory, id)
    if not subsubcat:
        raise HTTPException(status_code=404, detail="Sub-subcategory not found")
    
    for field, value in subsubcategory_in.items():
        if hasattr(subsubcat, field):
            setattr(subsubcat, field, value)
    
    db.add(subsubcat)
    db.commit()
    db.refresh(subsubcat)
    return subsubcat


@router.delete("/subsubcategories/{id}", response_model=Any)
def delete_subsubcategory(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Delete a sub-subcategory (Admin only).
    """
    subsubcat = db.get(SubSubCategory, id)
    if not subsubcat:
        raise HTTPException(status_code=404, detail="Sub-subcategory not found")
    db.delete(subsubcat)
    db.commit()
    return subsubcat


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
@cache.cached(prefix="listings", ttl=60)
def read_listings(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[str] = None,
    owner_id: Optional[int] = None,
    q: Optional[str] = None,
    location: Optional[str] = None,
    attrs: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    status: Optional[str] = None,
    current_user: Optional[User] = Depends(deps.get_current_user_optional),
) -> Any:
    """
    Retrieve listings.
    category_id can be either a numeric ID or a category slug (e.g., 'animals')
    """
    attributes = None
    if attrs:
        import json
        try:
            attributes = json.loads(attrs)
        except:
            pass

    # Resolve category_id if it's a slug
    resolved_category_id = None
    if category_id:
        try:
            resolved_category_id = int(category_id)
        except ValueError:
            category = crud_listing.get_category_by_slug(db, slug=category_id)
            if category:
                resolved_category_id = category.id

    # Security: Only admins can filter by non-active statuses or see all statuses
    effective_status = status
    if not current_user or not current_user.is_admin:
        effective_status = "active"

    listings = crud_listing.get_listings(
        db, 
        skip=skip, 
        limit=limit, 
        category_id=resolved_category_id, 
        search=q,
        status=effective_status,
        location=location, 
        attributes=attributes, 
        owner_id=owner_id,
        min_price=min_price, 
        max_price=max_price,
    )
    return listings


@router.post("/", response_model=Listing)
def create_listing(
    *,
    db: Session = Depends(deps.get_db),
    listing_in: ListingBase,
    current_user: User = Depends(deps.get_current_active_user),
    owner_id: Optional[int] = None,
) -> Any:
    """
    Create new listing.
    Verified sellers: listing goes live immediately (status='active').
    Unverified sellers: listing requires admin approval (status='pending').
    """
    # Layer 6: Rate Limiting & Progressive Friction
    account_age = datetime.utcnow() - current_user.created_at
    
    # 1. Block messaging for first 24h is handled in messages endpoint
    
    # 2. Listing Limits
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    todays_count = db.exec(
        select(func.count(Listing.id)).where(
            Listing.owner_id == current_user.id,
            Listing.created_at >= today_start
        )
    ).one()

    if account_age < timedelta(hours=24):
        # Day 0: No listings allowed (Browse only)
        raise HTTPException(status_code=403, detail="New accounts must wait 24 hours before posting their first ad.")
    elif account_age < timedelta(days=3):
        # Day 1-3: Max 1 listing
        if todays_count >= 1:
            raise HTTPException(status_code=403, detail="New accounts are limited to 1 ad per day during their first 3 days.")
    elif account_age < timedelta(days=7):
        # Day 4-7: Max 3 listings
        if todays_count >= 3:
            raise HTTPException(status_code=403, detail="Accounts in their first week are limited to 3 ads per day.")

    # Layer 4: Risk Screening
    risk_score = calculate_listing_risk(listing_in.dict(), current_user, db)
    
    # Initial status based on verification and risk
    status = "pending"
    if current_user.is_verified and risk_score < 40:
        status = "active"
    elif risk_score >= 80:
        # High risk always needs manual review
        status = "pending"
        # Log high risk event
        db.add(AuditLog(
            user_id=current_user.id,
            action="HIGH_RISK_LISTING",
            resource_type="listing",
            resource_id=0, # Will update after creation
            details=f"Risk Score: {risk_score}"
        ))

    # Determine effective owner
    effective_owner_id = current_user.id
    if owner_id and current_user.is_admin:
        # Verify target user exists
        target_user = db.get(User, owner_id)
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user for impersonation not found")
        effective_owner_id = owner_id

    listing = crud_listing.create_listing(
        db=db, listing_in=listing_in, owner_id=effective_owner_id
    )
    listing.status = status
    db.add(listing)
    db.commit()
    db.refresh(listing)

    # Consolidated Audit Log
    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_LISTING",
        resource_type="listing",
        resource_id=listing.id,
        details=f"Listing created with status '{status}' (Risk Score: {risk_score})"
    ))

    # Track first-ad conversion for marketing referral codes
    if current_user.referral_code and not current_user.referral_listing_counted:
        mc = db.exec(select(MarketingCode).where(MarketingCode.code == current_user.referral_code)).first()
        if mc:
            mc.ads_posted_count += 1
            db.add(mc)
        current_user.referral_listing_counted = True
        db.add(current_user)

    db.commit()
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
    
    # Increment views
    listing.views += 1
    db.add(listing)
    db.commit()
    db.refresh(listing)
    
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
    crud_wallet.deduct_funds(db, wallet=wallet, amount=boost_config["price"], description=f"Boost: {listing.title_en}")
    
    listing.boost_level = boost_level
    listing.boost_expires_at = datetime.utcnow() + timedelta(days=boost_config["days"])
    db.add(listing)
    db.commit()
    return {"message": "Success", "expires_at": listing.boost_expires_at}
