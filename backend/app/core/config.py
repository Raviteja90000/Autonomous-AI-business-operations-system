import json
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    APP_NAME: str = "Autonomous AI Business Operations Manager"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Security
    SECRET_KEY: str = "dev-secret-key-32-character-random-string-for-ops-manager"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./ai_ops_manager.db"
    DATABASE_ECHO: bool = False

    # Autonomy Defaults
    DEFAULT_AUTONOMY_TIER: int = 2
    MAX_AUTONOMOUS_SPEND_USD: float = 5000.00
    MAX_BLAST_RADIUS_ENTITIES: int = 10
    MIN_CONFIDENCE_THRESHOLD: float = 0.85
    GLOBAL_KILL_SWITCH: bool = False

    # AI Models & Multi-LLM Fallback Gateway
    MODEL_PROVIDER: str = "groq"  # groq | gemini | ollama | mock | openai | anthropic
    MODEL_OBSERVER: str = "mock-fast-v1"
    MODEL_PLANNER: str = "mock-reasoning-v1"
    MODEL_CRITIC: str = "mock-critic-v1"
    MODEL_EVALUATOR: str = "mock-eval-v1"
    MODEL_ADAPTER: str = "mock-adapter-v1"

    # Multi-LLM Fallback Chain (Ordered list of providers to try)
    LLM_FALLBACK_CHAIN: List[str] = ["groq", "gemini", "ollama", "mock"]
    LLM_DAILY_BUDGET_USD: float = 50.00
    LLM_MONTHLY_BUDGET_USD: float = 1000.00
    LLM_TIMEOUT_SECONDS: float = 30.0
    LLM_CIRCUIT_BREAKER_THRESHOLD: int = 3
    LLM_CIRCUIT_BREAKER_RESET_SECONDS: int = 120

    # Cloud Providers (Free Tiers)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Local LLM (Ollama - Free & Private)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"

    # Optional Commercial Providers
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-5-haiku-20241022"

    # Integrations Configuration & API Keys
    ENABLE_MOCK_INTEGRATIONS: bool = True
    CRM_CONNECTOR_TYPE: str = "mock"       # mock | hubspot
    FINANCE_CONNECTOR_TYPE: str = "mock"   # mock | stripe
    SUPPORT_CONNECTOR_TYPE: str = "mock"   # mock | zendesk
    EMAIL_CONNECTOR_TYPE: str = "mock"     # mock | sendgrid
    MARKETING_CONNECTOR_TYPE: str = "mock" # mock | google_ads

    # Stripe (Finance)
    STRIPE_API_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # SendGrid / Resend (Email)
    EMAIL_CONNECTOR_TYPE: str = "mock"     # mock | resend | sendgrid
    RESEND_API_KEY: Optional[str] = None
    RESEND_FROM_EMAIL: Optional[str] = "onboarding@resend.dev"
    RESEND_TEST_RECIPIENT: Optional[str] = "ravitejatalapaneni@gmail.com"
    RESEND_ROUTE_TO_TEST_INBOX: bool = True
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: Optional[str] = "ops@yourcompany.com"

    # Zendesk / GitHub (Customer Support)
    SUPPORT_CONNECTOR_TYPE: str = "mock"   # mock | zendesk | github
    ZENDESK_SUBDOMAIN: Optional[str] = None
    ZENDESK_EMAIL: Optional[str] = None
    ZENDESK_API_TOKEN: Optional[str] = None
    GITHUB_TOKEN: Optional[str] = None
    GITHUB_REPO: Optional[str] = None      # format: "username/repository-name"

    # HubSpot (CRM)
    HUBSPOT_ACCESS_TOKEN: Optional[str] = None

    # Google Ads (Marketing)
    GOOGLE_ADS_DEVELOPER_TOKEN: Optional[str] = None
    GOOGLE_ADS_CUSTOMER_ID: Optional[str] = None

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Telemetry
    OTEL_ENABLED: bool = False
    OTEL_EXPORTER_OTLP_ENDPOINT: str = "http://localhost:4317"
    OTEL_SERVICE_NAME: str = "autonomous-ai-ops-manager"

    model_config = SettingsConfigDict(
        env_file=".env.development",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
