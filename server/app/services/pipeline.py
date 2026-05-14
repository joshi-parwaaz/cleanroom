"""
app/services/pipeline.py
Fully SYNCHRONOUS pipeline — must be called from a ThreadPoolExecutor,
never from an async context directly.

Key fix: all ML inference runs in a worker thread so FastAPI's event loop
stays alive and the browser never times out waiting for a response.
"""
from __future__ import annotations

import json
import time
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Callable, List, Optional, Tuple

from loguru import logger

from app.core.config import settings
from app.core.model_manager import model_manager
from app.core.privacy_policy import EntityAction, get_action
from app.services.extractors import extract_text
from app.services.pseudonym_registry import PseudonymRegistry
from app.services.reconciler import reconcile
from app.services.reconstructor import reconstruct
from app.services.regex_engine import run_regex

# Keep chunks small enough for BERT's 512-token limit.
# 400 chars ≈ 100 tokens — safe margin.
CHUNK_SIZE = 400


def _chunk_text(text: str) -> List[Tuple[int, str]]:
    chunks, start = [], 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        if end < len(text):
            space = text.rfind(" ", start, end)
            if space > start:
                end = space
        chunks.append((start, text[start:end]))
        start = end
    return chunks


def run_pipeline_sync(
    file_bytes: bytes,
    filename: str,
    progress_cb=None,
) -> dict:
    """
    Runs entirely synchronously — safe inside a background thread.
    Returns a plain JSON-serialisable dict.
    """

    def progress(msg: str):
        logger.info(f"  ↳ {msg}")
        if progress_cb:
            try:
                progress_cb(msg)
            except Exception:
                pass

    t_start = time.perf_counter()
    job_id  = str(uuid.uuid4())
    logger.info(f"[{job_id}] Pipeline start — {filename} ({len(file_bytes):,} bytes)")

    # ── 1. Extract text ───────────────────────────────────────────────────────
    progress("Extracting text from document…")
    text = extract_text(file_bytes, filename)
    logger.info(f"[{job_id}] Extracted {len(text):,} chars")

    # ── 2. Chunk ──────────────────────────────────────────────────────────────
    progress("Splitting into analysis chunks…")
    chunks      = _chunk_text(text)
    total       = len(chunks)
    logger.info(f"[{job_id}] {total} chunks")

    # ── 3. Regex (fast, ~0 ms) ────────────────────────────────────────────────
    progress("Running regex detection…")
    all_regex = []
    for offset, chunk in chunks:
        for rm in run_regex(chunk):
            rm.start += offset
            rm.end   += offset
            all_regex.append(rm)

    # ── 4. NER inference (slow — report progress every 50 chunks) ─────────────
    all_ner = []
    for i, (offset, chunk) in enumerate(chunks):
        if i % 50 == 0:
            pct = int(i / total * 100)
            progress(f"Running NER inference… {pct}% ({i}/{total} chunks)")
        try:
            results = model_manager.predict(chunk)
            for r in results:
                r["start"] = r.get("start", 0) + offset
                r["end"]   = r.get("end",   0) + offset
            all_ner.extend(results)
        except Exception as e:
            logger.warning(f"[{job_id}] NER chunk error: {e}")

    # ── 5. Reconcile ──────────────────────────────────────────────────────────
    progress("Reconciling detections…")
    reconciled = reconcile(text, all_regex, all_ner, settings.NER_CONFIDENCE_THRESHOLD)
    logger.info(f"[{job_id}] Reconciled {len(reconciled)} entities")

    # ── 6. Filter entities and apply policy wrapper ───────────────────────────
    progress("Applying privacy policy…")
    registry = PseudonymRegistry()
    
    # Build replacement map only for entities that are NOT preserved
    replaceable = [
        ent for ent in reconciled
        if get_action(ent.entity_type) != EntityAction.PRESERVE
    ]

    # Override registry lookups for REDACT entities
    class _PolicyRegistry:
        """Wraps PseudonymRegistry, returns '[REDACTED]' for REDACT entities."""
        def __init__(self, inner):
            self._inner = inner
        def get_or_create(self, text, entity_type):
            if get_action(entity_type) == EntityAction.REDACT:
                return "[REDACTED]"
            if get_action(entity_type) == EntityAction.PRESERVE:
                return text  # identity — reconstructor will not call this for PRESERVE
            return self._inner.get_or_create(text, entity_type)

    policy_registry = _PolicyRegistry(registry)

    # ── 7. Rebuild document ───────────────────────────────────────────────────
    progress("Rebuilding sanitized document…")
    sanitized_bytes = reconstruct(file_bytes, filename, replaceable, policy_registry)

    # ── 8. Write outputs ──────────────────────────────────────────────────────
    progress("Writing output files…")
    tmp = Path(settings.TEMP_DIR)
    tmp.mkdir(parents=True, exist_ok=True)

    ext            = Path(filename).suffix
    out_filename   = f"{job_id}_sanitized{ext}"
    audit_filename = f"{job_id}_audit.json"
    (tmp / out_filename).write_bytes(sanitized_bytes)

    # ── 9. Build entity list ──────────────────────────────────────────────────
    entity_counts: dict = {}
    action_counts: dict = {"pseudonymized": 0, "redacted": 0, "preserved": 0}
    entity_objects = []
    seen:     dict = {}

    for ent in reconciled:
        action = get_action(ent.entity_type)

        if action == EntityAction.PRESERVE:
            action_counts["preserved"] += 1
            pseudo = ent.text # For audit logs
        elif action == EntityAction.REDACT:
            pseudo = "[REDACTED]"
            action_counts["redacted"] += 1
        else:  # PSEUDONYMIZE
            pseudo = registry.get_or_create(ent.text, ent.entity_type)
            action_counts["pseudonymized"] += 1

        key = f"{ent.text}|{ent.entity_type}"
        entity_counts[ent.entity_type.value] = entity_counts.get(ent.entity_type.value, 0) + 1
        
        if key in seen:
            seen[key]["occurrences"] += 1
        else:
            obj = {
                "original":       ent.text,
                "entity_type":    ent.entity_type.value,
                "pseudonym":      pseudo,
                "action":         action.value,
                "confidence":     float(ent.confidence),
                "source":         ent.source.value,
                "low_confidence": bool(ent.low_confidence),
                "occurrences":    1,
            }
            seen[key] = obj
            entity_objects.append(obj)


    audit_data = {
        "job_id":     job_id,
        "filename":   filename,
        "entity_map": registry.export(),
        "entities":   entity_objects,
    }
    class _NumpySafe(json.JSONEncoder):
        """Handles numpy scalars that slip through — np.float32, np.int64, etc."""
        def default(self, obj):
            try:
                import numpy as np
                if isinstance(obj, np.floating): return float(obj)
                if isinstance(obj, np.integer):  return int(obj)
                if isinstance(obj, np.ndarray):  return obj.tolist()
            except ImportError:
                pass
            return super().default(obj)
    (tmp / audit_filename).write_text(json.dumps(audit_data, indent=2, cls=_NumpySafe))

    elapsed_ms = (time.perf_counter() - t_start) * 1000
    logger.info(f"[{job_id}] Pipeline complete in {elapsed_ms:.1f}ms")

    return {
        "job_id":       job_id,
        "filename":     filename,
        "download_url": f"/files/{out_filename}",
        "audit_url":    f"/files/{audit_filename}",
        "entities":     entity_objects,
        "stats": {
            "total_entities":       len(entity_objects),
            "by_type":              dict(entity_counts),
            "low_confidence_count": sum(1 for e in entity_objects if e["low_confidence"]),
            "processing_time_ms":   round(elapsed_ms, 1),
        },
    }
