# Lumen

Lumen is an experiment-intelligence MLOps prototype. It provides CSV profiling, model training, diagnostics, explainability, model artifacts, a registry, and local deployment records.

## Run with Docker

1. Copy `.env.example` to `.env` and set secrets only if you need Copilot or shared API protection.
2. Run `docker compose up --build` from this directory.
3. Open `http://localhost:8080`.

The current container stack uses persistent SQLite storage for a simple local deployment. PostgreSQL, Redis, Celery, and MinIO are planned scale-out replacements and are not represented as active dependencies yet.

## Local development

- Backend: `cd project/backend`, install `requirements.txt`, then run `uvicorn main:app --reload`.
- Frontend: `cd project/frontend`, run `npm ci` then `npm run dev`.

The CI workflow runs backend tests/compilation and frontend lint/build on every push and pull request.
