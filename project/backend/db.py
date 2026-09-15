"""SQLite persistence layer for Lumen backend (Dataset Intelligence + Experiment Tracking)."""
import sqlite3
import json
import os
import time
import uuid

DB_PATH = os.path.join(os.path.dirname(__file__), "lumen.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS datasets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            filename TEXT NOT NULL,
            path TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            rows INTEGER NOT NULL,
            columns INTEGER NOT NULL,
            uploaded_at TEXT NOT NULL,
            profile_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS experiments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            dataset_id TEXT NOT NULL,
            target_column TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (dataset_id) REFERENCES datasets(id)
        );

        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            experiment_id TEXT NOT NULL,
            dataset_id TEXT NOT NULL,
            model_type TEXT NOT NULL,
            params_json TEXT NOT NULL,
            metrics_json TEXT,
            status TEXT NOT NULL,
            error TEXT,
            created_at TEXT NOT NULL,
            finished_at TEXT,
            duration_sec REAL,
            FOREIGN KEY (experiment_id) REFERENCES experiments(id),
            FOREIGN KEY (dataset_id) REFERENCES datasets(id)
        );
        """
    )
    conn.commit()
    conn.close()


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def row_to_dict(row: sqlite3.Row) -> dict:
    return {k: row[k] for k in row.keys()}
