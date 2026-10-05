from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_name: str = "ai4bharat/indic-bert"
    model_cache_dir: str = "./model_cache"
    confidence_threshold: float = 0.60
    max_text_length: int = 512
    device: str = "cpu"
    enable_transformer: bool = True
    enable_image_models: bool = True
    log_level: str = "INFO"
    environment: str = "development"
    allowed_origins: List[str] = ["http://localhost:3000", "https://crimelens.vercel.app"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

@lru_cache()
def get_settings():
    return Settings()
