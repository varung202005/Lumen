import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, ArrowUpDown, Plus, LayoutGrid, List } from "lucide-react";
import { experiments } from "@/data/experiments";
import { Card } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Status } from "@/types";

type SortKey = "updated" | "runs" | "metric" | "name";

const statusFilters: (Status | "all")[] = ["all", "running", "completed", "failed", "queued"];

export default function Experiments() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [view, setView] = useState<"cards" | "table">("cards");

  const filtered = useMemo(() => {
    let list = experiments.filter((e) =>
      (status === "all" || e.status === status) &&
      (e.name.toLowerCase().includes(query.toLowerCase()) || e.tags.some((t) => t.includes(query.toLowerCase())))
    );
    list = [...list].sort((a, b) => {
      if (sort === "updated") return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      if (sort === "runs") return b.runCount - a.runCount;
      if (sort === "metric") return b.bestMetricValue - a.bestMetricValue;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [query, status, sort]);

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-text">Experiments</h1>
          <p className="mt-1 text-[13px] text-text-muted">{experiments.length} experiments across your workspace</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-lumen px-3.5 py-2 text-[12.5px] font-semibold text-bg transition-opacity hover:opacity-90">
          <Plus size={14} /> New Experiment
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Search size={14} className="text-text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search experiments or tags…"
            className="w-full bg-transparent text-[12.5px] text-text placeholder:text-text-faint focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11.5px] font-medium capitalize transition-colors",
                status === s ? "bg-surface-2 text-text" : "text-text-faint hover:text-text-muted"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSort(sort === "updated" ? "runs" : sort === "runs" ? "metric" : sort === "metric" ? "name" : "updated")}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[11.5px] font-medium text-text-muted hover:text-text"
        >
          <ArrowUpDown size={13} /> Sort: <span className="capitalize text-text">{sort}</span>
        </button>

        <button className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[11.5px] font-medium text-text-muted hover:text-text">
          <SlidersHorizontal size={13} /> Filters
        </button>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          <button onClick={() => setView("cards")} className={cn("rounded-md p-1.5", view === "cards" ? "bg-surface-2 text-text" : "text-text-faint")}><LayoutGrid size={14} /></button>
          <button onClick={() => setView("table")} className={cn("rounded-md p-1.5", view === "table" ? "bg-surface-2 text-text" : "text-text-faint")}><List size={14} /></button>
        </div>
      </div>

      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <Card key={e.id} hoverable className="p-5">
              <Link to={`/experiments/${e.id}`} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[14px] font-semibold leading-snug text-text">{e.name}</h3>
                  <StatusBadge status={e.status} />
                </div>
                <p className="line-clamp-2 text-[12.5px] text-text-muted">{e.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {e.tags.map((t) => <Badge key={t}>{t}</Badge>)}
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-border-soft pt-3">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wide text-text-faint">{e.bestMetricName}</div>
                    <div className="font-mono text-[15px] font-semibold text-text">{e.bestMetricValue}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10.5px] uppercase tracking-wide text-text-faint">Runs</div>
                    <div className="font-mono text-[15px] font-semibold text-text">{e.runCount}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10.5px] uppercase tracking-wide text-text-faint">Updated</div>
                    <div className="text-[12px] text-text-muted">{formatRelativeTime(e.updatedAt)}</div>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-wide text-text-faint">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
                <th className="px-4 py-2.5 font-medium">Runs</th>
                <th className="px-4 py-2.5 font-medium">Best Metric</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border-soft bg-surface transition-colors last:border-0 hover:bg-surface-hover">
                  <td className="px-4 py-3">
                    <Link to={`/experiments/${e.id}`} className="font-medium text-text hover:text-lumen">{e.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{e.owner}</td>
                  <td className="px-4 py-3 font-mono text-text-muted">{e.runCount}</td>
                  <td className="px-4 py-3 font-mono text-text">{e.bestMetricName} {e.bestMetricValue}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3 text-text-faint">{formatRelativeTime(e.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
