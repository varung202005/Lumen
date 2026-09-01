import { useState } from "react";
import { Link } from "react-router-dom";
import { Database, FlaskConical, GitBranch, Boxes, Rocket } from "lucide-react";
import { datasets } from "@/data/datasets";
import { experiments } from "@/data/experiments";
import { models } from "@/data/models";
import { cn } from "@/lib/utils";

interface Node {
  id: string;
  label: string;
  sub: string;
  kind: "dataset" | "experiment" | "run" | "model" | "deployment";
  path?: string;
}

const kindIcon: Record<Node["kind"], any> = {
  dataset: Database,
  experiment: FlaskConical,
  run: GitBranch,
  model: Boxes,
  deployment: Rocket,
};

const kindColor: Record<Node["kind"], string> = {
  dataset: "#5b8def",
  experiment: "#9b8cf2",
  run: "#e8a23c",
  model: "#3ecf8e",
  deployment: "#f2b84b",
};

const columns: Node[][] = [
  datasets.slice(0, 4).map((d) => ({ id: d.id, label: d.name, sub: `${d.rows.toLocaleString()} rows`, kind: "dataset", path: `/datasets/${d.id}` })),
  experiments.slice(0, 4).map((e) => ({ id: e.id, label: e.name, sub: `${e.runCount} runs`, kind: "experiment", path: `/experiments/${e.id}` })),
  experiments.slice(0, 4).map((e) => ({ id: `${e.id}-best`, label: "Best Run", sub: e.bestMetricName + " " + e.bestMetricValue, kind: "run", path: `/experiments/${e.id}` })),
  models.map((m) => ({ id: m.id, label: m.name, sub: m.stage, kind: "model", path: `/models/${m.id}` })),
  [{ id: "deploy-prod", label: "Production", sub: "1 model serving", kind: "deployment" } as Node],
];

const columnLabels = ["Dataset", "Experiment", "Run", "Model", "Deployment"];

export default function Lineage() {
  const [selected, setSelected] = useState<Node | null>(columns[3][0]);

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-[20px] font-bold text-text">Lineage</h1>
        <p className="mt-1 text-[13px] text-text-muted">Trace the full lifecycle from dataset to deployment</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        <div className="overflow-x-auto rounded-xl border border-border bg-surface p-5">
          <div className="flex min-w-[900px] gap-6">
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-1 flex-col gap-2.5">
                <div className="mb-1 text-center text-[10.5px] font-semibold uppercase tracking-wide text-text-faint">{columnLabels[ci]}</div>
                {col.map((node) => {
                  const Icon = kindIcon[node.kind];
                  const isSelected = selected?.id === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelected(node)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        isSelected ? "border-lumen/50 bg-surface-2" : "border-border-soft bg-surface-2/50 hover:bg-surface-2"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon size={12} style={{ color: kindColor[node.kind] }} />
                        <span className="truncate text-[11.5px] font-medium text-text">{node.label}</span>
                      </div>
                      <span className="truncate text-[10.5px] text-text-faint">{node.sub}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-[11px] text-text-faint">Click any node to inspect it. Columns represent the ML lifecycle: dataset → experiment → run → model → deployment.</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 text-[12.5px] font-semibold text-text">Node Details</h3>
          {selected ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft bg-surface-2">
                  {(() => { const Icon = kindIcon[selected.kind]; return <Icon size={16} style={{ color: kindColor[selected.kind] }} />; })()}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-text">{selected.label}</div>
                  <div className="text-[11px] capitalize text-text-faint">{selected.kind}</div>
                </div>
              </div>
              <div className="rounded-lg border border-border-soft bg-surface-2 px-3 py-2.5 text-[12px] text-text-muted">{selected.sub}</div>
              {selected.path && (
                <Link to={selected.path} className="text-center text-[12px] font-medium text-lumen hover:underline">Open details →</Link>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] text-text-muted">Select a node to see details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
