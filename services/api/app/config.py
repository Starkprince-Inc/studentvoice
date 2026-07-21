from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="STUDENTVOICE_", env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str = "sqlite:///./studentvoice.db"
    public_base_url: str = "http://localhost:3000"
    source_contact_key: str | None = None
    maximum_upload_bytes: int = 20 * 1024 * 1024 * 1024
    upload_intent_ttl_seconds: int = 900
    quarantine_root: str = "./var/quarantine"


@lru_cache
def get_settings() -> Settings:
    return Settings()
