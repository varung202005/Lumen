import type { Experiment } from "@/types";

export const experiments: Experiment[] = [];

export function getExperiment(id: string) {
  return experiments.find((experiment) => experiment.id === id);
}
