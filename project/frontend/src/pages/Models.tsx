import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { models } from "@/data/models";
import { StageBadge } from "@/components/ui/Badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ModelStage } from "@/types";

const stages: (ModelStage | "all")[] = ["all", "Development", "Staging", "Production", "Archived"];

export default function Models() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<ModelStage | "all">("all");

  const filtered = useMemo(
    () => models.filter((m) => (stage === "all" || m.stage === stage) && m.name.toLowerCase().includes(query.toLowerCase())),
    [query, stage]
  );

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-text">Model Registry</h1>
          <p className="mt-1 text-[13px] text-text-muted">{models.length} registered models</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-lumen px-3.5 py-2 text-[12.5px] font-semibold text-bg transition-opacity hover:opacity-90">
          <Plus size={14} /> Register Model
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Search size={14} className="text-text-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search models…" className="w-full bg-transparent text-[12.5px] text-text placeholder:text-text-faint focus:outline-none" />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {stages.map((s) => (
            <button key={s} onClick={() => setStage(s)} className={cn("rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors", stage === s ? "bg-surface-2 text-text" : "text-text-faint hover:text-text-muted")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-wide text-text-faint">
              <th className="px-4 py-2.5 font-medium">Model</th>
              <th className="px-2 py-2.5 font-medium">Version</th>
              <th className="px-2 py-2.5 font-medium">Stage</th>
              <th className="px-2 py-2.5 font-medium">Accuracy</th>
              <th className="px-2 py-2.5 font-medium">F1</th>
              <th className="px-2 py-2.5 font-medium">Owner</th>
              <th className="px-4 py-2.5 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border-soft bg-surface transition-colors last:border-0 hover:bg-surface-hover">
                <td className="px-4 py-3">
                  <Link to={`/models/${m.id}`} className="font-medium text-text hover:text-lumen">{m.name}</Link>
                  <div className="mt-0.5 line-clamp-1 text-[11px] text-text-faint">{m.description}</div>
                </td>
                <td className="px-2 py-3 font-mono text-text-muted">{m.versions[0]?.version}</td>
                <td className="px-2 py-3"><StageBadge stage={m.stage} /></td>
                <td className="px-2 py-3 font-mono text-text-muted">{(m.accuracy * 100).toFixed(1)}%</td>
                <td className="px-2 py-3 font-mono text-text-muted">{m.f1}</td>
                <td className="px-2 py-3 text-text-muted">{m.owner}</td>
                <td className="px-4 py-3 text-text-faint">{formatRelativeTime(m.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
