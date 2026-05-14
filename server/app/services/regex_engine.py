"""
app/services/regex_engine.py
Deterministic regex patterns for PII/PHI entity detection.
Regex matches are always treated as confirmed detections (confidence = 1.0).
"""
import re
from dataclasses import dataclass
from typing import List, Tuple

from app.models.schemas import EntityType


@dataclass
class RegexMatch:
    start: int
    end: int
    text: str
    entity_type: EntityType
    confidence: float = 1.0


# ── Pattern Library ───────────────────────────────────────────────────────────
_PATTERNS: List[Tuple[EntityType, re.Pattern]] = [
    # Clinical Document Headers (Name / Patient Name / PT)
    # Catches things like "Patient Name: Parwaaz Joshi" which NER often skips.
    # Uses [ \t] instead of \s to prevent multiline greediness.
    (EntityType.PERSON, re.compile(
        r"\b(?:Patient Name|Patient|Name|PT)[ \t:]+([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)+)\b"
    )),
    # SSN  (###-##-####)
    (EntityType.SSN, re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    # Credit card (16-digit, optionally grouped)
    (EntityType.CREDIT_CARD, re.compile(
        r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}"
        r"|6(?:011|5[0-9]{2})[0-9]{12}|(?:\d{4}[- ]){3}\d{4})\b"
    )),
    # Email
    (EntityType.EMAIL, re.compile(
        r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"
    )),
    # US phone  (multiple formats)
    (EntityType.PHONE, re.compile(
        r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
    )),
    # Medical Record Number
    (EntityType.MRN, re.compile(
        r"\bMRN[:\s#]*\d{6,10}\b", re.IGNORECASE
    )),
    # Account / financial IDs
    (EntityType.FINANCIAL_ID, re.compile(
        r"\b(?:Account|Acct|A\/C)[:\s#]*\d{6,18}\b", re.IGNORECASE
    )),
    # Project codes (e.g. "Project Athena", "Project Helix")
    (EntityType.PROJECT_CODE, re.compile(
        r"\bProject\s+[A-Z][A-Za-z]{3,}\b"
    )),
    # IP addresses
    (EntityType.MISC, re.compile(
        r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    )),
    # Dates  (MM/DD/YYYY or YYYY-MM-DD)
    (EntityType.MISC, re.compile(
        r"\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\b"
    )),
]


def run_regex(text: str) -> List[RegexMatch]:
    """Apply all patterns to text; return sorted non-overlapping matches."""
    raw: List[RegexMatch] = []
    for entity_type, pattern in _PATTERNS:
        for m in pattern.finditer(text):
            # If the pattern uses a capturing group, extract ONLY that group.
            # This prevents replacing structural labels like "Patient Name: ".
            if pattern.groups > 0:
                start = m.start(1)
                end   = m.end(1)
                match_text = m.group(1)
            else:
                start = m.start()
                end   = m.end()
                match_text = m.group()

            raw.append(RegexMatch(
                start=start,
                end=end,
                text=match_text,
                entity_type=entity_type,
            ))

    # Sort by start position, then remove overlaps (keep longer span)
    raw.sort(key=lambda x: (x.start, -(x.end - x.start)))
    deduped: List[RegexMatch] = []
    last_end = -1
    for match in raw:
        if match.start >= last_end:
            deduped.append(match)
            last_end = match.end

    return deduped
