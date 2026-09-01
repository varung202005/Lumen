import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { getDataset } from "@/data/datasets";
import { MetricCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DistributionPie, FeatureBar } from "@/components/charts/Charts";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";

const tabs = ["Overview", "Profile", "Quality", "Drift", "Lineage"] as const;
type Tab = typeof tabs[number];

export default function DatasetDetail() {
  const { id } = useParams();
  const dataset = id ? getDataset(id) : undefined;
  const [tab, setTab] = useState<Tab>("Overview");
  if (!dataset) return <div className="text-[13px] text-text-muted">Dataset not found.</div>;

  const healthChecks = [
    { ok: dataset.healthScore > 70, label: `Class imbalance ${dataset.classDistribution.some(c => c.value < 15) ? "detected" : "not detected"}` },
    { ok: dataset.missingPct < 2, label: `${dataset.missingPct}% missing values` },
    { ok: dataset.duplicateRows === 0, label: dataset.duplicateRows === 0 ? "No duplicate rows" : `${dataset.duplicateRows} duplicate rows` },
    { ok: dataset.status !== "drift-detected", label: dataset.status === "drift-detected" ? "Possible drift in top feature" : "No significant drift" },
  ];

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
        <Link to="/datasets" className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-text">
          <ArrowLeft size={13} /> Datasets
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-[20px] font-bold text-text">{dataset.name}</h1>
            <p className="mt-1.5 text-[13px] text-text-muted">{dataset.owner} · {dataset.version} · Updated {formatRelativeTime(dataset.updatedAt)}</p>
          </div>
          <Badge tone={dataset.status === "drift-detected" ? "warning" : "success"}>{dataset.status.replace("-", " ")}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Rows" value={formatNumber(dataset.rows)} />
        <MetricCard label="Columns" value={dataset.columns} />
        <MetricCard label="Size" value={`${dataset.sizeMb} MB`} />
        <MetricCard label="Health Score" value={`${dataset.healthScore}/100`} tone="lumen" />
      </div>

      <div className="flex items-center gap-1 border-b border-border-soft">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("relative px-3.5 py-2.5 text-[12.5px] font-medium transition-colors", tab === t ? "text-text" : "text-text-faint hover:text-text-muted")}>
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 h-[2px] w-full bg-lumen" />}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-1 text-[12.5px] font-semibold text-text">Class Distribution</h3>
            <DistributionPie data={dataset.classDistribution} />
          </div>
          <div className="rounded-xl border border-[#2e2410] bg-surface glow-lumen">
            <div className="flex items-center gap-2 border-b border-border-soft px-5 py-3.5">
              <Sparkles size={14} className="text-lumen" />
              <h3 className="text-[13px] font-semibold text-text">AI Dataset Health</h3>
            </div>
            <div className="px-5 py-4">
              <div className="mb-3 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-lumen">{dataset.healthScore}</span>
                <span className="text-[12px] text-text-faint">/ 100</span>
              </div>
              <div className="flex flex-col gap-2">
                {healthChecks.map((c) => (
                  <div key={c.label} className="flex items-center gap-2 text-[12.5px]">
                    {c.ok ? <CheckCircle2 size={14} className="text-success" /> : <AlertTriangle size={14} className="text-warning" />}
                    <span className={c.ok ? "text-text-muted" : "text-text"}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "Profile" && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-[12.5px] font-semibold text-text">Feature Profile</h3>
          <div className="flex flex-col gap-3">
            {dataset.features.map((f) => (
              <div key={f.name} className="flex items-center justify-between border-b border-border-soft pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="text-[12.5px] font-medium text-text">{f.name}</div>
                  <div className="text-[11px] text-text-faint">{f.type} · {f.missingPct}% missing</div>
                </div>
                <div className="w-40"><FeatureBar name="importance" value={f.importance} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Quality" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard label="Missing Values" value={`${dataset.missingPct}%`} />
          <MetricCard label="Duplicate Rows" value={dataset.duplicateRows} />
          <MetricCard label="Outliers" value={`${dataset.outlierPct}%`} />
        </div>
      )}

      {tab === "Drift" && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-2 text-[12.5px] font-semibold text-text">Feature Drift</h3>
          {dataset.status === "drift-detected" ? (
            <p className="text-[12.5px] text-text-muted">The distribution of <span className="mono text-warning">{dataset.features[0]?.name}</span> has shifted significantly compared to the training baseline over the last 14 days. Consider re-training or reweighting affected features.</p>
          ) : (
            <p className="text-[12.5px] text-text-muted">No significant drift detected across tracked features in the last 30 days.</p>
          )}
        </div>
      )}

      {tab === "Lineage" && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 text-[12.5px] font-semibold text-text">Lineage</h3>
          <div className="flex items-center gap-2 text-[12.5px] text-text-muted">
            <Badge tone="track">{dataset.name}</Badge>
            <span>→</span>
            <Link to="/lineage"><Badge>Experiments</Badge></Link>
            <span>→</span>
            <Link to="/lineage"><Badge tone="success">Models</Badge></Link>
          </div>
          <Link to="/lineage" className="mt-3 inline-block text-[12px] font-medium text-lumen hover:underline">Open full lineage graph →</Link>
        </div>
      )}
    </div>
  );
}
