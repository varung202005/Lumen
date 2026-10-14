import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { api, type ApiExperiment } from "@/lib/api";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

export default function Copilot() {
  const [experiments, setExperiments] = useState<ApiExperiment[]>([]);
  const [experimentId, setExperimentId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listExperiments().then((items) => {
      setExperiments(items);
      if (items.length > 0) setExperimentId(items[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const content = input.trim();
    if (!content || loading) return;
    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const response = await api.askCopilot({ messages: nextMessages, experimentId: experimentId || undefined });
      setMessages((current) => [...current, { role: "assistant", content: response.content }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Copilot request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in flex h-[calc(100vh-104px)] flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles size={17} className="text-lumen" />
        <div>
          <h1 className="text-[20px] font-bold text-text">AI Experiment Copilot</h1>
          <p className="mt-1 text-[13px] text-text-muted">Ask questions about real runs, metrics, and next steps.</p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[220px_1fr]">
        <div className="hidden flex-col gap-1.5 overflow-y-auto rounded-xl border border-border bg-surface p-3 xl:flex">
          <div className="px-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wide text-text-faint">Experiment context</div>
          {experiments.length === 0 && <p className="px-1.5 py-3 text-[12px] text-text-muted">No experiments yet.</p>}
          {experiments.map((experiment) => (
            <button key={experiment.id} onClick={() => setExperimentId(experiment.id)} className={cn("rounded-lg px-2.5 py-2 text-left text-[12px] transition-colors", experiment.id === experimentId ? "bg-surface-2 text-text" : "text-text-muted hover:bg-surface-2/60")}>{experiment.name}</button>
          ))}
        </div>

        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-surface">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
            {messages.length === 0 && <div className="flex h-full items-center justify-center text-center text-[13px] text-text-muted">Ask Copilot about your experiment data.</div>}
            <div className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap", message.role === "user" ? "bg-track text-white" : "border border-[#2e2410] bg-surface-2 text-text")}>{message.content}</div>
                </div>
              ))}
              {loading && <div className="text-[12.5px] text-text-muted">Copilot is thinking…</div>}
            </div>
          </div>
          <div className="border-t border-border-soft p-3">
            {error && <p className="mb-2 text-[12px] text-danger">{error}</p>}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
              <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Ask about your experiments…" className="w-full bg-transparent text-[13px] text-text placeholder:text-text-faint focus:outline-none" />
              <button onClick={send} disabled={loading || !input.trim()} className="flex h-7 w-7 items-center justify-center rounded-md bg-lumen text-bg transition-opacity hover:opacity-90 disabled:opacity-50"><Send size={13} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
