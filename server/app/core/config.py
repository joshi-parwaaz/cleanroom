"""
app/core/config.py — Pydantic settings loaded from .env
"""
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Server
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"

    # CORS — stored as comma-separated string in .env, parsed to list here
    ALLOWED_ORIGINS_STR: str = "http://localhost:5173,http://localhost:3000"

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS_STR.split(",")]

    # AWS
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "cleanroom-audit-logs"

    # Model
    MODEL_PATH: str = "./models/bert_ner_quantized.onnx"
    TOKENIZER_PATH: str = "./models/tokenizer"
    NER_CONFIDENCE_THRESHOLD: float = 0.65

    # File size limits (bytes)
    MAX_TXT_CSV_SIZE: int = 10 * 1024 * 1024
    MAX_DOCX_SIZE: int = 10 * 1024 * 1024
    MAX_PDF_TEXT_SIZE: int = 25 * 1024 * 1024
    MAX_PDF_SCAN_SIZE: int = 15 * 1024 * 1024

    # Temp storage
    TEMP_DIR: str = "./tmp"
    FILE_TTL_HOURS: int = 24


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
