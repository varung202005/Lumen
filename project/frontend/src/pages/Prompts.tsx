import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, TextQuote, X } from "lucide-react";
import { api, type ApiPrompt } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { cn, formatRelativeTime } from "@/lib/utils";

const statusTone: Record<string, "success" | "neutral" | "warning"> = {
  active: "success",
  draft: "warning",
  deprecated: "neutral",
};

const statuses = ["all", "active", "draft", "deprecated"] as const;

export default function Prompts() {
  const navigate = useNavigate();
  const [promptList, setPromptList] = useState<ApiPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<typeof statuses[number]>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    api.listPrompts()
      .then(setPromptList)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Failed to load prompts"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => promptList.filter((p) => (status === "all" || p.status === status) && `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())),
    [promptList, query, status]
  );

  function closeCreate() {
    setIsCreateOpen(false);
    setName("");
    setDescription("");
    setContent("");
    setFormError("");
  }

  async function createPrompt() {
    const trimmedName = name.trim();
    const trimmedContent = content.trim();
    if (!trimmedName || !trimmedContent) {
      setFormError("Add a name and prompt content to continue.");
      return;
    }

    try {
      const createdPrompt = await api.createPrompt({ name: trimmedName, description, content: trimmedContent });
      setPromptList((current) => [createdPrompt, ...current]);
      closeCreate();
      navigate(`/prompts/${createdPrompt.id}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create prompt");
    }
  }

  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-text">Prompts</h1>
          <p className="mt-1 text-[13px] text-text-muted">Manage the prompts powering Lumen's AI intelligence layer</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-lumen px-3.5 py-2 text-[12.5px] font-semibold text-bg transition-opacity hover:opacity-90">
          <Plus size={14} /> New Prompt
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Search size={14} className="text-text-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts…" className="w-full bg-transparent text-[12.5px] text-text placeholder:text-text-faint focus:outline-none" />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={cn("rounded-md px-2.5 py-1 text-[11.5px] font-medium capitalize transition-colors", status === s ? "bg-surface-2 text-text" : "text-text-faint hover:text-text-muted")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loadError && <div className="rounded-lg border border-[#3d1a1d] bg-[#2a1214] px-3.5 py-2.5 text-[12.5px] text-danger">{loadError}</div>}

      {loading ? <p className="text-[12.5px] text-text-muted">Loading prompts…</p> : <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {filtered.map((p) => (
          <Link key={p.id} to={`/prompts/${p.id}`} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-surface-hover">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <TextQuote size={14} className="text-text-faint" />
                <h3 className="text-[13.5px] font-semibold text-text">{p.name}</h3>
              </div>
              <Badge tone={statusTone[p.status]}>{p.status}</Badge>
            </div>
            <p className="text-[12.5px] text-text-muted">{p.description}</p>
            <div className="flex items-center justify-between border-t border-border-soft pt-3 text-[11.5px] text-text-faint">
              <span>{p.versions.length} version{p.versions.length === 1 ? "" : "s"} · {p.owner}</span>
              <span>Updated {formatRelativeTime(p.updatedAt)}</span>
            </div>
          </Link>
        ))}
      </div>}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => event.target === event.currentTarget && closeCreate()}>
          <div role="dialog" aria-modal="true" aria-labelledby="new-prompt-title" className="w-full max-w-xl rounded-xl border border-border bg-surface p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="new-prompt-title" className="text-[16px] font-semibold text-text">New Prompt</h2>
                <p className="mt-1 text-[12px] text-text-muted">Create a reusable instruction for Lumen’s analysis layer.</p>
              </div>
              <button onClick={closeCreate} aria-label="Close new prompt" className="text-text-faint transition-colors hover:text-text"><X size={16} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="prompt-name" className="mb-1.5 block text-[11.5px] font-medium text-text-muted">Name</label>
                <input id="prompt-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Model Recommendation" className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12.5px] text-text placeholder:text-text-faint focus:outline-none" />
              </div>
              <div>
                <label htmlFor="prompt-description" className="mb-1.5 block text-[11.5px] font-medium text-text-muted">Description <span className="text-text-faint">(optional)</span></label>
                <input id="prompt-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should this prompt help Lumen do?" className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12.5px] text-text placeholder:text-text-faint focus:outline-none" />
              </div>
              <div>
                <label htmlFor="prompt-content" className="mb-1.5 block text-[11.5px] font-medium text-text-muted">Prompt Content</label>
                <textarea id="prompt-content" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Use {{variable_name}} for values Lumen will provide at runtime…" rows={7} className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-[12px] leading-relaxed text-text placeholder:font-sans placeholder:text-text-faint focus:outline-none" />
                <p className="mt-1.5 text-[11px] text-text-faint">Variables are detected automatically from double braces.</p>
              </div>
            </div>

            {formError && <p className="mt-3 text-[12px] text-danger">{formError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={closeCreate} className="rounded-lg border border-border px-3.5 py-2 text-[12px] font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text">Cancel</button>
              <button onClick={createPrompt} className="rounded-lg bg-lumen px-3.5 py-2 text-[12px] font-semibold text-bg transition-opacity hover:opacity-90">Create Prompt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
