import { NavLink } from "react-router-dom";
import {
  LayoutGrid, FlaskConical, GitBranch, Boxes, Database,
  Sparkles, Lightbulb, ScanEye, Network, TextQuote, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const trackItems = [
  { to: "/experiments", label: "Experiments", icon: FlaskConical },
  { to: "/runs", label: "Runs", icon: GitBranch },
  { to: "/models", label: "Models", icon: Boxes },
  { to: "/datasets", label: "Datasets", icon: Database },
];

const understandItems = [
  { to: "/copilot", label: "AI Copilot", icon: Sparkles },
  { to: "/insights", label: "Insights", icon: Lightbulb },
  { to: "/explainability", label: "Explainability", icon: ScanEye },
  { to: "/lineage", label: "Lineage", icon: Network },
];

const managementItems = [
  { to: "/prompts", label: "Prompts", icon: TextQuote },
  { to: "/settings", label: "Settings", icon: Settings },
];

function Item({ to, label, icon: Icon }: { to: string; label: string; icon: any }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors",
          isActive ? "bg-surface-2 text-text" : "text-text-muted hover:bg-surface-2/60 hover:text-text"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={15} strokeWidth={2} className={cn(isActive ? "text-text" : "text-text-faint group-hover:text-text-muted")} />
          {label}
        </>
      )}
    </NavLink>
  );
}

function SectionLabel({ children, dot }: { children: string; dot?: "track" | "lumen" }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 pb-1.5 pt-4 text-[10.5px] font-semibold tracking-wide text-text-faint first:pt-0">
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dot === "track" ? "bg-track" : "bg-lumen")} />
      )}
      {children}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="flex h-full w-[228px] shrink-0 flex-col border-r border-border-soft bg-bg px-3 py-4">
      <div className="mb-5 flex items-center gap-2 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lumen/90">
          <span className="text-[13px] font-bold text-bg">L</span>
        </div>
        <div>
          <div className="text-[14px] font-bold leading-none text-text">Lumen</div>
          <div className="mt-0.5 text-[9.5px] font-medium uppercase tracking-wider text-text-faint">AI-Native MLOps</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto">
        <Item to="/" label="Overview" icon={LayoutGrid} />

        <SectionLabel dot="track">Track</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {trackItems.map((i) => <Item key={i.to} {...i} />)}
        </div>

        <SectionLabel dot="lumen">Understand</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {understandItems.map((i) => <Item key={i.to} {...i} />)}
        </div>

        <SectionLabel>Management</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {managementItems.map((i) => <Item key={i.to} {...i} />)}
        </div>
      </nav>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border-soft px-2.5 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-text-muted">VM</div>
        <div className="min-w-0">
          <div className="truncate text-[12px] font-medium text-text">Varun Mehta</div>
          <div className="truncate text-[10.5px] text-text-faint">ML Engineer</div>
        </div>
      </div>
    </aside>
  );
}
