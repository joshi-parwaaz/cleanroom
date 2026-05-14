from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class EntityType(str, Enum):
    PERSON = "PERSON"
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    ADDRESS = "ADDRESS"
    ORG = "ORG"
    LOCATION = "LOCATION"
    DATE = "DATE"

    PROJECT_CODE = "PROJECT_CODE"

    FINANCIAL = "FINANCIAL"
    FINANCIAL_ID = "FINANCIAL_ID"

    MEDICAL = "MEDICAL"

    SSN = "SSN"
    PASSPORT = "PASSPORT"
    CREDIT_CARD = "CREDIT_CARD"
    MRN = "MRN"

    MISC = "MISC"


class DetectionSource(str, Enum):
    REGEX = "REGEX"
    NER = "NER"
    BOTH = "BOTH"


class JobSubmitResponse(BaseModel):
    job_id: str
    status: str


class JobStatusResponse(BaseModel):
    """
    Response for GET /api/anonymize/{job_id}/status.

    Must include every key that _jobs[job_id] carries — Pydantic's
    response_model strips undeclared fields, so if result/progress_msg/error
    are not declared here the client never sees them.
    """
    job_id: str
    status: str
    progress_msg: Optional[str] = None
    result: Optional[Any] = None   # plain dict from run_pipeline_sync
    error: Optional[str] = None


class DemoRequest(BaseModel):
    text: str


class DemoEntity(BaseModel):
    original: str
    entity_type: str
    pseudonym: str
    confidence: float
    source: str
    start: int
    end: int


class ProcessingStats(BaseModel):
    total_entities: int
    by_type: Dict[str, int]
    low_confidence_count: int
    processing_time_ms: float


class DemoResponse(BaseModel):
    original_text: str
    anonymized_text: str
    entities: List[DemoEntity]
    stats: ProcessingStats