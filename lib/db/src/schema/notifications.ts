import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const notificationsTable = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    actorId: integer("actor_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    postId: integer("post_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
  }),
);

export type NotificationRow = typeof notificationsTable.$inferSelect;
