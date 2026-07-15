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


@router.get("/categories/stats/shop-counts")
def get_shop_counts_by_category(
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get count of verified shops per category (by their active listings).
    Returns: { "category_id": shop_count, ... }
    """
    from sqlalchemy import text

    rows = db.execute(
        text("""
            SELECT l.category_id, COUNT(DISTINCT s.id) as shop_count
            FROM sellers s
            INNER JOIN listing l ON CAST(l.owner_id AS VARCHAR) = s.user_id AND l.status = 'active'
            WHERE s.is_active = true
            AND s.verification_status = 'verified'
            GROUP BY l.category_id
        """)
    ).fetchall()

    shop_counts: dict[int, int] = {}
    for row in rows:
        if row[0]:
            shop_counts[row[0]] = int(row[1])

    return shop_counts


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
async def create_listing(
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
    listing.status = "pending"  # Draft status - not visible yet
    listing.moderation_status = "pending"  # Waiting for admin review
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
        details=f"Listing created with status 'pending' (moderation_status='pending')"
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

    # Publish Kafka event for moderation
    try:
        from app.services.kafka_producer import publish_catalog_event, publish_notification_dispatch

        await publish_catalog_event(
            event_type="product.created_pending_moderation",
            payload={
                "listing_id": str(listing.id),
                "owner_id": str(effective_owner_id),
                "title": listing.title_en,
                "price": float(listing.price),
                "category_id": listing.category_id,
                "images": listing.images[:1] if listing.images else [],
                "description": (listing.description_en or "")[:100],
            },
            seller_id=str(effective_owner_id),
        )

        # Notify admins about pending moderation
        await publish_notification_dispatch(
            user_id="admin_team",
            event_type="catalog.product.pending_moderation",
            channels=["email", "push"],
            template="admin_listing_requires_moderation",
            data={
                "listing_id": str(listing.id),
                "seller_name": current_user.full_name or current_user.phone or f"User {current_user.id}",
                "title": listing.title_en,
                "price": f"{listing.price} {listing.currency}",
            },
        )

        # Notify seller of submission
        await publish_notification_dispatch(
            user_id=str(effective_owner_id),
            event_type="catalog.product.created_pending_moderation",
            channels=["push", "sms"],
            template="listing_submitted_for_review",
            data={
                "listing_id": str(listing.id),
                "title": listing.title_en,
            },
        )
    except Exception as e:
        import logging
        logging.getLogger("listings_api").warning(f"Failed to publish listing creation event: {e}")

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
                    "status": "pending",
                    "message": f"Your listing '{listing.title_en}' has been submitted for review. You'll be notified within 4 hours."
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
        title="Listing Submitted!",
        body=f"'{listing.title_en}' is under review. We'll notify you soon.",
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
    import json as _json

    # Try cache first (except for searches)
    cache_key = f"public_shops:{skip}:{limit}:{category_id or 'all'}"
    if not search and not shop_id:
        try:
            cached = cache.get(cache_key)
            if cached:
                return _json.loads(cached)
        except Exception:
            pass

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

        if category_id is not None:
            category_filter = "AND l.category_id = :category_id"
            params["category_id"] = category_id

        # Fast query: group shops with active listings
        query_str = f"""
            SELECT s.id, s.user_id, s.shop_name, s.owner_name,
                   s.shop_address, s.location_lat, s.location_lng,
                   s.verification_status, s.is_active, s.created_at,
                   COALESCE(s.shop_page_banner, u.shop_page_banner) as shop_page_banner,
                   MAX(l.created_at) as latest_listing,
                   COUNT(l.id) as listing_count
            FROM sellers s
            INNER JOIN listing l ON CAST(l.owner_id AS VARCHAR) = s.user_id AND l.status = 'active' {category_filter}
            LEFT JOIN "user" u ON CAST(u.id AS VARCHAR) = s.user_id
            WHERE s.verification_status = 'verified'
              AND s.is_active = true
              {search_filter}
            GROUP BY s.id, s.user_id, s.shop_name, s.owner_name,
                     s.shop_address, s.location_lat, s.location_lng,
                     s.verification_status, s.is_active, s.created_at,
                     s.shop_page_banner, u.shop_page_banner
            ORDER BY latest_listing DESC, s.id DESC
            OFFSET :skip LIMIT :limit
        """

        # Separate count query for total (runs fast without LIMIT)
        count_query_str = f"""
            SELECT COUNT(DISTINCT s.id)
            FROM sellers s
            INNER JOIN listing l ON CAST(l.owner_id AS VARCHAR) = s.user_id AND l.status = 'active' {category_filter}
            WHERE s.verification_status = 'verified'
              AND s.is_active = true
              {search_filter}
        """

        # Execute main query for paginated results
        query = text(query_str)
        result = db.execute(query, params)
        rows = result.fetchall()

        # Execute count query for total (fast - no LIMIT clause)
        count_query = text(count_query_str)
        total_shops = db.execute(count_query, params).scalar() or 0

        shops = []
        for row in rows:
            listing_count = int(row[12]) if len(row) > 12 and row[12] else 1
            shops.append({
                "id": str(row[0]),
                "user_id": str(row[1]),
                "shop_name": row[2],
                "owner_name": row[3],
                "category": None,
                "shop_address": row[4],
                "location_lat": row[5],
                "location_lng": row[6],
                "rating": 4.5,
                "is_verified": True,
                "listing_count": listing_count,
                "category_ids": [],
                "cover_image": None,
                "shop_page_banner": row[10],
                "slug": str(row[0]),
                "created_at": row[9].isoformat() if row[9] else None,
            })

        result_data = {"total": total_shops, "shops": shops}

        # Cache result - longer TTL for category-filtered (10 min) vs all shops (5 min)
        if not search and not shop_id:
            try:
                ttl = 600 if category_id else 300  # 10 min for category, 5 min for all
                cache.set(cache_key, _json.dumps(result_data, default=str), ttl=ttl)
            except Exception:
                pass

        return result_data
    except Exception as e:
        print(f"Error in get_public_shops: {str(e)}")
        return {"total": 0, "shops": []}


@router.get("/shops/{user_id}/banners")
def get_shop_banners(
    *,
    user_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get shop banners for a specific user/shop.
    Lightweight endpoint - returns only banner URLs (no auth required).
    """
    try:
        user = db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Shop not found")

        return {
            "user_id": user_id,
            "shop_page_banner": user.shop_page_banner,
            "shop_detail_banner": user.shop_detail_banner
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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


@router.get("/admin/duplicates")
def find_duplicate_shops(db: Session = Depends(deps.get_db)):
    """Find all users with multiple seller accounts"""
    try:
        from sqlalchemy import text

        query = text("""
            SELECT user_id, COUNT(*) as shop_count,
                   array_agg(id) as ids,
                   array_agg(shop_name) as shop_names,
                   array_agg(created_at) as created_dates
            FROM sellers
            WHERE is_active = true
            AND verification_status = 'verified'
            GROUP BY user_id
            HAVING COUNT(*) > 1
            ORDER BY shop_count DESC
        """)

        result = db.execute(query)
        rows = result.fetchall()

        duplicates = []
        for row in rows:
            duplicates.append({
                "user_id": row[0],
                "shop_count": row[1],
                "shop_ids": row[2],
                "shop_names": row[3],
                "created_dates": [d.isoformat() if d else None for d in row[4]]
            })

        return {
            "total_duplicate_users": len(duplicates),
            "duplicates": duplicates
        }
    except Exception as e:
        print(f"Error finding duplicates: {str(e)}")
        return {"total_duplicate_users": 0, "duplicates": []}


@router.post("/admin/merge-duplicates")
def merge_duplicate_shops(
    user_id: str,
    keep_shop_id: str = None,
    db: Session = Depends(deps.get_db)
):
    """Merge duplicate shops for a user, keeping one and deactivating others"""
    try:
        from sqlalchemy import text

        # Get all shops for this user
        shops_query = text("SELECT id, created_at FROM sellers WHERE user_id = :user_id ORDER BY created_at DESC")
        result = db.execute(shops_query, {"user_id": user_id})
        shops = result.fetchall()

        if len(shops) <= 1:
            return {"message": "User has only one shop, no merge needed"}

        # Keep the newest one (first in ordered results) unless specified
        keeper_id = keep_shop_id or shops[0][0]

        # Deactivate all other shops
        deactivated = []
        for shop_id, _ in shops:
            if shop_id != keeper_id:
                update_query = text("UPDATE sellers SET is_active = false WHERE id = :id")
                db.execute(update_query, {"id": shop_id})
                deactivated.append(shop_id)

        db.commit()

        return {
            "message": f"Merged {len(deactivated)} duplicate shops",
            "kept_shop_id": keeper_id,
            "deactivated_shop_ids": deactivated
        }
    except Exception as e:
        db.rollback()
        print(f"Error merging shops: {str(e)}")
        return {"error": str(e)}


# ============== MODERATION ENDPOINTS ==============

@router.post("/{listing_id}/approve")
async def approve_listing(
    listing_id: int,
    moderation_notes: Optional[str] = None,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Admin approves a listing for visibility.

    Published Events:
    - catalog.product.approved → Update search index, notify seller
    """
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.moderation_status = "approved"
    listing.status = "active"
    listing.moderated_at = datetime.utcnow()
    listing.moderator_id = current_user.id
    listing.moderation_notes = moderation_notes

    db.add(listing)
    db.commit()
    db.refresh(listing)

    # Publish Kafka event
    try:
        from app.services.kafka_producer import publish_catalog_event, publish_notification_dispatch

        await publish_catalog_event(
            event_type="product.approved",
            payload={
                "listing_id": str(listing.id),
                "owner_id": str(listing.owner_id),
                "title": listing.title_en,
                "approved_by": current_user.full_name or f"Admin {current_user.id}",
            },
            seller_id=str(listing.owner_id),
        )

        # Notify seller
        await publish_notification_dispatch(
            user_id=str(listing.owner_id),
            event_type="catalog.product.approved",
            channels=["email", "sms", "push"],
            template="listing_approved",
            data={
                "listing_id": str(listing.id),
                "title": listing.title_en,
                "price": f"{listing.price} {listing.currency}",
            },
        )
    except Exception as e:
        # Kafka may not be available, log but don't fail
        import logging
        logging.getLogger("listings_api").warning(f"Failed to publish approval event: {e}")

    return {"status": "approved", "listing_id": listing.id}


@router.post("/{listing_id}/reject")
async def reject_listing(
    listing_id: int,
    rejection_reason: str,
    moderation_notes: Optional[str] = None,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Admin rejects a listing.

    Published Events:
    - catalog.product.rejected → Hide from search, notify seller with reason
    """
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.moderation_status = "rejected"
    listing.status = "deleted"
    listing.rejection_reason = rejection_reason
    listing.moderated_at = datetime.utcnow()
    listing.moderator_id = current_user.id
    listing.moderation_notes = moderation_notes

    db.add(listing)
    db.commit()
    db.refresh(listing)

    # Publish Kafka event
    try:
        from app.services.kafka_producer import publish_catalog_event, publish_notification_dispatch

        await publish_catalog_event(
            event_type="product.rejected",
            payload={
                "listing_id": str(listing.id),
                "owner_id": str(listing.owner_id),
                "rejection_reason": rejection_reason,
                "rejected_by": current_user.full_name or f"Admin {current_user.id}",
            },
            seller_id=str(listing.owner_id),
        )

        # Notify seller
        await publish_notification_dispatch(
            user_id=str(listing.owner_id),
            event_type="catalog.product.rejected",
            channels=["email", "sms"],
            template="listing_rejected",
            data={
                "listing_id": str(listing.id),
                "title": listing.title_en,
                "rejection_reason": rejection_reason,
                "support_contact": "support@suqafuran.com",
            },
        )
    except Exception as e:
        import logging
        logging.getLogger("listings_api").warning(f"Failed to publish rejection event: {e}")

    return {"status": "rejected", "listing_id": listing.id, "reason": rejection_reason}


@router.get("/{listing_id}/moderation-status")
def get_listing_moderation_status(
    listing_id: int,
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get moderation status of a listing (seller can check their own).
    """
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "listing_id": listing.id,
        "moderation_status": listing.moderation_status,
        "status": listing.status,
        "moderated_at": listing.moderated_at,
        "rejection_reason": listing.rejection_reason,
        "moderation_notes": listing.moderation_notes if current_user.is_admin else None,
    }


# ============== FEATURED LISTING (PAID AD) ENDPOINTS ==============

@router.post("/{listing_id}/feature")
async def feature_listing(
    listing_id: int,
    boost_level: str,  # "basic", "vip", "diamond"
    payment_method: str,  # "mpesa", "stripe"
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Seller pays to feature a listing (boost visibility).

    Pricing:
    - basic: 5,000 SOS / 30 days
    - vip: 15,000 SOS / 30 days
    - diamond: 50,000 SOS / 30 days

    Published Events:
    - payments.featured_listing.initiated → Send payment prompt
    """
    from app.models.featured_listing import FeaturedListing

    # Validate listing exists and belongs to user
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Listing not owned by you")

    if listing.moderation_status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Listing must be approved before featuring"
        )

    # Pricing map
    PRICING = {
        "basic": {"amount": 5000, "duration": 30},
        "vip": {"amount": 15000, "duration": 30},
        "diamond": {"amount": 50000, "duration": 30},
    }

    if boost_level not in PRICING:
        raise HTTPException(status_code=400, detail="Invalid boost level")

    pricing = PRICING[boost_level]
    amount = pricing["amount"]
    duration_days = pricing["duration"]

    # Create FeaturedListing (payment pending)
    featured = FeaturedListing(
        listing_id=listing_id,
        owner_id=current_user.id,
        boost_level=boost_level,
        amount_paid=amount,
        currency="SOS",
        duration_days=duration_days,
        payment_method=payment_method,
        status="pending",
        payment_status="pending",
    )
    db.add(featured)
    db.commit()
    db.refresh(featured)

    # Publish Kafka event
    try:
        from app.services.kafka_producer import publish_payment_event, publish_notification_dispatch

        await publish_payment_event(
            event_type="featured_listing.payment_initiated",
            payload={
                "featured_listing_id": str(featured.id),
                "listing_id": str(listing_id),
                "boost_level": boost_level,
                "amount": amount,
                "duration_days": duration_days,
            },
            order_id=str(featured.id),
            user_id=str(current_user.id),
        )

        # Send payment prompt
        await publish_notification_dispatch(
            user_id=str(current_user.id),
            event_type="payments.featured_listing.initiated",
            channels=["sms", "push"],
            template="feature_listing_payment_prompt",
            data={
                "listing_title": listing.title_en,
                "boost_level": boost_level,
                "amount": amount,
                "featured_id": str(featured.id),
            },
        )
    except Exception as e:
        import logging
        logging.getLogger("listings_api").warning(f"Failed to publish feature event: {e}")

    return {
        "featured_listing_id": featured.id,
        "status": "pending",
        "payment_required": {
            "amount": amount,
            "currency": "SOS",
            "boost_level": boost_level,
            "duration_days": duration_days,
        },
        "next_step": f"Complete payment via {payment_method}",
    }


@router.post("/webhooks/featured-payment-success")
async def on_featured_listing_payment_success(
    featured_listing_id: int,
    payment_reference: str,
    amount_paid: float,
    *,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Webhook called when M-Pesa/Stripe payment succeeds for featured listing.

    Published Events:
    - payments.featured_listing.success → Notify seller, update analytics
    """
    from app.models.featured_listing import FeaturedListing

    featured = db.get(FeaturedListing, featured_listing_id)
    if not featured:
        raise HTTPException(status_code=404, detail="Featured listing not found")

    featured.payment_status = "success"
    featured.status = "active"
    featured.payment_reference = payment_reference
    featured.activated_at = datetime.utcnow()
    featured.expires_at = datetime.utcnow() + timedelta(days=featured.duration_days)
    db.add(featured)

    # Update listing boost level
    listing = db.get(Listing, featured.listing_id)
    boost_map = {"basic": 1, "vip": 2, "diamond": 3}
    listing.boost_level = boost_map.get(featured.boost_level, 0)
    listing.boost_expires_at = featured.expires_at
    db.add(listing)
    db.commit()

    # Publish Kafka event
    try:
        from app.services.kafka_producer import publish_payment_event, publish_notification_dispatch

        await publish_payment_event(
            event_type="featured_listing.payment_success",
            payload={
                "featured_listing_id": str(featured_listing_id),
                "listing_id": str(featured.listing_id),
                "amount": amount_paid,
                "expires_at": featured.expires_at.isoformat(),
            },
            order_id=str(featured_listing_id),
            user_id=str(featured.owner_id),
        )

        # Notify seller
        await publish_notification_dispatch(
            user_id=str(featured.owner_id),
            event_type="payments.featured_listing.success",
            channels=["email", "sms", "push"],
            template="feature_listing_payment_confirmed",
            data={
                "listing_title": listing.title_en,
                "boost_level": featured.boost_level,
                "amount": amount_paid,
                "expires_date": featured.expires_at.strftime("%B %d, %Y"),
            },
        )
    except Exception as e:
        import logging
        logging.getLogger("listings_api").warning(f"Failed to publish success event: {e}")

    return {"status": "activated"}


@router.post("/webhooks/featured-payment-failed")
async def on_featured_listing_payment_failed(
    featured_listing_id: int,
    failure_reason: str,
    *,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Webhook called when payment fails for featured listing.

    Published Events:
    - payments.featured_listing.failed → Notify seller to retry
    """
    from app.models.featured_listing import FeaturedListing

    featured = db.get(FeaturedListing, featured_listing_id)
    if not featured:
        raise HTTPException(status_code=404, detail="Featured listing not found")

    featured.payment_status = "failed"
    db.add(featured)
    db.commit()

    # Publish Kafka event
    try:
        from app.services.kafka_producer import publish_payment_event, publish_notification_dispatch

        await publish_payment_event(
            event_type="featured_listing.payment_failed",
            payload={
                "featured_listing_id": str(featured_listing_id),
                "listing_id": str(featured.listing_id),
                "failure_reason": failure_reason,
            },
            order_id=str(featured_listing_id),
            user_id=str(featured.owner_id),
        )

        # Notify seller
        listing = db.get(Listing, featured.listing_id)
        await publish_notification_dispatch(
            user_id=str(featured.owner_id),
            event_type="payments.featured_listing.failed",
            channels=["email", "sms", "push"],
            template="feature_listing_payment_failed",
            data={
                "listing_title": listing.title_en,
                "amount": featured.amount_paid,
                "failure_reason": failure_reason,
            },
        )
    except Exception as e:
        import logging
        logging.getLogger("listings_api").warning(f"Failed to publish failure event: {e}")

    return {"status": "failed", "reason": failure_reason}
