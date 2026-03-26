from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/intellicredit"
    sync_database_url: str = "postgresql://postgres:password@localhost:5432/intellicredit"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "intellicredit-docs"
    minio_secure: bool = False

    # ChromaDB
    chroma_host: str = "localhost"
    chroma_port: int = 8001

    # Anthropic (legacy — replaced by Gemini)
    anthropic_api_key: str = ""

    # Google Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # Sandbox.co.in
    sandbox_api_key: str = ""
    sandbox_base_url: str = "https://api.sandbox.co.in"

    # Tavily
    tavily_api_key: str = ""

    # App
    app_env: str = "development"
    secret_key: str = "change_me"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
