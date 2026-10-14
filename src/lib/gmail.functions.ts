import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { auth } from "@clerk/tanstack-react-start/server";
import { desc, eq } from "drizzle-orm";
import { emailMessages, gmailAccounts } from "@/db/schema";

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export type InboxEmail = {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: number;
  unread: boolean;
};

export const getInbox = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const { getDb } = await import("./db.server");
  const db = await getDb();
  const [account] = await db.select().from(gmailAccounts).where(eq(gmailAccounts.userId, userId));
  if (!account) return { connected: false as const };
  const rows = await db
    .select()
    .from(emailMessages)
    .where(eq(emailMessages.userId, userId))
    .orderBy(desc(emailMessages.receivedAt));
  const emails: InboxEmail[] = rows.map((r) => ({
    id: r.id,
    fromName: r.fromName,
    fromEmail: r.fromEmail,
    subject: r.subject,
    snippet: r.snippet,
    body: r.body,
    receivedAt: r.receivedAt,
    unread: r.unread,
  }));
  return {
    connected: true as const,
    email: account.email,
    lastSyncAt: account.lastSyncAt,
    emails,
  };
});

export const syncGmail = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await requireUserId();
  const gmail = await import("./gmail.server");
  try {
    const count = await gmail.syncInbox(userId, getRequestUrl().origin);
    return { ok: true as const, count };
  } catch (error) {
    if (error instanceof gmail.ReconnectRequired) {
      return { ok: false as const, code: "RECONNECT" as const };
    }
    console.error("Gmail sync failed", error);
    return { ok: false as const, code: "ERROR" as const };
  }
});

export const disconnectGmail = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await requireUserId();
  const gmail = await import("./gmail.server");
  await gmail.disconnectAccount(userId);
  return { ok: true as const };
});
