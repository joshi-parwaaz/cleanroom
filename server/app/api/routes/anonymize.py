"""
app/api/routes/anonymize.py

Fix for Windows + uvicorn --reload:
  run_in_executor uses the event loop's executor which lives in the reloader
  subprocess. On Windows with spawn-based multiprocessing this causes the
  background thread's writes to _jobs to be invisible to the main process.

  Solution: use threading.Thread directly. This runs in the SAME process as
  the uvicorn worker, so _jobs dict updates are immediately visible to the
  polling endpoint.
"""
import threading
import uuid
from pathlib import Path
from typing import Dict

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from loguru import logger

from app.core.config import settings
from app.models.schemas import JobStatusResponse, JobSubmitResponse
from app.services.pipeline import run_pipeline_sync

router = APIRouter()

# Module-level job store — lives in the worker process, always accessible
_jobs: Dict[str, dict] = {}

_ALLOWED_EXTS = {".pdf", ".docx", ".txt", ".csv"}
_SIZE_LIMITS = {
    ".txt":  settings.MAX_TXT_CSV_SIZE,
    ".csv":  settings.MAX_TXT_CSV_SIZE,
    ".docx": settings.MAX_DOCX_SIZE,
    ".pdf":  settings.MAX_PDF_TEXT_SIZE,
}


@router.post(
    "/anonymize",
    response_model=JobSubmitResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def submit_anonymize(file: UploadFile = File(...)):
    """
    Validates and queues the file. Returns job_id in < 100ms.
    Uses threading.Thread (not run_in_executor) so the shared _jobs dict
    is updated in the same process that handles poll requests.
    """
    ext = Path(file.filename or "").suffix.lower()
    if ext not in _ALLOWED_EXTS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported type '{ext}'. Accepted: {', '.join(_ALLOWED_EXTS)}",
        )

    data = await file.read()
    limit = _SIZE_LIMITS.get(ext, settings.MAX_TXT_CSV_SIZE)
    if len(data) > limit:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {limit // (1024 * 1024)} MB limit for {ext}.",
        )

    filename = file.filename or f"document{ext}"
    job_id = str(uuid.uuid4())

    _jobs[job_id] = {
        "status":       "pending",
        "progress_msg": "Queued — starting pipeline…",
        "result":       None,
        "error":        None,
    }

    logger.info(f"[{job_id}] Queued — {filename} ({len(data):,} bytes)")

    # threading.Thread shares memory with the main process on Windows
    t = threading.Thread(
        target=_run_job,
        args=(job_id, data, filename),
        daemon=True,   # dies if server shuts down
    )
    t.start()

    return JobSubmitResponse(job_id=job_id, status="pending")


def _run_job(job_id: str, data: bytes, filename: str):
    """Runs in a background thread. Writes directly to _jobs dict."""
    try:
        _jobs[job_id]["status"] = "processing"
        _jobs[job_id]["progress_msg"] = "Starting pipeline…"

        result = run_pipeline_sync(
            data,
            filename,
            progress_cb=lambda msg: _update(job_id, msg),
        )

        _jobs[job_id]["status"]       = "done"
        _jobs[job_id]["result"]       = result
        _jobs[job_id]["progress_msg"] = "Complete"
        logger.info(f"[{job_id}] Done ✓")

    except BaseException as e:  # catches SystemExit, MemoryError, etc.
        logger.exception(f"[{job_id}] Pipeline error: {e}")
        _jobs[job_id]["status"] = "error"
        _jobs[job_id]["error"]  = str(e)
        _jobs[job_id]["progress_msg"] = f"Error: {e}"


def _update(job_id: str, msg: str):
    if job_id in _jobs:
        _jobs[job_id]["progress_msg"] = msg


@router.get("/anonymize/{job_id}/status")
async def poll_job(job_id: str):
    """
    Returns instantly. Client polls every 2.5s.
    Returns raw dict (no response_model) so Pydantic never strips
    the `result` payload — that was the core mismatch bug.
    """
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return {"job_id": job_id, **job}


@router.delete("/anonymize/{job_id}")
async def cleanup_job(job_id: str):
    _jobs.pop(job_id, None)
    return {"deleted": job_id}
