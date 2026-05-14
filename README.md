<div align="center">
  <!-- TODO: Replace with actual logo or banner when available -->
  <br />
  <img src="https://via.placeholder.com/1200x300/0B1120/06B6D4?text=CleanRoom+-+Enterprise+Privacy+Engine" alt="CleanRoom Banner" width="100%" />

  <h1>CleanRoom</h1>
  <p><strong>Enterprise-Grade Cryptographic Clinical Data Sanitization</strong></p>

  <p>
    <a href="https://github.com/joshi-parwaaz/cleanroom/actions"><img src="https://img.shields.io/github/actions/workflow/status/joshi-parwaaz/cleanroom/ci.yml?style=for-the-badge&color=06B6D4" alt="Build Status" /></a>
    <a href="https://github.com/joshi-parwaaz/cleanroom/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-0B1120.svg?style=for-the-badge" alt="License" /></a>
    <!-- TODO: Add live deployment link here -->
    <a href="#"><img src="https://img.shields.io/badge/Live_Demo-06B6D4?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  </p>
</div>

<br />

CleanRoom is a high-security, **Zero-Trust** clinical document anonymization engine. Built to securely process unstructured medical documents, CleanRoom identifies, validates, and mathematically replaces Protected Health Information (PHI) and Personally Identifiable Information (PII) while perfectly preserving document schema, structure, and clinical semantics.

It replaces standard redaction (which destroys context) with deterministic pseudonymization, making sanitized data safe for sharing, audit, and longitudinal analysis without ever leaving your machine.

---

## ⚡ Core Architecture

- **Hybrid Detection Engine**: Combines strict clinical Regex patterns with a lightweight, ONNX-quantized Transformer NER model for high-recall extraction.
- **Precision Reconciler**: Mathematical boundary validation and span merging. Rejects greedy multiline extractions, fuses fragmented overlapping geographical entities, and enforces contextual heuristics to prevent false positives.
- **Clinical Policy Engine**: Vetoes redaction on critical medical terminology (e.g., diagnoses, medications, procedures) ensuring the clinical utility of the document is uncompromised.
- **Deterministic Pseudonymization**: Uses SHA-256 seed hashing to ensure an entity is mapped to the *same* realistic fake identity across the entire document ecosystem—vital for research consistency.
- **Zero-Trust Deployment**: Strictly local-first. No API endpoints to external cloud providers. No data leakage.

---

## 🚀 Quick Start (Local Development)

CleanRoom takes ~5 minutes to set up locally.

### 1. Backend API (FastAPI)

```bash
cd server
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download and quantize the NER model (one-time ~500MB download)
python download_model.py

# Start the server
uvicorn app.main:app --reload --port 8000
```
API Documentation available at: `http://localhost:8000/docs`

### 2. Frontend Application (Vite + React)

```bash
cd client
npm install

# Start the development server
npm run dev
```
Access the dashboard at: `http://localhost:5173`

---

## 🛡️ Production Deployment

CleanRoom is designed to run securely within your own VPC or bare-metal environment.

### Single VPS / Bare-Metal (Recommended)
You can deploy CleanRoom on any standard Linux environment (Ubuntu 22.04 LTS recommended) using Nginx and Systemd.

1. Clone the repository and install dependencies (`nginx`, `python3.11`, `nodejs`).
2. Run `python download_model.py` in the `/server` directory to prepare the ONNX runtime.
3. Configure `cleanroom-api.service` in systemd to point to the server directory.
4. Build the client using `npm run build` and serve the `/dist` directory via Nginx.
5. Reverse proxy `/api/` traffic to the local `8000` port.

> [!NOTE]
> Detailed deployment configurations for AWS EC2 and DigitalOcean can be provided via standard Infrastructure-as-Code templates. Ensure `ALLOWED_ORIGINS` is strictly defined in your production `.env`.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the root directory.

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | The port the FastAPI server listens on | `8000` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |
| `NER_CONFIDENCE_THRESHOLD` | Score required to accept generic NER predictions | `0.65` |
| `TEMP_DIR` | Directory for temporary PDF processing | `./tmp` |

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <br />
  <p>Built for trust. Designed for privacy.</p>
</div>
