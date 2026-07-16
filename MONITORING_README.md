# Suqafuran Admin Monitoring Dashboard

A comprehensive real-time system monitoring dashboard for the Suqafuran marketplace, providing insights into Kafka topics, notifications, distributed traces, and system health.

## Architecture Overview

### Phase 1: Overview + Kafka Topics (✅ Complete)
- **Overview Dashboard**: Top-level health metrics, topic summary, and critical events
- **Kafka Topics**: List view with lag metrics, partition counts, and topic health status
- **Components**: Real-time polling with pause/resume controls, 15-second auto-refresh

### Phase 2-5: Coming Soon
- **Notifications**: Funnel analytics and delivery tracking
- **Traces**: Jaeger integration and distributed tracing
- **Live Events**: WebSocket-driven real-time event stream
- **Alerts**: Alert rules management and history

## Directory Structure

```
Backend:
├── app/
│   ├── api/api_v1/
│   │   └── admin/
│   │       └── monitoring_router.py     # Main monitoring API endpoints
│   └── services/
│       └── kafka_admin.py               # Kafka topic metrics collection
├── migrations/
│   └── 003_monitoring_tables.sql       # DB schema for notifications, alerts

Frontend:
├── src/
│   ├── app/admin/monitoring/
│   │   ├── page.tsx                     # Overview dashboard
│   │   ├── kafka/page.tsx               # Kafka topics list
│   │   ├── notifications/page.tsx       # Phase 2
│   │   ├── traces/page.tsx              # Phase 3
│   │   ├── live/page.tsx                # Phase 4
│   │   └── alerts/page.tsx              # Phase 5
│   ├── components/monitoring/
│   │   ├── MonitoringLayout.tsx         # Shared layout & navigation
│   │   ├── StatCard.tsx                 # Stat card component
│   │   └── TopicStatusBadge.tsx         # Status indicator
│   ├── store/monitoring/
│   │   ├── useMonitoringStore.ts        # Overview state
│   │   └── useKafkaStore.ts             # Kafka topics state
│   ├── hooks/monitoring/
│   │   └── usePolling.ts                # Polling/refresh hook
│   └── services/
│       └── monitoringService.ts         # API client
```

## Setup & Configuration

### Backend Requirements

1. **PostgreSQL**: Run migration to create monitoring tables
   ```bash
   psql -U your_user -d your_db -f backend/migrations/003_monitoring_tables.sql
   ```

2. **Kafka Admin Client**: Install confluent_kafka
   ```bash
   pip install confluent-kafka
   ```

3. **Environment Variables**:
   ```
   KAFKA_BOOTSTRAP_SERVERS=kafka1:9092,kafka2:9092,kafka3:9092
   ```

4. **Register Router**: In `backend/app/api/api_v1/api.py`:
   ```python
   from app.api.api_v1.admin import monitoring_router
   api_router.include_router(monitoring_router.router)
   ```

### Frontend Requirements

1. **Zustand** (state management): Already installed
2. **recharts** (charts): Already installed
3. **lucide-react** (icons): Already installed

## API Endpoints

### Overview
```
GET /api/v1/admin/monitoring/overview
```
Returns:
- System health stats (events/sec, success rates, queue depth)
- Topic health summary grid
- Open alerts count

### Kafka Topics
```
GET /api/v1/admin/monitoring/kafka/topics
```
Returns list of all Kafka topics with metrics:
- Name, partition count, total messages
- Messages/sec, consumer lag
- Status (healthy/lagging/stalled)

```
GET /api/v1/admin/monitoring/kafka/topics/{topic_name}
```
Returns detailed metrics for a single topic:
- Partition breakdown
- Time-series data (placeholder for Phase 2)
- Sample messages

```
GET /api/v1/admin/monitoring/kafka/topics/{topic_name}/messages?skip=0&limit=50
```
Returns recent messages from a topic (with optional filters)

## Usage

### Overview Page
1. Navigate to `/admin/monitoring`
2. View system health statistics and Kafka topic grid
3. Click **Pause** to stop auto-refresh (useful for reading data)
4. Click **Refresh** for immediate data update
5. Click a topic row to drill into Kafka Topics detail

### Kafka Topics Page
1. Navigate to `/admin/monitoring/kafka`
2. View all topics with consumer lag and status
3. Click **View** on a row to see detailed partition metrics
4. Filter by status (healthy/lagging/stalled)

## Monitoring Metrics

### Key Metrics Tracked
- **Events/sec**: Total throughput across all Kafka topics
- **Notification Success Rate**: % of notifications successfully delivered
- **Active Workers**: Number of active Celery workers
- **Queue Depth**: Messages waiting in Celery queue
- **P95 Latency**: 95th percentile request latency (ms)
- **Failed Payments**: Count of failed payment transactions (last 1h)
- **Consumer Lag**: Messages behind for each Kafka consumer group

### Topic Health Status
- **Healthy**: Lag < 1000 messages
- **Lagging**: Lag 1000-5000 messages (yellow warning)
- **Stalled**: Lag > 5000 messages (red alert)

## Performance Considerations

### Caching Strategy
- Overview stats cached for 10-15 seconds (refreshed by background task)
- Kafka topic metrics cached to avoid repeated consumer queries
- Cache TTL: 15 seconds for most metrics

### Polling Intervals
- Default: 15 seconds (configurable via UI)
- Users can pause/resume to control data freshness
- Auto-refresh can be toggled independently per page

### WebSocket Relay (Phase 4)
- Single server-side Kafka consumer fans out to all admin clients
- Prevents per-tab consumer creation
- Buffering while UI paused (prevents data loss)

## Future Phases

### Phase 2: Notifications
- Event-specific funnel visualization
- Delivery tracking across channels (email, SMS, push)
- Retry failed notifications
- Success rate trends

### Phase 3: Traces
- Jaeger HTTP proxy integration
- Custom waterfall view of distributed traces
- Correlation ID ↔ trace ID bidirectional lookup
- Critical path templates (signup→OTP, order→payment, etc.)

### Phase 4: Live Events
- WebSocket relay from Kafka to browser
- Real-time event stream with filtering
- Sample rate control for high-volume topics
- Alert on critical event types (payment failures, etc.)

### Phase 5: Alerts
- Alert rule CRUD interface
- Alert evaluation Celery beat task (every 1 min)
- Active/historical alert log
- Notification integration (email, Slack, SMS)

## Troubleshooting

### "Kafka admin client not available"
- Ensure `confluent-kafka` is installed: `pip install confluent-kafka`
- Check `KAFKA_BOOTSTRAP_SERVERS` environment variable
- Verify Kafka cluster is reachable from backend

### Slow topic list load
- Metrics are cached; check cache TTL configuration
- If cold cache, first request will hit Kafka admin API (slower)
- Check Kafka cluster health if consistently slow

### Missing tables
- Run migration: `psql -f backend/migrations/003_monitoring_tables.sql`
- Ensure PostgreSQL user has CREATE TABLE permissions

## Security

- **Access Control**: `/admin/monitoring` routes require `admin` role
- **Audit Logging**: All admin monitoring API calls are logged
- **Sensitive Data**: Correlation IDs and trace IDs can be copy-to-clipboard for ops triage
- **RBAC**: Alerts CRUD behind `admin` role; read access for `ops` role

## References

- **Kafka Admin**: https://docs.confluent.io/kafka-clients/python/current/overview.html
- **Jaeger**: https://www.jaegertracing.io/
- **OpenTelemetry**: https://opentelemetry.io/
- **Zustand**: https://github.com/pmndrs/zustand
- **Recharts**: https://recharts.org/

---

**Last Updated**: 2026-07-16  
**Phase**: Phase 1 (Overview + Kafka Topics)  
**Status**: Ready for deployment
