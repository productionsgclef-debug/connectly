import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    clerkIdx: uniqueIndex("users_clerk_id_idx").on(t.clerkId),
    usernameIdx: uniqueIndex("users_username_idx").on(t.username),
  }),
);

export type UserRow = typeof usersTable.$inferSelect;
