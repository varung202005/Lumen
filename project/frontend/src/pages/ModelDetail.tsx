import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Boxes } from "lucide-react";
import { getModel } from "@/data/models";
import { getDataset } from "@/data/datasets";
import { MetricCard } from "@/components/ui/Card";
import { StageBadge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";

export default function ModelDetail() {
  const { id } = useParams();
  const model = id ? getModel(id) : undefined;
  if (!model) return <div className="text-[13px] text-text-muted">Model not found.</div>;
  const dataset = getDataset(model.datasetId);

  return (
    <div className="fade-in flex flex-col gap-6">
      <div>
        <Link to="/models" className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted hover:text-text">
          <ArrowLeft size={13} /> Models
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-soft bg-surface-2">
              <Boxes size={20} className="text-text-muted" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-mono text-[19px] font-bold text-text">{model.name}</h1>
                <StageBadge stage={model.stage} />
              </div>
              <p className="mt-1 text-[13px] text-text-muted">{model.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Accuracy" value={`${(model.accuracy * 100).toFixed(1)}%`} />
        <MetricCard label="F1" value={model.f1} tone="lumen" />
        <MetricCard label="Versions" value={model.versions.length} />
        <MetricCard label="Owner" value={model.owner} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border-soft px-5 py-3.5">
            <h3 className="text-[13px] font-semibold text-text">Version History</h3>
          </div>
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-border-soft text-[11px] uppercase tracking-wide text-text-faint">
                <th className="px-5 py-2 font-medium">Version</th>
                <th className="px-2 py-2 font-medium">Stage</th>
                <th className="px-2 py-2 font-medium">Accuracy</th>
                <th className="px-2 py-2 font-medium">F1</th>
                <th className="px-2 py-2 font-medium">Run</th>
                <th className="px-5 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {model.versions.map((v) => (
                <tr key={v.version} className="border-b border-border-soft last:border-0">
                  <td className="px-5 py-2.5 font-mono text-text">{v.version}</td>
                  <td className="px-2 py-2.5"><StageBadge stage={v.stage} /></td>
                  <td className="px-2 py-2.5 font-mono text-text-muted">{(v.accuracy * 100).toFixed(1)}%</td>
                  <td className="px-2 py-2.5 font-mono text-text-muted">{v.f1}</td>
                  <td className="px-2 py-2.5">
                    <Link to={`/runs/${v.runId}`} className="text-track hover:underline">{v.runId}</Link>
                  </td>
                  <td className="px-5 py-2.5 text-text-faint">{formatRelativeTime(v.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-2 text-[12.5px] font-semibold text-text">Training Dataset</h3>
            {dataset && (
              <Link to={`/datasets/${dataset.id}`} className="flex flex-col gap-1 rounded-lg border border-border-soft bg-surface-2 px-3 py-2.5 transition-colors hover:bg-surface-hover">
                <span className="font-mono text-[12.5px] text-text">{dataset.name}</span>
                <span className="text-[11px] text-text-faint">{dataset.rows.toLocaleString()} rows · {dataset.columns} columns</span>
              </Link>
            )}
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-2 text-[12.5px] font-semibold text-text">Lineage</h3>
            <Link to="/lineage" className="text-[12px] font-medium text-lumen hover:underline">View full lineage graph →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
