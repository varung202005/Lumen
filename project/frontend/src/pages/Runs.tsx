import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, GitCompare } from "lucide-react";
import { runs } from "@/data/runs";
import { getExperiment } from "@/data/experiments";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { cn, formatDuration, formatRelativeTime } from "@/lib/utils";
import type { Status } from "@/types";

const statusFilters: (Status | "all")[] = ["all", "running", "completed", "failed", "queued"];

export default function Runs() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return runs
      .filter((r) => status === "all" || r.status === status)
      .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()) || r.id.includes(query.toLowerCase()))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 60);
  }, [query, status]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-text">Runs</h1>
          <p className="mt-1 text-[13px] text-text-muted">{runs.length} runs across all experiments</p>
        </div>
        <button
          disabled={selected.length < 2}
          onClick={() => navigate(`/compare?runs=${selected.join(",")}`)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-opacity",
            selected.length >= 2 ? "bg-track text-white hover:opacity-90" : "cursor-not-allowed bg-surface-2 text-text-faint"
          )}
        >
          <GitCompare size={14} /> Compare {selected.length > 0 && `(${selected.length})`}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Search size={14} className="text-text-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search runs…" className="w-full bg-transparent text-[12.5px] text-text placeholder:text-text-faint focus:outline-none" />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {statusFilters.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={cn("rounded-md px-2.5 py-1 text-[11.5px] font-medium capitalize transition-colors", status === s ? "bg-surface-2 text-text" : "text-text-faint hover:text-text-muted")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-wide text-text-faint">
              <th className="w-8 px-4 py-2.5"></th>
              <th className="px-2 py-2.5 font-medium">Run</th>
              <th className="px-2 py-2.5 font-medium">Experiment</th>
              <th className="px-2 py-2.5 font-medium">Status</th>
              <th className="px-2 py-2.5 font-medium">F1</th>
              <th className="px-2 py-2.5 font-medium">Accuracy</th>
              <th className="px-2 py-2.5 font-medium">Duration</th>
              <th className="px-4 py-2.5 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const exp = getExperiment(r.experimentId);
              return (
                <tr key={r.id} className={cn("border-b border-border-soft bg-surface transition-colors last:border-0 hover:bg-surface-hover", selected.includes(r.id) && "bg-surface-hover")}>
                  <td className="px-4 py-2.5"><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} className="accent-track" /></td>
                  <td className="px-2 py-2.5">
                    <Link to={`/runs/${r.id}`} className="flex items-center gap-1.5 font-medium text-text hover:text-lumen">{r.name} {r.isBest && <Badge tone="lumen">best</Badge>}</Link>
                  </td>
                  <td className="px-2 py-2.5"><Link to={`/experiments/${r.experimentId}`} className="text-text-muted hover:text-text">{exp?.name}</Link></td>
                  <td className="px-2 py-2.5"><StatusBadge status={r.status} /></td>
                  <td className="px-2 py-2.5 font-mono text-text-muted">{r.metrics.f1}</td>
                  <td className="px-2 py-2.5 font-mono text-text-muted">{((r.metrics.accuracy ?? 0) * 100).toFixed(1)}%</td>
                  <td className="px-2 py-2.5 text-text-faint">{formatDuration(r.durationSec)}</td>
                  <td className="px-4 py-2.5 text-text-faint">{formatRelativeTime(r.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
