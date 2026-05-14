"""
app/services/reconciler.py
Merges regex and NER detections.

Policy: when in doubt, redact.
  - Regex: always confirmed (confidence 1.0)
  - NER ≥ 0.65: normal mask
  - NER < 0.65: mask anyway, flagged low_confidence
  - Both agree: confirmed
  - Conflict: mask both, log conflict

Span validation rules (NER only):
  - Minimum 3 characters — sub-word fragments are noise
  - Must not start or end mid-word — BERT sub-word tokenisation can produce
    spans like "cula" (from "vascular") which are not real entities
  - Must not be pure whitespace / punctuation
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

from app.models.schemas import DetectionSource, EntityType
from app.services.regex_engine import RegexMatch
from app.core.privacy_policy import is_allowlisted


@dataclass
class ReconciledEntity:
    start: int
    end: int
    text: str
    entity_type: EntityType
    confidence: float
    source: DetectionSource
    low_confidence: bool = False


# HuggingFace NER label → EntityType map
_NER_LABEL_MAP = {
    "PER":      EntityType.PERSON,
    "PERSON":   EntityType.PERSON,
    "ORG":      EntityType.ORG,
    "LOC":      EntityType.ADDRESS,
    "LOCATION": EntityType.ADDRESS,
    "MISC":     EntityType.MISC,
}

# Minimum entity text length accepted from NER.
# Sub-word fragments ("cula", "Pa", "Re") are 1-4 chars and always noise.
_MIN_NER_LEN = 3


def _is_mid_word(text: str, start: int, end: int) -> bool:
    """
    Return True if the entity span cuts through the middle of a word.

    BERT tokenises "vascular" → ["v","##as","##cu","##lar"].  With
    aggregation_strategy="simple" the model can merge "##cu"+"##lar" into
    entity span [4,8] inside "vascular".  That span starts/ends mid-word
    and is garbage — we must drop it before it reaches the reconstructor.

    A span is mid-word when:
      • the character immediately BEFORE start is alphabetic AND
        the entity itself starts with an alphabetic character, OR
      • the character immediately AFTER end is alphabetic AND
        the entity itself ends with an alphabetic character.
    """
    entity_text = text[start:end]
    if not entity_text:
        return True
    if start > 0 and text[start - 1].isalpha() and entity_text[0].isalpha():
        return True
    if end < len(text) and text[end].isalpha() and entity_text[-1].isalpha():
        return True
    return False


def _is_valid_span(text: str, start: int, end: int) -> bool:
    """All-in-one gate for NER and Regex spans."""
    if start < 0 or end > len(text) or start >= end:
        return False
    entity_text = text[start:end]
    
    # ── Strict Boundary Enforcement ───────────────────────────────────────────
    # Never allow entity spans to include newlines or field delimiters.
    # This prevents the pipeline from destroying the document schema.
    if "\n" in entity_text or "\r" in entity_text:
        return False
    if ":" in entity_text:
        return False

    # Too short — almost certainly a sub-word fragment
    if len(entity_text.strip()) < _MIN_NER_LEN:
        return False
    # Purely whitespace or punctuation — not a real entity
    if not any(c.isalnum() for c in entity_text):
        return False
    # Cuts through a word interior — BERT tokenisation artefact
    if _is_mid_word(text, start, end):
        return False
    return True


# Per-entity-type minimum NER confidence. Lowered significantly to ensure
# we do not silently drop patient names. The mid-word garbage filter and
# clinical allowlist will handle noise reduction.
_NER_CONFIDENCE: dict = {
    EntityType.PERSON:   0.40,  # Must catch patient names even if low confidence
    EntityType.ORG:      0.60,
    EntityType.ADDRESS:  0.60,
    EntityType.LOCATION: 0.60,
    EntityType.MISC:     0.70,  # catch-all label — still keep slightly higher
}
_DEFAULT_CONFIDENCE = 0.40

_HIGH_RISK_TYPES = {
    EntityType.PERSON, EntityType.SSN, EntityType.MRN, 
    EntityType.FINANCIAL_ID, EntityType.EMAIL, EntityType.PHONE, EntityType.CREDIT_CARD
}

def _passes_type_heuristics(text: str, entity_type: EntityType, confidence: float, threshold: float) -> bool:
    """Type-specific contextual validation to drop false positives."""
    words = text.split()
    
    # Address logic: avoid single generic words
    if entity_type in (EntityType.ADDRESS, EntityType.LOCATION):
        if len(words) == 1 and not any(c.isdigit() for c in text):
            # Drops "Hospital", "Centers", "Williams" as ADDRESS
            return False

    # Person logic: avoid low-confidence single names
    if entity_type == EntityType.PERSON:
        if len(words) == 1 and confidence < threshold:
            # Drops isolated single tokens predicted as PERSON without confidence
            return False
            
    return True


def reconcile(
    text: str,
    regex_matches: List[RegexMatch],
    ner_results: list,
    threshold: float = 0.65,
) -> List[ReconciledEntity]:
    """Merge regex and NER; return deduplicated, policy-applied entities."""

    entities: List[ReconciledEntity] = []

    # ── Regex matches (always trusted, confidence 1.0) ────────────────────────
    regex_spans: dict[tuple, ReconciledEntity] = {}
    for rm in regex_matches:
        if not _is_valid_span(text, rm.start, rm.end):
            continue
            
        key = (rm.start, rm.end)
        ent = ReconciledEntity(
            start=rm.start,
            end=rm.end,
            text=rm.text,
            entity_type=rm.entity_type,
            confidence=1.0,
            source=DetectionSource.REGEX,
        )
        regex_spans[key] = ent
        entities.append(ent)

    # ── NER results (span-validated before accepting) ─────────────────────────
    for nr in ner_results:
        start = nr.get("start", 0)
        end   = nr.get("end",   0)
        score = float(nr.get("score", 0.0))
        label = nr.get("entity_group", nr.get("entity", "MISC"))

        # ── Span integrity check — drop garbage before anything else ──────────
        if not _is_valid_span(text, start, end):
            continue

        entity_text = text[start:end]
        entity_type = _NER_LABEL_MAP.get(label, EntityType.MISC)
        low_conf    = score < threshold

        # Check overlap with regex spans
        overlapping_regex = None
        for (rs, re_), rex_ent in regex_spans.items():
            if rs < end and re_ > start:      # spans overlap
                overlapping_regex = rex_ent
                break

        if overlapping_regex:
            # Both agree — upgrade source to BOTH
            overlapping_regex.source     = DetectionSource.BOTH
            overlapping_regex.confidence = max(overlapping_regex.confidence, score)
        else:
            # Use per-type threshold, fall back to global default
            type_threshold = _NER_CONFIDENCE.get(entity_type, _DEFAULT_CONFIDENCE)
            
            # Contextual heuristics validation
            if not _passes_type_heuristics(entity_text, entity_type, score, type_threshold):
                continue
                
            low_conf = score < type_threshold
            
            # Confidence policy: drop low-confidence non-critical entities
            if low_conf and entity_type not in _HIGH_RISK_TYPES:
                continue

            entities.append(ReconciledEntity(
                start=start,
                end=end,
                text=entity_text,
                entity_type=entity_type,
                confidence=score,
                source=DetectionSource.NER,
                low_confidence=low_conf,
            ))

    # ── Sort: position ascending, longer span wins on ties ────────────────────
    entities.sort(key=lambda e: (e.start, -(e.end - e.start)))

    # ── Deduplication: remove contained / overlapping spans ───────────────────
    deduped: List[ReconciledEntity] = []
    last_end = -1
    for ent in entities:
        if not deduped or ent.start >= last_end:
            deduped.append(ent)
            last_end = ent.end
        else:
            prev = deduped[-1]
            # Overlap detected: If both are addresses, fuse them into one contiguous span
            if prev.entity_type in (EntityType.ADDRESS, EntityType.LOCATION) and ent.entity_type in (EntityType.ADDRESS, EntityType.LOCATION):
                merged_end = max(prev.end, ent.end)
                prev.end = merged_end
                prev.text = text[prev.start:merged_end]
                prev.entity_type = EntityType.ADDRESS
                prev.confidence = max(prev.confidence, ent.confidence)
                last_end = prev.end
            else:
                # Keep the longer or higher-confidence span
                if ent.end > last_end and ent.confidence >= prev.confidence:
                    deduped[-1] = ent
                    last_end = ent.end

    # ── Hierarchical Span Merging (Addresses) ─────────────────────────────────
    # Merge adjacent ADDRESS/LOCATION entities separated only by whitespace/punctuation
    merged: List[ReconciledEntity] = []
    i = 0
    while i < len(deduped):
        current = deduped[i]
        
        if current.entity_type in (EntityType.ADDRESS, EntityType.LOCATION):
            # Look ahead to merge
            while i + 1 < len(deduped):
                next_ent = deduped[i + 1]
                if next_ent.entity_type in (EntityType.ADDRESS, EntityType.LOCATION):
                    gap_text = text[current.end:next_ent.start]
                    # Check if gap is short and contains only space/punctuation
                    if len(gap_text) <= 5 and not any(c.isalnum() for c in gap_text):
                        # Merge them
                        current.end = next_ent.end
                        current.text = text[current.start:current.end]
                        current.entity_type = EntityType.ADDRESS  # Upgrade to full address
                        current.confidence = max(current.confidence, next_ent.confidence)
                        i += 1
                        continue
                break
        merged.append(current)
        i += 1

    # Allowlist veto: drop entities whose text matches known clinical terms.
    # NER frequently labels medication names and diagnoses as PERSON/ORG/LOC.
    # Preserving them here prevents false-positive redaction.
    final = [e for e in merged if not is_allowlisted(e.text)]

    return final
