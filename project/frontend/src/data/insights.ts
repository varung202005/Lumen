import type { Insight } from "@/types";

export const insights: Insight[] = [
  {
    id: "in-1",
    type: "root-cause",
    severity: "warning",
    title: "Overfitting detected in Customer Churn",
    explanation: "Validation loss increased steadily after epoch 18 while training loss kept falling, a classic overfitting signature. Regularization strength was likely too low for this run's model capacity.",
    affectedEntity: { type: "run", id: "exp-churn-run-9", name: "Run #9" },
    recommendation: "Increase dropout to 0.3 or add early stopping with patience=5.",
    createdAt: "2026-09-02T06:40:00Z",
  },
  {
    id: "in-2",
    type: "performance",
    severity: "success",
    title: "Run #42 improved F1 by 8.4%",
    explanation: "Compared with the previous best run, the higher learning rate combined with a larger batch size reached a better optimum before validation loss began rising.",
    affectedEntity: { type: "run", id: "exp-churn-run-14", name: "Run #14" },
    recommendation: "Promote this configuration to the default template for future churn experiments.",
    createdAt: "2026-09-02T07:10:00Z",
  },
  {
    id: "in-3",
    type: "dataset-warning",
    severity: "warning",
    title: "Dataset drift detected in customer_churn_v3",
    explanation: "The distribution of the 'income' feature has shifted significantly relative to the training baseline over the last two weeks, which may degrade model calibration.",
    affectedEntity: { type: "dataset", id: "ds-churn", name: "customer_churn_v3" },
    recommendation: "Schedule a re-training run once at least 3 more days of post-drift data has accumulated.",
    createdAt: "2026-09-01T22:00:00Z",
  },
  {
    id: "in-4",
    type: "model-rec",
    severity: "info",
    title: "defect-detector-resnet is ready for Production promotion",
    explanation: "Staging version v9 has outperformed the current production model on accuracy and F1 across the last 5 evaluation windows with no regression in latency.",
    affectedEntity: { type: "model", id: "model-defect", name: "defect-detector-resnet" },
    recommendation: "Promote v9 to Production after a final manual review.",
    createdAt: "2026-09-01T16:00:00Z",
  },
  {
    id: "in-5",
    type: "experiment-rec",
    severity: "info",
    title: "Try learning_rate = 0.008 with early stopping",
    explanation: "Across the last 12 runs in Customer Churn Prediction, runs using learning rates between 0.005–0.01 converged faster and generalized better than higher rates.",
    affectedEntity: { type: "experiment", id: "exp-churn", name: "Customer Churn Prediction" },
    recommendation: "Launch a new run with learning_rate=0.008, optimizer=AdamW, and early stopping enabled.",
    createdAt: "2026-09-02T07:15:00Z",
  },
  {
    id: "in-6",
    type: "root-cause",
    severity: "critical",
    title: "Support Ticket Triage run failures spiking",
    explanation: "3 of the last 5 runs failed during the tokenization stage, correlated with a recent update to the ticket_text preprocessing pipeline introducing null bytes.",
    affectedEntity: { type: "experiment", id: "exp-nlp", name: "Support Ticket Triage" },
    recommendation: "Roll back the preprocessing change or add null-byte sanitization before tokenization.",
    createdAt: "2026-08-27T11:05:00Z",
  },
  {
    id: "in-7",
    type: "dataset-warning",
    severity: "warning",
    title: "Class imbalance in fraud_detection_v2",
    explanation: "Fraudulent transactions represent only 3% of records, which can bias precision/recall tradeoffs if left unaddressed during training.",
    affectedEntity: { type: "dataset", id: "ds-fraud", name: "fraud_detection_v2" },
    recommendation: "Apply class weighting or SMOTE oversampling in the next training run.",
    createdAt: "2026-08-30T09:10:00Z",
  },
];

export function getInsight(id: string) {
  return insights.find((i) => i.id === id);
}
