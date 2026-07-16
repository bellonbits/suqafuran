from sqlmodel import create_engine, Session, SQLModel
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=120,
    pool_size=2,
    max_overflow=1,
    pool_timeout=30,
    connect_args={"connect_timeout": 10},
)


def SessionLocal():
    return Session(engine)


def init_db():
    """Create all tables in the database."""
    SQLModel.metadata.create_all(engine)


def get_db():
    with Session(engine) as session:
        yield session
