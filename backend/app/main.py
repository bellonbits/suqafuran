from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api.api_v1.api import api_router
from app.core.config import settings

# Create upload directory if it doesn't exist
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

limiter = Limiter(key_func=get_remote_address)
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
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
)

# Serve uploaded files
app.mount("/api/v1/listings/images", StaticFiles(directory=settings.UPLOAD_DIR), name="images")

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {"message": "Welcome to Suqafuran API"}
