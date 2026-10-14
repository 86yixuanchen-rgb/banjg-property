import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const repairRequests = sqliteTable(
  "repair_requests",
  {
    userId: text("user_id").notNull(),
    id: text("id").notNull(),
    title: text("title").notNull(),
    address: text("address").notNull(),
    priority: text("priority", { enum: ["Urgent", "High", "Medium", "Low"] }).notNull(),
    boardColumn: text("board_column", {
      enum: ["New", "Waiting", "Action Needed", "Scheduled", "Completed"],
    }).notNull(),
    status: text("status").notNull(),
    waitingOn: text("waiting_on").notNull(),
    nextAction: text("next_action").notNull(),
    waiting: text("waiting").notNull(),
    lastUpdate: text("last_update").notNull(),
    sortOrder: integer("sort_order").notNull(),
    aiSummary: text("ai_summary"),
    aiNextStep: text("ai_next_step"),
    aiColumn: text("ai_column"),
    aiWaitingOn: text("ai_waiting_on"),
    aiUpdatedAt: integer("ai_updated_at"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

export const participantRoles = ["Tenant", "Landlord", "Repair Team"] as const;

export const requestParticipants = sqliteTable(
  "request_participants",
  {
    userId: text("user_id").notNull(),
    requestId: text("request_id").notNull(),
    role: text("role", { enum: participantRoles }).notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.requestId, t.email] })],
);

export const requestEvents = sqliteTable("request_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  requestId: text("request_id").notNull(),
  at: integer("at").notNull(),
  kind: text("kind", { enum: ["created", "status", "note"] }).notNull(),
  text: text("text").notNull(),
  actor: text("actor").notNull(),
});

export const gmailAccounts = sqliteTable("gmail_accounts", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  refreshToken: text("refresh_token").notNull(),
  lastSyncAt: integer("last_sync_at"),
});

export const emailMessages = sqliteTable(
  "email_messages",
  {
    userId: text("user_id").notNull(),
    id: text("id").notNull(),
    threadId: text("thread_id").notNull(),
    fromName: text("from_name").notNull(),
    fromEmail: text("from_email").notNull(),
    subject: text("subject").notNull(),
    snippet: text("snippet").notNull(),
    body: text("body").notNull(),
    toEmails: text("to_emails").notNull().default(""),
    receivedAt: integer("received_at").notNull(),
    unread: integer("unread", { mode: "boolean" }).notNull(),
    requestId: text("request_id"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);
