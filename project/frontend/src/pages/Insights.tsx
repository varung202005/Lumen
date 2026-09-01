import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, TrendingUp, Info, AlertOctagon } from "lucide-react";
import { insights } from "@/data/insights";
import { SeverityBadge } from "@/components/ui/Badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Insight } from "@/types";

const typeLabels: Record<Insight["type"], string> = {
  "root-cause": "Root Cause Analysis",
  "dataset-warning": "Dataset Warning",
  "performance": "Performance Improvement",
  "model-rec": "Model Recommendation",
  "experiment-rec": "Experiment Recommendation",
};

const severityIcon: Record<Insight["severity"], any> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
  success: TrendingUp,
};

const entityPath: Record<Insight["affectedEntity"]["type"], (id: string) => string> = {
  experiment: (id) => `/experiments/${id}`,
  run: (id) => `/runs/${id}`,
  dataset: (id) => `/datasets/${id}`,
  model: (id) => `/models/${id}`,
};

const typeFilters: (Insight["type"] | "all")[] = ["all", "root-cause", "dataset-warning", "performance", "model-rec", "experiment-rec"];

export default function Insights() {
  const [type, setType] = useState<Insight["type"] | "all">("all");

  const filtered = useMemo(
    () => insights.filter((i) => type === "all" || i.type === type).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [type]
  );

  return (
    <div className="fade-in flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-bold text-text">Experiment Intelligence Feed</h1>
        <p className="mt-1 text-[13px] text-text-muted">Everything Lumen's AI layer has found across your workspace</p>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-surface p-1">
        {typeFilters.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn("rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors", type === t ? "bg-surface-2 text-text" : "text-text-faint hover:text-text-muted")}
          >
            {t === "all" ? "All" : typeLabels[t]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((insight) => {
          const Icon = severityIcon[insight.severity];
          return (
            <div key={insight.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                    insight.severity === "critical" && "border-[#3d1a1d] bg-[#2a1214] text-danger",
                    insight.severity === "warning" && "border-[#3d2a12] bg-[#2a1c0c] text-warning",
                    insight.severity === "info" && "border-[#1c2c47] bg-[#101c30] text-track",
                    insight.severity === "success" && "border-[#15382a] bg-[#0d2419] text-success",
                  )}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13.5px] font-semibold text-text">{insight.title}</h3>
                      <SeverityBadge severity={insight.severity} />
                    </div>
                    <div className="mt-0.5 text-[11px] uppercase tracking-wide text-text-faint">{typeLabels[insight.type]}</div>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-text-faint">{formatRelativeTime(insight.createdAt)}</span>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-text-muted">{insight.explanation}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-3">
                <Link to={entityPath[insight.affectedEntity.type](insight.affectedEntity.id)} className="text-[12px] font-medium text-track hover:underline">
                  {insight.affectedEntity.name} →
                </Link>
                <div className="rounded-lg border border-[#2e2410] bg-[#1a1409] px-3 py-1.5 text-[11.5px] text-lumen">{insight.recommendation}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
