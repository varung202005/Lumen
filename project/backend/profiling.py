"""Real CSV profiling used by Module 1 (Dataset Intelligence)."""
import pandas as pd
import numpy as np


def profile_csv(path: str) -> dict:
    df = pd.read_csv(path)
    n_rows, n_cols = df.shape

    columns = []
    observations = []

    duplicate_rows = int(df.duplicated().sum())
    if duplicate_rows > 0:
        pct = round(duplicate_rows / n_rows * 100, 2) if n_rows else 0
        observations.append({
            "severity": "warning" if pct < 10 else "critical",
            "message": f"{duplicate_rows} duplicate rows found ({pct}% of dataset).",
        })

    for col in df.columns:
        series = df[col]
        missing = int(series.isna().sum())
        missing_pct = round(missing / n_rows * 100, 2) if n_rows else 0
        is_numeric = pd.api.types.is_numeric_dtype(series)
        unique = int(series.nunique(dropna=True))

        col_info = {
            "name": col,
            "dtype": str(series.dtype),
            "type": "numeric" if is_numeric else "categorical",
            "missing": missing,
            "missingPct": missing_pct,
            "unique": unique,
        }

        if is_numeric:
            desc = series.describe()
            col_info.update({
                "mean": _safe_round(desc.get("mean")),
                "std": _safe_round(desc.get("std")),
                "min": _safe_round(desc.get("min")),
                "max": _safe_round(desc.get("max")),
            })
        else:
            top = series.mode(dropna=True)
            col_info["topValue"] = str(top.iloc[0]) if len(top) else None

        columns.append(col_info)

        if missing_pct > 30:
            observations.append({
                "severity": "warning",
                "message": f"Column '{col}' has high missingness ({missing_pct}%).",
            })
        if unique <= 1 and n_rows > 0:
            observations.append({
                "severity": "warning",
                "message": f"Column '{col}' is constant (only {unique} unique value).",
            })
        if is_numeric and unique == n_rows and n_rows > 0:
            observations.append({
                "severity": "info",
                "message": f"Column '{col}' looks like a unique identifier.",
            })

    if not observations:
        observations.append({"severity": "success", "message": "No major data quality issues detected."})

    return {
        "rows": int(n_rows),
        "columns": int(n_cols),
        "duplicateRows": duplicate_rows,
        "columnProfiles": columns,
        "observations": observations,
    }


def _safe_round(v, ndigits=4):
    if v is None:
        return None
    try:
        if np.isnan(v):
            return None
    except TypeError:
        pass
    return round(float(v), ndigits)
