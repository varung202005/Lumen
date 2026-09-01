import type { Run, Status, MetricPoint } from "@/types";
import { experiments } from "./experiments";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildHistory(rand: () => number, steps: number, start: number, end: number, noise: number): MetricPoint[] {
  const pts: MetricPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const base = start + (end - start) * t;
    pts.push({ step: i + 1, value: Math.max(0, base + (rand() - 0.5) * noise) });
  }
  return pts;
}

const optimizers = ["Adam", "AdamW", "SGD", "RMSprop"];
const modelTypes = ["XGBoost", "RandomForest", "ResNet-50", "LightGBM", "Transformer-Base"];
const statuses: Status[] = ["completed", "completed", "completed", "failed", "running"];

function buildRuns(): Run[] {
  const runs: Run[] = [];
  experiments.forEach((exp, ei) => {
    const rand = seededRandom(ei * 137 + 7);
    const n = Math.min(exp.runCount, 14); // cap generated runs per experiment for the prototype
    for (let i = 0; i < n; i++) {
      const rid = `${exp.id}-run-${i + 1}`;
      const status = i === n - 1 && exp.status === "running" ? "running" : statuses[Math.floor(rand() * statuses.length)];
      const accStart = 0.6 + rand() * 0.1;
      const accEnd = Math.min(0.97, accStart + 0.15 + rand() * 0.2);
      const lossStart = 0.9 + rand() * 0.2;
      const lossEnd = Math.max(0.05, lossStart - 0.6 - rand() * 0.2);
      const accHist = buildHistory(rand, 20, accStart, accEnd, 0.03);
      const lossHist = buildHistory(rand, 20, lossStart, lossEnd, 0.04);
      const f1 = Math.round((accEnd - 0.02 - rand() * 0.05) * 1000) / 1000;
      runs.push({
        id: rid,
        name: `Run #${i + 1}`,
        experimentId: exp.id,
        status,
        createdAt: new Date(Date.now() - (n - i) * 3 * 3600 * 1000 - ei * 86400000).toISOString(),
        durationSec: Math.round(180 + rand() * 2400),
        metrics: {
          accuracy: Math.round(accEnd * 1000) / 1000,
          precision: Math.round((accEnd - rand() * 0.04) * 1000) / 1000,
          recall: Math.round((accEnd - rand() * 0.06) * 1000) / 1000,
          f1,
          loss: Math.round(lossEnd * 1000) / 1000,
          trainingTimeSec: Math.round(180 + rand() * 2400),
        },
        metricHistory: { accuracy: accHist, loss: lossHist },
        parameters: {
          learning_rate: [0.1, 0.01, 0.008, 0.005, 0.001][Math.floor(rand() * 5)],
          batch_size: [16, 32, 64, 128][Math.floor(rand() * 4)],
          epochs: [10, 20, 30, 50][Math.floor(rand() * 4)],
          optimizer: optimizers[Math.floor(rand() * optimizers.length)],
          model_type: modelTypes[Math.floor(rand() * modelTypes.length)],
          dropout: Math.round(rand() * 0.5 * 100) / 100,
        },
        artifacts: [
          { name: "model.pkl", type: "model", sizeKb: Math.round(2000 + rand() * 40000) },
          { name: "training_log.txt", type: "log", sizeKb: Math.round(10 + rand() * 200) },
          { name: "confusion_matrix.png", type: "image", sizeKb: Math.round(40 + rand() * 200) },
          { name: "feature_importance.json", type: "json", sizeKb: Math.round(2 + rand() * 20) },
        ],
        datasetId: `ds-${exp.id.replace("exp-", "")}`,
        isBest: false,
      });
    }
    // mark best run by f1
    const expRuns = runs.filter((r) => r.experimentId === exp.id);
    const best = expRuns.reduce((a, b) => ((b.metrics.f1 ?? 0) > (a.metrics.f1 ?? 0) ? b : a));
    best.isBest = true;
  });
  return runs;
}

export const runs: Run[] = buildRuns();

export function getRun(id: string) {
  return runs.find((r) => r.id === id);
}

export function getRunsForExperiment(experimentId: string) {
  return runs.filter((r) => r.experimentId === experimentId);
}
