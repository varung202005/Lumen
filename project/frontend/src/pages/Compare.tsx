import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, X, Plus } from "lucide-react";
import { runs, getRun } from "@/data/runs";
import { getExperiment } from "@/data/experiments";
import { StatusBadge } from "@/components/ui/Badge";
import { CompareBarChart } from "@/components/charts/Charts";
import { cn, formatDuration } from "@/lib/utils";

const colors = ["#5b8def", "#f2b84b", "#3ecf8e", "#9b8cf2"];

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const runIds = (params.get("runs") ?? "").split(",").filter(Boolean);
  const [picker, setPicker] = useState(false);

  const selectedRuns = useMemo(() => runIds.map(getRun).filter(Boolean), [runIds]) as NonNullable<ReturnType<typeof getRun>>[];

  function setRuns(ids: string[]) {
    setParams(ids.length ? { runs: ids.join(",") } : {});
  }
  function remove(id: string) {
    setRuns(runIds.filter((r) => r !== id));
  }
  function add(id: string) {
    if (!runIds.includes(id)) setRuns([...runIds, id]);
    setPicker(false);
  }

  const barData = [
    { name: "Accuracy", ...Object.fromEntries(selectedRuns.map((r) => [r.name, +(100 * (r.metrics.accuracy ?? 0)).toFixed(1)])) },
    { name: "F1 ×100", ...Object.fromEntries(selectedRuns.map((r) => [r.name, +(100 * (r.metrics.f1 ?? 0)).toFixed(1)])) },
    { name: "Loss ×100", ...Object.fromEntries(selectedRuns.map((r) => [r.name, +(100 * (r.metrics.loss ?? 0)).toFixed(1)])) },
  ];
  const bestF1 = selectedRuns.length ? Math.max(...selectedRuns.map((r) => r.metrics.f1 ?? 0)) : 0;
  const winner = selectedRuns.find((r) => r.metrics.f1 === bestF1);

  const paramKeys = ["learning_rate", "batch_size", "epochs", "optimizer", "model_type", "dropout"];

  return (
    <div className="fade-in flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-text">Run Comparison</h1>
          <p className="mt-1 text-[13px] text-text-muted">Compare metrics, parameters, and AI-generated explanations across runs</p>
        </div>
        <div className="relative">
          <button onClick={() => setPicker((p) => !p)} className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-[12.5px] font-medium text-text-muted hover:text-text">
            <Plus size={14} /> Add run
          </button>
          {picker && (
            <div className="absolute right-0 z-10 mt-1.5 max-h-72 w-72 overflow-y-auto rounded-lg border border-border bg-surface-2 py-1.5 shadow-xl">
              {runs.filter((r) => !runIds.includes(r.id)).slice(0, 30).map((r) => (
                <button key={r.id} onClick={() => add(r.id)} className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] text-text-muted hover:bg-surface-hover hover:text-text">
                  <span>{r.name} <span className="text-text-faint">· {r.experimentId}</span></span>
                  <span className="font-mono text-text-faint">F1 {r.metrics.f1}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRuns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="text-[13px] text-text-muted">Select at least two runs to compare. Add runs from Experiments, Runs, or the picker above.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-wide text-text-faint">
                  <th className="px-4 py-2.5 font-medium">Metric</th>
                  {selectedRuns.map((r, i) => (
                    <th key={r.id} className="px-4 py-2.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: colors[i % colors.length] }} />
                        <Link to={`/runs/${r.id}`} className="text-text hover:text-lumen">{r.name}</Link>
                        <button onClick={() => remove(r.id)} className="ml-auto text-text-faint hover:text-danger"><X size={12} /></button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Experiment", get: (r: typeof selectedRuns[0]) => getExperiment(r.experimentId)?.name },
                  { label: "Status", get: (r: typeof selectedRuns[0]) => <StatusBadge status={r.status} /> },
                  { label: "Accuracy", get: (r: typeof selectedRuns[0]) => `${((r.metrics.accuracy ?? 0) * 100).toFixed(1)}%` },
                  { label: "F1", get: (r: typeof selectedRuns[0]) => r.metrics.f1 },
                  { label: "Loss", get: (r: typeof selectedRuns[0]) => r.metrics.loss },
                  { label: "Duration", get: (r: typeof selectedRuns[0]) => formatDuration(r.durationSec) },
                  { label: "Dataset", get: (r: typeof selectedRuns[0]) => r.datasetId },
                  ...paramKeys.map((k) => ({ label: k, get: (r: typeof selectedRuns[0]) => String(r.parameters[k]) })),
                ].map((row, ri) => (
                  <tr key={row.label} className={cn("border-b border-border-soft bg-surface last:border-0", ri % 2 === 1 && "bg-surface-2/30")}>
                    <td className="px-4 py-2.5 font-mono text-text-muted">{row.label}</td>
                    {selectedRuns.map((r) => (
                      <td key={r.id} className="px-4 py-2.5 font-mono text-text">{row.get(r) as any}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-1 text-[13px] font-semibold text-text">Metric Comparison</h3>
            <CompareBarChart data={barData} bars={selectedRuns.map((r, i) => ({ key: r.name, color: colors[i % colors.length], label: r.name }))} />
          </div>

          {winner && (
            <div className="rounded-xl border border-[#2e2410] bg-surface glow-lumen">
              <div className="flex items-center gap-2 border-b border-border-soft px-5 py-3.5">
                <Sparkles size={14} className="text-lumen" />
                <h3 className="text-[13px] font-semibold text-text">AI Comparison</h3>
              </div>
              <div className="px-5 py-4 text-[12.5px] text-text-muted">
                <p>
                  <Link to={`/runs/${winner.id}`} className="mono text-lumen hover:underline">{winner.name}</Link> achieved the best F1 score ({winner.metrics.f1}) among the selected runs, largely explained by its
                  {" "}<span className="mono text-text">{winner.parameters.optimizer}</span> optimizer and learning rate of <span className="mono text-text">{winner.parameters.learning_rate}</span>.
                  Runs with smaller batch sizes converged more slowly but showed less overfitting in later epochs.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
