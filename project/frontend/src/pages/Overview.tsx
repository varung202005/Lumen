import { Link } from "react-router-dom";
import { FlaskConical, GitBranch, Boxes, Database, Sparkles, ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";
import { experiments } from "@/data/experiments";
import { runs } from "@/data/runs";
import { models } from "@/data/models";
import { datasets } from "@/data/datasets";
import { insights } from "@/data/insights";
import { MetricCard } from "@/components/ui/Card";
import { StatusBadge, SeverityBadge } from "@/components/ui/Badge";
import { ActivityChart } from "@/components/charts/Charts";
import { formatRelativeTime, formatPct } from "@/lib/utils";

function buildActivityData() {
  const days = 10;
  const buckets: { date: string; success: number; failed: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const dayRuns = runs.filter((r) => {
      const rd = new Date(r.createdAt);
      return rd.toDateString() === d.toDateString();
    });
    buckets.push({
      date: label,
      success: dayRuns.filter((r) => r.status === "completed").length || Math.floor(Math.random() * 3),
      failed: dayRuns.filter((r) => r.status === "failed").length,
    });
  }
  return buckets;
}

export default function Overview() {
  const activeExperiments = experiments.filter((e) => e.status === "running" || e.status === "queued" || e.status === "completed").length;
  const totalRuns = runs.length;
  const bestModel = [...models].sort((a, b) => b.f1 - a.f1)[0];
  const recentExperiments = [...experiments].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 4);
  const recentRuns = [...runs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);
  const recentModels = [...models].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 3);
  const topInsights = [...insights].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 3);
  const activityData = buildActivityData();

  return (
    <div className="fade-in flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-text">Experiment Overview</h1>
          <p className="mt-1 text-[13px] text-text-muted">Good morning, Varun. Here's what's happening across your workspace.</p>
        </div>
        <Link to="/experiments" className="flex items-center gap-1.5 rounded-lg bg-lumen px-3.5 py-2 text-[12.5px] font-semibold text-bg transition-opacity hover:opacity-90">
          New Experiment <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Active Experiments" value={activeExperiments} sub={<span className="flex items-center gap-1 text-track"><FlaskConical size={11} /> across 5 owners</span>} />
        <MetricCard label="Total Runs" value={totalRuns} sub={<span className="flex items-center gap-1"><GitBranch size={11} /> last 30 days</span>} />
        <MetricCard label="Best Model" value={formatPct(bestModel.f1, 1)} sub={<span className="flex items-center gap-1"><Boxes size={11} /> {bestModel.name}</span>} />
        <MetricCard label="Datasets" value={datasets.length} sub={<span className="flex items-center gap-1"><Database size={11} /> 1 drifting</span>} />
        <MetricCard label="AI Insights" value={insights.length} tone="lumen" sub={<span className="flex items-center gap-1 text-lumen"><Sparkles size={11} /> 2 need review</span>} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
            <div>
              <h3 className="text-[13px] font-semibold text-text">Experiment Activity</h3>
              <p className="mt-0.5 text-[12px] text-text-muted">Runs over the last 10 days</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Successful</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Failed</span>
            </div>
          </div>
          <div className="px-4 pb-3 pt-2">
            <ActivityChart data={activityData} />
          </div>
        </div>

        <div className="rounded-xl border border-[#2e2410] bg-surface glow-lumen">
          <div className="flex items-center gap-2 border-b border-border-soft px-5 py-4">
            <Sparkles size={15} className="text-lumen" />
            <h3 className="text-[13px] font-semibold text-text">Today's Experiment Intelligence</h3>
          </div>
          <div className="flex flex-col divide-y divide-border-soft">
            {topInsights.map((insight) => (
              <Link key={insight.id} to="/insights" className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface-hover">
                <div className="mt-0.5">
                  {insight.severity === "success" ? <TrendingUp size={14} className="text-success" /> : <AlertTriangle size={14} className={insight.severity === "critical" ? "text-danger" : "text-warning"} />}
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-text">{insight.title}</div>
                  <div className="mt-0.5 line-clamp-2 text-[11.5px] text-text-muted">{insight.explanation}</div>
                </div>
              </Link>
            ))}
          </div>
          <div className="border-t border-border-soft px-5 py-3">
            <Link to="/insights" className="text-[12px] font-medium text-lumen hover:underline">View all insights →</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border-soft px-5 py-3.5">
            <h3 className="text-[13px] font-semibold text-text">Recent Experiments</h3>
          </div>
          <div className="flex flex-col divide-y divide-border-soft">
            {recentExperiments.map((e) => (
              <Link key={e.id} to={`/experiments/${e.id}`} className="flex items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface-hover">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium text-text">{e.name}</div>
                  <div className="mt-0.5 text-[11px] text-text-faint">{e.runCount} runs · {formatRelativeTime(e.updatedAt)}</div>
                </div>
                <StatusBadge status={e.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border-soft px-5 py-3.5">
            <h3 className="text-[13px] font-semibold text-text">Recent Runs</h3>
          </div>
          <div className="flex flex-col divide-y divide-border-soft">
            {recentRuns.map((r) => (
              <Link key={r.id} to={`/runs/${r.id}`} className="flex items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface-hover">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium text-text">{r.name}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-text-faint">F1 {r.metrics.f1} · {formatRelativeTime(r.createdAt)}</div>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border-soft px-5 py-3.5">
            <h3 className="text-[13px] font-semibold text-text">Recently Registered Models</h3>
          </div>
          <div className="flex flex-col divide-y divide-border-soft">
            {recentModels.map((m) => (
              <Link key={m.id} to={`/models/${m.id}`} className="flex items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface-hover">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-medium text-text">{m.name}</div>
                  <div className="mt-0.5 text-[11px] text-text-faint">{m.stage} · {formatRelativeTime(m.updatedAt)}</div>
                </div>
                <SeverityBadge severity={m.stage === "Production" ? "success" : "info"} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
