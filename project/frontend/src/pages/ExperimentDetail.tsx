import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, GitCompare, MoreHorizontal, Lightbulb } from "lucide-react";
import { getExperiment } from "@/data/experiments";
import { getRunsForExperiment } from "@/data/runs";
import { MetricCard } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { MultiRunLineChart } from "@/components/charts/Charts";
import { cn, formatRelativeTime, formatDuration } from "@/lib/utils";

export default function ExperimentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const experiment = id ? getExperiment(id) : undefined;
  const runs = useMemo(() => (id ? getRunsForExperiment(id) : []), [id]);
  const [selected, setSelected] = useState<string[]>([]);

  if (!experiment) {
    return <div className="text-[13px] text-text-muted">Experiment not found.</div>;
  }

  const best = runs.find((r) => r.isBest) ?? runs[0];
  const accData = runs.slice(0, 8).map((r) => ({ step: r.name.replace("Run #", "#"), accuracy: r.metrics.accuracy ?? 0 }));
  const lossData = runs.slice(0, 8).map((r) => ({ step: r.name.replace("Run #", "#"), loss: r.metrics.loss ?? 0 }));
  const durationData = runs.slice(0, 8).map((r) => ({ step: r.name.replace("Run #", "#"), duration: Math.round(r.durationSec / 60) }));

  function toggleRun(runId: string) {
    setSelected((s) => (s.includes(runId) ? s.filter((x) => x !== runId) : [...s, runId]));
  }

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
        <Link to="/experiments" className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-text">
          <ArrowLeft size={13} /> Experiments
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[20px] font-bold text-text">{experiment.name}</h1>
              <StatusBadge status={experiment.status} />
            </div>
            <p className="mt-1.5 max-w-2xl text-[13px] text-text-muted">{experiment.description}</p>
            <div className="mt-2.5 flex items-center gap-3 text-[11.5px] text-text-faint">
              <span>Owner <span className="text-text-muted">{experiment.owner}</span></span>
              <span>·</span>
              <span>Updated {formatRelativeTime(experiment.updatedAt)}</span>
              <span>·</span>
              <div className="flex gap-1.5">{experiment.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              disabled={selected.length < 2}
              onClick={() => navigate(`/compare?runs=${selected.join(",")}`)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-opacity",
                selected.length >= 2 ? "bg-track text-white hover:opacity-90" : "cursor-not-allowed bg-surface-2 text-text-faint"
              )}
            >
              <GitCompare size={14} /> Compare Runs {selected.length > 0 && `(${selected.length})`}
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted hover:text-text"><MoreHorizontal size={16} /></button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-text">Experiment Health</h3>
          <Badge tone="success">GOOD</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Best Accuracy" value={`${((best.metrics.accuracy ?? 0) * 100).toFixed(1)}%`} />
          <MetricCard label="Best F1" value={best.metrics.f1} />
          <MetricCard label="Runs" value={experiment.runCount} />
          <MetricCard label="Improvement" value={`${experiment.improvementPct > 0 ? "+" : ""}${experiment.improvementPct}%`} tone="lumen" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-1 text-[12.5px] font-semibold text-text">Accuracy vs Runs</h3>
          <MultiRunLineChart data={accData} lines={[{ key: "accuracy", color: "#5b8def", label: "Accuracy" }]} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-1 text-[12.5px] font-semibold text-text">Loss vs Runs</h3>
          <MultiRunLineChart data={lossData} lines={[{ key: "loss", color: "#e5636a", label: "Loss" }]} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-1 text-[12.5px] font-semibold text-text">Training Time (min)</h3>
          <MultiRunLineChart data={durationData} lines={[{ key: "duration", color: "#f2b84b", label: "Minutes" }]} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border-soft px-5 py-3.5">
            <h3 className="text-[13px] font-semibold text-text">Runs</h3>
            <span className="text-[11.5px] text-text-faint">Select rows to compare</span>
          </div>
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-border-soft text-[11px] uppercase tracking-wide text-text-faint">
                <th className="w-8 px-4 py-2"></th>
                <th className="px-2 py-2 font-medium">Run</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Accuracy</th>
                <th className="px-2 py-2 font-medium">F1</th>
                <th className="px-2 py-2 font-medium">Duration</th>
                <th className="px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className={cn("border-b border-border-soft transition-colors last:border-0 hover:bg-surface-hover", selected.includes(r.id) && "bg-surface-hover")}>
                  <td className="px-4 py-2.5">
                    <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleRun(r.id)} className="accent-track" />
                  </td>
                  <td className="px-2 py-2.5">
                    <Link to={`/runs/${r.id}`} className="flex items-center gap-1.5 font-medium text-text hover:text-lumen">
                      {r.name} {r.isBest && <Badge tone="lumen">best</Badge>}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5"><StatusBadge status={r.status} /></td>
                  <td className="px-2 py-2.5 font-mono text-text-muted">{((r.metrics.accuracy ?? 0) * 100).toFixed(1)}%</td>
                  <td className="px-2 py-2.5 font-mono text-text-muted">{r.metrics.f1}</td>
                  <td className="px-2 py-2.5 text-text-faint">{formatDuration(r.durationSec)}</td>
                  <td className="px-4 py-2.5 text-text-faint">{formatRelativeTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-[#2e2410] bg-surface glow-lumen">
          <div className="flex items-center gap-2 border-b border-border-soft px-5 py-3.5">
            <Sparkles size={14} className="text-lumen" />
            <h3 className="text-[13px] font-semibold text-text">Experiment Intelligence</h3>
          </div>
          <div className="flex flex-col gap-4 px-5 py-4">
            <p className="text-[12.5px] text-text-muted">We found 2 significant patterns across your runs.</p>
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2.5 rounded-lg border border-border-soft bg-surface-2 px-3 py-2.5">
                <Lightbulb size={14} className="mt-0.5 shrink-0 text-lumen" />
                <p className="text-[12px] text-text-muted">Higher learning rates improved convergence across the last 6 runs.</p>
              </div>
              <div className="flex gap-2.5 rounded-lg border border-border-soft bg-surface-2 px-3 py-2.5">
                <Lightbulb size={14} className="mt-0.5 shrink-0 text-lumen" />
                <p className="text-[12px] text-text-muted">Validation loss starts increasing after epoch 18 in most runs.</p>
              </div>
            </div>
            <div className="rounded-lg border border-[#3a2c11] bg-[#1a1409] px-3.5 py-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-lumen">Recommended next experiment</div>
              <p className="mt-1 text-[12.5px] text-text">Try <span className="mono text-lumen">learning_rate = 0.008</span> with early stopping enabled.</p>
            </div>
            <Link to="/copilot" className="text-center text-[12px] font-medium text-lumen hover:underline">Ask Copilot about this experiment →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
