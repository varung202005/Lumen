# Lumen architecture

Lumen is a local-first experiment-intelligence application. The React frontend calls a FastAPI API; the API profiles datasets, trains sklearn models, creates diagnostics and explanations, then persists all records in SQLite.

```mermaid
flowchart LR
  UI[React + TypeScript UI] --> API[FastAPI]
  API --> DB[(SQLite)]
  API --> Uploads[CSV uploads]
  API --> Trainer[scikit-learn training]
  Trainer --> Artifacts[Joblib model artifacts]
  Trainer --> Intelligence[Diagnostics + explanations]
  Intelligence --> DB
  API --> Gemini[Gemini API - optional Copilot]
```

## Data model

```mermaid
erDiagram
  DATASETS ||--o{ EXPERIMENTS : supplies
  DATASETS ||--o{ RUNS : used_by
  EXPERIMENTS ||--o{ RUNS : contains
  RUNS ||--o{ ARTIFACTS : produces
  RUNS ||--|| MODELS : registers
  MODELS ||--o{ DEPLOYMENTS : deploys
  RUNS ||--o{ INSIGHTS : generates
  DATASETS ||--o{ INSIGHTS : informs
```

The database tables are `datasets`, `experiments`, `runs`, `artifacts`, `models`, `deployments`, `insights`, and `prompts`.

## Deployment boundary

Docker Compose provides a frontend container, a backend container, health checks, and persistent local storage. The current deployment intentionally uses SQLite; PostgreSQL, Redis, Celery, and MinIO remain a scale-out roadmap rather than active claims.
