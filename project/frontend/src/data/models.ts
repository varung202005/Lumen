import type { MLModel } from "@/types";

export const models: MLModel[] = [
  {
    id: "model-churn",
    name: "churn-classifier",
    description: "Production churn risk scoring model served to the retention team dashboard.",
    owner: "Varun Mehta",
    stage: "Production",
    accuracy: 0.948,
    f1: 0.91,
    updatedAt: "2026-09-02T07:10:00Z",
    datasetId: "ds-churn",
    versions: [
      { version: "v6", stage: "Production", accuracy: 0.948, f1: 0.91, runId: "exp-churn-run-14", createdAt: "2026-09-02T07:10:00Z" },
      { version: "v5", stage: "Archived", accuracy: 0.931, f1: 0.885, runId: "exp-churn-run-9", createdAt: "2026-08-20T07:10:00Z" },
      { version: "v4", stage: "Archived", accuracy: 0.912, f1: 0.86, runId: "exp-churn-run-5", createdAt: "2026-08-05T07:10:00Z" },
    ],
  },
  {
    id: "model-defect",
    name: "defect-detector-resnet",
    description: "Computer vision model flagging manufacturing defects on the QA line.",
    owner: "Priya Nair",
    stage: "Staging",
    accuracy: 0.948,
    f1: 0.902,
    updatedAt: "2026-09-01T15:42:00Z",
    datasetId: "ds-imgcls",
    versions: [
      { version: "v9", stage: "Staging", accuracy: 0.948, f1: 0.902, runId: "exp-imgcls-run-14", createdAt: "2026-09-01T15:42:00Z" },
      { version: "v8", stage: "Production", accuracy: 0.939, f1: 0.891, runId: "exp-imgcls-run-11", createdAt: "2026-08-18T15:42:00Z" },
    ],
  },
  {
    id: "model-fraud",
    name: "fraud-ensemble",
    description: "Gradient-boosted ensemble for real-time transaction risk scoring.",
    owner: "Daniel Osei",
    stage: "Development",
    accuracy: 0.921,
    f1: 0.887,
    updatedAt: "2026-08-30T09:05:00Z",
    datasetId: "ds-fraud",
    versions: [
      { version: "v3", stage: "Development", accuracy: 0.921, f1: 0.887, runId: "exp-fraud-run-10", createdAt: "2026-08-30T09:05:00Z" },
    ],
  },
  {
    id: "model-triage",
    name: "ticket-triage-transformer",
    description: "Transformer classifier routing inbound support tickets.",
    owner: "Ayesha Khan",
    stage: "Archived",
    accuracy: 0.874,
    f1: 0.86,
    updatedAt: "2026-08-27T11:00:00Z",
    datasetId: "ds-nlp",
    versions: [
      { version: "v2", stage: "Archived", accuracy: 0.874, f1: 0.86, runId: "exp-nlp-run-12", createdAt: "2026-08-27T11:00:00Z" },
    ],
  },
];

export function getModel(id: string) {
  return models.find((m) => m.id === id);
}
