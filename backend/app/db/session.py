import os
from sqlmodel import create_engine, Session, SQLModel
from app.core.config import settings

# Configurable per-process -- backend, celery-worker, and celery-beat each run
# as separate containers with their own engine/pool, all sharing one managed
# Postgres instance's max_connections budget, so a single hardcoded pool size
# here would either starve the web-facing process or blow the DB's connection
# limit once all three processes' pools are counted together. Set
# DB_POOL_SIZE/DB_MAX_OVERFLOW per service in docker-compose.yml; these
# defaults are sized for the backend API (the process needing the most
# headroom for concurrent HTTP requests).
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "8"))
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "4"))
POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=60,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_timeout=POOL_TIMEOUT,
    connect_args={"connect_timeout": 10, "options": "-c statement_timeout=30000"},
)


def SessionLocal():
    return Session(engine)


def init_db():
    """Create all tables in the database."""
    SQLModel.metadata.create_all(engine)


def get_db():
    with Session(engine) as session:
        yield session
