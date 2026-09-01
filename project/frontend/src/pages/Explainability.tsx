import { useState } from "react";
import { Sparkles } from "lucide-react";
import { models } from "@/data/models";
import { datasets, getDataset } from "@/data/datasets";
import { getRunsForExperiment } from "@/data/runs";
import { experiments } from "@/data/experiments";
import { cn } from "@/lib/utils";

const explanationTypes = ["Feature Importance", "SHAP", "LIME", "Counterfactual"] as const;

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wide text-text-faint">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12.5px] text-text focus:outline-none focus:ring-1 focus:ring-lumen/50"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function Explainability() {
  const [modelId, setModelId] = useState(models[0].id);
  const model = models.find((m) => m.id === modelId)!;
  const dataset = getDataset(model.datasetId) ?? datasets[0];
  const exp = experiments.find((e) => e.id.includes(model.id.replace("model-", "")));
  const runOptions = exp ? getRunsForExperiment(exp.id) : [];
  const [runId, setRunId] = useState(runOptions[0]?.id ?? "");
  const [explType, setExplType] = useState<typeof explanationTypes[number]>("Feature Importance");

  const sortedFeatures = [...dataset.features].sort((a, b) => b.importance - a.importance);
  const topFeature = sortedFeatures[0];

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-[20px] font-bold text-text">Explainability Studio</h1>
        <p className="mt-1 text-[13px] text-text-muted">Understand what drives your model's predictions</p>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-4">
        <Select label="Model" value={modelId} onChange={setModelId} options={models.map((m) => ({ value: m.id, label: m.name }))} />
        <Select label="Run" value={runId} onChange={setRunId} options={runOptions.map((r) => ({ value: r.id, label: r.name }))} />
        <Select label="Dataset" value={dataset.id} onChange={() => {}} options={[{ value: dataset.id, label: dataset.name }]} />
        <Select label="Explanation Type" value={explType} onChange={(v) => setExplType(v as any)} options={explanationTypes.map((t) => ({ value: t, label: t }))} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-text">{explType}</h3>
          <div className="flex flex-col gap-3">
            {sortedFeatures.map((f) => (
              <div key={f.name} className="flex items-center gap-3">
                <div className="w-32 shrink-0 truncate text-[12.5px] text-text-muted">{f.name}</div>
                <div className="h-3.5 flex-1 overflow-hidden rounded-md bg-surface-2">
                  <div
                    className={cn("h-full rounded-md", f === topFeature ? "bg-lumen" : "bg-track")}
                    style={{ width: `${Math.max(4, f.importance * 100)}%` }}
                  />
                </div>
                <div className="w-12 shrink-0 text-right font-mono text-[11.5px] text-text-faint">{f.importance.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#2e2410] bg-surface glow-lumen">
          <div className="flex items-center gap-2 border-b border-border-soft px-5 py-3.5">
            <Sparkles size={14} className="text-lumen" />
            <h3 className="text-[13px] font-semibold text-text">AI Interpretation</h3>
          </div>
          <div className="px-5 py-4 text-[12.5px] text-text-muted">
            <p>
              '<span className="mono text-lumen">{topFeature?.name}</span>' is the strongest contributor to this model's predictions, accounting for roughly {(Math.round((topFeature?.importance ?? 0) * 100))}% of the total decision weight based on {explType.toLowerCase()} analysis.
              Its influence is consistent across the top 20% of predictions, with a secondary effect from '<span className="mono text-text">{sortedFeatures[1]?.name}</span>'.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
