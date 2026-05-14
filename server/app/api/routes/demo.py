"""
app/api/routes/demo.py — /api/demo endpoint
Processes raw pasted text for the live detection demo on the landing page.
"""
import time
from collections import defaultdict

from fastapi import APIRouter, HTTPException, status
from loguru import logger

from app.core.config import settings
from app.core.model_manager import model_manager
from app.models.schemas import (
    DemoEntity,
    DemoRequest,
    DemoResponse,
    EntityType,
    ProcessingStats,
)
from app.services.pseudonym_registry import PseudonymRegistry
from app.services.reconciler import reconcile
from app.services.regex_engine import run_regex
from app.services.reconstructor import apply_replacements

router = APIRouter()


@router.post("/demo", response_model=DemoResponse)
async def demo_anonymize(req: DemoRequest):
    """Anonymize raw text for the interactive demo panel."""
    t_start = time.perf_counter()
    text = req.text

    # Regex
    regex_matches = run_regex(text)

    # NER
    ner_results = []
    try:
        ner_results = model_manager.predict(text[:512])
    except Exception as e:
        logger.warning(f"NER inference failed in demo: {e}")

    # Reconcile
    reconciled = reconcile(text, regex_matches, ner_results, settings.NER_CONFIDENCE_THRESHOLD)

    # Registry + anonymized text
    registry = PseudonymRegistry()
    anonymized = apply_replacements(text, reconciled, registry)

    # Build entity list with character offsets
    entities = []
    entity_counts: dict[str, int] = defaultdict(int)
    for ent in reconciled:
        pseudo = registry.get_or_create(ent.text, ent.entity_type)
        entities.append(DemoEntity(
            original=ent.text,
            entity_type=ent.entity_type.value,
            pseudonym=pseudo,
            confidence=round(ent.confidence, 3),
            source=ent.source.value,
            start=ent.start,
            end=ent.end,
        ))
        entity_counts[ent.entity_type.value] += 1

    elapsed_ms = (time.perf_counter() - t_start) * 1000

    return DemoResponse(
        original_text=text,
        anonymized_text=anonymized,
        entities=entities,
        stats=ProcessingStats(
            total_entities=len(entities),
            by_type=dict(entity_counts),
            low_confidence_count=sum(1 for e in reconciled if e.low_confidence),
            processing_time_ms=round(elapsed_ms, 1),
        ),
    )
