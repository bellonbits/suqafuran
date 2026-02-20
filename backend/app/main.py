from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from app.api.api_v1.api import api_router
from app.core.config import settings
from slowapi import _rate_limit_exceeded_handler
import uuid

# Create upload directory if it doesn't exist
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
)

# Serve uploaded files
app.mount("/api/v1/listings/images", StaticFiles(directory=settings.UPLOAD_DIR), name="images")

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", include_in_schema=False)
def root():
    return {"message": "Welcome to Suqafuran API"}


@app.get("/health", include_in_schema=False)
def health():
    """Health probe used by Docker, load balancers, and uptime monitors."""
    checks = {"status": "ok", "db": "ok", "redis": "ok"}
    status_code = 200

    # DB check
    try:
        from app.db.session import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        checks["db"] = f"error: {e}"
        checks["status"] = "degraded"
        status_code = 503

    # Redis check
    try:
        from app.services.cache_service import cache
        cache.client.ping()
    except Exception as e:
        checks["redis"] = f"error: {e}"
        checks["status"] = "degraded"
        status_code = 503

    return JSONResponse(content=checks, status_code=status_code)
