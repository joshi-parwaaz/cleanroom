"""
app/core/privacy_policy.py
Configurable anonymization policy layer.

PrivacyMode controls what happens to each entity type:
  PSEUDONYMIZE — replace with a realistic deterministic fake
  REDACT       — replace with [REDACTED]
  PRESERVE     — leave the original text untouched

Medical / clinical terms allowlist prevents false-positive redaction of
medications, diagnoses, and procedures that NER incorrectly classifies
as named entities.
"""
from __future__ import annotations

from enum import Enum
from typing import Dict, Set

from app.models.schemas import EntityType


class EntityAction(str, Enum):
    PSEUDONYMIZE = "pseudonymize"
    REDACT       = "redact"
    PRESERVE     = "preserve"


# ─── Single Standard Policy ───────────────────────────────────────────────────
_POLICY: Dict[EntityType, EntityAction] = {
    EntityType.PERSON:       EntityAction.PSEUDONYMIZE,
    EntityType.EMAIL:        EntityAction.PSEUDONYMIZE,
    EntityType.PHONE:        EntityAction.PSEUDONYMIZE,
    EntityType.ADDRESS:      EntityAction.PSEUDONYMIZE,
    EntityType.SSN:          EntityAction.REDACT,
    EntityType.MRN:          EntityAction.PSEUDONYMIZE,
    EntityType.CREDIT_CARD:  EntityAction.REDACT,
    EntityType.ORG:          EntityAction.PRESERVE,
    EntityType.LOCATION:     EntityAction.PRESERVE,
    EntityType.DATE:         EntityAction.PSEUDONYMIZE,
    EntityType.FINANCIAL:    EntityAction.PSEUDONYMIZE,
    EntityType.FINANCIAL_ID: EntityAction.REDACT,
    EntityType.PROJECT_CODE: EntityAction.PSEUDONYMIZE,
    EntityType.MEDICAL:      EntityAction.PRESERVE,
    EntityType.MISC:         EntityAction.PRESERVE,
}


def get_action(entity_type: EntityType) -> EntityAction:
    """Return the action for a given entity type under the standard policy."""
    return _POLICY.get(entity_type, EntityAction.PRESERVE)


# ─── Medical / clinical term allowlist ───────────────────────────────────────
#
# Terms on this list are NEVER anonymised regardless of what NER labels them.
# NER (especially general-purpose BERT) frequently tags medication names,
# diagnoses, and anatomical terms as PERSON/ORG/LOC — this list vetoes that.
#
# Structure:
#   Lower-cased tokens.  Matching is case-insensitive substring/whole-word.
#   Add domain-specific terms by extending the sets below.
#
_DRUG_NAMES: Set[str] = {
    # NSAIDs / analgesics
    "ibuprofen", "aspirin", "acetaminophen", "paracetamol", "naproxen",
    "celecoxib", "diclofenac", "indomethacin", "ketorolac", "meloxicam",
    "piroxicam", "tramadol", "codeine", "morphine", "oxycodone", "hydrocodone",
    "fentanyl", "buprenorphine", "methadone",
    # Antibiotics
    "amoxicillin", "amoxicillin-clavulanate", "azithromycin", "ciprofloxacin",
    "doxycycline", "cephalexin", "clindamycin", "metronidazole", "nitrofurantoin",
    "trimethoprim", "sulfamethoxazole", "levofloxacin", "moxifloxacin",
    "vancomycin", "linezolid", "piperacillin", "tazobactam", "meropenem",
    # Cardiovascular
    "atorvastatin", "rosuvastatin", "simvastatin", "lovastatin", "pravastatin",
    "lisinopril", "enalapril", "ramipril", "amlodipine", "nifedipine",
    "metoprolol", "atenolol", "carvedilol", "bisoprolol", "propranolol",
    "furosemide", "hydrochlorothiazide", "spironolactone", "warfarin",
    "apixaban", "rivaroxaban", "dabigatran", "clopidogrel", "aspirin",
    "digoxin", "amiodarone", "diltiazem", "verapamil",
    # Diabetes
    "metformin", "insulin", "glipizide", "glimepiride", "sitagliptin",
    "empagliflozin", "dapagliflozin", "liraglutide", "semaglutide",
    "pioglitazone", "canagliflozin",
    # Mental health / neuro
    "sertraline", "fluoxetine", "escitalopram", "citalopram", "paroxetine",
    "venlafaxine", "duloxetine", "bupropion", "mirtazapine", "trazodone",
    "alprazolam", "lorazepam", "diazepam", "clonazepam", "zolpidem",
    "quetiapine", "risperidone", "olanzapine", "aripiprazole", "haloperidol",
    "lithium", "valproate", "lamotrigine", "levetiracetam", "gabapentin",
    "pregabalin", "carbamazepine", "phenytoin",
    # Respiratory
    "albuterol", "salbutamol", "budesonide", "fluticasone", "salmeterol",
    "tiotropium", "ipratropium", "montelukast", "theophylline",
    # Gastrointestinal
    "omeprazole", "pantoprazole", "esomeprazole", "lansoprazole",
    "ranitidine", "famotidine", "ondansetron", "metoclopramide",
    "loperamide", "bisacodyl", "lactulose",
    # Hormones / endocrine
    "levothyroxine", "prednisone", "prednisolone", "dexamethasone",
    "hydrocortisone", "methylprednisolone", "testosterone", "estradiol",
    "progesterone", "tamoxifen", "letrozole", "anastrozole",
    # Misc common
    "hydroxychloroquine", "chloroquine", "ivermectin", "dexamethasone",
    "remdesivir", "tocilizumab", "baricitinib",
}

_DIAGNOSES: Set[str] = {
    "diabetes", "hypertension", "hyperlipidemia", "dyslipidemia",
    "asthma", "copd", "pneumonia", "influenza", "covid-19", "covid",
    "depression", "anxiety", "schizophrenia", "bipolar", "dementia",
    "alzheimer", "parkinson", "epilepsy", "seizure", "stroke", "tia",
    "myocardial infarction", "heart failure", "atrial fibrillation",
    "hypothyroidism", "hyperthyroidism", "anemia", "thrombosis",
    "pulmonary embolism", "dvt", "osteoporosis", "osteoarthritis",
    "rheumatoid arthritis", "lupus", "gout", "fibromyalgia",
    "chronic kidney disease", "ckd", "liver disease", "cirrhosis",
    "hepatitis", "crohn", "ulcerative colitis", "ibs", "gerd",
    "appendicitis", "cholecystitis", "pancreatitis",
    "cancer", "carcinoma", "lymphoma", "leukemia", "melanoma",
    "breast cancer", "lung cancer", "prostate cancer", "colon cancer",
}

_PROCEDURES: Set[str] = {
    "mri", "ct scan", "x-ray", "ultrasound", "ecg", "ekg", "eeg",
    "colonoscopy", "endoscopy", "biopsy", "surgery", "laparoscopy",
    "catheterization", "dialysis", "chemotherapy", "radiotherapy",
    "physiotherapy", "rehabilitation", "vaccination", "immunization",
    "blood test", "urinalysis", "spirometry", "echocardiogram",
}

_ANATOMICAL: Set[str] = {
    "heart", "lung", "liver", "kidney", "brain", "spinal", "cervical",
    "lumbar", "thoracic", "femur", "tibia", "fibula", "humerus",
    "radius", "ulna", "phalanx", "vertebra", "trachea", "bronchus",
    "alveoli", "glomerulus", "cortex", "hippocampus", "ventricle",
    "atrium", "aorta", "artery", "vein", "capillary",
}

_PROJECT_TERMS: Set[str] = {
    "cleanroom", "cleanroom project", "project cleanroom"
}

# Combined allowlist — all lower-cased
CLINICAL_ALLOWLIST: Set[str] = (
    _DRUG_NAMES | _DIAGNOSES | _PROCEDURES | _ANATOMICAL | _PROJECT_TERMS
)


def is_allowlisted(text: str) -> bool:
    """
    Return True if the entity text is a known clinical/medical term that
    should never be anonymised.  Matching is case-insensitive whole-word.
    """
    normalized = text.strip().lower()
    if normalized in CLINICAL_ALLOWLIST:
        return True
    # Also check if the text is a sub-phrase containing an allowlisted term
    # (e.g. "Ibuprofen 400mg" contains "ibuprofen")
    for term in CLINICAL_ALLOWLIST:
        if len(term) >= 5 and term in normalized:
            return True
    return False
