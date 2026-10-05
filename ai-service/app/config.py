from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_name: str = ""
    model_cache_dir: str = "./model_cache"
    confidence_threshold: float = 0.60
    max_text_length: int = 512
    device: str = "cpu"
    enable_transformer: bool = False
    enable_image_models: bool = False
    log_level: str = "INFO"
    environment: str = "development"
    allowed_origins: List[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", protected_namespaces=("settings_",)
    )


@lru_cache()
def get_settings():
    return Settings()
