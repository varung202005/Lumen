# Lumen backend

Run locally with `pip install -r requirements.txt` then `uvicorn main:app --reload`.
The API is available at `http://localhost:8000`; the health endpoint is `/api/health`.

Configuration is environment based:

- `GEMINI_API_KEY`: optional server-only Gemini key for Copilot.
- `LUMEN_GEMINI_MODEL`: Gemini model name.
- `LUMEN_CORS_ORIGINS`: comma-separated permitted frontend origins.
- `LUMEN_API_KEY`: optional shared API key. If set, clients must send `X-API-Key` for API routes other than health.
- `LUMEN_STORAGE_DIR` / `LUMEN_DB_PATH`: storage locations used in containers.

Run checks with `pytest -q` and `python -m compileall -q .`.
