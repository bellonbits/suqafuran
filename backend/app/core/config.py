from typing import List, Optional, Union, Any
from pydantic import AnyHttpUrl, EmailStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Suqafuran API"
    API_V1_STR: str = "/api/v1"
    # JWT AUTH
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 180 # 6 months
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OAUTH
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    
    # RESEND EMAIL
    RESEND_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "no-reply@guri24.com"
    EMAIL_FROM_NAME: str = "Suqafuran"

    # AFRICA'S TALKING (kept for legacy/SMS use)
    AFRICASTALKING_USERNAME: str = "sandbox"
    AFRICASTALKING_API_KEY: str = ""
    AFRICASTALKING_SENDER_ID: str = "SUQAFURAN"

    # LIPANA M-PESA
    LIPANA_SECRET_KEY: str = ""
    LIPANA_WEBHOOK_SECRET: str = ""
    KES_CONVERSION_RATE: float = 130.0  # Used to convert USD to KES for Lipana
    
    # CLOUDINARY
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    
    # ENVIRONMENT
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # OBSERVABILITY
    OTEL_EXPORTER_OTLP_ENDPOINT: Optional[str] = None # e.g., http://tempo:4317
    
    # DATABASE
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info) -> str:
        if isinstance(v, str):
            return v
        return f"postgresql://{info.data.get('POSTGRES_USER')}:{info.data.get('POSTGRES_PASSWORD')}@{info.data.get('POSTGRES_SERVER')}:{info.data.get('POSTGRES_PORT')}/{info.data.get('POSTGRES_DB')}"

    # REDIS
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    REDIS_URL: Optional[str] = None

    @field_validator("REDIS_URL", mode="before")
    @classmethod
    def assemble_redis_url(cls, v: Optional[str], info) -> str:
        if isinstance(v, str):
            return v
        password = info.data.get('REDIS_PASSWORD')
        host = info.data.get('REDIS_HOST')
        port = info.data.get('REDIS_PORT')
        db = info.data.get('REDIS_DB')
        if password:
            return f"redis://:{password}@{host}:{port}/{db}"
        return f"redis://{host}:{port}/{db}"

    # KAFKA
    KAFKA_BOOTSTRAP_SERVERS: Optional[str] = "localhost:9092"
    KAFKA_SASL_USERNAME: Optional[str] = None
    KAFKA_SASL_PASSWORD: Optional[str] = None
    KAFKA_SECURITY_PROTOCOL: str = "PLAINTEXT"
    KAFKA_SASL_MECHANISM: str = "PLAIN"
    KAFKA_TOPIC_BUSINESS_EVENTS: str = "suqafuran-business-events"

    # EMAIL
    EMAILS_ENABLED: bool = True
    SMTP_TLS: bool = False
    SMTP_SSL: bool = True
    SMTP_PORT: int = 465
    SMTP_HOST: str = "mail.privateemail.com"
    SMTP_USER: str
    SMTP_PASSWORD: str
    EMAILS_FROM_EMAIL: EmailStr
    EMAILS_FROM_NAME: str = "Suqafuran"
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = 24
    EMAIL_TEMPLATES_DIR: str = "app/email-templates"
    FRONTEND_URL: str = "http://localhost:5173"

    # SECURITY
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    CORS_ORIGINS: Any = ["http://localhost:5173", "http://localhost", "https://localhost", "capacitor://localhost", "https://suqafuran.vercel.app", "http://143.198.30.249:8888", "http://143.198.30.249", "http://api.guri24.com:8888", "http://api.guri24.com"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        elif isinstance(v, str) and v.startswith("["):
            import json
            return json.loads(v)
        return v

    # FILE UPLOAD
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: Any = ["jpg", "jpeg", "png", "webp", "svg", "pdf"]
    UPLOAD_DIR: str = "./uploads"

    # CLOUDINARY
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # GROQ (AI ASSISTANT)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "meta-llama/llama-4-scout-17b-16e-instruct"   # multimodal, best Somali translation
    GROQ_TRANSLATE_MODEL: str = "meta-llama/llama-4-scout-17b-16e-instruct"  # dedicated translation model

    @field_validator("ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def assemble_allowed_extensions(cls, v: Any) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        elif isinstance(v, str) and v.startswith("["):
            import json
            return json.loads(v)
        return v

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True, extra="ignore"
    )


settings = Settings()
