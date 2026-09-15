import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, FlaskConical, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { api, type ApiDataset, type ApiRun } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const MODEL_OPTIONS = [
  { value: "logistic_regression", label: "Logistic Regression" },
  { value: "random_forest", label: "Random Forest" },
  { value: "decision_tree", label: "Decision Tree" },
];

export default function NewExperiment() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [datasets, setDatasets] = useState<ApiDataset[]>([]);
  const [datasetId, setDatasetId] = useState<string>(params.get("datasetId") ?? "");
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [modelType, setModelType] = useState<string>("random_forest");
  const [nEstimators, setNEstimators] = useState(100);
  const [maxDepth, setMaxDepth] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ApiRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listDatasets().then((ds) => {
      setDatasets(ds);
      if (!datasetId && ds.length > 0) setDatasetId(ds[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDataset = useMemo(() => datasets.find((d) => d.id === datasetId), [datasets, datasetId]);

  useEffect(() => {
    if (selectedDataset && !selectedDataset.profile.columnProfiles.some((c) => c.name === targetColumn)) {
      const categorical = selectedDataset.profile.columnProfiles.find((c) => c.type === "categorical");
      setTargetColumn(categorical?.name ?? selectedDataset.profile.columnProfiles[0]?.name ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDataset]);

  async function handleTrain() {
    if (!datasetId || !targetColumn) return;
    setRunning(true);
    setError(null);
    setResult(null);
    const trainingParams: Record<string, unknown> = {};
    if (modelType === "random_forest") trainingParams.n_estimators = nEstimators;
    if (modelType === "random_forest" || modelType === "decision_tree") {
      if (maxDepth) trainingParams.max_depth = Number(maxDepth);
    }
    try {
      const run = await api.createRun({ datasetId, targetColumn, modelType, params: trainingParams });
      setResult(run);
      if (run.status === "failed") setError(run.error ?? "Training failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start run");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
        <Link to="/datasets" className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-text">
          <ArrowLeft size={13} /> Datasets
        </Link>
        <h1 className="mt-3 text-[20px] font-bold text-text">New Experiment</h1>
        <p className="mt-1 text-[13px] text-text-muted">Pick an uploaded dataset, choose a target column and model, then train — real training against your real CSV.</p>
      </div>

      {datasets.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-5 text-[12.5px] text-text-muted">
          No uploaded datasets yet. <Link to="/datasets" className="text-lumen hover:underline">Upload a CSV first</Link>.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-text-muted">Dataset</label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12.5px] text-text focus:outline-none"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.rows} rows × {d.columns} cols)</option>
                ))}
              </select>
            </div>

            {selectedDataset && (
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-text-muted">Target Column</label>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12.5px] text-text focus:outline-none"
                >
                  {selectedDataset.profile.columnProfiles.map((c) => (
                    <option key={c.name} value={c.name}>{c.name} ({c.type}, {c.unique} unique)</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-text-muted">Model</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12.5px] text-text focus:outline-none"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {modelType === "random_forest" && (
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-text-muted">n_estimators</label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={nEstimators}
                  onChange={(e) => setNEstimators(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12.5px] text-text focus:outline-none"
                />
              </div>
            )}

            {(modelType === "random_forest" || modelType === "decision_tree") && (
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-text-muted">max_depth (blank = unlimited)</label>
                <input
                  type="number"
                  min={1}
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12.5px] text-text focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={handleTrain}
              disabled={running || !datasetId || !targetColumn}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-lumen px-3.5 py-2.5 text-[12.5px] font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
              {running ? "Training…" : "Train Model"}
            </button>

            {error && <div className="rounded-lg border border-[#3d1a1d] bg-[#2a1214] px-3.5 py-2.5 text-[12.5px] text-danger">{error}</div>}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-[12.5px] font-semibold text-text">Run Result</h3>
            {!result && !running && <p className="text-[12.5px] text-text-faint">Configure a run and click Train Model to see real metrics here.</p>}
            {running && <p className="flex items-center gap-2 text-[12.5px] text-text-muted"><Loader2 size={14} className="animate-spin" /> Training on the server…</p>}
            {result && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  {result.status === "completed" ? (
                    <Badge tone="success"><CheckCircle2 size={11} /> completed</Badge>
                  ) : (
                    <Badge tone="danger"><XCircle size={11} /> failed</Badge>
                  )}
                  <span className="font-mono text-[11.5px] text-text-faint">{result.id}</span>
                </div>
                {result.metrics && (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <MetricCard label="Accuracy" value={`${(result.metrics.accuracy * 100).toFixed(1)}%`} />
                      <MetricCard label="F1" value={result.metrics.f1} tone="lumen" />
                      <MetricCard label="Precision" value={`${(result.metrics.precision * 100).toFixed(1)}%`} />
                      <MetricCard label="Recall" value={`${(result.metrics.recall * 100).toFixed(1)}%`} />
                    </div>
                    <div>
                      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-faint">Confusion Matrix ({result.metrics.classNames.join(" / ")})</div>
                      <table className="border-collapse text-[12px]">
                        <tbody>
                          {result.metrics.confusionMatrix.map((row, i) => (
                            <tr key={i}>
                              {row.map((v, j) => (
                                <td key={j} className={cn("border border-border-soft px-3 py-1.5 text-center font-mono", i === j ? "bg-[#0d2419] text-success" : "text-text-muted")}>{v}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11.5px] text-text-faint">Trained on {result.metrics.trainRows} rows, tested on {result.metrics.testRows} rows, {result.metrics.featureCount} features, in {result.metrics.trainingTimeSec}s.</p>
                  </>
                )}
                <div className="flex items-center gap-3">
                  <Link to={`/runs/${result.id}`} className="text-[12px] font-medium text-lumen hover:underline">View full run detail →</Link>
                  <button onClick={() => navigate("/runs")} className="text-[12px] font-medium text-text-muted hover:text-text">Go to Run History</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
