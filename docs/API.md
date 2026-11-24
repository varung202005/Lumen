# Lumen API reference

The interactive OpenAPI reference is available at `/docs` while the backend is running. All routes below are prefixed with `/api`.

| Route | Purpose |
| --- | --- |
| `GET /health` | Service health check |
| `POST /datasets/upload` | Upload and profile a CSV file |
| `GET /datasets`, `GET /datasets/{id}` | Read datasets and profiles |
| `POST /runs` | Train a classification or regression model |
| `GET /runs`, `GET /runs/{id}` | Read runs and metrics |
| `GET /runs/{id}/explanation` | Get stored feature importance |
| `GET /experiments`, `GET /experiments/{id}` | Read experiment histories |
| `GET /insights` | Read rule-based findings and recommendations |
| `GET /models`, `GET /models/{id}` | Read model registry records |
| `POST /models/{id}/stage` | Set lifecycle stage |
| `POST /models/{id}/deploy` | Create local staging/production deployment record |
| `GET/POST /prompts` | Manage Copilot prompts |
| `POST /copilot` | Ask Gemini-backed Copilot (requires server-side Gemini key) |

If `LUMEN_API_KEY` is set, API requests other than `/health` require the `X-API-Key` header.
