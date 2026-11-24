"""Deterministic run diagnostics used when a training job finishes."""

def diagnose_run(run_id: str, experiment_id: str, dataset_id: str, status: str, metrics: dict | None, error: str | None, prior_runs: list[dict]) -> list[dict]:
    findings = []
    def add(kind, severity, title, explanation, recommendation):
        findings.append({"run_id": run_id, "experiment_id": experiment_id, "dataset_id": dataset_id, "type": kind, "severity": severity, "title": title, "explanation": explanation, "recommendation": recommendation})
    if status == "failed":
        add("root-cause", "critical", "Training run failed", error or "The training process ended unexpectedly.", "Review the error, validate the target column and model parameters, then retry.")
        return findings
    if not metrics:
        return findings
    accuracy, f1 = metrics.get("accuracy", 0), metrics.get("f1", 0)
    if f1 < 0.60:
        add("performance", "warning", "Low validation F1 score", f"This run reached F1 {f1:.3f}, below the 0.60 baseline used by Lumen.", "Review features and target quality, then compare a different model or parameter setting.")
    if accuracy - f1 >= 0.15:
        add("root-cause", "warning", "Accuracy and F1 disagree", f"Accuracy is {accuracy:.3f}, while F1 is {f1:.3f}. This often indicates uneven class performance.", "Inspect class balance and the confusion matrix; consider class weights or resampling.")
    previous = [r.get("metrics", {}).get("f1") for r in prior_runs if r.get("status") == "completed" and r.get("metrics")]
    previous = [score for score in previous if isinstance(score, (int, float))]
    if previous:
        best = max(previous)
        if f1 > best:
            add("performance", "success", "New best run", f"F1 {f1:.3f} improves on the previous best of {best:.3f} in this experiment.", "Record this configuration as the current baseline and test one controlled variation next.")
        elif best - f1 >= 0.05:
            add("experiment-rec", "info", "Run trails the experiment baseline", f"F1 {f1:.3f} is below the current best of {best:.3f}.", "Compare parameters with the best run before scheduling another variation.")
    if not findings:
        add("performance", "success", "Run completed without rule-based warnings", f"Validation accuracy is {accuracy:.3f} and F1 is {f1:.3f}.", "Compare this run against another model configuration to continue improving the experiment.")
    return findings
