import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Send, FlaskConical, GitBranch } from "lucide-react";
import { experiments } from "@/data/experiments";
import { getRunsForExperiment } from "@/data/runs";
import { Badge } from "@/components/ui/Badge";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";

const suggestedQuestions = [
  "Why did Run #42 perform better?",
  "Compare my best runs.",
  "What caused the validation loss to increase?",
  "Which parameter had the biggest impact?",
  "What should I try next?",
];

function mockResponse(question: string): { content: string; references: ChatMessage["references"] } {
  const q = question.toLowerCase();
  if (q.includes("why") && q.includes("42")) {
    return {
      content: "Run #42 outperformed earlier runs primarily because of its learning rate schedule. It used learning_rate=0.008 with AdamW, which converged to a lower validation loss before overfitting set in. Compared with the previous best run, F1 improved by 8.4%, largely from better generalization rather than raw training accuracy.",
      references: [{ label: "Run #42", type: "run" }, { label: "F1 = 0.91", type: "metric" }],
    };
  }
  if (q.includes("compare") && q.includes("best")) {
    return {
      content: "Your top 3 runs by F1 share two traits: learning rates between 0.005–0.01, and dropout of at least 0.2. The main difference is batch size — the highest performer used batch_size=64, giving smoother gradient updates than the smaller-batch runs.",
      references: [{ label: "Customer Churn Prediction", type: "experiment" }],
    };
  }
  if (q.includes("validation loss")) {
    return {
      content: "Validation loss increases after epoch 18 in most runs of this experiment, while training loss keeps falling — a sign of overfitting. This pattern is consistent across models with dropout below 0.2 and shows up regardless of optimizer choice.",
      references: [{ label: "Overfitting detected", type: "metric" }],
    };
  }
  if (q.includes("parameter") && q.includes("impact")) {
    return {
      content: "Across recent runs, learning_rate had the largest effect on final F1, followed by dropout. Batch size and optimizer choice mattered less — swapping Adam for AdamW changed F1 by less than 0.5% on average.",
      references: [{ label: "learning_rate", type: "metric" }],
    };
  }
  if (q.includes("what should i try") || q.includes("next")) {
    return {
      content: "Based on the last 12 runs, I'd recommend learning_rate=0.008 with AdamW, dropout=0.3, and early stopping with patience=5. This configuration is close to your current best run but should reduce the overfitting seen after epoch 18.",
      references: [{ label: "Run #42", type: "run" }],
    };
  }
  return {
    content: "Here's what I found across your experiment history: performance has trended upward over the last 10 runs, with the biggest gains coming from learning rate tuning rather than architecture changes. Let me know if you'd like me to dig into a specific run or parameter.",
    references: [],
  };
}

export default function Copilot() {
  const [activeExpId, setActiveExpId] = useState(experiments[0].id);
  const activeExp = experiments.find((e) => e.id === activeExpId)!;
  const expRuns = getRunsForExperiment(activeExpId).slice(0, 6);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      role: "assistant",
      content: `Hi Varun — I'm looking at ${activeExp.name}. Ask me anything about your runs, metrics, or what to try next.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content, timestamp: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const { content: reply, references } = mockResponse(content);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply, references, timestamp: new Date().toISOString() }]);
      setLoading(false);
    }, 950);
  }

  return (
    <div className="fade-in flex h-[calc(100vh-104px)] flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles size={17} className="text-lumen" />
        <h1 className="text-[20px] font-bold text-text">AI Experiment Copilot</h1>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[220px_1fr_260px]">
        {/* LEFT: experiment context */}
        <div className="hidden flex-col gap-1.5 overflow-y-auto rounded-xl border border-border bg-surface p-3 xl:flex">
          <div className="px-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wide text-text-faint">Context</div>
          {experiments.map((e) => (
            <button
              key={e.id}
              onClick={() => setActiveExpId(e.id)}
              className={cn(
                "flex items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                e.id === activeExpId ? "bg-surface-2 text-text" : "text-text-muted hover:bg-surface-2/60"
              )}
            >
              <FlaskConical size={13} className="mt-0.5 shrink-0" />
              <span className="text-[12px] leading-snug">{e.name}</span>
            </button>
          ))}
        </div>

        {/* CENTER: conversation */}
        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-surface">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-4">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed",
                    m.role === "user" ? "bg-track text-white" : "border border-[#2e2410] bg-surface-2 text-text"
                  )}>
                    {m.role === "assistant" && <Sparkles size={12} className="mb-1 text-lumen" />}
                    <p>{m.content}</p>
                    {m.references && m.references.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.references.map((r, i) => (
                          <Link key={i} to={r.type === "run" ? "/runs" : r.type === "experiment" ? "/experiments" : "/insights"}>
                            <Badge tone="lumen">{r.label}</Badge>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-xl border border-[#2e2410] bg-surface-2 px-4 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lumen [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lumen [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lumen" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border-soft p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {suggestedQuestions.map((q) => (
                <button key={q} onClick={() => send(q)} className="rounded-full border border-border-soft bg-surface-2 px-2.5 py-1 text-[11px] text-text-muted transition-colors hover:border-lumen/40 hover:text-lumen">
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask Copilot about your experiments…"
                className="w-full bg-transparent text-[13px] text-text placeholder:text-text-faint focus:outline-none"
              />
              <button onClick={() => send()} className="flex h-7 w-7 items-center justify-center rounded-md bg-lumen text-bg transition-opacity hover:opacity-90">
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: relevant context */}
        <div className="hidden flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-surface p-3.5 xl:flex">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-text-faint">Relevant runs</div>
          {expRuns.map((r) => (
            <Link key={r.id} to={`/runs/${r.id}`} className="flex items-center justify-between rounded-lg border border-border-soft px-2.5 py-2 transition-colors hover:bg-surface-hover">
              <div className="flex items-center gap-2">
                <GitBranch size={12} className="text-text-faint" />
                <span className="text-[12px] text-text">{r.name}</span>
              </div>
              <span className="font-mono text-[11px] text-text-muted">F1 {r.metrics.f1}</span>
            </Link>
          ))}
          <div className="mt-2 rounded-lg border border-[#2e2410] bg-[#1a1409] px-3 py-2.5 text-[11.5px] text-text-muted">
            Copilot answers are generated from mock experiment data for this prototype.
          </div>
        </div>
      </div>
    </div>
  );
}
