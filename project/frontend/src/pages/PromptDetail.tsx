import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getPrompt } from "@/data/prompts";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/Card";
import { cn, formatRelativeTime } from "@/lib/utils";

const statusTone: Record<string, "success" | "neutral" | "warning"> = {
  active: "success",
  draft: "warning",
  deprecated: "neutral",
};

export default function PromptDetail() {
  const { id } = useParams();
  const prompt = id ? getPrompt(id) : undefined;
  const [versionIdx, setVersionIdx] = useState(0);
  if (!prompt) return <div className="text-[13px] text-text-muted">Prompt not found.</div>;
  const version = prompt.versions[versionIdx];

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
        <Link to="/prompts" className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-text">
          <ArrowLeft size={13} /> Prompts
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[20px] font-bold text-text">{prompt.name}</h1>
              <Badge tone={statusTone[prompt.status]}>{prompt.status}</Badge>
            </div>
            <p className="mt-1.5 text-[13px] text-text-muted">{prompt.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Versions" value={prompt.versions.length} />
        <MetricCard label="Eval Score" value={version.evalScore} tone="lumen" />
        <MetricCard label="Owner" value={prompt.owner} />
        <MetricCard label="Updated" value={formatRelativeTime(prompt.updatedAt)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[12.5px] font-semibold text-text">Prompt Content — {version.version}</h3>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-border-soft bg-surface-2 p-4 font-mono text-[12px] leading-relaxed text-text-muted">{version.content}</pre>
          <div className="mt-4">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-faint">Variables</div>
            <div className="flex flex-wrap gap-1.5">
              {prompt.variables.map((v) => <Badge key={v} tone="track">{`{{${v}}}`}</Badge>)}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-[12.5px] font-semibold text-text">Version History</h3>
          <div className="flex flex-col gap-1.5">
            {prompt.versions.map((v, i) => (
              <button
                key={v.version}
                onClick={() => setVersionIdx(i)}
                className={cn("flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12px] transition-colors", i === versionIdx ? "bg-surface-2 text-text" : "text-text-muted hover:bg-surface-2/60")}
              >
                <span className="font-mono">{v.version}</span>
                <span className="font-mono text-text-faint">{v.evalScore}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
