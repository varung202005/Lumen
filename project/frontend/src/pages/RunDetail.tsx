import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Image as ImageIcon, Braces, Package, Sparkles, Download } from "lucide-react";
import { getRun } from "@/data/runs";
import { getExperiment } from "@/data/experiments";
import { getDataset } from "@/data/datasets";
import { MetricCard } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { MetricLineChart } from "@/components/charts/Charts";
import { cn, formatBytes, formatDuration, formatRelativeTime } from "@/lib/utils";

const tabs = ["Metrics", "Parameters", "Artifacts", "Model & Dataset", "AI Analysis"] as const;
type Tab = typeof tabs[number];

const artifactIcons: Record<string, any> = {
  model: Package,
  log: FileText,
  image: ImageIcon,
  json: Braces,
  other: FileText,
};

export default function RunDetail() {
  const { id } = useParams();
  const run = id ? getRun(id) : undefined;
  const [tab, setTab] = useState<Tab>("Metrics");

  if (!run) return <div className="text-[13px] text-text-muted">Run not found.</div>;
  const experiment = getExperiment(run.experimentId);
  const dataset = getDataset(run.datasetId);

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
        <Link to={`/experiments/${run.experimentId}`} className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-text">
          <ArrowLeft size={13} /> {experiment?.name ?? "Experiment"}
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[20px] font-bold text-text">{run.name}</h1>
              <StatusBadge status={run.status} />
              {run.isBest && <Badge tone="lumen">Best run</Badge>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-text-faint">
              <span className="mono">{run.id}</span>
              <span>·</span>
              <span>Experiment <Link to={`/experiments/${run.experimentId}`} className="text-text-muted hover:text-lumen">{experiment?.name}</Link></span>
              <span>·</span>
              <span>Duration {formatDuration(run.durationSec)}</span>
              <span>·</span>
              <span>Created {formatRelativeTime(run.createdAt)}</span>
            </div>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[12px] font-medium text-text-muted hover:text-text">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Accuracy" value={`${((run.metrics.accuracy ?? 0) * 100).toFixed(1)}%`} />
        <MetricCard label="Precision" value={`${((run.metrics.precision ?? 0) * 100).toFixed(1)}%`} />
        <MetricCard label="Recall" value={`${((run.metrics.recall ?? 0) * 100).toFixed(1)}%`} />
        <MetricCard label="F1" value={run.metrics.f1} tone="lumen" />
        <MetricCard label="Loss" value={run.metrics.loss} />
        <MetricCard label="Train Time" value={formatDuration(run.metrics.trainingTimeSec ?? 0)} />
      </div>

      <div className="flex items-center gap-1 border-b border-border-soft">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-3.5 py-2.5 text-[12.5px] font-medium transition-colors",
              tab === t ? "text-text" : "text-text-faint hover:text-text-muted"
            )}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-lumen" />}
          </button>
        ))}
      </div>

      {tab === "Metrics" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-1 text-[12.5px] font-semibold text-text">Accuracy over steps</h3>
            <MetricLineChart data={run.metricHistory.accuracy} dataKey="Accuracy" color="#5b8def" />
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-1 text-[12.5px] font-semibold text-text">Loss over steps</h3>
            <MetricLineChart data={run.metricHistory.loss} dataKey="Loss" color="#e5636a" />
          </div>
        </div>
      )}

      {tab === "Parameters" && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-[12.5px]">
            <tbody>
              {Object.entries(run.parameters).map(([k, v], i) => (
                <tr key={k} className={cn("border-b border-border-soft last:border-0", i % 2 === 0 && "bg-surface-2/40")}>
                  <td className="w-1/3 px-5 py-2.5 font-mono text-text-muted">{k}</td>
                  <td className="px-5 py-2.5 font-mono text-text">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Artifacts" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {run.artifacts.map((a) => {
            const Icon = artifactIcons[a.type];
            return (
              <div key={a.name} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft bg-surface-2">
                  <Icon size={16} className="text-text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[12.5px] text-text">{a.name}</div>
                  <div className="text-[11px] text-text-faint">{formatBytes(a.sizeKb)}</div>
                </div>
                <button className="text-text-faint hover:text-text"><Download size={14} /></button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "Model & Dataset" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-[12.5px] font-semibold text-text">Model</h3>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-soft bg-surface-2">
                <Package size={18} className="text-text-muted" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-text">{run.parameters.model_type}</div>
                <div className="text-[11.5px] text-text-faint">Trained in {run.name}</div>
              </div>
            </div>
          </div>
          <Link to={`/datasets/${run.datasetId}`} className="rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-surface-hover">
            <h3 className="text-[12.5px] font-semibold text-text">Dataset</h3>
            <div className="mt-2">
              <div className="text-[13px] font-medium text-text">{dataset?.name}</div>
              <div className="text-[11.5px] text-text-faint">{dataset?.rows.toLocaleString()} rows · {dataset?.columns} columns</div>
            </div>
          </Link>
        </div>
      )}

      {tab === "AI Analysis" && (
        <div className="rounded-xl border border-[#2e2410] bg-surface glow-lumen">
          <div className="flex items-center gap-2 border-b border-border-soft px-5 py-3.5">
            <Sparkles size={14} className="text-lumen" />
            <h3 className="text-[13px] font-semibold text-text">AI Analysis</h3>
          </div>
          <div className="flex flex-col gap-3 px-5 py-4 text-[12.5px] text-text-muted">
            <p>
              This run reached <span className="mono text-text">F1 {run.metrics.f1}</span> using <span className="mono text-text">{run.parameters.optimizer}</span> at learning rate <span className="mono text-text">{run.parameters.learning_rate}</span>.
              {run.status === "failed"
                ? " The run failed before completion — check training_log.txt for a stack trace around the tokenization stage."
                : " Validation metrics stabilized in the final third of training with no signs of divergence."}
            </p>
            <p>
              Compared with other runs in this experiment, this configuration {run.isBest ? "represents the current best result." : "is within range of the top performers."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
