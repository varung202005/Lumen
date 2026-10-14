import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, ArrowUpDown, Plus, LayoutGrid, List, FlaskConical } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Status } from "@/types";
import { api, type ApiExperiment } from "@/lib/api";

type SortKey = "updated" | "runs" | "metric" | "name";
type FilterKey = "all" | "with-runs" | "without-runs";
const statusFilters: (Status | "all")[] = ["all", "running", "completed", "failed", "queued"];

function experimentStatus(experiment: ApiExperiment): Status {
  if (experiment.runs.some((run) => run.status === "running")) return "running";
  if (experiment.runs.length === 0) return "queued";
  if (experiment.runs[0]?.status === "failed") return "failed";
  return "completed";
}

function bestF1(experiment: ApiExperiment) {
  const scores = experiment.runs.map((run) => run.metrics?.f1).filter((score): score is number => typeof score === "number");
  return scores.length ? Math.max(...scores) : null;
}

export default function Experiments() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [experiments, setExperiments] = useState<ApiExperiment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.listExperiments().then(setExperiments).catch(() => setExperiments([]));
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return experiments
      .filter((experiment) => {
        const currentStatus = experimentStatus(experiment);
        const matchesSearch = experiment.name.toLowerCase().includes(normalizedQuery) || experiment.targetColumn.toLowerCase().includes(normalizedQuery);
        const matchesStatus = status === "all" || currentStatus === status;
        const matchesFilter = filter === "all" || (filter === "with-runs" ? experiment.runs.length > 0 : experiment.runs.length === 0);
        return matchesSearch && matchesStatus && matchesFilter;
      })
      .sort((a, b) => {
        if (sort === "runs") return b.runs.length - a.runs.length;
        if (sort === "metric") return (bestF1(b) ?? -1) - (bestF1(a) ?? -1);
        if (sort === "name") return a.name.localeCompare(b.name);
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
  }, [experiments, filter, query, sort, status]);

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-text">Experiments</h1>
          <p className="mt-1 text-[13px] text-text-muted">{experiments.length} experiments across your workspace</p>
        </div>
        <button onClick={() => navigate("/experiments/new")} className="flex items-center gap-1.5 rounded-lg bg-lumen px-3.5 py-2 text-[12.5px] font-semibold text-bg transition-opacity hover:opacity-90"><Plus size={14} /> New Experiment</button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Search size={14} className="text-text-faint" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search experiments or tags…" className="w-full bg-transparent text-[12.5px] text-text placeholder:text-text-faint focus:outline-none" />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {statusFilters.map((item) => <button key={item} onClick={() => setStatus(item)} className={cn("rounded-md px-2.5 py-1 text-[11.5px] font-medium capitalize transition-colors", status === item ? "bg-surface-2 text-text" : "text-text-faint hover:text-text-muted")}>{item}</button>)}
        </div>
        <button onClick={() => setSort(sort === "updated" ? "runs" : sort === "runs" ? "metric" : sort === "metric" ? "name" : "updated")} className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[11.5px] font-medium text-text-muted hover:text-text"><ArrowUpDown size={13} /> Sort: <span className="capitalize text-text">{sort}</span></button>
        <div className="relative">
          <button onClick={() => setFiltersOpen((open) => !open)} className={cn("flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-2 text-[11.5px] font-medium hover:text-text", filtersOpen || filter !== "all" ? "border-lumen/50 text-text" : "border-border text-text-muted")}><SlidersHorizontal size={13} /> Filters</button>
          {filtersOpen && <div className="absolute right-0 z-10 mt-1.5 w-48 rounded-lg border border-border bg-surface-2 p-1.5 shadow-xl">
            {([["all", "All experiments"], ["with-runs", "With runs"], ["without-runs", "Without runs"]] as const).map(([value, label]) => <button key={value} onClick={() => { setFilter(value); setFiltersOpen(false); }} className={cn("w-full rounded-md px-2.5 py-2 text-left text-[12px]", filter === value ? "bg-surface text-text" : "text-text-muted hover:bg-surface hover:text-text")}>{label}</button>)}
          </div>}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          <button aria-label="Card view" onClick={() => setView("cards")} className={cn("rounded-md p-1.5", view === "cards" ? "bg-surface-2 text-text" : "text-text-faint")}><LayoutGrid size={14} /></button>
          <button aria-label="Table view" onClick={() => setView("table")} className={cn("rounded-md p-1.5", view === "table" ? "bg-surface-2 text-text" : "text-text-faint")}><List size={14} /></button>
        </div>
      </div>

      {filtered.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center text-[13px] text-text-muted">No experiments match these filters. Upload a dataset and train a model to create one.</div> : view === "cards" ? (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((experiment) => {
            const score = bestF1(experiment);
            return <Card key={experiment.id} hoverable className="p-5"><Link to={`/experiments/${experiment.id}`} className="flex flex-col gap-3"><div className="flex items-start justify-between gap-2"><h3 className="text-[14px] font-semibold leading-snug text-text">{experiment.name}</h3><Badge tone="track"><FlaskConical size={11} /> {experimentStatus(experiment)}</Badge></div><p className="text-[12.5px] text-text-muted">Target column: <span className="font-mono text-text">{experiment.targetColumn}</span></p><div className="mt-1 flex items-center justify-between border-t border-border-soft pt-3"><div><div className="text-[10.5px] uppercase tracking-wide text-text-faint">Best F1</div><div className="font-mono text-[15px] font-semibold text-text">{score ?? "—"}</div></div><div className="text-right"><div className="text-[10.5px] uppercase tracking-wide text-text-faint">Runs</div><div className="font-mono text-[15px] font-semibold text-text">{experiment.runs.length}</div></div><div className="text-right"><div className="text-[10.5px] uppercase tracking-wide text-text-faint">Created</div><div className="text-[12px] text-text-muted">{formatRelativeTime(experiment.createdAt)}</div></div></div></Link></Card>;
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border"><table className="w-full text-left text-[12.5px]"><thead><tr className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-wide text-text-faint"><th className="px-4 py-2.5 font-medium">Name</th><th className="px-4 py-2.5 font-medium">Target</th><th className="px-4 py-2.5 font-medium">Runs</th><th className="px-4 py-2.5 font-medium">Best F1</th><th className="px-4 py-2.5 font-medium">Status</th><th className="px-4 py-2.5 font-medium">Created</th></tr></thead><tbody>{filtered.map((experiment) => <tr key={experiment.id} className="border-b border-border-soft bg-surface last:border-0 hover:bg-surface-hover"><td className="px-4 py-3"><Link to={`/experiments/${experiment.id}`} className="font-medium text-text hover:text-lumen">{experiment.name}</Link></td><td className="px-4 py-3 font-mono text-text-muted">{experiment.targetColumn}</td><td className="px-4 py-3 font-mono text-text-muted">{experiment.runs.length}</td><td className="px-4 py-3 font-mono text-text">{bestF1(experiment) ?? "—"}</td><td className="px-4 py-3"><StatusBadge status={experimentStatus(experiment)} /></td><td className="px-4 py-3 text-text-faint">{formatRelativeTime(experiment.createdAt)}</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
