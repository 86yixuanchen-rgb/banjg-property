import { eq } from "drizzle-orm";
import { emailMessages, gmailAccounts } from "@/db/schema";
import { getDb } from "./db.server";

export const GMAIL_SCOPES = "openid email https://www.googleapis.com/auth/gmail.readonly";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function googleConfig(origin: string) {
  return {
    clientId: env("GOOGLE_CLIENT_ID"),
    clientSecret: env("GOOGLE_CLIENT_SECRET"),
    redirectUri: `${origin}/api/gmail/callback`,
  };
}

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function cryptoKey() {
  return crypto.subtle.importKey("raw", unb64(env("TOKEN_ENCRYPTION_KEY")), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

async function encrypt(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await cryptoKey(),
    new TextEncoder().encode(plain),
  );
  return `${b64(iv)}.${b64(new Uint8Array(ct))}`;
}

async function decrypt(value: string) {
  const [iv, ct] = value.split(".");
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(iv ?? "") },
    await cryptoKey(),
    unb64(ct ?? ""),
  );
  return new TextDecoder().decode(plain);
}

export async function connectAccount(userId: string, code: string, origin: string) {
  const cfg = googleConfig(origin);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed (${res.status})`);
  const tokens = (await res.json()) as { access_token: string; refresh_token?: string };
  if (!tokens.refresh_token) throw new Error("Google did not return a refresh token");

  const info = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!info.ok) throw new Error(`Google userinfo failed (${info.status})`);
  const { email } = (await info.json()) as { email: string };

  const db = await getDb();
  const refreshToken = await encrypt(tokens.refresh_token);
  await db
    .insert(gmailAccounts)
    .values({ userId, email, refreshToken })
    .onConflictDoUpdate({ target: gmailAccounts.userId, set: { email, refreshToken } });
}

export class ReconnectRequired extends Error {}

async function accessToken(userId: string, origin: string) {
  const db = await getDb();
  const [account] = await db.select().from(gmailAccounts).where(eq(gmailAccounts.userId, userId));
  if (!account) throw new ReconnectRequired("Gmail is not connected");
  const cfg = googleConfig(origin);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: await decrypt(account.refreshToken),
      grant_type: "refresh_token",
    }),
  });
  if (res.status === 400 || res.status === 401) {
    throw new ReconnectRequired("Google authorization expired");
  }
  if (!res.ok) throw new Error(`Google token refresh failed (${res.status})`);
  return ((await res.json()) as { access_token: string }).access_token;
}

type Part = {
  mimeType?: string;
  body?: { data?: string };
  parts?: Part[];
  headers?: { name: string; value: string }[];
};
type GmailMessage = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: Part;
};

function decodeBase64Url(data: string) {
  const bytes = unb64(data.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(bytes);
}

function findPart(part: Part | undefined, mime: string): string | null {
  if (!part) return null;
  if (part.mimeType === mime && part.body?.data) return decodeBase64Url(part.body.data);
  for (const child of part.parts ?? []) {
    const found = findPart(child, mime);
    if (found) return found;
  }
  return null;
}

function decodeEntities(s: string) {
  return s
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
      .replace(/<br\s*\/?>|<\/(p|div|tr|li)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n"),
  ).trim();
}

function parseMessage(userId: string, m: GmailMessage) {
  const header = (name: string) =>
    m.payload?.headers?.find((h) => h.name.toLowerCase() === name)?.value ?? "";
  const from = header("from");
  const match = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  const fromEmail = (match?.[2] ?? from).trim();
  const fromName = (match?.[1] ?? "").trim() || fromEmail;
  const text = findPart(m.payload, "text/plain");
  const html = findPart(m.payload, "text/html");
  const body = (text ?? (html ? htmlToText(html) : decodeEntities(m.snippet ?? ""))).slice(
    0,
    20000,
  );
  return {
    userId,
    id: m.id,
    threadId: m.threadId,
    fromName,
    fromEmail,
    subject: header("subject") || "(no subject)",
    snippet: decodeEntities(m.snippet ?? "").slice(0, 300),
    body,
    receivedAt: Number(m.internalDate ?? Date.now()),
    unread: m.labelIds?.includes("UNREAD") ?? false,
  };
}

export async function syncInbox(userId: string, origin: string) {
  const token = await accessToken(userId, origin);
  const headers = { Authorization: `Bearer ${token}` };
  const list = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=" +
      encodeURIComponent("in:inbox newer_than:30d"),
    { headers },
  );
  if (!list.ok) throw new Error(`Gmail list failed (${list.status})`);
  const ids = ((await list.json()) as { messages?: { id: string }[] }).messages ?? [];

  const messages = await Promise.all(
    ids.map(async ({ id }) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers },
      );
      return res.ok ? ((await res.json()) as GmailMessage) : null;
    }),
  );

  const db = await getDb();
  for (const m of messages) {
    if (!m) continue;
    const row = parseMessage(userId, m);
    await db
      .insert(emailMessages)
      .values(row)
      .onConflictDoUpdate({
        target: [emailMessages.userId, emailMessages.id],
        set: { unread: row.unread },
      });
  }
  await db
    .update(gmailAccounts)
    .set({ lastSyncAt: Date.now() })
    .where(eq(gmailAccounts.userId, userId));
  return messages.filter(Boolean).length;
}

export async function disconnectAccount(userId: string) {
  const db = await getDb();
  await db.delete(emailMessages).where(eq(emailMessages.userId, userId));
  await db.delete(gmailAccounts).where(eq(gmailAccounts.userId, userId));
}
