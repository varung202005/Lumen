import type { Dataset } from "@/types";

export const datasets: Dataset[] = [];

export function getDataset(id: string) {
  return datasets.find((dataset) => dataset.id === id);
}
