# Lumen backend

The AI Copilot uses the Gemini Generate Content API from the backend. Configure the backend process before starting it:

```bash
export GEMINI_API_KEY="your_api_key"
export LUMEN_GEMINI_MODEL="gemini-3.8-flash"
```

The API key must stay on the server and must not be added to frontend code. The Copilot endpoint is `POST /api/copilot` and automatically includes recent run context from Lumen.
