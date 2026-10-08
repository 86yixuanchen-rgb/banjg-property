import { useEffect, useRef, useState } from "react";
import { X, Send, Bot, AlertTriangle, LoaderCircle, Check } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
import { askDeepSeek } from "@/lib/deepseek";

type Turn = { q: string; answer?: string; error?: string };

export function AssistantPanel({ onClose }: { onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { requests } = useWorkspace();
  const ask = async (q: string) => {
    if (!q.trim() || loading) return;
    setInput("");
    setLoading(true);
    try {
      const result = await askDeepSeek({
        data: {
          question: q,
          requests: requests.map(
            ({ id, title, address, status, priority, waitingOn, nextAction }) => ({
              id,
              title,
              address,
              status,
              priority,
              waitingOn,
              nextAction,
            }),
          ),
        },
      });
      setTurns((items) => [
        ...items,
        result.ok ? { q, answer: result.answer } : { q, error: result.message },
      ]);
    } catch {
      setTurns((items) => [
        ...items,
        { q, error: "The AI service is unavailable. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l bg-card shadow-float sm:w-[400px] md:static md:z-auto md:shadow-none">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-ai-soft text-ai">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Banjg AI</div>
          <div className="text-[11px] text-muted-foreground">
            Suggests actions — you stay in control
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Close AI assistant"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {turns.map((t, i) => (
          <div key={`${t.q}-${i}`} className="space-y-3">
            <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
              {t.q}
            </div>
            <div
              className={`rounded-lg border p-3 text-sm ${t.error ? "border-waiting/40 bg-waiting-soft" : "bg-ai-soft"}`}
            >
              <div
                className={`flex items-center gap-2 font-medium ${t.error ? "text-waiting" : "text-ai"}`}
              >
                {t.error ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                {t.error ? "AI setup required" : "Banjg AI"}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {t.error ?? t.answer}
              </p>
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Reviewing requests and messages…
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
      <div className="border-t p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => void ask("What needs my attention today?")}
            className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
          >
            What needs my attention?
          </button>
          <button
            onClick={() => void ask("Which repairs are waiting for landlord approval?")}
            className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
          >
            Waiting on landlords
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
          className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about requests, properties or people…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button
            disabled={!input.trim() || loading}
            className="text-primary disabled:text-muted-foreground"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
