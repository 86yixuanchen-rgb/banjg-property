import { Link } from "@tanstack/react-router";
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

function Row({
  id,
  title,
  meta,
  highlight,
}: {
  id: string;
  title: string;
  meta: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to="/requests/$id"
      params={{ id }}
      className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted ${highlight ? "border-waiting/40 bg-waiting-soft" : ""}`}
    >
      <span>
        <span className="font-mono text-xs text-muted-foreground">{id}</span> · {title}
      </span>
      <span className="text-xs text-muted-foreground">{meta}</span>
    </Link>
  );
}

function LandlordAnswer() {
  const { notify } = useWorkspace();
  return (
    <div className="space-y-2 text-sm">
      <p>5 active requests are waiting for landlord approval. The top three by value:</p>
      <div className="space-y-1.5">
        <Row id="REQ-101" title="Air Conditioning" meta="$680 · 18 hrs" />
        <Row id="REQ-087" title="Garage Door" meta="$340 · 2 days" highlight />
        <Row id="REQ-076" title="Hot Water" meta="$1,200 · 4 hrs" />
      </div>
      <div className="flex items-center gap-2 rounded-md bg-waiting-soft px-3 py-2 text-xs text-waiting">
        <AlertTriangle className="h-3.5 w-3.5" />
        REQ-087 has been waiting the longest.
      </div>
      <div className="flex gap-2 pt-1">
        <Link to="/" className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
          View Requests
        </Link>
        <button
          onClick={() => notify("3 follow-up drafts created for review")}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          Draft Follow-ups
        </button>
      </div>
    </div>
  );
}

function AttentionAnswer() {
  const items = [
    {
      id: "REQ-087",
      t: "Garage Door",
      why: "Landlord hasn't responded in 2 days — a follow-up is overdue.",
    },
    { id: "REQ-093", t: "Water Leak", why: "Tenant sent the photos you asked for." },
    { id: "REQ-106", t: "Electrical Issue", why: "Electrician cancelled today." },
  ];
  return (
    <div className="space-y-2 text-sm">
      <p>Three requests may need your attention.</p>
      {items.map((x) => (
        <Link
          key={x.id}
          to="/requests/$id"
          params={{ id: x.id }}
          className="block rounded-md border p-3 hover:bg-muted"
        >
          <div className="font-medium">
            <span className="font-mono text-xs text-muted-foreground">{x.id}</span> · {x.t}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{x.why}</div>
        </Link>
      ))}
    </div>
  );
}

function GenericAnswer({ query }: { query: string }) {
  return (
    <div className="rounded-lg border bg-ai-soft p-3 text-sm">
      <div className="flex items-center gap-2 font-medium text-ai">
        <Check className="h-4 w-4" />
        Workspace reviewed
      </div>
      <p className="mt-2 text-muted-foreground">
        I found the closest matching repair activity for “{query}”. Try a request ID, property
        address, or ask what needs attention for more specific results.
      </p>
    </div>
  );
}
