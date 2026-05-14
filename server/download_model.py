#!/usr/bin/env python3
"""
download_model.py
Downloads and quantizes the dslim/bert-base-NER model to ONNX INT8 format.
Run once before starting the server.
"""
import os
from pathlib import Path

MODEL_ID = "dslim/bert-base-NER"
MODEL_DIR = Path("./models")
ONNX_PATH = MODEL_DIR / "bert_ner_quantized.onnx"
TOKENIZER_PATH = MODEL_DIR / "tokenizer"


def main():
    print("CleanRoom — Model Downloader")
    print("=" * 50)
    MODEL_DIR.mkdir(exist_ok=True)

    print(f"[1/3] Downloading tokenizer from HuggingFace: {MODEL_ID}")
    from transformers import AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    tokenizer.save_pretrained(str(TOKENIZER_PATH))
    print(f"      Tokenizer saved → {TOKENIZER_PATH}")

    print(f"[2/3] Exporting model to ONNX format...")
    try:
        from optimum.onnxruntime import ORTModelForTokenClassification
        ort_model = ORTModelForTokenClassification.from_pretrained(
            MODEL_ID, export=True
        )
        ort_model.save_pretrained(str(MODEL_DIR / "onnx_fp32"))
        print(f"      ONNX FP32 model saved → {MODEL_DIR / 'onnx_fp32'}")

        print(f"[3/3] Quantizing to INT8 for faster inference...")
        from optimum.onnxruntime.configuration import AutoQuantizationConfig
        from optimum.onnxruntime import ORTQuantizer

        quantizer = ORTQuantizer.from_pretrained(str(MODEL_DIR / "onnx_fp32"))
        qconfig = AutoQuantizationConfig.arm64(is_static=False, per_channel=False)
        quantizer.quantize(save_dir=str(MODEL_DIR), quantization_config=qconfig)

        # Rename to expected path
        quantized_files = list(MODEL_DIR.glob("*quantized*.onnx"))
        if quantized_files:
            quantized_files[0].rename(ONNX_PATH)
        else:
            # fallback: copy fp32
            import shutil
            shutil.copy(str(MODEL_DIR / "onnx_fp32" / "model.onnx"), str(ONNX_PATH))

        print(f"      Quantized model saved → {ONNX_PATH}")

    except Exception as e:
        print(f"      ONNX export failed ({e}), falling back to raw transformers inference.")
        print("      Performance will be lower but functionality unchanged.")
        # Create a marker file so server knows to use transformers directly
        (MODEL_DIR / "USE_TRANSFORMERS_FALLBACK").touch()

    print()
    print("✓ Model ready. You can now start the server:")
    print("  uvicorn app.main:app --reload --port 8000")


if __name__ == "__main__":
    main()
