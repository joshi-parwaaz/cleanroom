"""
app/core/model_manager.py
Loads the NER model at startup.
Falls back to raw HuggingFace transformers if ONNX artefacts are absent.
Pydantic v2 "model_" namespace warning is suppressed via schemas fix.
"""
from pathlib import Path
from loguru import logger
from app.core.config import settings


class ModelManager:
    def __init__(self):
        self.pipeline = None
        self._use_transformers = False

    async def load(self):
        onnx_path      = Path(settings.MODEL_PATH)
        fallback_marker = Path("./models/USE_TRANSFORMERS_FALLBACK")
        if fallback_marker.exists() or not onnx_path.exists():
            logger.warning("ONNX model not found — using HuggingFace transformers (slower).")
            self._load_transformers()
        else:
            self._load_onnx(onnx_path)

    def _load_onnx(self, onnx_path: Path):
        try:
            from optimum.onnxruntime import ORTModelForTokenClassification
            from transformers import AutoTokenizer, pipeline as hf_pipeline
            logger.info(f"Loading ONNX model from {onnx_path.parent}")
            tokenizer = AutoTokenizer.from_pretrained(settings.TOKENIZER_PATH)
            model     = ORTModelForTokenClassification.from_pretrained(str(onnx_path.parent))
            self.pipeline = hf_pipeline(
                "ner", model=model, tokenizer=tokenizer,
                aggregation_strategy="simple",
            )
            logger.info("ONNX NER pipeline ready.")
        except Exception as e:
            logger.error(f"ONNX load failed: {e} — falling back to transformers.")
            self._load_transformers()

    def _load_transformers(self):
        from transformers import pipeline as hf_pipeline
        self._use_transformers = True
        self.pipeline = hf_pipeline(
            "ner",
            model="dslim/bert-base-NER",
            aggregation_strategy="simple",
        )
        logger.info("HuggingFace transformers NER pipeline ready.")

    async def unload(self):
        self.pipeline = None

    def predict(self, text: str) -> list:
        if self.pipeline is None:
            raise RuntimeError("Model not loaded.")
        return self.pipeline(text[:512])


model_manager = ModelManager()
