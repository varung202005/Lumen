import { useState } from "react";
import { cn } from "@/lib/utils";

const sections = ["General", "Appearance", "Workspace", "Notifications", "AI Preferences"] as const;
type Section = typeof sections[number];

function Toggle({ label, description, defaultOn }: { label: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="flex items-center justify-between border-b border-border-soft py-3.5 last:border-0">
      <div>
        <div className="text-[12.5px] font-medium text-text">{label}</div>
        <div className="mt-0.5 text-[11.5px] text-text-muted">{description}</div>
      </div>
      <button
        onClick={() => setOn((o) => !o)}
        className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-lumen" : "bg-surface-2")}
      >
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-bg transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

function TextField({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border-soft py-3.5 last:border-0">
      <label className="text-[12px] font-medium text-text">{label}</label>
      <input defaultValue={defaultValue} className="w-full max-w-sm rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12.5px] text-text focus:outline-none focus:ring-1 focus:ring-lumen/50" />
    </div>
  );
}

export default function Settings() {
  const [section, setSection] = useState<Section>("General");

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-[20px] font-bold text-text">Settings</h1>
        <p className="mt-1 text-[13px] text-text-muted">Manage your Lumen workspace preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        <div className="flex flex-col gap-0.5">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={cn("rounded-lg px-3 py-2 text-left text-[12.5px] font-medium transition-colors", section === s ? "bg-surface-2 text-text" : "text-text-muted hover:bg-surface-2/60")}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          {section === "General" && (
            <div>
              <TextField label="Full name" defaultValue="Varun Mehta" />
              <TextField label="Email" defaultValue="varun.mehta@lumen.dev" />
              <TextField label="Role" defaultValue="ML Engineer" />
            </div>
          )}
          {section === "Appearance" && (
            <div>
              <Toggle label="Dark theme" description="Use Lumen's dark, high-contrast theme" defaultOn />
              <Toggle label="Compact tables" description="Reduce row height across data tables" />
              <Toggle label="Reduced motion" description="Minimize animations across the interface" />
            </div>
          )}
          {section === "Workspace" && (
            <div>
              <TextField label="Workspace name" defaultValue="Lumen — ML Platform Team" />
              <Toggle label="Auto-archive stale experiments" description="Archive experiments with no runs for 90+ days" defaultOn />
              <Toggle label="Require review before Production promotion" description="Model stage changes to Production need a second approver" defaultOn />
            </div>
          )}
          {section === "Notifications" && (
            <div>
              <Toggle label="Run completion" description="Notify when a run finishes or fails" defaultOn />
              <Toggle label="Dataset drift alerts" description="Notify when drift is detected in a tracked dataset" defaultOn />
              <Toggle label="Weekly digest" description="Summary of experiment activity every Monday" />
            </div>
          )}
          {section === "AI Preferences" && (
            <div>
              <Toggle label="Proactive insights" description="Let Lumen surface insights automatically on the Overview page" defaultOn />
              <Toggle label="Copilot access to run artifacts" description="Allow Copilot to reference logs and artifacts in responses" defaultOn />
              <Toggle label="Auto-suggest next experiment" description="Show a recommended configuration after each run" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
