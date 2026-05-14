"""
app/api/routes/health.py
"""
from fastapi import APIRouter
from app.core.model_manager import model_manager

router = APIRouter()

@router.get("/health")
async def health():
    return {
        "status":       "ok",
        "model_loaded": model_manager.pipeline is not None,
        "version":      "1.0.0",
    }
