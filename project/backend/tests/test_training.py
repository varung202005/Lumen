import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from training import train_and_evaluate


def test_classification_training_has_reproducibility_and_explanation(tmp_path):
    frame = pd.DataFrame({"feature": list(range(20)), "target": ["no"] * 10 + ["yes"] * 10})
    path = tmp_path / "classification.csv"; frame.to_csv(path, index=False)
    result = train_and_evaluate(str(path), "target", "decision_tree", {})
    assert result["taskType"] == "classification"
    assert result["explanation"]["featureImportance"]
    assert result["reproducibility"]["randomSeed"] == 42


def test_regression_training_reports_regression_metrics(tmp_path):
    frame = pd.DataFrame({"feature": list(range(20)), "target": [x * 2 + 1 for x in range(20)]})
    path = tmp_path / "regression.csv"; frame.to_csv(path, index=False)
    result = train_and_evaluate(str(path), "target", "linear_regression", {})
    assert result["taskType"] == "regression"
    assert result["r2"] > 0.99
    assert result["rmse"] >= 0
