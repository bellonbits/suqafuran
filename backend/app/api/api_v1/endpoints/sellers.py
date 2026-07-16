"""
Sellers API
===========
Sellers are NOT a separate database entity.
Any user who:
  1. has `is_verified = true`
  2. has `is_active = true`
  3. has at least one listing with status='active' AND moderation_status='approved'
…is automatically considered a seller.
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from sqlalchemy import text
from app.api import deps
from app.models.user import User

router = APIRouter()


@router.get("/")
def list_sellers(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(default=None, description="Search by name, business name, or email"),
    featured_only: bool = Query(default=False),
) -> Any:
    """
    List all sellers.
    A seller = a verified, active user with at least one approved active listing.
    No registration required — automatic qualification.
    """
    try:
        search_clause = ""
        featured_clause = ""
        params: dict = {"skip": skip, "limit": limit}

        if search:
            search_clause = """
                AND (
                    u.full_name ILIKE :search
                    OR u.business_name ILIKE :search
                    OR u.email ILIKE :search
                )
            """
            params["search"] = f"%{search}%"

        if featured_only:
            featured_clause = "AND u.is_featured = true"

        query = text(f"""
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.business_name,
                u.shop_description,
                u.shop_page_banner,
                u.avatar_url,
                u.is_verified,
                u.is_featured,
                u.free_delivery,
                u.verified_level,
                u.trust_score,
                u.trust_level,
                u.location,
                u.response_time,
                u.created_at,
                COUNT(DISTINCT l.id) AS listings_count
            FROM "user" u
            INNER JOIN listing l
                ON l.owner_id = u.id
                AND l.status = 'active'
                AND l.moderation_status = 'approved'
            WHERE u.is_verified = true
              AND u.is_active = true
              {search_clause}
              {featured_clause}
            GROUP BY u.id
            ORDER BY u.is_featured DESC, u.trust_score DESC, u.created_at DESC
            LIMIT :limit OFFSET :skip
        """)

        rows = db.execute(query, params).fetchall()

        return [
            {
                "id": row[0],
                "full_name": row[1],
                "email": row[2],
                "phone": row[3],
                "business_name": row[4] or row[1],
                "shop_description": row[5],
                "shop_page_banner": row[6],
                "avatar_url": row[7],
                "is_verified": bool(row[8]),
                "is_featured": bool(row[9]),
                "free_delivery": bool(row[10]),
                "verified_level": row[11],
                "trust_score": row[12] or 0,
                "trust_level": row[13] or "NEW",
                "location": row[14],
                "response_time": row[15] or "Typically responds in a few hours",
                "created_at": str(row[16]),
                "listings_count": int(row[17]),
            }
            for row in rows
        ]
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error listing sellers: {str(e)}")


@router.get("/count")
def count_sellers(
    db: Session = Depends(deps.get_db),
    search: Optional[str] = Query(default=None),
) -> Any:
    """Count of all qualified sellers (for pagination)."""
    try:
        search_clause = ""
        params: dict = {}

        if search:
            search_clause = """
                AND (
                    u.full_name ILIKE :search
                    OR u.business_name ILIKE :search
                    OR u.email ILIKE :search
                )
            """
            params["search"] = f"%{search}%"

        query = text(f"""
            SELECT COUNT(DISTINCT u.id)
            FROM "user" u
            INNER JOIN listing l
                ON l.owner_id = u.id
                AND l.status = 'active'
                AND l.moderation_status = 'approved'
            WHERE u.is_verified = true
              AND u.is_active = true
              {search_clause}
        """)

        total = db.execute(query, params).scalar() or 0
        return {"total": int(total)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{seller_id}")
def get_seller(
    seller_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Get a single seller's public profile by user ID.
    Returns 404 if the user is not a qualified seller
    (not verified, or no active approved listings).
    """
    try:
        query = text("""
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.business_name,
                u.shop_description,
                u.shop_page_banner,
                u.shop_detail_banner,
                u.avatar_url,
                u.is_verified,
                u.is_featured,
                u.free_delivery,
                u.verified_level,
                u.trust_score,
                u.trust_level,
                u.location,
                u.response_time,
                u.created_at,
                COUNT(DISTINCT l.id) AS listings_count
            FROM "user" u
            INNER JOIN listing l
                ON l.owner_id = u.id
                AND l.status = 'active'
                AND l.moderation_status = 'approved'
            WHERE u.id = :seller_id
              AND u.is_verified = true
              AND u.is_active = true
            GROUP BY u.id
        """)

        row = db.execute(query, {"seller_id": seller_id}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Seller not found")

        return {
            "id": row[0],
            "full_name": row[1],
            "email": row[2],
            "phone": row[3],
            "business_name": row[4] or row[1],
            "shop_description": row[5],
            "shop_page_banner": row[6],
            "shop_detail_banner": row[7],
            "avatar_url": row[8],
            "is_verified": bool(row[9]),
            "is_featured": bool(row[10]),
            "free_delivery": bool(row[11]),
            "verified_level": row[12],
            "trust_score": row[13] or 0,
            "trust_level": row[14] or "NEW",
            "location": row[15],
            "response_time": row[16] or "Typically responds in a few hours",
            "created_at": str(row[17]),
            "listings_count": int(row[18]),
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{seller_id}/is-seller")
def check_is_seller(
    seller_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Quick check: returns whether a given user qualifies as a seller.
    Used by the frontend to conditionally show seller UI.
    """
    try:
        query = text("""
            SELECT 1
            FROM "user" u
            INNER JOIN listing l
                ON l.owner_id = u.id
                AND l.status = 'active'
                AND l.moderation_status = 'approved'
            WHERE u.id = :seller_id
              AND u.is_verified = true
              AND u.is_active = true
            LIMIT 1
        """)
        result = db.execute(query, {"seller_id": seller_id}).fetchone()
        return {"is_seller": result is not None, "user_id": seller_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
