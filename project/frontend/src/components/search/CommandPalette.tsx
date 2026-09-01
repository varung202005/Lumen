import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FlaskConical, GitBranch, Boxes, Database, Lightbulb, CornerDownLeft } from "lucide-react";
import { runSearch, type SearchResult } from "@/lib/searchIndex";
import { cn } from "@/lib/utils";

const icons: Record<SearchResult["category"], any> = {
  Experiment: FlaskConical,
  Run: GitBranch,
  Model: Boxes,
  Dataset: Database,
  Insight: Lightbulb,
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const results = runSearch(query);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function go(r: SearchResult) {
    navigate(r.path);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && results[active]) go(results[active]);
    if (e.key === "Escape") onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[14vh]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2.5 border-b border-border-soft px-4 py-3">
          <Search size={16} className="text-text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search experiments, runs, models, datasets, insights…"
            className="w-full bg-transparent text-[13.5px] text-text placeholder:text-text-faint focus:outline-none"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-text-faint">ESC</kbd>
        </div>
        <div className="max-h-[360px] overflow-y-auto py-1.5">
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-text-muted">No results for "{query}"</div>
          )}
          {!query && (
            <div className="px-4 py-8 text-center text-[13px] text-text-muted">Type to search across your workspace</div>
          )}
          {results.map((r, i) => {
            const Icon = icons[r.category];
            return (
              <button
                key={r.category + r.id}
                onClick={() => go(r)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  i === active ? "bg-surface-2" : "hover:bg-surface-2/60"
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border-soft bg-surface-2">
                  <Icon size={13} className="text-text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-text">{r.title}</div>
                  <div className="truncate text-[11.5px] text-text-faint">{r.subtitle}</div>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-text-faint">{r.category}</span>
                {i === active && <CornerDownLeft size={12} className="text-text-faint" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
