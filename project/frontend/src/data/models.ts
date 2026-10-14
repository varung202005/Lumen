import type { MLModel } from "@/types";

export const models: MLModel[] = [];

export function getModel(id: string) {
  return models.find((model) => model.id === id);
}
