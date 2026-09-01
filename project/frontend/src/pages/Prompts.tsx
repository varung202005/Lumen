import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, TextQuote } from "lucide-react";
import { prompts } from "@/data/prompts";
import { Badge } from "@/components/ui/Badge";
import { cn, formatRelativeTime } from "@/lib/utils";

const statusTone: Record<string, "success" | "neutral" | "warning"> = {
  active: "success",
  draft: "warning",
  deprecated: "neutral",
};

const statuses = ["all", "active", "draft", "deprecated"] as const;

export default function Prompts() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<typeof statuses[number]>("all");

  const filtered = useMemo(
    () => prompts.filter((p) => (status === "all" || p.status === status) && p.name.toLowerCase().includes(query.toLowerCase())),
    [query, status]
  );

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-text">Prompts</h1>
          <p className="mt-1 text-[13px] text-text-muted">Manage the prompts powering Lumen's AI intelligence layer</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-lumen px-3.5 py-2 text-[12.5px] font-semibold text-bg transition-opacity hover:opacity-90">
          <Plus size={14} /> New Prompt
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Search size={14} className="text-text-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts…" className="w-full bg-transparent text-[12.5px] text-text placeholder:text-text-faint focus:outline-none" />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={cn("rounded-md px-2.5 py-1 text-[11.5px] font-medium capitalize transition-colors", status === s ? "bg-surface-2 text-text" : "text-text-faint hover:text-text-muted")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {filtered.map((p) => (
          <Link key={p.id} to={`/prompts/${p.id}`} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-surface-hover">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <TextQuote size={14} className="text-text-faint" />
                <h3 className="text-[13.5px] font-semibold text-text">{p.name}</h3>
              </div>
              <Badge tone={statusTone[p.status]}>{p.status}</Badge>
            </div>
            <p className="text-[12.5px] text-text-muted">{p.description}</p>
            <div className="flex items-center justify-between border-t border-border-soft pt-3 text-[11.5px] text-text-faint">
              <span>{p.versions.length} version{p.versions.length === 1 ? "" : "s"} · {p.owner}</span>
              <span>Updated {formatRelativeTime(p.updatedAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
