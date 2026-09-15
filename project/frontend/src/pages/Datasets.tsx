import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Database, UploadCloud, Loader2 } from "lucide-react";
import { datasets } from "@/data/datasets";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { api, type ApiDataset } from "@/lib/api";

const statusTone: Record<string, "success" | "track" | "warning"> = {
  ready: "success",
  processing: "track",
  "drift-detected": "warning",
};

export default function Datasets() {
  const [query, setQuery] = useState("");
  const [realDatasets, setRealDatasets] = useState<ApiDataset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => datasets.filter((d) => d.name.toLowerCase().includes(query.toLowerCase())), [query]);

  function loadRealDatasets() {
    api.listDatasets().then(setRealDatasets).catch(() => {});
  }

  useEffect(() => {
    loadRealDatasets();
  }, []);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await api.uploadDataset(file);
      loadRealDatasets();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-text">Datasets</h1>
          <p className="mt-1 text-[13px] text-text-muted">Dataset Intelligence across {datasets.length + realDatasets.length} tracked datasets</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelected} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-lg bg-lumen px-3.5 py-2 text-[12.5px] font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            {uploading ? "Uploading & profiling…" : "Upload CSV"}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="rounded-lg border border-[#3d1a1d] bg-[#2a1214] px-3.5 py-2.5 text-[12.5px] text-danger">{uploadError}</div>
      )}

      {realDatasets.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-text-faint">Your Uploaded Datasets</h2>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {realDatasets.map((d) => (
              <Card key={d.id} hoverable className="p-5">
                <Link to={`/datasets/${d.id}`} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft bg-surface-2">
                        <Database size={14} className="text-text-muted" />
                      </div>
                      <div>
                        <h3 className="font-mono text-[13px] font-semibold text-text">{d.name}</h3>
                        <p className="text-[11px] text-text-faint">{d.filename}</p>
                      </div>
                    </div>
                    <Badge tone="success">ready</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-border-soft pt-3">
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-text-faint">Rows</div>
                      <div className="font-mono text-[13.5px] font-semibold text-text">{formatNumber(d.rows)}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-text-faint">Columns</div>
                      <div className="font-mono text-[13.5px] font-semibold text-text">{d.columns}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-text-faint">Duplicates</div>
                      <div className="font-mono text-[13.5px] font-semibold text-lumen">{d.profile.duplicateRows}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-faint">
                    <span>{formatNumber(d.sizeBytes)} bytes</span>
                    <span>Uploaded {formatRelativeTime(d.uploadedAt)}</span>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-w-[220px] max-w-sm items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <Search size={14} className="text-text-faint" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search datasets…" className="w-full bg-transparent text-[12.5px] text-text placeholder:text-text-faint focus:outline-none" />
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((d) => (
          <Card key={d.id} hoverable className="p-5">
            <Link to={`/datasets/${d.id}`} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft bg-surface-2">
                    <Database size={14} className="text-text-muted" />
                  </div>
                  <div>
                    <h3 className="font-mono text-[13px] font-semibold text-text">{d.name}</h3>
                    <p className="text-[11px] text-text-faint">{d.version}</p>
                  </div>
                </div>
                <Badge tone={statusTone[d.status]}>{d.status.replace("-", " ")}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-border-soft pt-3">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-text-faint">Rows</div>
                  <div className="font-mono text-[13.5px] font-semibold text-text">{formatNumber(d.rows)}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-text-faint">Columns</div>
                  <div className="font-mono text-[13.5px] font-semibold text-text">{d.columns}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-text-faint">Health</div>
                  <div className="font-mono text-[13.5px] font-semibold text-lumen">{d.healthScore}/100</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-faint">
                <span>{d.owner}</span>
                <span>Updated {formatRelativeTime(d.updatedAt)}</span>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
