import type { Prompt } from "@/types";

export const prompts: Prompt[] = [
  {
    id: "pr-1",
    name: "Experiment Analysis",
    description: "Summarizes patterns and anomalies across all runs in an experiment.",
    status: "active",
    owner: "Varun Mehta",
    updatedAt: "2026-08-30T10:00:00Z",
    variables: ["experiment_name", "run_summaries", "metric_history"],
    versions: [
      { version: "v4", content: "Analyze the following runs from {{experiment_name}} and identify patterns in {{metric_history}}...", evalScore: 0.91, updatedAt: "2026-08-30T10:00:00Z" },
      { version: "v3", content: "Given {{run_summaries}}, summarize key trends across runs...", evalScore: 0.86, updatedAt: "2026-08-10T10:00:00Z" },
    ],
  },
  {
    id: "pr-2",
    name: "Root Cause Analysis",
    description: "Diagnoses likely causes of run failures or metric regressions.",
    status: "active",
    owner: "Ayesha Khan",
    updatedAt: "2026-08-28T09:00:00Z",
    variables: ["run_id", "error_logs", "parameter_diff"],
    versions: [
      { version: "v2", content: "Given {{error_logs}} and {{parameter_diff}} for {{run_id}}, determine the most likely root cause...", evalScore: 0.88, updatedAt: "2026-08-28T09:00:00Z" },
    ],
  },
  {
    id: "pr-3",
    name: "Dataset Summary",
    description: "Produces a plain-language health summary for a dataset.",
    status: "active",
    owner: "Priya Nair",
    updatedAt: "2026-08-25T14:00:00Z",
    variables: ["dataset_name", "profile_stats"],
    versions: [
      { version: "v3", content: "Summarize the health of {{dataset_name}} using {{profile_stats}}, flagging any drift, imbalance, or missing data...", evalScore: 0.93, updatedAt: "2026-08-25T14:00:00Z" },
    ],
  },
  {
    id: "pr-4",
    name: "Run Comparison",
    description: "Explains why one run outperformed another in plain language.",
    status: "draft",
    owner: "Varun Mehta",
    updatedAt: "2026-08-22T11:00:00Z",
    variables: ["run_a", "run_b", "metric_diff"],
    versions: [
      { version: "v1", content: "Compare {{run_a}} and {{run_b}} using {{metric_diff}} and explain the performance gap...", evalScore: 0.79, updatedAt: "2026-08-22T11:00:00Z" },
    ],
  },
];

export function getPrompt(id: string) {
  return prompts.find((p) => p.id === id);
}
