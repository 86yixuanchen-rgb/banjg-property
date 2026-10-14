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
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

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
    receivedAt: integer("received_at").notNull(),
    unread: integer("unread", { mode: "boolean" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);
