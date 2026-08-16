import { sql } from "drizzle-orm";
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
};

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    businessName: text("business_name"),
    pageUrl: text("page_url"),
    pageTitle: text("page_title"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("conversations_session_id_unique").on(table.sessionId),
    index("conversations_created_at_idx").on(table.createdAt),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [
    index("messages_conversation_id_idx").on(table.conversationId),
    index("messages_created_at_idx").on(table.createdAt),
  ],
);

/**
 * Legacy request records are retained so a future Turso migration does not
 * delete historical data. Current appointment flows never read or write this
 * table; they use the original MySQL appointment tables instead.
 */
export const legacyBookingRequests = sqliteTable(
  "booking_requests",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    service: text("service"),
    location: text("location"),
    preferredDate: text("preferred_date"),
    preferredTime: text("preferred_time"),
    notes: text("notes"),
    status: text("status", { enum: ["new", "confirmed", "completed", "cancelled"] })
      .notNull()
      .default("new"),
    ...timestamps,
  },
  (table) => [
    index("booking_requests_conversation_id_idx").on(table.conversationId),
    index("booking_requests_email_idx").on(table.email),
    index("booking_requests_status_idx").on(table.status),
  ],
);

export const repairs = sqliteTable(
  "repairs",
  {
    id: text("id").primaryKey(),
    trackingNumber: text("tracking_number").notNull(),
    deviceName: text("device_name"),
    service: text("service"),
    location: text("location"),
    status: text("status", {
      enum: ["received", "diagnosing", "awaiting_approval", "repairing", "quality_check", "ready", "completed"],
    })
      .notNull()
      .default("received"),
    statusMessage: text("status_message"),
    receivedAt: text("received_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
    estimatedCompletion: text("estimated_completion"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("repairs_tracking_number_unique").on(table.trackingNumber),
    index("repairs_status_idx").on(table.status),
    index("repairs_updated_at_idx").on(table.updatedAt),
  ],
);

export const repairUpdates = sqliteTable(
  "repair_updates",
  {
    id: text("id").primaryKey(),
    repairId: text("repair_id")
      .notNull()
      .references(() => repairs.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    title: text("title").notNull(),
    message: text("message"),
    createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [
    index("repair_updates_repair_id_idx").on(table.repairId),
    index("repair_updates_created_at_idx").on(table.createdAt),
  ],
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Repair = typeof repairs.$inferSelect;
export type NewRepair = typeof repairs.$inferInsert;
export type RepairUpdate = typeof repairUpdates.$inferSelect;
export type NewRepairUpdate = typeof repairUpdates.$inferInsert;
