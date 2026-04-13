from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.api import deps
from app.crud import crud_content
from app.models.site_content import SiteContent, SiteContentRead, SiteContentUpdate
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=Dict[str, Dict[str, str]])
def read_content_overrides(
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve all site content as a dictionary for i18next overrides.
    Returns: { "en": { "key": "val" }, "so": { "key": "val" } }
    """
    contents = crud_content.get_site_content(db)
    overrides = {
        "en": {},
        "so": {}
    }
    for item in contents:
        if item.value_en:
            overrides["en"][item.key] = item.value_en
        if item.value_so:
            overrides["so"][item.key] = item.value_so
    return overrides


@router.get("/all", response_model=List[SiteContentRead])
def read_all_content(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Retrieve all site content (Admin only).
    """
    return crud_content.get_site_content(db)


@router.patch("/{key}", response_model=SiteContentRead)
def update_content(
    *,
    db: Session = Depends(deps.get_db),
    key: str,
    content_in: SiteContentUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update site content by key (Admin only).
    """
    db_obj = crud_content.get_content_by_key(db, key=key)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Content key not found")
    return crud_content.update_site_content(db=db, db_obj=db_obj, content_in=content_in)


@router.post("/sync", response_model=Dict[str, int])
def sync_content(
    *,
    db: Session = Depends(deps.get_db),
    content_map: Dict[str, Dict[str, str]], # { "key": { "en": "...", "so": "..." } }
    page_group: str = "general",
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Bulk import/sync content keys from a map (Admin only).
    """
    count = 0
    for key, values in content_map.items():
        db_obj = crud_content.get_content_by_key(db, key=key)
        if db_obj:
            # Update existing
            crud_content.update_site_content(
                db=db, 
                db_obj=db_obj, 
                content_in=SiteContentUpdate(
                    value_en=values.get("en"), 
                    value_so=values.get("so")
                )
            )
        else:
            # Create new
            crud_content.create_site_content(
                db=db,
                content_in=SiteContent(
                    key=key,
                    value_en=values.get("en", ""),
                    value_so=values.get("so"),
                    page_group=page_group
                )
            )
        count += 1
    return {"synced": count}
