"""CSV profiling and deterministic dataset-intelligence checks."""
import re
import pandas as pd
import numpy as np

PII_NAME = re.compile(r"(email|e-mail|phone|mobile|ssn|social.?security|address|postal|zip|passport|aadhar|pan)", re.I)
EMAIL_VALUE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def _safe_round(v, ndigits=4):
    if v is None or pd.isna(v): return None
    return round(float(v), ndigits)

def _severity_observation(observations, severity, message):
    observations.append({"severity": severity, "message": message})

def profile_csv(path: str, target_column: str | None = None, reference_path: str | None = None) -> dict:
    df = pd.read_csv(path)
    n_rows, n_cols = df.shape
    columns, observations, pii_columns, outliers = [], [], [], []
    duplicate_rows = int(df.duplicated().sum())
    if duplicate_rows:
        _severity_observation(observations, "warning" if duplicate_rows / max(n_rows, 1) < .1 else "critical", f"{duplicate_rows} duplicate rows found.")

    for col in df.columns:
        series = df[col]
        missing = int(series.isna().sum()); missing_pct = round(missing / max(n_rows, 1) * 100, 2)
        is_numeric = pd.api.types.is_numeric_dtype(series); unique = int(series.nunique(dropna=True))
        item = {"name": col, "dtype": str(series.dtype), "type": "numeric" if is_numeric else "categorical", "missing": missing, "missingPct": missing_pct, "unique": unique}
        if is_numeric:
            desc = series.describe(); item.update({"mean": _safe_round(desc.get("mean")), "std": _safe_round(desc.get("std")), "min": _safe_round(desc.get("min")), "max": _safe_round(desc.get("max"))})
            clean = series.dropna()
            if len(clean) >= 4:
                q1, q3 = clean.quantile(.25), clean.quantile(.75); iqr = q3 - q1
                count = int(((clean < q1 - 1.5 * iqr) | (clean > q3 + 1.5 * iqr)).sum()) if iqr else 0
                if count: outliers.append({"column": col, "count": count, "percent": round(count / max(n_rows, 1) * 100, 2)})
        else:
            mode = series.mode(dropna=True); item["topValue"] = str(mode.iloc[0]) if len(mode) else None
        if PII_NAME.search(col) or (not is_numeric and series.dropna().astype(str).head(100).str.match(EMAIL_VALUE).mean() > .5): pii_columns.append(col)
        if missing_pct > 30: _severity_observation(observations, "warning", f"Column '{col}' has high missingness ({missing_pct}%).")
        if unique <= 1 and n_rows: _severity_observation(observations, "warning", f"Column '{col}' is constant.")
        columns.append(item)

    if pii_columns: _severity_observation(observations, "warning", f"Potential PII detected in: {', '.join(pii_columns)}. Mask or remove it before sharing data.")
    if outliers: _severity_observation(observations, "warning", f"IQR outliers found in {len(outliers)} numeric column(s).")
    target_analysis = _target_checks(df, target_column)
    if target_analysis["classBalance"] and target_analysis["classBalance"]["minorityPercent"] < 20:
        _severity_observation(observations, "warning", f"Target '{target_column}' is imbalanced; minority class is {target_analysis['classBalance']['minorityPercent']}%.")
    if target_analysis["potentialLeakage"]:
        _severity_observation(observations, "critical", f"Potential target leakage: {', '.join(x['column'] for x in target_analysis['potentialLeakage'])}.")
    drift = _drift(df, reference_path)
    if drift:
        _severity_observation(observations, "warning", f"Potential drift detected in: {', '.join(x['column'] for x in drift)}.")
    if not observations: _severity_observation(observations, "success", "No major data quality issues detected.")
    return {"rows": int(n_rows), "columns": int(n_cols), "duplicateRows": duplicate_rows, "columnProfiles": columns, "observations": observations, "piiColumns": pii_columns, "outliers": outliers, "classBalance": target_analysis["classBalance"], "potentialLeakage": target_analysis["potentialLeakage"], "drift": drift}

def _target_checks(df, target):
    result = {"classBalance": None, "potentialLeakage": []}
    if not target or target not in df: return result
    y = df[target]; counts = y.value_counts(dropna=True)
    if len(counts) > 1:
        result["classBalance"] = {"classes": {str(k): int(v) for k, v in counts.items()}, "minorityPercent": round(float(counts.min() / counts.sum() * 100), 2)}
    for col in df.columns:
        if col == target: continue
        if df[col].equals(y): result["potentialLeakage"].append({"column": col, "reason": "identical to target"})
        elif pd.api.types.is_numeric_dtype(df[col]) and pd.api.types.is_numeric_dtype(y):
            corr = df[[col, target]].corr().iloc[0, 1]
            if pd.notna(corr) and abs(corr) >= .98: result["potentialLeakage"].append({"column": col, "reason": f"correlation {corr:.3f}"})
    return result

def _drift(df, reference_path):
    if not reference_path: return []
    try: ref = pd.read_csv(reference_path)
    except Exception: return []
    drift = []
    for col in set(df.columns).intersection(ref.columns):
        if pd.api.types.is_numeric_dtype(df[col]) and pd.api.types.is_numeric_dtype(ref[col]):
            baseline = abs(ref[col].mean()) or 1
            change = abs(df[col].mean() - ref[col].mean()) / baseline
            if pd.notna(change) and change >= .25: drift.append({"column": col, "meanChangePercent": round(float(change * 100), 2)})
    return drift
