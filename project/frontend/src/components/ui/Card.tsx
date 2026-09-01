import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className, onClick, hoverable }: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-surface",
        (hoverable || onClick) && "cursor-pointer transition-colors hover:bg-surface-hover hover:border-[#2c2f36]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-soft px-5 py-4">
      <div>
        <h3 className="text-[13px] font-semibold text-text">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[12px] text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({ label, value, sub, tone = "default" }: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "lumen";
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface px-4 py-3.5", tone === "lumen" && "border-[#2e2410]")}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-text-faint">{label}</div>
      <div className={cn("mt-1.5 font-mono text-2xl font-semibold", tone === "lumen" ? "text-lumen" : "text-text")}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-text-muted">{sub}</div>}
    </div>
  );
}
