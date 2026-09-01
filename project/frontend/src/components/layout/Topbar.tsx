import { Search, Bell } from "lucide-react";

export function Topbar({ onSearchClick }: { onSearchClick: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-soft px-6">
      <button
        onClick={onSearchClick}
        className="flex w-[300px] items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-left text-[12.5px] text-text-faint transition-colors hover:border-[#2c2f36] hover:text-text-muted"
      >
        <Search size={14} />
        <span className="flex-1">Search Lumen…</span>
        <kbd className="rounded border border-border-soft bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-faint">⌘K</kbd>
      </button>

      <div className="flex items-center gap-3">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2">
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-lumen" />
        </button>
        <div className="h-6 w-px bg-border-soft" />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-[11.5px] font-semibold text-text-muted">VM</div>
      </div>
    </header>
  );
}
