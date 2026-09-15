import json
import os
import time
import traceback

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


@app.get("/api/health")
def health():
    return {"ok": True}
