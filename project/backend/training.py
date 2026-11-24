"""Real model training used by Module 2 (Experiment Tracking + Model Training)."""
import time
import os
import platform
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import sklearn
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

MODEL_REGISTRY = {
    "logistic_regression": LogisticRegression,
    "random_forest": RandomForestClassifier,
    "decision_tree": DecisionTreeClassifier,
    "linear_regression": LinearRegression,
    "random_forest_regressor": RandomForestRegressor,
    "decision_tree_regressor": DecisionTreeRegressor,
}

REGRESSION_MODELS = {"linear_regression", "random_forest_regressor", "decision_tree_regressor"}


def build_model(model_type: str, params: dict):
    if model_type not in MODEL_REGISTRY:
        raise ValueError(f"Unsupported model_type '{model_type}'. Choose one of {list(MODEL_REGISTRY)}")
    cls = MODEL_REGISTRY[model_type]
    kwargs = {}
    if model_type == "logistic_regression":
        kwargs["max_iter"] = int(params.get("max_iter", 1000))
        kwargs["C"] = float(params.get("C", 1.0))
    elif model_type in {"random_forest", "random_forest_regressor"}:
        kwargs["n_estimators"] = int(params.get("n_estimators", 100))
        kwargs["max_depth"] = params.get("max_depth") or None
        if kwargs["max_depth"] is not None:
            kwargs["max_depth"] = int(kwargs["max_depth"])
        kwargs["random_state"] = 42
    elif model_type in {"decision_tree", "decision_tree_regressor"}:
        kwargs["max_depth"] = params.get("max_depth") or None
        if kwargs["max_depth"] is not None:
            kwargs["max_depth"] = int(kwargs["max_depth"])
        kwargs["random_state"] = 42
    return cls(**kwargs)


def train_and_evaluate(csv_path: str, target_column: str, model_type: str, params: dict, test_size: float = 0.2, artifact_path: str | None = None):
    start = time.time()
    df = pd.read_csv(csv_path)

    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in dataset columns: {list(df.columns)}")

    df = df.dropna(subset=[target_column])
    y_raw = df[target_column]
    X = df.drop(columns=[target_column])

    # Encode categorical/text feature columns numerically; fill missing numeric values with column mean.
    for col in X.columns:
        if not pd.api.types.is_numeric_dtype(X[col]):
            X[col] = LabelEncoder().fit_transform(X[col].astype(str))
        if X[col].isna().any():
            X[col] = X[col].fillna(X[col].mean())

    is_regression = model_type in REGRESSION_MODELS
    target_encoder = None
    if is_regression:
        if not pd.api.types.is_numeric_dtype(y_raw):
            raise ValueError("Regression requires a numeric target column.")
        y = y_raw.astype(float).values
        class_names = []
    elif not pd.api.types.is_numeric_dtype(y_raw):
        target_encoder = LabelEncoder()
        y = target_encoder.fit_transform(y_raw.astype(str))
        class_names = list(target_encoder.classes_)
    else:
        y = y_raw.values
        class_names = sorted([str(v) for v in pd.unique(y_raw)])

    n_classes = len(np.unique(y))
    if not is_regression and n_classes < 2:
        raise ValueError("Target column must have at least 2 distinct classes for classification.")

    class_counts = np.bincount(y.astype(int)) if not is_regression else np.array([])
    stratify = y if not is_regression and class_counts.min() >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=stratify
    )

    model = build_model(model_type, params)
    model.fit(X_train, y_train)
    if artifact_path:
        os.makedirs(os.path.dirname(artifact_path), exist_ok=True)
        joblib.dump({"model": model, "featureNames": list(X.columns), "targetColumn": target_column, "modelType": model_type}, artifact_path)
    y_pred = model.predict(X_test)

    # These are actual contributions from the fitted sklearn estimator.  Tree
    # models expose feature_importances_; linear models use absolute coefficients.
    if hasattr(model, "feature_importances_"):
        raw_importance = np.asarray(model.feature_importances_, dtype=float)
        method = "sklearn feature importance"
    elif hasattr(model, "coef_"):
        coefficients = np.asarray(model.coef_, dtype=float)
        raw_importance = np.mean(np.abs(coefficients), axis=0) if coefficients.ndim > 1 else np.abs(coefficients)
        method = "absolute logistic-regression coefficient"
    else:
        raw_importance = np.zeros(X.shape[1], dtype=float)
        method = "model importance unavailable"
    total = float(raw_importance.sum())
    normalized = raw_importance / total if total else raw_importance
    feature_importance = sorted(
        [{"name": str(name), "importance": round(float(score), 6)} for name, score in zip(X.columns, normalized)],
        key=lambda item: item["importance"], reverse=True,
    )
    top = feature_importance[0] if feature_importance else None
    summary = (
        f"{top['name']} is the strongest model signal, accounting for about {top['importance'] * 100:.1f}% "
        f"of the measured importance according to {method}."
        if top else "This model did not expose feature importance values."
    )

    common = {
        "trainRows": int(len(X_train)),
        "testRows": int(len(X_test)),
        "featureCount": int(X.shape[1]),
        "trainingTimeSec": round(time.time() - start, 3),
        "taskType": "regression" if is_regression else "classification",
        "reproducibility": {"randomSeed": 42, "python": platform.python_version(), "scikitLearn": sklearn.__version__, "pandas": pd.__version__, "numpy": np.__version__, "testSize": test_size},
        "explanation": {
            "method": method,
            "featureImportance": feature_importance,
            "summary": summary,
        },
    }
    if is_regression:
        # Empty classification fields preserve a stable API shape for shared run views.
        return {**common, "accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1": 0.0, "confusionMatrix": [], "classNames": [], "mae": round(float(mean_absolute_error(y_test, y_pred)), 4), "rmse": round(float(mean_squared_error(y_test, y_pred) ** .5), 4), "r2": round(float(r2_score(y_test, y_pred)), 4)}
    average = "binary" if n_classes == 2 else "macro"
    return {**common, "accuracy": round(float(accuracy_score(y_test, y_pred)), 4), "precision": round(float(precision_score(y_test, y_pred, average=average, zero_division=0)), 4), "recall": round(float(recall_score(y_test, y_pred, average=average, zero_division=0)), 4), "f1": round(float(f1_score(y_test, y_pred, average=average, zero_division=0)), 4), "confusionMatrix": confusion_matrix(y_test, y_pred).tolist(), "classNames": class_names}
