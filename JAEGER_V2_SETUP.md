# Jaeger v2 Setup & Monitoring Guide

## Overview

Jaeger v2 is built on OpenTelemetry and provides distributed tracing for monitoring request flows across microservices. This setup enables comprehensive observability for the Suqafuran marketplace.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Jaeger v2 (All-in-One)                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ OTLP Receiver (gRPC: 4317 / HTTP: 4318)         │   │
│  └──────────────────────────────────────────────────┘   │
│                        ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Collector (Processes & Stores Spans)             │   │
│  └──────────────────────────────────────────────────┘   │
│                        ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ BadgerDB Storage (/badger/data, /badger/key)    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Admin API: :14269 (Health checks)                      │
│  Query UI:  :16686 (Web interface)                      │
└─────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         │                    │                    │
    Backend API           Frontend (optional)  Celery Workers
```

## Configuration

### Docker Compose Setup

**Jaeger Service:**
```yaml
jaeger:
  image: jaegertracing/jaeger:latest
  command:
    - "--admin.http.host-port=:14269"
    - "--collector.grpc.host-port=:4317"
    - "--collector.otlp.enabled=true"
    - "--collector.http.host-port=:4318"
    - "--query.http.server.host-port=:16686"
  environment:
    SPAN_STORAGE_TYPE: badger
    BADGER_EPHEMERAL: "false"
  ports:
    - "4317:4317"    # OTLP gRPC receiver
    - "4318:4318"    # OTLP HTTP receiver
    - "16686:16686"  # Query UI
    - "14269:14269"  # Admin API
```

### Backend Configuration (Environment Variables)

```env
# OpenTelemetry Configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_SERVICE_NAME=suqafuran-backend
OTEL_SDK_DISABLED=false
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp

# Optional: Sample rate (0.0 = no sampling, 1.0 = 100% sampling)
OTEL_TRACES_SAMPLER=always_on
```

### Python Backend Setup

**Dependencies (requirements.txt):**
```
opentelemetry-api>=1.21.0
opentelemetry-sdk>=1.21.0
opentelemetry-exporter-otlp>=1.21.0
opentelemetry-instrumentation-fastapi>=0.42b0
opentelemetry-instrumentation-sqlalchemy>=0.42b0
opentelemetry-instrumentation-redis>=0.42b0
```

**Code Integration (app/core/tracing.py):**
- Automatically instruments FastAPI
- Instruments SQLAlchemy for database queries
- Instruments Redis for cache operations
- Sends traces to Jaeger via OTLP gRPC protocol

## Accessing Jaeger

### Web UI (Query Interface)
- **URL:** http://localhost:16686
- **Features:**
  - Search traces by service, operation, tags
  - View trace details and span waterfall
  - Analyze latency and dependencies
  - View service topology (Service Graph)

### API Access
- **Health Check:** `http://localhost:14269/health`
- **Health Ready:** `http://localhost:14269/live`
- **Metrics:** `http://localhost:14269/metrics`

## Monitoring & Troubleshooting

### Check Jaeger Status
```bash
# Health check
curl http://localhost:14269/health

# Check if receiving spans
docker logs suqafuran-jaeger | grep -i "span"
```

### Verify Backend Traces
```bash
# Check if backend is sending traces
docker logs suqafuran-backend | grep -i "otel\|tracer\|span"

# Should see similar output:
# INFO: Instrumented FastAPI application
# INFO: Starting OpenTelemetry trace export
```

### Common Issues

**Issue: No traces appearing in Jaeger UI**

1. Verify OTLP endpoint is correct:
   ```bash
   docker exec suqafuran-backend curl -v http://jaeger:4317
   ```

2. Check backend logs for errors:
   ```bash
   docker logs suqafuran-backend | grep -i "error\|otel"
   ```

3. Verify Jaeger is running:
   ```bash
   docker ps | grep jaeger
   ```

4. Check Jaeger logs:
   ```bash
   docker logs suqafuran-jaeger | tail -20
   ```

**Issue: Connection refused**

1. Ensure Jaeger dependency is set in docker-compose:
   ```yaml
   depends_on:
     jaeger:
       condition: service_healthy
   ```

2. Wait for Jaeger to be healthy:
   ```bash
   docker wait suqafuran-jaeger || true
   ```

## Tracing Instrumentation

### Automatic Instrumentation Included

- **FastAPI**: Request/response tracing
- **SQLAlchemy**: Database query tracing
- **Redis**: Cache operation tracing
- **HTTP Client**: Outbound HTTP calls

### Custom Span Creation

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("custom-operation") as span:
    span.set_attribute("user_id", user_id)
    span.set_attribute("action", "purchase")
    # Your code here
```

## Performance Tuning

### Sampling Strategies

```env
# Trace every request (high overhead, dev only)
OTEL_TRACES_SAMPLER=always_on

# Trace 10% of requests (recommended for production)
OTEL_TRACES_SAMPLER=traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1

# Trace based on parent context (recommended)
OTEL_TRACES_SAMPLER=parentbased_always_on
```

### Batch Span Processor Settings

```python
# In tracing.py (customizable)
BatchSpanProcessor(
    exporter,
    schedule_delay_millis=5000,      # Flush every 5 seconds
    max_queue_size=2048,              # Max spans in queue
    max_export_batch_size=512,        # Max spans per batch
)
```

## Storage & Retention

### BadgerDB Configuration

**Data Storage:**
- **Key Store:** `/badger/key`
- **Value Store:** `/badger/data`
- **Persistence:** Mounted as Docker volume `jaeger_data`

**Retention (default):**
- Traces stored in-memory and on disk
- Adjust `--memory.max-traces` for memory limits
- For production, consider external storage (Elasticsearch, GCS)

## Scaling Considerations

For production deployments:

1. **Use External Storage:**
   ```yaml
   # Replace BadgerDB with Elasticsearch or GCS
   SPAN_STORAGE_TYPE: elasticsearch
   ES_SERVER_URLS: http://elasticsearch:9200
   ```

2. **Enable Sampling:**
   ```env
   OTEL_TRACES_SAMPLER=traceidratio
   OTEL_TRACES_SAMPLER_ARG=0.1
   ```

3. **Set Resource Limits:**
   ```yaml
   resources:
     limits:
       cpus: '2'
       memory: 2G
   ```

4. **Use Collector (Optional):**
   - Separate OpenTelemetry Collector
   - Handles ingestion, processing, exporting
   - Better scalability and reliability

## Useful Queries (Jaeger UI)

1. **All requests to Products endpoint:**
   ```
   Service: suqafuran-backend
   Operation: /api/v1/listings
   ```

2. **Slow requests (>1s):**
   ```
   Service: suqafuran-backend
   Min Duration: 1s
   ```

3. **Failed requests:**
   ```
   Service: suqafuran-backend
   Tags: error=true
   ```

4. **Database operations:**
   ```
   Operation: SQLAlchemy
   Tags: db.system=postgresql
   ```

## References

- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)
- [OTLP Protocol](https://opentelemetry.io/docs/specs/otlp/)
- [BadgerDB](https://github.com/dgraph-io/badger)

## Upgrade Path from v1

Migration completed:
- ✅ Replaced `jaegertracing/all-in-one` with `jaegertracing/jaeger:latest` (v2)
- ✅ Updated OTLP protocol configuration
- ✅ Changed from Jaeger exporter to OTLP exporter
- ✅ Added comprehensive instrumentation
- ✅ Enabled trace, metrics, and logs export

No breaking changes to application code - tracing setup is backward compatible.
