import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mail,
  MessageSquare,
  Bell,
  FileText,
  ChevronLeft,
  Hourglass,
  X,
  Plus,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { columns, priorityTone } from "@/lib/data";
import { columnStatus, useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/requests/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Kinzo Property` },
      {
        name: "description",
        content: `Status, next action and full activity timeline for ${params.id}.`,
      },
      { property: "og:title", content: `${params.id} — Kinzo Property` },
      {
        property: "og:description",
        content: "Repair request detail with unified communication timeline.",
      },
    ],
  }),
  component: Detail,
});

const timeline = [
  {
    when: "Monday 9:14 AM",
    what: "Tenant reported air conditioning issue",
    src: "Email",
    who: "James Wong",
  },
  { when: "Monday 9:26 AM", what: "Sarah requested photos", src: "Email", who: "Sarah Miller" },
  { when: "Monday 10:03 AM", what: "Tenant provided photos", src: "SMS", who: "James Wong" },
  {
    when: "Tuesday 2:15 PM",
    what: "CoolAir Services submitted $680 quote",
    src: "Email",
    who: "CoolAir Services",
  },
  {
    when: "Tuesday 3:42 PM",
    what: "Quote sent to landlord for approval",
    src: "Email",
    who: "Sarah Miller",
  },
];

const people = [
  { role: "Tenant", name: "James Wong", detail: "0412 555 019" },
  { role: "Landlord", name: "David Chen", detail: "d.chen@outlook.com" },
  { role: "Tradesperson", name: "CoolAir Services", detail: "HVAC · Licence 284019C" },
  { role: "Property Manager", name: "Sarah Miller", detail: "Harbour Realty" },
];

function Detail() {
  const { id } = Route.useParams();
  const { requests, updateRequest, notify } = useWorkspace();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const r = requests.find((x) => x.id === id) ?? requests.find((x) => x.id === "REQ-101")!;
  const isAC = r.id === "REQ-101";
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Link
          to="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to board
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-sm text-muted-foreground">{r.id}</div>
            <h1 className="text-2xl font-semibold tracking-tight">{r.title}</h1>
            <p className="text-muted-foreground">{r.address}</p>
          </div>
          <label className="text-xs font-medium text-muted-foreground">
            Update status
            <select
              value={r.column}
              onChange={(e) => {
                const column = e.target.value as typeof r.column;
                updateRequest(r.id, {
                  column,
                  status: columnStatus[column],
                  lastUpdate: "Just now",
                });
                notify(`${r.id} status updated to ${column}`);
              }}
              className="mt-1 block h-9 rounded-md border bg-card px-3 text-sm text-foreground"
            >
              {columns.map((column) => (
                <option key={column.name}>{column.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 xl:grid-cols-6">
          {[
            [
              "Status",
              <span className="inline-flex items-center gap-1.5 rounded bg-waiting-soft px-2 py-0.5 text-waiting">
                <Hourglass className="h-3 w-3" />
                {r.status}
              </span>,
            ],
            [
              "Priority",
              <span className={`rounded border px-2 py-0.5 ${priorityTone[r.priority]}`}>
                {r.priority}
              </span>,
            ],
            ["Property", r.address],
            ["Tenant", "James Wong"],
            ["Landlord", "David Chen"],
            ["Assigned PM", "Sarah Miller"],
          ].map(([k, v], i) => (
            <div key={i} className="bg-card p-3">
              <div className="text-xs text-muted-foreground">{k}</div>
              <div className="mt-1 text-sm font-medium">{v}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border-2 border-primary/30 bg-primary-soft p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                Next action
              </div>
              <div className="mt-1 text-lg font-semibold">
                {isAC ? "Landlord approval required" : r.nextAction}
              </div>
              <div className="text-sm text-muted-foreground">
                {isAC ? "CoolAir Services quote: $680" : `Waiting on ${r.waitingOn}`}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => notify(`Reminder queued to ${r.waitingOn}`)}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Bell className="h-4 w-4" />
                  Send Reminder
                </button>
                <button
                  onClick={() => setQuoteOpen(true)}
                  className="flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium"
                >
                  <FileText className="h-4 w-4" />
                  View Quote
                </button>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Activity timeline</h2>
                <button
                  onClick={() => setNoteOpen(true)}
                  className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add note
                </button>
              </div>
              <ol className="relative space-y-5 border-l pl-6">
                {timeline.map((t) => (
                  <li key={t.when} className="relative">
                    <span className="absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full border bg-card">
                      {t.src === "SMS" ? (
                        <MessageSquare className="h-3 w-3 text-done" />
                      ) : (
                        <Mail className="h-3 w-3 text-primary" />
                      )}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {t.when} · {t.who}
                    </div>
                    <div className="text-sm font-medium">{t.what}</div>
                    <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      Source: {t.src}
                    </span>
                  </li>
                ))}
                {notes.map((text, index) => (
                  <li key={`${text}-${index}`} className="relative">
                    <span className="absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full bg-done">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </span>
                    <div className="text-xs text-muted-foreground">Just now · Sarah Miller</div>
                    <div className="text-sm font-medium">{text}</div>
                    <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      Internal note
                    </span>
                  </li>
                ))}
                <li className="relative">
                  <span className="absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full bg-waiting">
                    <Hourglass className="h-3 w-3 text-primary-foreground" />
                  </span>
                  <div className="text-xs text-muted-foreground">Current state</div>
                  <div className="text-sm font-semibold text-waiting">
                    Waiting for landlord approval
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold">Stakeholders</h2>
            {people.map((p) => (
              <div
                key={p.role}
                className={`rounded-lg border bg-card p-4 shadow-card ${p.role === "Landlord" ? "border-waiting/50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">{p.role}</div>
                  {p.role === "Landlord" && (
                    <span className="rounded bg-waiting-soft px-1.5 text-[10px] font-medium text-waiting">
                      Waiting on
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-semibold">
                    {p.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {quoteOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-xl border bg-card p-6 shadow-float">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-muted-foreground">QUOTE CA-24018</div>
                <h2 className="text-xl font-semibold">CoolAir Services</h2>
              </div>
              <button
                onClick={() => setQuoteOpen(false)}
                className="rounded p-1 hover:bg-muted"
                aria-label="Close quote"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="my-6 rounded-lg bg-muted p-5">
              <div className="flex justify-between border-b pb-3 text-sm">
                <span>Diagnose and repair split-system air conditioner</span>
                <span className="font-medium">$618.18</span>
              </div>
              <div className="flex justify-between pt-3 text-sm">
                <span>GST</span>
                <span>$61.82</span>
              </div>
              <div className="mt-3 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>$680.00</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Valid for 14 days. Parts subject to availability.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setQuoteOpen(false)}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setQuoteOpen(false);
                  notify("Quote marked approved and trade notified");
                  updateRequest(r.id, {
                    column: "Scheduled",
                    status: "Ready to schedule",
                    lastUpdate: "Just now",
                  });
                }}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Approve quote
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {noteOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!note.trim()) return;
              setNotes((items) => [...items, note.trim()]);
              setNote("");
              setNoteOpen(false);
              notify("Timeline note added");
            }}
            className="w-full max-w-md rounded-xl border bg-card p-6 shadow-float"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Add internal note</h2>
              <button type="button" onClick={() => setNoteOpen(false)} className="p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              autoFocus
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Record a call, decision or follow-up…"
              className="mt-4 min-h-28 w-full rounded-md border p-3 text-sm outline-none focus:border-ring"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteOpen(false)}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Add note
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}
