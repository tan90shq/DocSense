# ✦ DocSense Backend Service

<p align="center">
  <img src="../DocSense_Logo.png" alt="DocSense Logo" width="120" style="border-radius: 16px; margin-bottom: 12px;" />
</p>

<p align="center">
  <strong>FastAPI • PyMuPDF • SentenceTransformers • Qdrant Cloud • Groq LPU</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.142.2-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PyMuPDF-1.28.2-FF6F00?style=flat-square&logo=pdf&logoColor=white" alt="PyMuPDF" />
  <img src="https://img.shields.io/badge/Qdrant-Cloud_Vector_DB-DC2626?style=flat-square&logo=qdrant&logoColor=white" alt="Qdrant" />
  <img src="https://img.shields.io/badge/Groq-LPU_Inference-F55036?style=flat-square&logo=fastly&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Backend-Hand--Crafted%20by%20Me-8B5CF6?style=flat-square&logo=python&logoColor=white" alt="Hand-Crafted" />
</p>

---

## 📖 Complete Technical Specification

> [!TIP]
> For a comprehensive, step-by-step deep dive into all backend subsystems, see:
> 
> 👉 **[ARCHITECTURE.md](./ARCHITECTURE.md) — The Complete Backend Architecture & Systems Manual**
> 
> - **1. The Master Flow:** Complete flowchart from PDF upload to grounded answer and UI sync.
> - **2. `/upload` Structured Flow:** Step-by-step ingestion, layout parsing, font-hierarchy math, and Qdrant collection upsert.
> - **3. `/ask` Structured Flow:** Multi-query expansion, Qdrant vector retrieval, MS-MARCO reranking, grounded synthesis, and rolling memory.
> - **4. Auxiliary Endpoints:** Short technical summaries for all 8 other REST routes.
> - **5. Function & File Showcase:** In-depth documentation of all critical functions in `chunking.py`, `qdrant.py`, `retrieval.py`, and `main.py`.

---

## ⚡ Quickstart

### 1. Environment Setup
```bash
# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 2. Environment Variables (`.env`)
```env
GROQ_API_KEY="your-groq-api-key"
QDRANT_URL="https://your-cluster.qdrant.io"
QDRANT_API_KEY="your-qdrant-api-key"
```

### 3. Launch Server
```bash
uvicorn main:app --reload --port 8001
```
Interactive docs will be available at:
- **Swagger UI:** `http://localhost:8001/docs`
- **ReDoc:** `http://localhost:8001/redoc`

### 4. Run Automated Test Suite
```bash
python api_flow_tests/run_all_tests.py
```

---

## 📂 Backend File Organization

- [`main.py`](./main.py) — FastAPI routing, lifecycle handlers, and JSON storage persistence.
- [`schemas.py`](./schemas.py) — Pydantic request/response validation schemas.
- [`services/chunking.py`](./services/chunking.py) — PyMuPDF font-aware layout parser and 120-word overlapping chunk generator.
- [`services/qdrant.py`](./services/qdrant.py) — Qdrant collection creation, batch embedding, and upsert engine.
- [`services/retrieval.py`](./services/retrieval.py) — Groq multi-query expansion, Qdrant vector retrieval, cross-encoder neural reranking, grounded synthesis, and rolling chat summarizer.
- [`data/`](./data/) — JSON state persistence (`all_pdfs.json`, `all_sessions.json`).
- [`uploads/`](./uploads/) — Safe filesystem storage for uploaded PDF documents.
- [`api_flow_tests/`](./api_flow_tests/) — 19-scenario automated test suite.
