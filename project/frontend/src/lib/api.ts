// Thin client for the real Lumen backend (Dataset Intelligence + Experiment Tracking).
// Dev server proxies /api -> http://localhost:8000 (see vite.config.ts).

export interface ColumnProfile {
  name: string;
  dtype: string;
  type: "numeric" | "categorical";
  missing: number;
  missingPct: number;
  unique: number;
  mean?: number | null;
  std?: number | null;
  min?: number | null;
  max?: number | null;
  topValue?: string | null;
}

export interface DatasetProfile {
  rows: number;
  columns: number;
  duplicateRows: number;
  columnProfiles: ColumnProfile[];
  observations: { severity: string; message: string }[];
}

export interface ApiDataset {
  id: string;
  name: string;
  filename: string;
  sizeBytes: number;
  rows: number;
  columns: number;
  uploadedAt: string;
  profile: DatasetProfile;
}

export interface RunMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: number[][];
  classNames: string[];
  trainRows: number;
  testRows: number;
  featureCount: number;
  trainingTimeSec: number;
}

export interface ApiRun {
  id: string;
  experimentId: string;
  datasetId: string;
  modelType: string;
  params: Record<string, unknown>;
  metrics: RunMetrics | null;
  status: "running" | "completed" | "failed";
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
  durationSec: number | null;
}

export interface ApiExperiment {
  id: string;
  name: string;
  datasetId: string;
  targetColumn: string;
  createdAt: string;
  runs: ApiRun[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  uploadDataset(file: File): Promise<ApiDataset> {
    const form = new FormData();
    form.append("file", file);
    return request<ApiDataset>("/datasets/upload", { method: "POST", body: form });
  },
  listDatasets(): Promise<ApiDataset[]> {
    return request("/datasets");
  },
  getDataset(id: string): Promise<ApiDataset> {
    return request(`/datasets/${id}`);
  },
  createRun(payload: {
    datasetId: string;
    targetColumn: string;
    modelType: string;
    params: Record<string, unknown>;
    experimentName?: string;
  }): Promise<ApiRun> {
    return request("/runs", { method: "POST", body: JSON.stringify(payload) });
  },
  listRuns(): Promise<ApiRun[]> {
    return request("/runs");
  },
  getRun(id: string): Promise<ApiRun> {
    return request(`/runs/${id}`);
  },
  listExperiments(): Promise<ApiExperiment[]> {
    return request("/experiments");
  },
  getExperiment(id: string): Promise<ApiExperiment> {
    return request(`/experiments/${id}`);
  },
};
