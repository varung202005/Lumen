import type { Prompt } from "@/types";

const PROMPTS_STORAGE_KEY = "lumen-prompts";

export const prompts: Prompt[] = [];

export function getPrompts(): Prompt[] {
  if (typeof window === "undefined") return prompts;

  try {
    const stored = window.localStorage.getItem(PROMPTS_STORAGE_KEY);
    if (!stored) return prompts;
    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) ? (parsed as Prompt[]) : prompts;
  } catch {
    return prompts;
  }
}

export function savePrompts(nextPrompts: Prompt[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(nextPrompts));
  }
}

export function getPrompt(id: string) {
  return getPrompts().find((prompt) => prompt.id === id);
}
