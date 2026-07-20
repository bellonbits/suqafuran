from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from database import get_db
from models import Seller, Category, Listing, ShopReview, ShopFeedback, ShopFollow
from typing import List, Optional
import json
import asyncio
from datetime import datetime

# Main marketplace router
router = APIRouter(tags=["marketplace"])

# Separate router for listings endpoints (at /listings prefix)
listings_router = APIRouter(prefix="/listings", tags=["listings"])

# Separate router for admin endpoints (at /admin prefix)
admin_router = APIRouter(prefix="/admin", tags=["admin"])

# Notifications router
notifications_router = APIRouter(prefix="/notifications", tags=["notifications"])


@listings_router.get("/categories")
def list_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get all categories"""
    try:
        from sqlalchemy import text
        rows = db.execute(
            text("SELECT id, name_en, name_so, slug, icon_name, image_url FROM category ORDER BY id OFFSET :skip LIMIT :limit"),
            {"skip": skip, "limit": limit}
        ).fetchall()
        return [
            {
                "id": row.id,
                "name_en": row.name_en,
                "name_so": row.name_so,
                "slug": row.slug,
                "icon_name": row.icon_name,
                "image_url": row.image_url,
                "subcategories": []
            }
            for row in rows
        ]
    except Exception as e:
        import traceback; traceback.print_exc()
        return []


@listings_router.get("/")
def list_listings(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get marketplace listings"""
    try:
        query = db.query(Listing).filter(Listing.status == "active")

        if category_id:
            query = query.filter(Listing.category_id == category_id)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Listing.title_en.ilike(search_term)) |
                (Listing.description_en.ilike(search_term))
            )

        listings = query.offset(skip).limit(limit).all()

        return [
            {
                "id": listing.id,
                "title_en": listing.title_en,
                "title_so": listing.title_so,
                "description_en": listing.description_en,
                "price": listing.price,
                "images": listing.images,
                "status": listing.status,
                "category_id": listing.category_id,
                "owner_id": listing.owner_id,
                "created_at": listing.created_at.isoformat() if listing.created_at else None
            }
            for listing in listings
        ]
    except Exception as e:
        return []


@listings_router.get("/shops")
def list_public_shops(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Public endpoint: Get verified sellers/shops that have at least 1 active listing.
    Returns seller profile enriched with listing count and categories.
    """
    try:
        from sqlalchemy import text
        search_clause = ""
        params = {"skip": skip, "limit": limit}
        if search:
            search_clause = "AND (s.shop_name ILIKE :search OR s.category ILIKE :search)"
            params["search"] = f"%{search}%"

        query = text(f"""
            SELECT DISTINCT ON (s.user_id) s.id, s.user_id, s.shop_name, s.owner_name, s.category,
                   s.shop_address, s.location_lat, s.location_lng,
                   s.verification_status, s.is_active, s.created_at,
                   COUNT(DISTINCT l.id) as listing_count
            FROM sellers s
            JOIN listing l ON l.status = 'active' AND CAST(l.owner_id AS TEXT) = s.user_id
            WHERE s.verification_status = 'verified'
            AND s.is_active = true
            {search_clause}
            GROUP BY s.id, s.user_id, s.shop_name, s.owner_name, s.category,
                     s.shop_address, s.location_lat, s.location_lng,
                     s.verification_status, s.is_active, s.created_at
            HAVING COUNT(DISTINCT l.id) >= 1
            ORDER BY s.user_id, s.created_at DESC
            OFFSET :skip LIMIT :limit
        """)

        result = db.execute(query, params)
        rows = result.fetchall()

        shops = []
        for row in rows:
            # Grabbing distinct category ids for this seller
            cat_query = text("""
                SELECT DISTINCT category_id FROM listing 
                WHERE status = 'active'
                AND owner_id = :owner_id
                AND category_id IS NOT NULL
            """)
            try:
                owner_id_val = int(row[1])
            except Exception:
                owner_id_val = -1

            cat_res = db.execute(cat_query, {"owner_id": owner_id_val}).fetchall()
            cat_ids = [r[0] for r in cat_res if r[0]]

            if category_id and category_id not in cat_ids:
                continue

            # Grab first listing image as cover
            cover_image = None
            first_listing_query = text("""
                SELECT images FROM listing 
                WHERE status = 'active'
                AND owner_id = :owner_id
                LIMIT 1
            """)
            first_listing_res = db.execute(first_listing_query, {"owner_id": owner_id_val}).first()
            if first_listing_res and first_listing_res[0]:
                import json as _json
                try:
                    imgs = _json.loads(first_listing_res[0]) if isinstance(first_listing_res[0], str) else first_listing_res[0]
                    cover_image = imgs[0] if imgs else None
                except Exception:
                    cover_image = first_listing_res[0]

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
                "listing_count": row[11],
                "category_ids": cat_ids,
                "cover_image": cover_image,
                "slug": str(row[0]),
                "created_at": row[10].isoformat() if row[10] else None,
            })

        # Get total count (distinct by user_id to match the query above)
        count_query = text(f"""
            SELECT COUNT(DISTINCT s.user_id)
            FROM sellers s
            JOIN listing l ON l.status = 'active' AND CAST(l.owner_id AS TEXT) = s.user_id
            WHERE s.verification_status = 'verified'
            AND s.is_active = true
            {search_clause}
        """)
        total_res = db.execute(count_query, {k: v for k, v in params.items() if k not in ("skip", "limit")}).first()
        total = total_res[0] if total_res else len(shops)

        return {"total": total, "shops": shops}
    except Exception as e:
        print(f"Error in list_public_shops: {str(e)}")
        return {"total": 0, "shops": []}



@admin_router.get("/shops")
def list_shops(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get marketplace shops/sellers - only verified sellers with at least 1 listing"""
    try:
        from sqlalchemy import text, func

        # Use raw SQL to efficiently find sellers with listings, deduplicating by user_id
        # Filter only numeric user_ids to avoid CAST errors
        query = text("""
            SELECT DISTINCT ON (s.user_id) s.id, s.user_id, s.shop_name, s.owner_name, s.phone, s.email,
                   s.shop_address, s.location_lat, s.location_lng, s.created_at,
                   s.verification_status, s.is_active
            FROM sellers s
            INNER JOIN listing l ON CAST(s.user_id AS INTEGER) = l.owner_id
            WHERE s.is_active = true
            AND s.verification_status = 'verified'
            AND l.status = 'active'
            AND s.user_id ~ '^[0-9]+$'
            ORDER BY s.user_id, s.created_at DESC
            OFFSET :skip
            LIMIT :limit
        """)

        result = db.execute(query, {"skip": skip, "limit": limit})
        rows = result.fetchall()

        sellers = []
        for row in rows:
            sellers.append({
                "id": row[0],
                "user_id": row[1],
                "shop_name": row[2],
                "owner_name": row[3],
                "phone": row[4],
                "email": row[5],
                "shop_address": row[6],
                "location_lat": row[7],
                "location_lng": row[8],
                "rating": 5.0,
                "is_verified": row[10] == "verified",
                "created_at": row[9].isoformat() if row[9] else None
            })

        return sellers
    except Exception as e:
        return []


@listings_router.get("/{category_id}")
def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """Get category details"""
    try:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        return {
            "id": category.id,
            "name_en": category.name_en,
            "name_so": category.name_so,
            "slug": category.slug,
            "icon_name": category.icon_name,
            "image_url": category.image_url
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@admin_router.get("/duplicate-shops")
def find_duplicate_shops(db: Session = Depends(get_db)):
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


@admin_router.post("/merge-shops")
def merge_duplicate_shops(
    user_id: str,
    keep_shop_id: str = None,
    db: Session = Depends(get_db)
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
        for shop_id, _ in shops[1:]:
            if shop_id != keeper_id:
                update_query = text("UPDATE sellers SET is_active = false WHERE id = :id")
                db.execute(update_query, {"id": shop_id})

        db.commit()

        return {
            "message": f"Merged {len(shops) - 1} duplicate shops",
            "kept_shop_id": keeper_id,
            "deactivated_shop_ids": [s[0] for s in shops[1:] if s[0] != keeper_id]
        }
    except Exception as e:
        db.rollback()
        print(f"Error merging shops: {str(e)}")
        return {"error": str(e)}


@notifications_router.websocket("/ws")
def get_shop_reviews(
    shop_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all reviews for a shop"""
    try:
        from models import ShopReview, Seller
        from sqlalchemy import func

        # Get the seller by ID (shop_id is the seller ID)
        seller = db.query(Seller).filter(Seller.id == shop_id).first()
        if not seller:
            raise HTTPException(status_code=404, detail="Shop not found")

        # Get reviews
        reviews = db.query(ShopReview).filter(
            ShopReview.seller_id == shop_id
        ).order_by(ShopReview.created_at.desc()).offset(skip).limit(limit).all()

        # Calculate stats
        total_reviews = db.query(func.count(ShopReview.id)).filter(
            ShopReview.seller_id == shop_id
        ).scalar()

        avg_rating = db.query(func.avg(ShopReview.rating)).filter(
            ShopReview.seller_id == shop_id
        ).scalar()

        verified_count = db.query(func.count(ShopReview.id)).filter(
            ShopReview.seller_id == shop_id,
            ShopReview.is_verified_purchase == True
        ).scalar()

        return {
            "reviews": [
                {
                    "id": r.id,
                    "display_name": r.display_name or "Anonymous",
                    "rating": r.rating,
                    "review": r.review,
                    "is_verified_purchase": r.is_verified_purchase,
                    "reviewer_email": r.reviewer_email,
                    "created_at": r.created_at.isoformat() if r.created_at else None
                }
                for r in reviews
            ],
            "average_rating": float(avg_rating) if avg_rating else 0,
            "total_reviews": total_reviews or 0,
            "verified_reviews_count": verified_count or 0
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching reviews: {str(e)}")
        return {
            "reviews": [],
            "average_rating": 0,
            "total_reviews": 0,
            "verified_reviews_count": 0
        }


@listings_router.post("/shops/{shop_id}/reviews")
def create_shop_review(
    shop_id: str,
    review_data: dict,
    db: Session = Depends(get_db)
):
    """Submit a review for a shop"""
    try:
        from models import ShopReview, Seller

        # Get shop
        seller = db.query(Seller).filter(Seller.id == shop_id).first()
        if not seller:
            raise HTTPException(status_code=404, detail="Shop not found")

        # Extract review data
        user_id = review_data.get("user_id")
        reviewer_email = review_data.get("reviewer_email")
        rating = review_data.get("rating")
        review_text = review_data.get("review")
        display_name = review_data.get("display_name", "Anonymous")
        is_verified_purchase = review_data.get("is_verified_purchase", False)

        # Validate rating
        if not rating or not (1 <= rating <= 5):
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

        # Check if user already reviewed (by email)
        if reviewer_email:
            existing_review = db.query(ShopReview).filter(
                ShopReview.seller_id == shop_id,
                ShopReview.reviewer_email == reviewer_email
            ).first()
            if existing_review:
                # Update existing review
                existing_review.rating = rating
                existing_review.review = review_text
                existing_review.display_name = display_name
                existing_review.is_verified_purchase = is_verified_purchase
                existing_review.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(existing_review)
                return {
                    "id": existing_review.id,
                    "message": "Review updated successfully",
                    "is_new": False
                }

        # Create new review
        new_review = ShopReview(
            seller_id=shop_id,
            user_id=user_id,
            rating=rating,
            review=review_text,
            display_name=display_name,
            reviewer_email=reviewer_email,
            is_verified_purchase=is_verified_purchase
        )
        db.add(new_review)
        db.commit()
        db.refresh(new_review)

        return {
            "id": new_review.id,
            "message": "Review submitted successfully",
            "is_new": True
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating review: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# FEEDBACK ENDPOINTS
@listings_router.get("/shops/{shop_id}/feedback")
def get_shop_feedback(
    shop_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get feedback for a shop"""
    try:
        from models import ShopFeedback, Seller

        # Get the seller
        seller = db.query(Seller).filter(Seller.id == shop_id).first()
        if not seller:
            raise HTTPException(status_code=404, detail="Shop not found")

        # Get feedback
        feedback = db.query(ShopFeedback).filter(
            ShopFeedback.seller_id == shop_id,
            ShopFeedback.is_public == True
        ).order_by(ShopFeedback.created_at.desc()).offset(skip).limit(limit).all()

        return {
            "feedback": [
                {
                    "id": f.id,
                    "display_name": f.display_name or "Anonymous",
                    "feedback_text": f.feedback_text,
                    "created_at": f.created_at.isoformat() if f.created_at else None
                }
                for f in feedback
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching feedback: {str(e)}")
        return {"feedback": []}


@listings_router.post("/shops/{shop_id}/feedback")
def submit_shop_feedback(
    shop_id: str,
    feedback_data: dict,
    db: Session = Depends(get_db)
):
    """Submit feedback for a shop"""
    try:
        from models import ShopFeedback, Seller

        # Get shop
        seller = db.query(Seller).filter(Seller.id == shop_id).first()
        if not seller:
            raise HTTPException(status_code=404, detail="Shop not found")

        feedback_text = feedback_data.get("feedback_text")
        if not feedback_text or len(feedback_text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Feedback text is required")

        # Create feedback
        new_feedback = ShopFeedback(
            seller_id=shop_id,
            user_id=feedback_data.get("user_id"),
            feedback_text=feedback_text,
            display_name=feedback_data.get("display_name", "Anonymous"),
            is_public=feedback_data.get("is_public", True)
        )
        db.add(new_feedback)
        db.commit()
        db.refresh(new_feedback)

        return {
            "id": new_feedback.id,
            "message": "Feedback submitted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# FOLLOW ENDPOINTS
@listings_router.post("/shops/{shop_id}/follow")
def follow_shop(
    shop_id: str,
    follow_data: dict,
    db: Session = Depends(get_db)
):
    """Follow a shop"""
    try:
        from models import ShopFollow, Seller

        # Get shop
        seller = db.query(Seller).filter(Seller.id == shop_id).first()
        if not seller:
            raise HTTPException(status_code=404, detail="Shop not found")

        user_id = follow_data.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")

        # Check if already following
        existing_follow = db.query(ShopFollow).filter(
            ShopFollow.user_id == user_id,
            ShopFollow.seller_id == shop_id
        ).first()

        if existing_follow:
            return {"message": "Already following this shop", "is_new": False}

        # Create follow relationship
        new_follow = ShopFollow(
            user_id=user_id,
            seller_id=shop_id
        )
        db.add(new_follow)
        db.commit()

        return {
            "message": "Shop followed successfully",
            "is_new": True
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error following shop: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@listings_router.delete("/shops/{shop_id}/follow")
def unfollow_shop(
    shop_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Unfollow a shop"""
    try:
        from models import ShopFollow

        follow = db.query(ShopFollow).filter(
            ShopFollow.user_id == user_id,
            ShopFollow.seller_id == shop_id
        ).first()

        if not follow:
            raise HTTPException(status_code=404, detail="Not following this shop")

        db.delete(follow)
        db.commit()

        return {"message": "Shop unfollowed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error unfollowing shop: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@notifications_router.websocket("/ws")
async def websocket_notifications_endpoint(websocket: WebSocket, token: str = None):
    """WebSocket endpoint for real-time notifications"""
    try:
        await websocket.accept()

        # Send initial connection message
        await websocket.send_json({
            "type": "connection",
            "message": "Connected to notifications",
            "timestamp": datetime.utcnow().isoformat()
        })

        # Keep connection open and send dummy notifications
        while True:
            try:
                # Receive message from client (if any)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                # Echo it back
                await websocket.send_json({
                    "type": "echo",
                    "message": data,
                    "timestamp": datetime.utcnow().isoformat()
                })
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                await websocket.send_json({
                    "type": "ping",
                    "message": "Ping",
                    "timestamp": datetime.utcnow().isoformat()
                })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.close(code=status.WS_1000_NORMAL_CLOSURE)
        except:
            pass
