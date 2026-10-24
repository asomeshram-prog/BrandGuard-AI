# BrandGuard AI

A hackathon-ready brand-compliance review MVP. It combines a responsive HTML/CSS/JavaScript dashboard, FastAPI, SQLite, and optional Groq-powered review.

## Features
- Single-admin login with bearer-token session (12 hours)
- Dashboard metrics: total reviews, approved, rejected, average brand score
- Upload a PDF guideline plus pasted text or TXT/MD/image content
- Brand score, issues, rationale, and suggested corrections
- Reviewer comments and approve/reject decisions
- SQLite persistence and local file storage
- Rule-based fallback when no AI API key is configured

## Requirements
- Python 3.10+
- Optional Groq API key for AI-powered analysis

## Run locally
From the project root:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and update the admin password. To enable Groq analysis, add your key to `GROQ_API_KEY`. Without a key, the app still runs with a transparent lightweight heuristic review.

Start the server from the project root:

```bash
uvicorn backend.main:app --reload
```

Open http://127.0.0.1:8000

Default demo login: `admin` / `brandguard123` (change it in `.env` before sharing the app).

## Demo walkthrough
1. Sign in.
2. Open **New review**.
3. Upload `samples/sample_brand_guideline.pdf` and paste the sample content from `samples/sample_content.txt`.
4. Click **Save & analyze**.
5. Inspect the score, issues, and suggested corrections.
6. Add a reviewer comment and approve or reject.
7. Return to Dashboard to see metrics update.

## API
All endpoints except `POST /login` require `Authorization: Bearer <token>`.

- `POST /login` JSON `{ "username": "admin", "password": "..." }`
- `POST /upload` multipart fields `content_text`, optional `content_file`, optional `guideline_file`
- `POST /analyze` multipart field `review_id`
- `GET /report/{id}`
- `POST /approve/{id}` JSON `{ "comment": "..." }`
- `POST /reject/{id}` JSON `{ "comment": "..." }`
- `GET /dashboard`

Interactive API docs are available at `/docs`.

## Notes and limitations
- PDF extraction works best with text-based PDFs; scanned PDFs need OCR, which is not included in this MVP.
- Images can be uploaded and stored. For dependable review of image contents, describe the visual in the content text field. This MVP does not send image pixels to a vision model.
- The fallback reviewer is intentionally simple and should be treated as a demo aid, not a compliance guarantee.
- Tokens are held in process memory, so logging out/restarting the server invalidates sessions. Use HTTPS, stronger credential storage, rate limits, and a persistent session system before production.
- Uploads are stored locally in `uploads/`; SQLite is created automatically at `database/brandguard.db`.
- To switch to Supabase later, isolate the persistence calls in `backend/main.py` and replace SQLite queries with a repository layer.

## Project layout
```text
BrandGuard-AI/
├── backend/main.py
├── frontend/index.html
├── frontend/styles.css
├── frontend/app.js
├── database/schema.sql
├── samples/sample_brand_guideline.pdf
├── samples/sample_content.txt
├── uploads/.gitkeep
├── .env.example
├── requirements.txt
└── README.md
```
