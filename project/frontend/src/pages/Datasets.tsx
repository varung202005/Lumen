import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Database } from "lucide-react";
import { datasets } from "@/data/datasets";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatNumber, formatRelativeTime } from "@/lib/utils";

const statusTone: Record<string, "success" | "track" | "warning"> = {
  ready: "success",
  processing: "track",
  "drift-detected": "warning",
};

export default function Datasets() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => datasets.filter((d) => d.name.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-text">Datasets</h1>
          <p className="mt-1 text-[13px] text-text-muted">Dataset Intelligence across {datasets.length} tracked datasets</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-lumen px-3.5 py-2 text-[12.5px] font-semibold text-bg transition-opacity hover:opacity-90">
          <Plus size={14} /> Register Dataset
        </button>
      </div>

      <div className="flex min-w-[220px] max-w-sm items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <Search size={14} className="text-text-faint" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search datasets…" className="w-full bg-transparent text-[12.5px] text-text placeholder:text-text-faint focus:outline-none" />
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((d) => (
          <Card key={d.id} hoverable className="p-5">
            <Link to={`/datasets/${d.id}`} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft bg-surface-2">
                    <Database size={14} className="text-text-muted" />
                  </div>
                  <div>
                    <h3 className="font-mono text-[13px] font-semibold text-text">{d.name}</h3>
                    <p className="text-[11px] text-text-faint">{d.version}</p>
                  </div>
                </div>
                <Badge tone={statusTone[d.status]}>{d.status.replace("-", " ")}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-border-soft pt-3">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-text-faint">Rows</div>
                  <div className="font-mono text-[13.5px] font-semibold text-text">{formatNumber(d.rows)}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-text-faint">Columns</div>
                  <div className="font-mono text-[13.5px] font-semibold text-text">{d.columns}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-text-faint">Health</div>
                  <div className="font-mono text-[13.5px] font-semibold text-lumen">{d.healthScore}/100</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-faint">
                <span>{d.owner}</span>
                <span>Updated {formatRelativeTime(d.updatedAt)}</span>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
