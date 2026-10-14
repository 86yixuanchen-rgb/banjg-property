import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Bell,
  FileText,
  ChevronLeft,
  Hourglass,
  X,
  Plus,
  Check,
  Sparkles,
  Send,
  StickyNote,
  RefreshCw,
  Link2,
  Trash2,
  Flag,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { columns, priorityTone, type Column } from "@/lib/data";
import { columnStatus, useWorkspace } from "@/lib/workspace";
import { useAuth } from "@/lib/auth";
import {
  addNote,
  addParticipant,
  analyzeIncident,
  getIncident,
  linkEmail,
  removeParticipant,
  type IncidentEmail,
} from "@/lib/incidents.functions";
import { participantRoles } from "@/db/schema";

export const Route = createFileRoute("/requests/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Banjg Property` },
      {
        name: "description",
        content: `Status, next action and full activity timeline for ${params.id}.`,
      },
      { property: "og:title", content: `${params.id} — Banjg Property` },
      {
        property: "og:description",
        content: "Repair request detail with unified communication timeline.",
      },
    ],
  }),
  component: Detail,
});

type Role = (typeof participantRoles)[number];
type Entry = {
  key: string;
  at: number;
  kind: "email-in" | "email-out" | "status" | "note" | "created";
  who: string;
  role: string;
  title: string;
  body?: string;
  counterpart?: { name: string; email: string } | undefined;
};

const roleTone: Record<string, string> = {
  Tenant: "bg-primary-soft text-primary",
  Landlord: "bg-waiting-soft text-waiting",
  "Repair Team": "bg-done-soft text-done",
  "Property Manager": "bg-muted text-muted-foreground",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatWhen = (at: number) =>
  new Date(at).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

function firstAddress(list: string) {
  return list.split(",")[0]?.trim() ?? "";
}

function emailEntry(m: IncidentEmail, roleOf: Map<string, string>): Entry {
  const other = m.outgoing ? firstAddress(m.toEmails) : m.fromEmail;
  return {
    key: `mail-${m.id}`,
    at: m.receivedAt,
    kind: m.outgoing ? "email-out" : "email-in",
    who: m.outgoing ? "You" : m.fromName,
    role: m.outgoing ? "Property Manager" : (roleOf.get(m.fromEmail) ?? "Unassigned"),
    title: m.subject,
    body: m.body,
    counterpart: other ? { name: m.outgoing ? other : m.fromName, email: other } : undefined,
  };
}

function Detail() {
  const { id } = Route.useParams();
  const { requests, updateRequest, notify } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [person, setPerson] = useState<{ role: Role; name: string; email: string }>({
    role: "Tenant",
    name: "",
    email: "",
  });

  const r = requests.find((x) => x.id === id);
  const incident = useQuery({
    queryKey: ["incident", id],
    queryFn: () => getIncident({ data: { id } }),
    staleTime: 0,
  });
  const d = incident.data;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["incident", id] });
  const refreshSoon = () => window.setTimeout(() => void refresh(), 800);

  const analyze = async () => {
    setAnalyzing(true);
    setAiError("");
    try {
      const result = await analyzeIncident({ data: { id } });
      if (!result.ok) {
        setAiError(
          result.code === "NOT_CONFIGURED"
            ? "DeepSeek is not configured for this environment."
            : "The AI could not analyse this request right now.",
        );
      }
      await refresh();
    } catch {
      setAiError("The AI could not analyse this request right now.");
    } finally {
      setAnalyzing(false);
    }
  };

  const attempted = useRef("");
  useEffect(() => {
    if (!d || !r || d.emails.length === 0) return;
    const newest = Math.max(...d.emails.map((e) => e.receivedAt), ...d.events.map((e) => e.at));
    const key = `${id}:${newest}`;
    if ((!d.ai || newest > d.ai.updatedAt) && attempted.current !== key) {
      attempted.current = key;
      void analyze();
    }
  }, [d]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="font-mono text-sm text-muted-foreground">{id}</div>
          <h1 className="text-xl font-semibold">Request not found</h1>
          <p className="text-sm text-muted-foreground">
            This repair request doesn't exist or may have been removed.
          </p>
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            Back to board
          </Link>
        </div>
      </AppShell>
    );
  }

  const quoteMatch = r.nextAction.match(/\$([\d,]+)/);
  const quoteAmount = quoteMatch ? quoteMatch[0] : null;
  const tradeName = d?.participants.find((p) => p.role === "Repair Team")?.name ?? "Trade partner";
  const stepIndex = columns.findIndex((c) => c.name === r.column);

  const participants = d?.participants ?? [];
  const roleOf = new Map(participants.map((p) => [p.email.toLowerCase(), p.role as string]));
  const entries: Entry[] = [
    ...(d?.events ?? []).map<Entry>((e) => ({
      key: `ev-${e.id}`,
      at: e.at,
      kind: e.kind,
      who: e.actor,
      role: "Property Manager",
      title: e.text,
    })),
    ...(d?.emails ?? []).map((m) => emailEntry(m, roleOf)),
  ].sort((a, b) => a.at - b.at);

  const countFor = (email: string) =>
    (d?.emails ?? []).filter((m) => m.fromEmail === email || m.toEmails.split(",").includes(email))
      .length;

  const changeColumn = (column: Column, extra: Partial<typeof r> = {}) => {
    updateRequest(r.id, {
      column,
      status: columnStatus[column],
      lastUpdate: "Just now",
      ...extra,
    });
    refreshSoon();
  };

  const submitPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addParticipant({ data: { requestId: r.id, ...person } });
      setPerson({ role: person.role, name: "", email: "" });
      setAdding(false);
      await refresh();
      notify("Person added and matching emails linked");
    } catch {
      notify("Could not add this person. Check the email address.");
    }
  };

  const addSender = async (role: Role, name: string, email: string) => {
    try {
      await addParticipant({ data: { requestId: r.id, role, name, email } });
      await refresh();
      notify(`${name} added as ${role}`);
    } catch {
      notify("Could not add this person.");
    }
  };

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
          <span className={`rounded border px-2 py-0.5 text-xs ${priorityTone[r.priority]}`}>
            {r.priority} priority
          </span>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-card">
          <ol className="flex items-start" aria-label="Request progress">
            {columns.map((c, i) => {
              const done = i < stepIndex;
              const current = i === stepIndex;
              return (
                <li key={c.name} className="relative flex flex-1 flex-col items-center text-center">
                  {i > 0 ? (
                    <span
                      className={`absolute left-[-50%] top-3 h-0.5 w-full ${i <= stepIndex ? "bg-primary" : "bg-border"}`}
                    />
                  ) : null}
                  <button
                    onClick={() => {
                      if (!current) {
                        changeColumn(c.name);
                        notify(`${r.id} moved to ${c.name}`);
                      }
                    }}
                    aria-current={current ? "step" : undefined}
                    title={`Move to ${c.name}`}
                    className={`relative z-10 grid h-6 w-6 place-items-center rounded-full border-2 text-[10px] font-semibold ${
                      current
                        ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </button>
                  <span
                    className={`mt-1.5 text-[11px] ${current ? "font-semibold text-primary" : "text-muted-foreground"}`}
                  >
                    {c.name}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t pt-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-waiting">
              <Hourglass className="h-3.5 w-3.5" />
              {r.status}
            </span>
            <span className="text-muted-foreground">
              Waiting on <span className="font-medium text-foreground">{r.waitingOn}</span>
            </span>
            <span className="text-muted-foreground">Updated {r.lastUpdate}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border-2 border-ai/30 bg-ai-soft p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ai">
                  <Sparkles className="h-4 w-4" />
                  AI suggested next step
                </div>
                <button
                  onClick={() => void analyze()}
                  disabled={analyzing}
                  className="flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs hover:bg-muted disabled:opacity-60"
                >
                  <RefreshCw className={`h-3 w-3 ${analyzing ? "animate-spin" : ""}`} />
                  {analyzing ? "Analysing…" : d?.ai ? "Regenerate" : "Generate"}
                </button>
              </div>
              {d?.ai ? (
                <>
                  <p className="mt-3 text-sm text-muted-foreground">{d.ai.summary}</p>
                  <div className="mt-3 text-lg font-semibold">{d.ai.nextStep}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Waiting on {d.ai.waitingOn} · suggested column: {d.ai.column}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        const column = (columns.find((c) => c.name === d.ai?.column)?.name ??
                          r.column) as Column;
                        changeColumn(column, {
                          nextAction: d.ai?.nextStep ?? r.nextAction,
                          waitingOn: d.ai?.waitingOn ?? r.waitingOn,
                        });
                        notify("AI suggestion applied to the request");
                      }}
                      className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                      <Check className="h-4 w-4" />
                      Apply to request
                    </button>
                    <span className="text-xs text-muted-foreground">
                      Generated {formatWhen(d.ai.updatedAt)}. Nothing changes until you apply it.
                    </span>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {analyzing
                    ? "Reading the emails and activity for this request…"
                    : d && d.emails.length === 0
                      ? "No emails are linked yet. Add the tenant, landlord and repair team below so their emails appear here, then the AI will suggest what to do next."
                      : "Generate a summary and a recommended next step."}
                </p>
              )}
              {aiError ? <p className="mt-2 text-xs text-destructive">{aiError}</p> : null}
            </div>

            <div className="rounded-lg border-2 border-primary/30 bg-primary-soft p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                Current next action
              </div>
              <div className="mt-1 text-lg font-semibold">{r.nextAction}</div>
              <div className="text-sm text-muted-foreground">Waiting on {r.waitingOn}</div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => notify(`Reminder queued to ${r.waitingOn}`)}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Bell className="h-4 w-4" />
                  Send Reminder
                </button>
                {quoteAmount ? (
                  <button
                    onClick={() => setQuoteOpen(true)}
                    className="flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    View Quote
                  </button>
                ) : null}
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
              {incident.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading activity…</p>
              ) : (
                <ol className="relative space-y-5 border-l pl-6">
                  {entries.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      No activity yet.{" "}
                      {d?.gmailConnected
                        ? "Add the people involved and their emails will appear here."
                        : "Connect Gmail in the Unified Inbox and add the people involved to see their emails here."}
                    </li>
                  ) : null}
                  {entries.map((t) => {
                    const isMail = t.kind === "email-in" || t.kind === "email-out";
                    const open = expanded === t.key;
                    return (
                      <li key={t.key} className="relative">
                        <span
                          className={`absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full border bg-card ${
                            t.kind === "status" ? "border-primary" : ""
                          }`}
                        >
                          {t.kind === "email-out" ? (
                            <Send className="h-3 w-3 text-primary" />
                          ) : isMail ? (
                            <Mail className="h-3 w-3 text-primary" />
                          ) : t.kind === "note" ? (
                            <StickyNote className="h-3 w-3 text-done" />
                          ) : (
                            <Flag className="h-3 w-3 text-primary" />
                          )}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatWhen(t.at)}</span>
                          <span>·</span>
                          <span>{t.who}</span>
                          {isMail || t.kind === "note" ? (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${roleTone[t.role] ?? "bg-muted text-muted-foreground"}`}
                            >
                              {t.kind === "note" ? "Internal note" : t.role}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm font-medium">
                          {isMail ? (t.kind === "email-out" ? "Sent: " : "") : ""}
                          {t.title}
                        </div>
                        {isMail ? (
                          <>
                            <button
                              onClick={() => setExpanded(open ? null : t.key)}
                              className="mt-1 text-xs text-primary hover:underline"
                            >
                              {open ? "Hide email" : "Read email"}
                            </button>
                            {open ? (
                              <p className="mt-2 whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">
                                {t.body}
                              </p>
                            ) : null}
                            {t.role === "Unassigned" && t.counterpart ? (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                Add {t.counterpart.email} as
                                {participantRoles.map((role) => (
                                  <button
                                    key={role}
                                    onClick={() =>
                                      void addSender(
                                        role,
                                        t.counterpart?.name ?? "",
                                        t.counterpart?.email ?? "",
                                      )
                                    }
                                    className="rounded border px-1.5 py-0.5 hover:bg-muted"
                                  >
                                    {role}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </>
                        ) : null}
                      </li>
                    );
                  })}
                  <li className="relative">
                    <span className="absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full bg-waiting">
                      <Hourglass className="h-3 w-3 text-primary-foreground" />
                    </span>
                    <div className="text-xs text-muted-foreground">Current state</div>
                    <div className="text-sm font-semibold text-waiting">{r.status}</div>
                  </li>
                </ol>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">People involved</h2>
                <button
                  onClick={() => setAdding((v) => !v)}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
              {adding ? (
                <form
                  onSubmit={(e) => void submitPerson(e)}
                  className="space-y-2 rounded-lg border bg-card p-3 shadow-card"
                >
                  <select
                    value={person.role}
                    onChange={(e) => setPerson({ ...person, role: e.target.value as Role })}
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    aria-label="Role"
                  >
                    {participantRoles.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                  <input
                    required
                    value={person.name}
                    onChange={(e) => setPerson({ ...person, name: e.target.value })}
                    placeholder="Name"
                    aria-label="Name"
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring"
                  />
                  <input
                    required
                    type="email"
                    value={person.email}
                    onChange={(e) => setPerson({ ...person, email: e.target.value })}
                    placeholder="email@example.com"
                    aria-label="Email"
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring"
                  />
                  <button className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground">
                    Add person
                  </button>
                </form>
              ) : null}
              {participantRoles.map((role) => {
                const people = participants.filter((p) => p.role === role);
                return (
                  <div key={role} className="rounded-lg border bg-card p-4 shadow-card">
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${roleTone[role]}`}
                      >
                        {role}
                      </span>
                      {r.waitingOn.toLowerCase().includes(role.toLowerCase()) ? (
                        <span className="rounded bg-waiting-soft px-1.5 text-[10px] font-medium text-waiting">
                          Waiting on
                        </span>
                      ) : null}
                    </div>
                    {people.length === 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">Nobody added yet.</p>
                    ) : null}
                    {people.map((p) => (
                      <div key={p.email} className="mt-2 flex items-center gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                          {initials(p.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{p.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {p.email} · {countFor(p.email)} emails
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            void removeParticipant({
                              data: { requestId: r.id, email: p.email },
                            }).then(refresh)
                          }
                          className="rounded p-1 text-muted-foreground hover:bg-muted"
                          aria-label={`Remove ${p.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
              <div className="rounded-lg border bg-card p-4 shadow-card">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${roleTone["Property Manager"]}`}
                >
                  Property Manager
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-semibold">
                    {initials(user?.name ?? "?")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{user?.name ?? "You"}</div>
                    <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
                  </div>
                </div>
              </div>
            </div>

            {d?.gmailConnected && d.unlinkedEmails.length > 0 ? (
              <div className="space-y-2">
                <h2 className="flex items-center gap-1.5 font-semibold">
                  <Link2 className="h-4 w-4" />
                  Link an existing email
                </h2>
                {d.unlinkedEmails.map((m) => (
                  <div key={m.id} className="rounded-lg border bg-card p-3 text-sm shadow-card">
                    <div className="truncate font-medium">{m.subject}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {m.outgoing ? `To ${m.toEmails}` : `From ${m.fromName}`} ·{" "}
                      {formatWhen(m.receivedAt)}
                    </div>
                    <button
                      onClick={() =>
                        void linkEmail({ data: { emailId: m.id, requestId: r.id } })
                          .then(refresh)
                          .then(() => notify("Email linked to this request"))
                      }
                      className="mt-2 rounded border px-2 py-1 text-xs hover:bg-muted"
                    >
                      Link to {r.id}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
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
                <div className="font-mono text-xs text-muted-foreground">QUOTE</div>
                <h2 className="text-xl font-semibold">{tradeName}</h2>
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
                <span>{r.title}</span>
                <span className="font-medium">{quoteAmount}</span>
              </div>
              <div className="flex justify-between pt-3 text-sm">
                <span>GST (inc.)</span>
                <span>Included</span>
              </div>
              <div className="mt-3 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{quoteAmount}</span>
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
                  changeColumn("Scheduled", { status: "Ready to schedule" });
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
              void addNote({ data: { requestId: r.id, text: note.trim() } })
                .then(refresh)
                .then(() => notify("Timeline note added"));
              setNote("");
              setNoteOpen(false);
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
