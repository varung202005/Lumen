import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical, GitBranch, Database, ArrowRight } from "lucide-react";
import { MetricCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ActivityChart } from "@/components/charts/Charts";
import { api, type ApiExperiment, type ApiRun, type ApiDataset } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

export default function Overview() {
  const [experiments, setExperiments] = useState<ApiExperiment[]>([]);
  const [runs, setRuns] = useState<ApiRun[]>([]);
  const [datasets, setDatasets] = useState<ApiDataset[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { Promise.all([api.listExperiments(), api.listRuns(), api.listDatasets()]).then(([e, r, d]) => { setExperiments(e); setRuns(r); setDatasets(d); }).catch(() => setError("Connect the backend to view workspace data.")); }, []);
  const activity = useMemo(() => Array.from({ length: 10 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (9 - i)); const same = (r: ApiRun) => new Date(r.createdAt).toDateString() === d.toDateString(); return { date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), success: runs.filter(r => same(r) && r.status === "completed").length, failed: runs.filter(r => same(r) && r.status === "failed").length }; }), [runs]);
  const completed = runs.filter(r => r.status === "completed" && r.metrics);
  const best = completed.reduce<ApiRun | null>((current, run) => !current || (run.metrics?.f1 ?? 0) > (current.metrics?.f1 ?? 0) ? run : current, null);
  return <div className="fade-in flex flex-col gap-6">
    <div className="flex items-end justify-between"><div><h1 className="text-[20px] font-bold text-text">Experiment Overview</h1><p className="mt-1 text-[13px] text-text-muted">Live workspace activity from Lumen.</p></div><Link to="/experiments/new" className="flex items-center gap-1.5 rounded-lg bg-lumen px-3.5 py-2 text-[12.5px] font-semibold text-bg">New Experiment <ArrowRight size={14}/></Link></div>
    {error && <div className="rounded-lg border border-[#3d1a1d] px-3 py-2 text-[12px] text-danger">{error}</div>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><MetricCard label="Experiments" value={experiments.length}/><MetricCard label="Total Runs" value={runs.length}/><MetricCard label="Best F1" value={best?.metrics?.f1 ?? "—"} tone="lumen"/><MetricCard label="Datasets" value={datasets.length}/></div>
    <div className="rounded-xl border border-border bg-surface"><div className="border-b border-border-soft px-5 py-4"><h3 className="text-[13px] font-semibold text-text">Experiment Activity</h3><p className="mt-0.5 text-[12px] text-text-muted">Completed and failed runs over the last 10 days</p></div><div className="px-4 pb-3 pt-2"><ActivityChart data={activity}/></div></div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="rounded-xl border border-border bg-surface"><h3 className="border-b border-border-soft px-5 py-3.5 text-[13px] font-semibold text-text">Recent Experiments</h3>{experiments.slice(0,5).map(e => <Link key={e.id} to={`/experiments/${e.id}`} className="block border-b border-border-soft px-5 py-3 last:border-0 hover:bg-surface-hover"><div className="text-[12.5px] font-medium text-text">{e.name}</div><div className="text-[11px] text-text-faint">{e.runs.length} runs · {formatRelativeTime(e.createdAt)}</div></Link>)}{!experiments.length && <p className="px-5 py-6 text-[12px] text-text-muted">No experiments yet.</p>}</section>
      <section className="rounded-xl border border-border bg-surface"><h3 className="border-b border-border-soft px-5 py-3.5 text-[13px] font-semibold text-text">Recent Runs</h3>{runs.slice(0,5).map(r => <Link key={r.id} to={`/runs/${r.id}`} className="flex items-center justify-between border-b border-border-soft px-5 py-3 last:border-0 hover:bg-surface-hover"><div><div className="font-mono text-[12px] text-text">{r.id}</div><div className="text-[11px] text-text-faint">{r.modelType} · F1 {r.metrics?.f1 ?? "—"}</div></div><Badge tone={r.status === "completed" ? "success" : r.status === "failed" ? "danger" : "track"}>{r.status}</Badge></Link>)}{!runs.length && <p className="px-5 py-6 text-[12px] text-text-muted">No runs yet.</p>}</section>
      <section className="rounded-xl border border-border bg-surface"><h3 className="border-b border-border-soft px-5 py-3.5 text-[13px] font-semibold text-text">Workspace Status</h3><div className="space-y-3 px-5 py-4 text-[12.5px] text-text-muted"><p className="flex gap-2"><FlaskConical size={14}/> {experiments.length} tracked experiments</p><p className="flex gap-2"><GitBranch size={14}/> {completed.length} completed runs</p><p className="flex gap-2"><Database size={14}/> {datasets.length} uploaded datasets</p><p className="border-t border-border-soft pt-3 text-text-faint">AI insights and model registry become available after their backend modules are implemented.</p></div></section>
    </div></div>;
}
