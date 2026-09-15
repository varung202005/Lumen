"""Real model training used by Module 2 (Experiment Tracking + Model Training)."""
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

MODEL_REGISTRY = {
    "logistic_regression": LogisticRegression,
    "random_forest": RandomForestClassifier,
    "decision_tree": DecisionTreeClassifier,
}


def build_model(model_type: str, params: dict):
    if model_type not in MODEL_REGISTRY:
        raise ValueError(f"Unsupported model_type '{model_type}'. Choose one of {list(MODEL_REGISTRY)}")
    cls = MODEL_REGISTRY[model_type]
    kwargs = {}
    if model_type == "logistic_regression":
        kwargs["max_iter"] = int(params.get("max_iter", 1000))
        kwargs["C"] = float(params.get("C", 1.0))
    elif model_type == "random_forest":
        kwargs["n_estimators"] = int(params.get("n_estimators", 100))
        kwargs["max_depth"] = params.get("max_depth") or None
        if kwargs["max_depth"] is not None:
            kwargs["max_depth"] = int(kwargs["max_depth"])
        kwargs["random_state"] = 42
    elif model_type == "decision_tree":
        kwargs["max_depth"] = params.get("max_depth") or None
        if kwargs["max_depth"] is not None:
            kwargs["max_depth"] = int(kwargs["max_depth"])
        kwargs["random_state"] = 42
    return cls(**kwargs)


def train_and_evaluate(csv_path: str, target_column: str, model_type: str, params: dict, test_size: float = 0.2):
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

    target_encoder = None
    if not pd.api.types.is_numeric_dtype(y_raw):
        target_encoder = LabelEncoder()
        y = target_encoder.fit_transform(y_raw.astype(str))
        class_names = list(target_encoder.classes_)
    else:
        y = y_raw.values
        class_names = sorted([str(v) for v in pd.unique(y_raw)])

    n_classes = len(np.unique(y))
    if n_classes < 2:
        raise ValueError("Target column must have at least 2 distinct classes for classification.")

    class_counts = np.bincount(y.astype(int))
    stratify = y if class_counts.min() >= 2 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=stratify
    )

    model = build_model(model_type, params)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    average = "binary" if n_classes == 2 else "macro"
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, average=average, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, average=average, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, y_pred, average=average, zero_division=0)), 4),
        "confusionMatrix": confusion_matrix(y_test, y_pred).tolist(),
        "classNames": class_names,
        "trainRows": int(len(X_train)),
        "testRows": int(len(X_test)),
        "featureCount": int(X.shape[1]),
        "trainingTimeSec": round(time.time() - start, 3),
    }
    return metrics
