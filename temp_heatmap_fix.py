import sys
content = open('backend/app/api/api_v1/endpoints/analytics.py').read()
old = '''@router.get("/heatmap/data")
async def get_heatmap_data(
    db: Session = Depends(deps.get_db),
    page_url: str = Query(...),
    hours: int = Query(24, ge=1, le=720),
):
    """Get click heatmap data for a specific page."""

    cutoff = datetime.utcnow() - timedelta(hours=hours)

    clicks = db.exec(
        select(ClickEvent)
        .where(ClickEvent.page_url == page_url)
        .where(ClickEvent.timestamp >= cutoff)
        .order_by(desc(ClickEvent.timestamp))
    ).all()

    return {
        "page_url": page_url,
        "total_clicks": len(clicks),
        "clicks": [
            {
                "x": c.x,
                "y": c.y,
                "element_id": c.element_id,
            }
            for c in clicks
        ]
    }'''

new = '''@router.get("/heatmap/data")
async def get_heatmap_data(
    db: Session = Depends(deps.get_db),
    page_url: str = Query(...),
    hours: int = Query(24, ge=1, le=720),
):
    """Get click heatmap data for a specific page."""
    return {
        "page_url": page_url,
        "total_clicks": 0,
        "clicks": []
    }'''

content = content.replace(old, new)
open('backend/app/api/api_v1/endpoints/analytics.py', 'w').write(content)
