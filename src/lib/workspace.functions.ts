import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { and, asc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  appointments,
  emailMessages,
  gmailAccounts,
  properties,
  repairRequests,
  requestEvents,
  requestParticipants,
  requestQuotes,
} from "@/db/schema";
import { requests as sampleRequests } from "@/lib/data";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

async function database() {
  const { getDb } = await import("./db.server");
  return getDb();
}

const requestId = z.string().regex(/^REQ-\d+$/);

// ---------- properties
export const listProperties = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const db = await database();
  return db
    .select()
    .from(properties)
    .where(eq(properties.userId, userId))
    .orderBy(asc(properties.address));
});

export const addProperty = createServerFn({ method: "POST" })
  .validator(
    z.object({
      address: z.string().trim().min(1).max(300),
      ownerName: z.string().trim().max(100),
      ownerEmail: z.string().trim().toLowerCase().max(200),
      notes: z.string().trim().max(1000),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = await database();
    await db.insert(properties).values({ userId, ...data });
    return { ok: true as const };
  });

export const deleteProperty = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = await database();
    await db
      .delete(properties)
      .where(and(eq(properties.userId, userId), eq(properties.id, data.id)));
    return { ok: true as const };
  });

// ---------- appointments
export const listAppointments = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const db = await database();
  return db
    .select()
    .from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(asc(appointments.startsAt));
});

export const addAppointment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().trim().min(1).max(200),
      startsAt: z.number().int(),
      location: z.string().trim().max(300),
      requestId: requestId.nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = await database();
    await db.insert(appointments).values({ userId, ...data });
    if (data.requestId) {
      await db.insert(requestEvents).values({
        userId,
        requestId: data.requestId,
        at: Date.now(),
        kind: "appointment",
        text: `Appointment booked: ${data.title} on ${new Date(data.startsAt).toLocaleString("en-AU")}`,
        actor: "Property Manager",
      });
    }
    return { ok: true as const };
  });

export const deleteAppointment = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = await database();
    await db
      .delete(appointments)
      .where(and(eq(appointments.userId, userId), eq(appointments.id, data.id)));
    return { ok: true as const };
  });

// ---------- quotes
export const addQuote = createServerFn({ method: "POST" })
  .validator(
    z.object({
      requestId,
      supplier: z.string().trim().min(1).max(100),
      amount: z.number().positive().max(10_000_000),
      description: z.string().trim().max(500),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = await database();
    const amountCents = Math.round(data.amount * 100);
    await db.insert(requestQuotes).values({
      userId,
      requestId: data.requestId,
      supplier: data.supplier,
      amountCents,
      description: data.description,
      status: "Pending",
      createdAt: Date.now(),
    });
    await db.insert(requestEvents).values({
      userId,
      requestId: data.requestId,
      at: Date.now(),
      kind: "quote",
      text: `Quote received from ${data.supplier}: $${(amountCents / 100).toFixed(2)}`,
      actor: "Property Manager",
    });
    return { ok: true as const };
  });

export const decideQuote = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int(), decision: z.enum(["Approved", "Rejected"]) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = await database();
    const [quote] = await db
      .select()
      .from(requestQuotes)
      .where(and(eq(requestQuotes.userId, userId), eq(requestQuotes.id, data.id)));
    if (!quote) return { ok: false as const };
    await db
      .update(requestQuotes)
      .set({ status: data.decision })
      .where(and(eq(requestQuotes.userId, userId), eq(requestQuotes.id, data.id)));
    await db.insert(requestEvents).values({
      userId,
      requestId: quote.requestId,
      at: Date.now(),
      kind: "quote",
      text: `Quote from ${quote.supplier} ($${(quote.amountCents / 100).toFixed(2)}) ${data.decision.toLowerCase()}`,
      actor: "Property Manager",
    });
    return { ok: true as const, requestId: quote.requestId };
  });

// ---------- contacts (everyone added to any request)
export const listContacts = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const db = await database();
  const people = await db
    .select()
    .from(requestParticipants)
    .where(eq(requestParticipants.userId, userId));
  const mail = await db
    .select({ from: emailMessages.fromEmail, to: emailMessages.toEmails })
    .from(emailMessages)
    .where(eq(emailMessages.userId, userId));
  const byEmail = new Map<
    string,
    { name: string; email: string; roles: Set<string>; requests: Set<string>; emails: number }
  >();
  for (const p of people) {
    const key = p.email.toLowerCase();
    const entry = byEmail.get(key) ?? {
      name: p.name,
      email: key,
      roles: new Set<string>(),
      requests: new Set<string>(),
      emails: 0,
    };
    entry.roles.add(p.role);
    entry.requests.add(p.requestId);
    byEmail.set(key, entry);
  }
  for (const m of mail) {
    const involved = new Set([m.from, ...m.to.split(",")]);
    for (const addr of involved) {
      const entry = byEmail.get(addr.trim().toLowerCase());
      if (entry) entry.emails += 1;
    }
  }
  return [...byEmail.values()]
    .map((c) => ({
      name: c.name,
      email: c.email,
      roles: [...c.roles],
      requests: [...c.requests],
      emails: c.emails,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

// ---------- settings and analytics
export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const db = await database();
  const [account] = await db.select().from(gmailAccounts).where(eq(gmailAccounts.userId, userId));
  return {
    gmail: account ? { email: account.email, lastSyncAt: account.lastSyncAt } : null,
    googleConfigured: Boolean(
      process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"],
    ),
    aiConfigured: Boolean(process.env["DEEPSEEK_API_KEY"]),
  };
});

export const getAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const db = await database();
  const since = Date.now() - 30 * 24 * 3600 * 1000;
  const [mails] = await db
    .select({ n: sql<number>`count(*)` })
    .from(emailMessages)
    .where(and(eq(emailMessages.userId, userId), gte(emailMessages.receivedAt, since)));
  const [linked] = await db
    .select({ n: sql<number>`count(*)` })
    .from(emailMessages)
    .where(and(eq(emailMessages.userId, userId), sql`${emailMessages.requestId} is not null`));
  const quotes = await db.select().from(requestQuotes).where(eq(requestQuotes.userId, userId));
  const [people] = await db
    .select({ n: sql<number>`count(distinct ${requestParticipants.email})` })
    .from(requestParticipants)
    .where(eq(requestParticipants.userId, userId));
  const sum = (status: string) =>
    quotes.filter((q) => q.status === status).reduce((t, q) => t + q.amountCents, 0) / 100;
  return {
    emails30d: Number(mails?.n ?? 0),
    emailsLinked: Number(linked?.n ?? 0),
    contacts: Number(people?.n ?? 0),
    quotesPending: quotes.filter((q) => q.status === "Pending").length,
    quotesApprovedTotal: sum("Approved"),
  };
});

// ---------- sample data (explicit, never automatic)
export const loadSampleData = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await requireUserId();
  const db = await database();
  const existing = await db
    .select({ id: repairRequests.id })
    .from(repairRequests)
    .where(eq(repairRequests.userId, userId))
    .limit(1);
  if (existing.length > 0) return { ok: false as const };
  await db.insert(repairRequests).values(
    sampleRequests.map((r, i) => ({
      userId,
      id: r.id,
      title: r.title,
      address: r.address,
      priority: r.priority,
      boardColumn: r.column,
      status: r.status,
      waitingOn: r.waitingOn,
      nextAction: r.nextAction,
      waiting: r.waiting,
      lastUpdate: r.lastUpdate,
      sortOrder: i + 1,
      aiSummary: null,
      aiNextStep: null,
      aiColumn: null,
      aiWaitingOn: null,
      aiUpdatedAt: null,
    })),
  );
  return { ok: true as const };
});
