# Validation and demonstration plan

## Automated evidence

Run from `project/backend`:

```powershell
pytest -q
python -m compileall -q .
```

Run from `project/frontend`:

```powershell
npm run lint
npm run build
```

The test suite covers injected PII, outliers, target leakage, class imbalance diagnostics, classification training, and regression training. CI executes these checks on every push and pull request.

## Demonstration script

1. Upload a normal CSV and inspect missing values, duplicates, PII candidates, and outliers.
2. Upload a new version with the same filename and start a run to show drift comparison.
3. Select a categorical target and train a classifier; inspect metrics, diagnostics, model artifact, and feature importance.
4. Select a numeric target and train a regressor; verify R², RMSE, and MAE.
5. Open Insights and show the persisted recommendation generated for the run.
6. Open Model Registry, deploy a registered model to staging, then inspect Lineage.
7. Ask Copilot to compare runs, if `GEMINI_API_KEY` is configured.

## Acceptance criteria

| Capability | Evidence |
| --- | --- |
| Dataset intelligence | Profile observations and injected-issue tests |
| Experiment tracking | Persisted experiments/runs and run detail UI |
| Diagnostics | Persisted Insights after training |
| Explainability | Stored estimator feature importance per completed run |
| Model lifecycle | Joblib artifact, registry record, deployment record, lineage |
| Reliability | Passing backend tests, frontend build, Docker Compose configuration |
