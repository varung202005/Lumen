import { experiments } from "@/data/experiments";
import { runs } from "@/data/runs";
import { models } from "@/data/models";
import { datasets } from "@/data/datasets";
import { insights } from "@/data/insights";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: "Experiment" | "Run" | "Model" | "Dataset" | "Insight";
  path: string;
}

function buildIndex(): SearchResult[] {
  const items: SearchResult[] = [];
  experiments.forEach((e) =>
    items.push({ id: e.id, title: e.name, subtitle: `${e.runCount} runs \u00b7 ${e.owner}`, category: "Experiment", path: `/experiments/${e.id}` })
  );
  runs.forEach((r) =>
    items.push({ id: r.id, title: r.name, subtitle: `${r.experimentId} \u00b7 F1 ${r.metrics.f1}`, category: "Run", path: `/runs/${r.id}` })
  );
  models.forEach((m) =>
    items.push({ id: m.id, title: m.name, subtitle: `${m.stage} \u00b7 v${m.versions[0]?.version}`, category: "Model", path: `/models/${m.id}` })
  );
  datasets.forEach((d) =>
    items.push({ id: d.id, title: d.name, subtitle: `${d.rows.toLocaleString()} rows`, category: "Dataset", path: `/datasets/${d.id}` })
  );
  insights.forEach((i) =>
    items.push({ id: i.id, title: i.title, subtitle: i.affectedEntity.name, category: "Insight", path: `/insights` })
  );
  return items;
}

export const searchIndex = buildIndex();

export function runSearch(query: string, limit = 8): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return searchIndex
    .filter((i) => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    .slice(0, limit);
}
