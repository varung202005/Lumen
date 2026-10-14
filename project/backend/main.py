import json
import os
import re
import time
import traceback
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db
from profiling import profile_csv
from training import train_and_evaluate

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Lumen Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    db.init_db()


# ---------------------------------------------------------------------------
# Module 1: Dataset Intelligence
# ---------------------------------------------------------------------------

def dataset_to_api(row: dict) -> dict:
    profile = json.loads(row["profile_json"])
    return {
        "id": row["id"],
        "name": row["name"],
        "filename": row["filename"],
        "sizeBytes": row["size_bytes"],
        "rows": row["rows"],
        "columns": row["columns"],
        "uploadedAt": row["uploaded_at"],
        "profile": profile,
    }


@app.post("/api/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Only .csv files are supported")

    dataset_id = db.new_id("ds")
    dest_path = os.path.join(UPLOAD_DIR, f"{dataset_id}_{file.filename}")
    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    try:
        profile = profile_csv(dest_path)
    except Exception as e:
        os.remove(dest_path)
        raise HTTPException(400, f"Failed to parse CSV: {e}")

    conn = db.get_conn()
    conn.execute(
        "INSERT INTO datasets (id, name, filename, path, size_bytes, rows, columns, uploaded_at, profile_json) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            dataset_id,
            file.filename.rsplit(".", 1)[0],
            file.filename,
            dest_path,
            len(contents),
            profile["rows"],
            profile["columns"],
            db.now_iso(),
            json.dumps(profile),
        ),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
    conn.close()
    return dataset_to_api(db.row_to_dict(row))


@app.get("/api/datasets")
def list_datasets():
    conn = db.get_conn()
    rows = conn.execute("SELECT * FROM datasets ORDER BY uploaded_at DESC").fetchall()
    conn.close()
    return [dataset_to_api(db.row_to_dict(r)) for r in rows]


@app.get("/api/datasets/{dataset_id}")
def get_dataset(dataset_id: str):
    conn = db.get_conn()
    row = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Dataset not found")
    return dataset_to_api(db.row_to_dict(row))


# ---------------------------------------------------------------------------
# Module 2: Experiment Tracking + Model Training
# ---------------------------------------------------------------------------

class CreateRunRequest(BaseModel):
    datasetId: str
    targetColumn: str
    modelType: str
    params: dict = {}
    experimentName: Optional[str] = None


class CreatePromptRequest(BaseModel):
    name: str
    description: str = ""
    content: str


class CopilotMessage(BaseModel):
    role: str
    content: str


class CopilotRequest(BaseModel):
    messages: list[CopilotMessage]
    experimentId: Optional[str] = None


def run_to_api(row: dict) -> dict:
    return {
        "id": row["id"],
        "experimentId": row["experiment_id"],
        "datasetId": row["dataset_id"],
        "modelType": row["model_type"],
        "params": json.loads(row["params_json"]),
        "metrics": json.loads(row["metrics_json"]) if row["metrics_json"] else None,
        "status": row["status"],
        "error": row["error"],
        "createdAt": row["created_at"],
        "finishedAt": row["finished_at"],
        "durationSec": row["duration_sec"],
    }


def experiment_to_api(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "datasetId": row["dataset_id"],
        "targetColumn": row["target_column"],
        "createdAt": row["created_at"],
    }


@app.post("/api/runs")
def create_run(req: CreateRunRequest):
    conn = db.get_conn()
    ds_row = conn.execute("SELECT * FROM datasets WHERE id = ?", (req.datasetId,)).fetchone()
    if not ds_row:
        conn.close()
        raise HTTPException(404, "Dataset not found")

    # Reuse an experiment for this dataset+target if one already exists, else create it.
    exp_row = conn.execute(
        "SELECT * FROM experiments WHERE dataset_id = ? AND target_column = ?",
        (req.datasetId, req.targetColumn),
    ).fetchone()
    if exp_row:
        experiment_id = exp_row["id"]
    else:
        experiment_id = db.new_id("exp")
        name = req.experimentName or f"{db.row_to_dict(ds_row)['name']} — predict {req.targetColumn}"
        conn.execute(
            "INSERT INTO experiments (id, name, dataset_id, target_column, created_at) VALUES (?, ?, ?, ?, ?)",
            (experiment_id, name, req.datasetId, req.targetColumn, db.now_iso()),
        )

    run_id = db.new_id("run")
    created_at = db.now_iso()
    conn.execute(
        "INSERT INTO runs (id, experiment_id, dataset_id, model_type, params_json, metrics_json, status, error, created_at, finished_at, duration_sec) "
        "VALUES (?, ?, ?, ?, ?, NULL, 'running', NULL, ?, NULL, NULL)",
        (run_id, experiment_id, req.datasetId, req.modelType, json.dumps(req.params), created_at),
    )
    conn.commit()

    start = time.time()
    try:
        metrics = train_and_evaluate(
            csv_path=db.row_to_dict(ds_row)["path"],
            target_column=req.targetColumn,
            model_type=req.modelType,
            params=req.params,
        )
        duration = round(time.time() - start, 3)
        conn.execute(
            "UPDATE runs SET status='completed', metrics_json=?, finished_at=?, duration_sec=? WHERE id=?",
            (json.dumps(metrics), db.now_iso(), duration, run_id),
        )
    except Exception as e:
        duration = round(time.time() - start, 3)
        conn.execute(
            "UPDATE runs SET status='failed', error=?, finished_at=?, duration_sec=? WHERE id=?",
            (f"{e}", db.now_iso(), duration, run_id),
        )
        traceback.print_exc()

    conn.commit()
    row = conn.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
    conn.close()
    return run_to_api(db.row_to_dict(row))


@app.get("/api/runs")
def list_runs(experiment_id: Optional[str] = None):
    conn = db.get_conn()
    if experiment_id:
        rows = conn.execute(
            "SELECT * FROM runs WHERE experiment_id = ? ORDER BY created_at DESC", (experiment_id,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM runs ORDER BY created_at DESC").fetchall()
    conn.close()
    return [run_to_api(db.row_to_dict(r)) for r in rows]


@app.get("/api/runs/{run_id}")
def get_run(run_id: str):
    conn = db.get_conn()
    row = conn.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Run not found")
    return run_to_api(db.row_to_dict(row))


@app.get("/api/experiments")
def list_experiments():
    conn = db.get_conn()
    rows = conn.execute("SELECT * FROM experiments ORDER BY created_at DESC").fetchall()
    exps = []
    for r in rows:
        e = experiment_to_api(db.row_to_dict(r))
        run_rows = conn.execute(
            "SELECT * FROM runs WHERE experiment_id = ? ORDER BY created_at DESC", (e["id"],)
        ).fetchall()
        e["runs"] = [run_to_api(db.row_to_dict(rr)) for rr in run_rows]
        exps.append(e)
    conn.close()
    return exps


@app.get("/api/experiments/{experiment_id}")
def get_experiment(experiment_id: str):
    conn = db.get_conn()
    row = conn.execute("SELECT * FROM experiments WHERE id = ?", (experiment_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Experiment not found")
    e = experiment_to_api(db.row_to_dict(row))
    run_rows = conn.execute(
        "SELECT * FROM runs WHERE experiment_id = ? ORDER BY created_at DESC", (experiment_id,)
    ).fetchall()
    conn.close()
    e["runs"] = [run_to_api(db.row_to_dict(rr)) for rr in run_rows]
    return e


# ---------------------------------------------------------------------------
# Module 3: Prompt Management
# ---------------------------------------------------------------------------

def prompt_to_api(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "status": row["status"],
        "owner": row["owner"],
        "updatedAt": row["updated_at"],
        "variables": json.loads(row["variables_json"]),
        "versions": json.loads(row["versions_json"]),
    }


@app.get("/api/prompts")
def list_prompts():
    conn = db.get_conn()
    rows = conn.execute("SELECT * FROM prompts ORDER BY updated_at DESC").fetchall()
    conn.close()
    return [prompt_to_api(db.row_to_dict(row)) for row in rows]


@app.post("/api/prompts")
def create_prompt(req: CreatePromptRequest):
    name = req.name.strip()
    content = req.content.strip()
    if not name or not content:
        raise HTTPException(400, "Prompt name and content are required")

    variables = []
    for match in re.finditer(r"{{\s*([\w.-]+)\s*}}", content):
        if match.group(1) not in variables:
            variables.append(match.group(1))

    now = db.now_iso()
    prompt_id = db.new_id("pr")
    versions = [{"version": "v1", "content": content, "evalScore": 0, "updatedAt": now}]
    conn = db.get_conn()
    conn.execute(
        "INSERT INTO prompts (id, name, description, status, owner, updated_at, variables_json, versions_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (prompt_id, name, req.description.strip() or "A custom prompt for Lumen's intelligence layer.", "draft", "Workspace user", now, json.dumps(variables), json.dumps(versions)),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM prompts WHERE id = ?", (prompt_id,)).fetchone()
    conn.close()
    return prompt_to_api(db.row_to_dict(row))


@app.get("/api/prompts/{prompt_id}")
def get_prompt(prompt_id: str):
    conn = db.get_conn()
    row = conn.execute("SELECT * FROM prompts WHERE id = ?", (prompt_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Prompt not found")
    return prompt_to_api(db.row_to_dict(row))


# ---------------------------------------------------------------------------
# Module 4: AI Experiment Copilot
# ---------------------------------------------------------------------------

def copilot_context(experiment_id: Optional[str]) -> str:
    conn = db.get_conn()
    if experiment_id:
        experiment = conn.execute("SELECT * FROM experiments WHERE id = ?", (experiment_id,)).fetchone()
        runs = conn.execute("SELECT * FROM runs WHERE experiment_id = ? ORDER BY created_at DESC LIMIT 20", (experiment_id,)).fetchall()
    else:
        experiment = None
        runs = conn.execute("SELECT * FROM runs ORDER BY created_at DESC LIMIT 20").fetchall()
    conn.close()

    run_summaries = []
    for row in runs:
        run = db.row_to_dict(row)
        run_summaries.append({
            "id": run["id"],
            "experimentId": run["experiment_id"],
            "model": run["model_type"],
            "status": run["status"],
            "params": json.loads(run["params_json"]),
            "metrics": json.loads(run["metrics_json"]) if run["metrics_json"] else None,
            "error": run["error"],
        })

    return json.dumps({
        "experiment": db.row_to_dict(experiment) if experiment else None,
        "runs": run_summaries,
    }, default=str)


@app.post("/api/copilot")
def ask_copilot(req: CopilotRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(503, "GEMINI_API_KEY is not configured on the backend")
    if not req.messages:
        raise HTTPException(400, "At least one message is required")

    model = os.getenv("LUMEN_GEMINI_MODEL", "gemini-3.8-flash")
    instructions = (
        "You are Lumen Copilot, an AI assistant for MLOps. Use only the supplied experiment context. "
        "Be concise, explain metrics in plain language, distinguish observations from hypotheses, "
        "and recommend concrete next steps. If the context is insufficient, say so.\n\n"
        f"Experiment context:\n{copilot_context(req.experimentId)}"
    )
    payload = {
        "systemInstruction": {"parts": [{"text": instructions}]},
        "contents": [
            {"role": "model" if message.role == "assistant" else "user", "parts": [{"text": message.content}]}
            for message in req.messages[-12:]
        ],
        "generationConfig": {"temperature": 0.2},
    }
    request = Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(payload).encode("utf-8"),
        headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=60) as response:
            body = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise HTTPException(502, f"Gemini request failed: {detail[:300]}") from error
    except URLError as error:
        raise HTTPException(502, f"Could not reach Gemini: {error.reason}") from error

    output = [part.get("text", "") for part in body.get("candidates", [{}])[0].get("content", {}).get("parts", [])]
    text = "\n".join(part for part in output if part).strip()
    if not text:
        raise HTTPException(502, "The Gemini model returned no text")
    return {"content": text, "model": model}


@app.get("/api/health")
def health():
    return {"ok": True}
