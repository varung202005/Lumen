import type { Insight } from "@/types";

export const insights: Insight[] = [];

export function getInsight(id: string) {
  return insights.find((insight) => insight.id === id);
}
