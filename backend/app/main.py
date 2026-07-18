from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from app.api.api_v1.api import api_router
from app.core.config import settings
from slowapi import _rate_limit_exceeded_handler
from prometheus_fastapi_instrumentator import Instrumentator
import uuid
import time
import structlog
from app.core.logging_config import setup_logging, get_logger
from app.core.tracing import setup_tracing
from app.tasks.celery_app import celery_app
import asyncio
from app.services.kafka_service import kafka_service, ws_manager
from app.services.kafka_websocket_integration import integrate_kafka_with_websocket
from app.services.kafka_producer import kafka_producer
from app.services.kafka_admin import get_kafka_admin

# Initialize structured logging
setup_logging()
logger = get_logger("api")


# Create upload directory if it doesn't exist
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Initialize distributed tracing
setup_tracing(app)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    structlog.contextvars.clear_contextvars()

    trace_id = None
    try:
        from opentelemetry import trace
        span = trace.get_current_span()
        trace_id = format(span.get_span_context().trace_id, "032x") if span and span.get_span_context().trace_id else None
    except (ImportError, AttributeError):
        pass

    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        trace_id=trace_id,
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else "unknown",
    )
    
    start_time = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as e:
        logger.exception("unhandled_exception", error=str(e))
        raise e
    finally:
        process_time = time.perf_counter() - start_time
        
    # Standard request logging
    logger.info(
        "http_request",
        status_code=response.status_code,
        latency_ms=round(process_time * 1000, 2),
    )
    
    response.headers["X-Request-ID"] = request_id
    return response

from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

# GZip Compression (added first, so it executes last/innermost)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Session middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
)

# Set all CORS enabled origins (added last, so it executes first/outermost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With", "X-Device-Fingerprint"],
)

# Serve uploaded files
if Path(settings.UPLOAD_DIR).exists():
    app.mount("/api/v1/listings/images", StaticFiles(directory=settings.UPLOAD_DIR), name="images")

app.include_router(api_router, prefix=settings.API_V1_STR)

# Catch-all OPTIONS handler for CORS preflight requests
@app.options("/{full_path:path}", include_in_schema=False)
async def options_handler(full_path: str):
    return {"message": "OK"}

# Monitoring
Instrumentator().instrument(app).expose(app)


@app.on_event("startup")
async def start_background_event_consumer():
    """
    Starts the background thread that processes business/order events (stock
    alerts, CRM updates, order-status pushes, WebSocket broadcasts). Without
    this, kafka_service.send_event() calls are queued but never drained —
    notifications and realtime sockets silently never fire.

    Also integrates Kafka events with WebSocket real-time delivery.
    """
    import subprocess
    from app.db.session import SessionLocal
    ws_manager.set_event_loop(asyncio.get_event_loop())

    # Initialize Kafka admin and auto-create default topics with retries
    logger.info("=" * 60)
    logger.info("Initializing Kafka and creating default topics...")
    logger.info("=" * 60)

    kafka_admin = get_kafka_admin()
    # Use 'is not None' because AdminClient.__bool__() returns False even when valid
    if kafka_admin is not None and kafka_admin.admin_client is not None:
        try:
            logger.info("📋 Calling create_default_topics...")
            success = kafka_admin.create_default_topics(retries=3, delay=2.0)
            if success:
                logger.info("✅ Kafka topics initialized successfully")
            else:
                logger.warning("⚠️  Kafka topics initialization incomplete, attempting fallback...")
                # Try using kafka-topics CLI as fallback
                try:
                    subprocess.run([
                        "kafka-topics",
                        "--bootstrap-server", "kafka:9092",
                        "--create", "--topic", "suqafuran-orders",
                        "--partitions", "3", "--replication-factor", "1",
                        "--if-not-exists"
                    ], timeout=10, check=False)
                    logger.info("✓ Created topics via CLI fallback")
                except Exception as e:
                    logger.warning(f"⚠️  CLI fallback also failed: {e}")
        except Exception as e:
            logger.error(f"❌ Error creating topics: {e}")
    else:
        logger.error("❌ Kafka admin client not available")

    logger.info("=" * 60)

    # Enable Kafka + WebSocket integration
    integrate_kafka_with_websocket()

    # Start Kafka producer (for publishing domain events)
    await kafka_producer.start()

    # Start Kafka consumer
    kafka_service.start_consumer(SessionLocal)


@app.on_event("shutdown")
async def stop_kafka_producer():
    """Gracefully shut down Kafka producer."""
    await kafka_producer.stop()



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

