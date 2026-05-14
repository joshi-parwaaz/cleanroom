"""
app/main.py — CleanRoom FastAPI application
"""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.api.routes import anonymize, demo, health
from app.core.config import settings
from app.core.model_manager import model_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("CleanRoom starting up…")
    Path(settings.TEMP_DIR).mkdir(parents=True, exist_ok=True)
    await model_manager.load()
    logger.info("Model loaded — ready.")
    yield
    logger.info("CleanRoom shutting down.")
    await model_manager.unload()


app = FastAPI(
    title="CleanRoom API",
    description="Local-First PII/PHI Anonymization Engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,    prefix="/api", tags=["health"])
app.include_router(anonymize.router, prefix="/api", tags=["anonymize"])
app.include_router(demo.router,      prefix="/api", tags=["demo"])

Path(settings.TEMP_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=settings.TEMP_DIR), name="files")
