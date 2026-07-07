from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, BackgroundTasks, Header
from sqlmodel import Session, select, func
from app.api import deps
from app.crud import crud_listing
from app.models.listing import Listing, ListingBase, ListingRead, Category, SubCategory, SubSubCategory
from app.core.metrics import LISTINGS_CREATED_TOTAL
from app.models.user import User
from app.models.audit import AuditLog
from app.models.marketing_code import MarketingCode
from app.services.cache_service import cache
from app.services.security_service import security_service
from app.services.moderation_service import moderation_service
from app.services.ai_service import ai_service
from app.core.security import risk_security
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
        url, phash = await storage_service.upload_file(contents, filename)
        
        # AI Image Intelligence moved to background
        from app.services.ai_service import ai_service
        background_tasks.add_task(ai_service.analyze_image, url)
        
        return {
            "filename": filename, 
            "url": url,
            "phash": phash,
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
            url, phash = await storage_service.upload_file(contents, filename)
            results.append({
                "filename": filename, 
                "url": url,
                "phash": phash
            })
        except Exception as e:
            # For multiple uploads, we might just skip the failed ones or log them
            continue
    
    return results


@router.post("/upload-video")
async def upload_video(
    *,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Upload a video for a listing (up to 100 MB)."""
    extension = file.filename.split(".")[-1].lower()
    if extension not in settings.ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Video format not supported. Use mp4, webm, or mov.")

    contents = await file.read(settings.MAX_VIDEO_SIZE + 1)
    if len(contents) > settings.MAX_VIDEO_SIZE:
        raise HTTPException(status_code=400, detail="Video too large. Max 100 MB.")

    filename = f"vid_{uuid.uuid4()}.{extension}"
    try:
        url, _ = await storage_service.upload_file(contents, filename)
        return {"filename": filename, "url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload video: {str(e)}")


@router.get("/categories", response_model=List[Any])
def read_categories(
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve categories with subcategories.
    Includes active_listing_count so clients can filter to categories
    that actually have live ads.
    """
    import json
    from sqlalchemy import text

    # Single efficient query: count active listings per category
    rows = db.execute(
        text(
            """
            SELECT l.category_id, COUNT(*) AS cnt
            FROM listing l
            JOIN "user" u ON u.id = l.owner_id
            WHERE l.status = 'active'
              AND u.is_suspended = false
            GROUP BY l.category_id
            """
        )
    ).fetchall()
    active_counts: dict[int, int] = {row.category_id: row.cnt for row in rows}

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
            "active_listing_count": active_counts.get(cat.id, 0),
        }
        result.append(cat_dict)

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
    result = crud_listing.create_category(db, category_in=cat)
    cache.delete_pattern("cache:categories:*")
    return result


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
    cache.delete_pattern("cache:categories:*")
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
    result = crud_listing.remove_category(db, id=id)
    cache.delete_pattern("cache:categories:*")
    return result


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
    result = crud_listing.create_subcategory(db, subcategory_in=subcat)
    cache.delete_pattern("cache:categories:*")
    return result


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
    
    result = crud_listing.update_subcategory(db, db_obj=subcat, subcategory_in=subcategory_in)
    cache.delete_pattern("cache:categories:*")
    return result


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
    result = crud_listing.remove_subcategory(db, id=id)
    cache.delete_pattern("cache:categories:*")
    return result


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
    cache.delete_pattern("cache:categories:*")
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
    cache.delete_pattern("cache:categories:*")
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
    cache.delete_pattern("cache:categories:*")
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


def _listings_fully_loaded(listings: List[ListingRead]) -> bool:
    """Guards against caching a result where the owner relationship is missing
    for a listing that has an owner_id."""
    return all(l.owner is not None for l in listings if l.owner_id)


@router.get("/", response_model=List[ListingRead])
@cache.cached(prefix="listings", ttl=60, should_cache=_listings_fully_loaded)
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
            else:
                # Unknown category slug: return no results rather than
                # silently dropping the filter and returning everything.
                return []

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
    # Convert to the read schema here (rather than relying on response_model to do it
    # after the fact) so the cache decorator stores/replays the same shape. `owner` is
    # a SQLAlchemy Relationship() on the raw Listing table model, not a Pydantic field,
    # so jsonable_encoder silently drops it when caching raw ORM objects — every cache
    # *write* was correct in memory but lost `owner` on serialization, then every cache
    # *hit* served it back as null. ListingRead declares `owner` as a real field, so
    # encoding it (for cache storage) round-trips correctly.
    return [ListingRead.model_validate(l) for l in listings]


@router.post("/", response_model=Listing)
def create_listing(
    *,
    db: Session = Depends(deps.get_db),
    listing_in: ListingBase,
    current_user: User = Depends(deps.get_current_active_user),
    owner_id: Optional[int] = None,
    x_device_fingerprint: Optional[str] = Header(None),
) -> Any:
    """
    Create new listing.
    """
    # Prevent duplicated active listings from the same user (allow reposting sold/closed/deleted ones)
    existing_duplicate = db.exec(
        select(Listing).where(
            Listing.owner_id == current_user.id,
            Listing.title_en == listing_in.title_en,
            Listing.status.in_(["active", "pending"])
        )
    ).first()
    if existing_duplicate:
        raise HTTPException(status_code=400, detail="Duplicate product detected. You have already posted a listing with this title.")
    # 1. Device Intelligence & Fingerprinting
    if x_device_fingerprint:
        device = security_service.get_or_create_device(db, x_device_fingerprint, {})
        security_service.link_user_to_device(db, current_user, device)
        if device.is_banned:
            raise HTTPException(status_code=403, detail="Access denied for this device.")

    # 2. Risk-Based Rate Limiting
    risk_security.check_listing_limit(current_user)

    # 3. Messaging & Content Moderation
    flags = moderation_service.analyze_listing(
        db, 
        current_user, 
        listing_in.title_en, 
        listing_in.description_en or "", 
        listing_in.price
    )
    
    # Layer 3.5: Duplicate Image Detection (PHash)
    if listing_in.image_hashes:
        for h in listing_in.image_hashes:
            if not h: continue
            # Check if this hash exists in other listings (not by this user)
            # In a real system, we'd use a specialized vector DB or Hamming distance index
            # For now, exact hash match for identifying repeated farm accounts
            # Fix: cast JSON to JSONB for proper containment check in PostgreSQL
            from sqlalchemy.dialects.postgresql import JSONB
            from sqlalchemy import cast
            
            duplicates = db.query(Listing).filter(
                cast(Listing.image_hashes, JSONB).contains([h]),
                Listing.owner_id != current_user.id
            ).count()
            
            if duplicates > 0:
                flags.append("duplicate_image_detected")
                break
    
    # Layer 4: AI Analysis
    ai_mod = ai_service.check_moderation(listing_in.dict())
    
    # Layer 6: Status Logic
    status = "active"
    
    # Determine effective owner (Admin impersonation support)
    effective_owner_id = current_user.id
    if owner_id and current_user.is_admin:
        target_user = db.get(User, owner_id)
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user for impersonation not found")
        effective_owner_id = owner_id

    listing = crud_listing.create_listing(db, listing_in=listing_in, owner_id=effective_owner_id)
    listing.status = status
    db.add(listing)
    db.commit()
    db.refresh(listing)

    # Track business metric
    try:
        category_name = "unknown"
        if listing.category_id:
            cat = db.get(Category, listing.category_id)
            if cat:
                category_name = cat.name_en
        
        LISTINGS_CREATED_TOTAL.labels(
            category=category_name,
            location=listing.location or "unknown"
        ).inc()
    except Exception:
        pass # Never fail request due to metrics

    # Consolidated Audit Log
    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_LISTING",
        resource_type="listing",
        resource_id=listing.id,
        details=f"Listing created with status '{status}'"
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
    db.refresh(listing)

    # In-app notification for ad posting
    from app.crud.crud_notification import crud_notification
    try:
        crud_notification.create(
            db,
            obj_in={
                "type": "ad_posted",
                "data": {
                    "listing_id": listing.id,
                    "title": listing.title_en,
                    "status": status,
                    "message": f"Your listing '{listing.title_en}' has been successfully created and is now {status}!"
                }
            },
            user_id=effective_owner_id
        )
    except Exception:
        pass

    # Push notification for ad posted
    from app.utils.push import send_push_to_user
    send_push_to_user(
        db,
        user_id=effective_owner_id,
        title="Ad Posted Successfully!",
        body=f"'{listing.title_en}' is now {status} on Suqafuran.",
        data={"type": "ad_posted", "listing_id": str(listing.id), "path": f"/listing/{listing.id}"}
    )

    return listing




@router.get("/shops")
def get_public_shops(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    shop_id: Optional[str] = None,
    category_id: Optional[int] = None,
) -> Any:
    """
    Get all verified shops/sellers that have at least one active listing.
    Optionally filter by category_id.
    """
    from sqlalchemy import text
    try:
        # Build filters
        search_filter = ""
        category_filter = ""
        params = {"skip": skip, "limit": limit}

        if search:
            search_filter = "AND (s.shop_name ILIKE :search OR s.category ILIKE :search)"
            params["search"] = f"%{search}%"

        if shop_id:
            search_filter += " AND s.id = :shop_id"
            params["shop_id"] = shop_id

        if category_id:
            category_filter = "AND l.category_id = :category_id"
            params["category_id"] = category_id

        # Fastest query: just get verified active sellers (assuming data integrity)
        query_str = f"""
            SELECT s.id, s.user_id, s.shop_name, s.owner_name, s.category,
                   s.shop_address, s.location_lat, s.location_lng,
                   s.verification_status, s.is_active, s.created_at
            FROM sellers s
            WHERE s.verification_status = 'verified'
              AND s.is_active = true
              {search_filter}
            ORDER BY s.created_at DESC
            OFFSET :skip LIMIT :limit
        """

        subquery = query_str

        query = text(subquery)

        result = db.execute(query, params)
        rows = result.fetchall()

        shops = []
        for row in rows:
            # Grabbing the cover image from the first listing
            cover_image = None

            # Build category filter for cover image if category is selected
            category_filter = ""
            listing_params = {"owner_id": int(row[1])}
            if category_id:
                category_filter = "AND (category_id = :category_id OR subcategory_id = :category_id OR subsubcategory_id = :category_id)"
                listing_params["category_id"] = category_id

            first_listing_query = text(f"""
                SELECT images FROM listing
                WHERE status = 'active'
                AND owner_id = :owner_id
                {category_filter}
                LIMIT 1
            """)
            try:
                owner_id_val = int(row[1])
            except Exception:
                owner_id_val = -1

            first_listing_res = db.execute(first_listing_query, listing_params).first()
            if first_listing_res and first_listing_res[0]:
                import json as _json
                try:
                    imgs = _json.loads(first_listing_res[0]) if isinstance(first_listing_res[0], str) else first_listing_res[0]
                    cover_image = imgs[0] if imgs else None
                except Exception:
                    cover_image = first_listing_res[0]

            # Use cover_image from first listing (or category fallback)
            shops.append({
                "id": str(row[0]),
                "user_id": str(row[1]),
                "shop_name": row[2],
                "owner_name": row[3],
                "category": row[4],
                "shop_address": row[5],
                "location_lat": row[6],
                "location_lng": row[7],
                "rating": 4.5,
                "is_verified": True,
                "listing_count": None,
                "category_ids": [],
                "cover_image": cover_image,
                "slug": str(row[0]),
                "created_at": row[10].isoformat() if row[10] else None,
            })

        # Return without count query (too slow) - frontend doesn't strictly need it
        return {"total": len(shops), "shops": shops}
    except Exception as e:
        print(f"Error in get_public_shops: {str(e)}")
        return {"total": 0, "shops": []}


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
    
    # Query for owner's active business storefront and attach it
    listing_data = ListingRead.model_validate(listing)
    if listing_data.owner:
        from app.models.business import Business
        from sqlmodel import select
        business = db.exec(select(Business).where(Business.owner_id == listing.owner_id, Business.is_active == True)).first()
        if business:
            listing_data.owner.business = {
                "name": business.name,
                "slug": business.slug,
                "logo_url": business.logo_url,
                "banner_url": business.banner_url,
                "category": business.category,
                "is_verified": business.is_verified,
            }
    
    return listing_data



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
    
    from datetime import datetime as dt
    for field, value in listing_in.items():
        if hasattr(listing, field):
            setattr(listing, field, value)

    # Auto-set sold_at when is_sold becomes True
    if listing_in.get('is_sold') is True and not listing.sold_at:
        listing.sold_at = dt.utcnow()
    # Keep status in sync: marking sold → status = "sold"
    if listing_in.get('is_sold') is True:
        listing.status = 'sold'

    listing.updated_at = dt.utcnow()
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
