export type Status = "running" | "completed" | "failed" | "queued";
export type Severity = "critical" | "warning" | "info" | "success";
export type ModelStage = "Development" | "Staging" | "Production" | "Archived";

export interface MetricPoint {
  step: number;
  value: number;
}

export interface Metrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  loss?: number;
  trainingTimeSec?: number;
}

export interface Parameters {
  learning_rate: number;
  batch_size: number;
  epochs: number;
  optimizer: string;
  model_type: string;
  dropout: number;
  [key: string]: string | number;
}

export interface Artifact {
  name: string;
  type: "model" | "log" | "image" | "json" | "other";
  sizeKb: number;
}

export interface Run {
  id: string;
  name: string;
  experimentId: string;
  status: Status;
  createdAt: string;
  durationSec: number;
  metrics: Metrics;
  metricHistory: {
    accuracy: MetricPoint[];
    loss: MetricPoint[];
  };
  parameters: Parameters;
  artifacts: Artifact[];
  datasetId: string;
  isBest?: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  owner: string;
  tags: string[];
  runCount: number;
  bestMetricName: string;
  bestMetricValue: number;
  updatedAt: string;
  status: Status;
  improvementPct: number;
}

export interface Dataset {
  id: string;
  name: string;
  version: string;
  rows: number;
  columns: number;
  sizeMb: number;
  status: "ready" | "processing" | "drift-detected";
  missingPct: number;
  duplicateRows: number;
  outlierPct: number;
  healthScore: number;
  owner: string;
  updatedAt: string;
  features: { name: string; type: string; missingPct: number; importance: number }[];
  classDistribution: { label: string; value: number }[];
}

export interface ModelVersion {
  version: string;
  stage: ModelStage;
  accuracy: number;
  f1: number;
  runId: string;
  createdAt: string;
}

export interface MLModel {
  id: string;
  name: string;
  description: string;
  owner: string;
  stage: ModelStage;
  accuracy: number;
  f1: number;
  updatedAt: string;
  datasetId: string;
  versions: ModelVersion[];
}

export interface Insight {
  id: string;
  type: "root-cause" | "dataset-warning" | "performance" | "model-rec" | "experiment-rec";
  severity: Severity;
  title: string;
  explanation: string;
  affectedEntity: { type: "experiment" | "run" | "dataset" | "model"; id: string; name: string };
  recommendation: string;
  createdAt: string;
}

export interface PromptVersion {
  version: string;
  content: string;
  evalScore: number;
  updatedAt: string;
}

export interface Prompt {
  id: string;
  name: string;
  description: string;
  status: "active" | "draft" | "deprecated";
  owner: string;
  updatedAt: string;
  variables: string[];
  versions: PromptVersion[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: { label: string; type: "run" | "experiment" | "metric" }[];
  timestamp: string;
}
