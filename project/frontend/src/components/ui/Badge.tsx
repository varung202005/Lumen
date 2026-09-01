import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Status, Severity, ModelStage } from "@/types";

export function Badge({ children, className, tone = "neutral" }: {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "lumen" | "track" | "success" | "warning" | "danger";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-2 text-text-muted border-border",
    lumen: "bg-[#241c0e] text-lumen border-[#3a2c11]",
    track: "bg-[#101c30] text-track border-[#1c2c47]",
    success: "bg-[#0d2419] text-success border-[#15382a]",
    warning: "bg-[#2a1c0c] text-warning border-[#3d2a12]",
    danger: "bg-[#2a1214] text-danger border-[#3d1a1d]",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-none", tones[tone], className)}>
      {children}
    </span>
  );
}

const statusMap: Record<Status, { label: string; tone: "success" | "track" | "danger" | "neutral" }> = {
  completed: { label: "Completed", tone: "success" },
  running: { label: "Running", tone: "track" },
  failed: { label: "Failed", tone: "danger" },
  queued: { label: "Queued", tone: "neutral" },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = statusMap[status];
  return (
    <Badge tone={s.tone}>
      <span className={cn("h-1.5 w-1.5 rounded-full",
        s.tone === "success" && "bg-success",
        s.tone === "track" && "bg-track lumen-pulse",
        s.tone === "danger" && "bg-danger",
        s.tone === "neutral" && "bg-text-faint",
      )} />
      {s.label}
    </Badge>
  );
}

const severityMap: Record<Severity, { tone: "danger" | "warning" | "track" | "success"; symbol: string }> = {
  critical: { tone: "danger", symbol: "!" },
  warning: { tone: "warning", symbol: "!" },
  info: { tone: "track", symbol: "i" },
  success: { tone: "success", symbol: "\u2191" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = severityMap[severity];
  return (
    <Badge tone={s.tone} className="font-mono">
      {s.symbol} {severity}
    </Badge>
  );
}

const stageTone: Record<ModelStage, "success" | "track" | "warning" | "neutral"> = {
  Production: "success",
  Staging: "track",
  Development: "warning",
  Archived: "neutral",
};

export function StageBadge({ stage }: { stage: ModelStage }) {
  return <Badge tone={stageTone[stage]}>{stage}</Badge>;
}
