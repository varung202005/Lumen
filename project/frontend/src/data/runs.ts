import type { Run } from "@/types";

export const runs: Run[] = [];

export function getRun(id: string) {
  return runs.find((run) => run.id === id);
}

export function getRunsForExperiment(experimentId: string) {
  return runs.filter((run) => run.experimentId === experimentId);
}
