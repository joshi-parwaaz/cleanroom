"""
app/services/pseudonym_registry.py
Deterministic, realistic pseudonym generation via SHA-256 seed + Faker.

The same input entity always maps to the same pseudonym within (and across)
sessions.  Faker is seeded from the SHA-256 hash of the normalized entity
text so output is deterministic without storing any state on disk.

Key improvements over v1:
  - Addresses: no APO/DPO military addresses; clean city/state/zip format
  - Emails: preserves domain when non-personal; name-dot-name format
  - Phones: preserves formatting style (dashes / parens / international prefix)
  - Names: preserves title prefix (Dr., Mr., Mrs.) if present
  - Privacy-mode-aware: PRESERVE action means registry is never called
"""
from __future__ import annotations

import hashlib
import random
import re
from typing import Dict

from faker import Faker

from app.models.schemas import EntityType

_fake = Faker("en_US")
Faker.seed(0)  # base seed; overridden per-entity by _seeded()

# Personal email domains that should be swapped for a corporate-looking one
_PERSONAL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
    "aol.com", "protonmail.com", "live.com", "msn.com", "me.com",
}
_CORP_DOMAINS = [
    "nexacore.io", "databridge.co", "synaptiq.com", "veloxtech.net",
    "axionhealth.com", "meridianops.io", "corelink.ai", "heliosdata.com",
]

# Phone format detection patterns
_PHONE_FORMATS = {
    "intl":   re.compile(r"^\+"),
    "parens": re.compile(r"\(\d{3}\)"),
    "dashes": re.compile(r"\d{3}-\d{3}-\d{4}"),
    "dots":   re.compile(r"\d{3}\.\d{3}\.\d{4}"),
}

# Title prefixes to preserve
_TITLES = ["Dr.", "Dr ", "Mr.", "Mr ", "Mrs.", "Mrs ", "Ms.", "Ms ",
           "Prof.", "Prof ", "Sir ", "Rev."]


def _seeded(seed: int) -> Faker:
    Faker.seed(seed)
    random.seed(seed)
    return _fake


def _normalize(text: str) -> str:
    return re.sub(r"[^\w@.\-]", "", text.lower().strip())


def _hash_seed(normalized: str) -> int:
    digest = hashlib.sha256(normalized.encode()).digest()
    return int.from_bytes(digest[:8], "big")


# ─── Type-specific generators ─────────────────────────────────────────────────

def _gen_person(original: str, seed: int) -> str:
    f = _seeded(seed)
    # Preserve title prefix (Dr., Mr., etc.)
    title = ""
    for t in _TITLES:
        if original.strip().startswith(t):
            title = t.rstrip() + " "
            break
    first = f.first_name()
    last  = f.last_name()
    return f"{title}{first} {last}"


def _gen_email(original: str, seed: int) -> str:
    f = _seeded(seed)
    # Try to parse original domain
    m = re.match(r"[^@]+@(.+)", original.strip())
    if m:
        orig_domain = m.group(1).lower()
        if orig_domain in _PERSONAL_DOMAINS:
            random.seed(seed)
            domain = random.choice(_CORP_DOMAINS)
        else:
            domain = orig_domain  # preserve corporate domain
    else:
        random.seed(seed)
        domain = random.choice(_CORP_DOMAINS)

    first = f.first_name().lower()
    last  = f.last_name().lower()
    random.seed(seed + 1)
    # Mirror original's username style: dot-separated vs single token
    if "." in (original.split("@")[0] if "@" in original else original):
        username = f"{first}.{last}"
    else:
        username = f"{first}{last[0]}"

    return f"{username}@{domain}"


def _gen_phone(original: str, seed: int) -> str:
    f = _seeded(seed)
    # Detect and preserve formatting style
    stripped = re.sub(r"\D", "", original)

    if _PHONE_FORMATS["intl"].match(original):
        # International: preserve country code, replace rest
        prefix = original[:original.index(stripped[1])] if len(stripped) > 10 else "+"
        cc = stripped[:len(stripped) - 10] or "1"
        num = f.numerify("##########")
        return f"+{cc} {num[:3]}-{num[3:6]}-{num[6:]}"
    elif _PHONE_FORMATS["parens"].search(original):
        return f"({f.numerify('###')}) {f.numerify('###-####')}"
    elif _PHONE_FORMATS["dashes"].search(original):
        return f.numerify("###-###-####")
    elif _PHONE_FORMATS["dots"].search(original):
        return f.numerify("###.###.####")
    else:
        return f.numerify("##########")


def _gen_address(seed: int) -> str:
    f = _seeded(seed)
    # Avoid APO/FPO military addresses and multi-line output
    street = f.street_address()
    city   = f.city()
    state  = f.state_abbr()
    zip_   = f.postcode()
    return f"{street}, {city}, {state} {zip_}"


def _generate(entity_type: EntityType, seed: int, original: str = "") -> str:
    f = _seeded(seed)
    match entity_type:
        case EntityType.PERSON:
            return _gen_person(original, seed)
        case EntityType.EMAIL:
            return _gen_email(original, seed)
        case EntityType.PHONE:
            return _gen_phone(original, seed)
        case EntityType.ADDRESS | EntityType.LOCATION:
            return _gen_address(seed)
        case EntityType.SSN:
            return f.ssn()
        case EntityType.CREDIT_CARD:
            return f.credit_card_number(card_type="visa")
        case EntityType.MRN:
            return f"MRN-{f.numerify('######')}"
        case EntityType.FINANCIAL_ID:
            return f"ACCT-{f.numerify('############')}"
        case EntityType.PROJECT_CODE:
            words = ["Vantage", "Nexus", "Solace", "Ember", "Cipher",
                     "Prism", "Aether", "Quorum", "Zephyr", "Beacon",
                     "Orbit", "Vertex", "Helix", "Apex", "Stratus"]
            random.seed(seed)
            return f"Project {random.choice(words)}"
        case EntityType.ORG:
            return f.company()
        case EntityType.DATE:
            return f.date(pattern="%m/%d/%Y")
        case _:
            return f"[REDACTED_{f.lexify('????').upper()}]"


class PseudonymRegistry:
    """Session-scoped registry: original_text → pseudonym."""

    def __init__(self):
        self._map: Dict[str, str] = {}

    def get_or_create(self, original: str, entity_type: EntityType) -> str:
        key = _normalize(original)
        if key not in self._map:
            seed = _hash_seed(key)
            self._map[key] = _generate(entity_type, seed, original)
        return self._map[key]

    def export(self) -> Dict[str, str]:
        return dict(self._map)
