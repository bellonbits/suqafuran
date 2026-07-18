from app.core.config import settings

def setup_tracing(app):
    if not settings.OTEL_EXPORTER_OTLP_ENDPOINT:
        return

    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.resources import SERVICE_NAME, Resource
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        # Set up resource
        resource = Resource(attributes={
            SERVICE_NAME: "suqafuran-api"
        })

        # Set up tracer provider
        provider = TracerProvider(resource=resource)

        # Set up exporter
        exporter = OTLPSpanExporter(endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT, insecure=True)

        # Add span processor
        provider.add_span_processor(BatchSpanProcessor(exporter))

        # Set global tracer provider
        trace.set_tracer_provider(provider)

        # Instrument FastAPI
        FastAPIInstrumentor.instrument_app(app)
    except ImportError:
        pass
