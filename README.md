<div align="center">
  <img src="docs/assets/banner.png" alt="CleanRoom Banner" width="100%" />
  
  <br />
  <br />

  <h1>CleanRoom</h1>
  <p><strong>Privacy-Preserving Clinical Document Anonymization Engine</strong></p>

  <p>
    <a href="https://github.com/joshi-parwaaz/cleanroom/actions">
      <img src="https://img.shields.io/github/actions/workflow/status/joshi-parwaaz/cleanroom/ci.yml?style=for-the-badge&color=06B6D4" alt="Build Status" />
    </a>
    <a href="https://github.com/joshi-parwaaz/cleanroom/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-0B1120.svg?style=for-the-badge" alt="License" />
    </a>
    <a href="https://cleanroom-delta.vercel.app/">
      <img src="https://img.shields.io/badge/Live_Demo-06B6D4?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
    </a>
    <a href="https://parwaaz-cleanroom-api.hf.space/docs">
      <img src="https://img.shields.io/badge/API-Docs-0B1120?style=for-the-badge&logo=fastapi&logoColor=white" alt="API Docs" />
    </a>
  </p>
</div>

<br />

**CleanRoom** is a state-of-the-art, privacy-preserving document anonymization system designed specifically for clinical and sensitive unstructured data. It intelligently detects, validates, and pseudonymizes Personally Identifiable Information (PII) and Protected Health Information (PHI).

Unlike traditional destructive redaction, CleanRoom uses **deterministic pseudonymization**. This ensures that documents remain readable and useful for analytics, auditing, and testing while completely shielding sensitive identities.

---

## 🌟 Key Features

- 🧠 **Hybrid Detection Pipeline**: Merges regex-based extraction with transformer-based Named Entity Recognition (NER) using ONNX-optimized models.
- 🔗 **Deterministic Pseudonymization**: Repeated entities map consistently to the same synthetic identity (e.g., "John Doe" becomes "Patient-A" throughout the file).
- 📄 **Advanced Document Support**: Handles TXT, DOCX, and PDFs (including scanned images via OCR).
- 🧩 **Entity Reconciliation**: Intelligent merging of overlapping detections with high-confidence prioritization.
- 🛡️ **Auditability**: Generates detailed JSON audit logs for every detection and replacement action.
- 🔒 **Local-First Privacy**: Designed for self-hosting; no external cloud APIs are required for inference.

---

## 🛠️ Tech Stack

### Backend (Python/FastAPI)
- **FastAPI**: High-performance web framework.
- **ONNX Runtime**: Efficient transformer inference for NER.
- **Presidio**: Microsoft's PII detection and anonymization framework.
- **PyMuPDF & pdfplumber**: Robust PDF parsing and reconstruction.
- **Tesseract OCR**: Optical Character Recognition for scanned documents.

### Frontend (React/TypeScript)
- **Vite**: Ultra-fast build tool and dev server.
- **TailwindCSS**: Utility-first CSS for a modern interface.
- **Framer Motion & GSAP**: Fluid, high-performance animations.
- **Lucide React**: Clean and consistent iconography.

---

## 📁 Project Structure

```text
cleanroom/
├── client/             # React + Vite frontend application
│   ├── src/            # Components, hooks, and logic
│   └── public/         # Static assets
├── server/             # FastAPI backend engine
│   ├── app/            # Core application (API, services, logic)
│   ├── models/         # Local NLP models (quantized ONNX)
│   └── tests/          # Pytest suite
├── docs/               # Project documentation and assets
└── .env.example        # Configuration template
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- Tesseract OCR (optional, for scanned PDF support)

### 2. Backend Setup
```bash
cd server

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download the ONNX NER model
python download_model.py

# Start the server
uvicorn app.main:app --reload --port 8000
```
*API will be available at `http://localhost:8000`*

### 3. Frontend Setup
```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```
*Frontend will be available at `http://localhost:5173`*

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | FastAPI server port | `8000` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:5173` |
| `NER_CONFIDENCE` | Minimum NER confidence threshold | `0.65` |
| `TEMP_DIR` | Temporary file processing directory | `./tmp` |

---

## ⚠️ Current Limitations
- **Boundary Fragmentation**: Rare edge cases in NER output may lead to fragmented entity boundaries.
- **Address Specificity**: Differentiating between generic locations and specific residential addresses is an ongoing area of refinement.
- **OCR Quality**: Reconstruction fidelity depends heavily on the source document resolution.

---

## 📝 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

<div align="center">
  <br />
  <p>Built with ❤️ for privacy-focused workflows.</p>
</div>