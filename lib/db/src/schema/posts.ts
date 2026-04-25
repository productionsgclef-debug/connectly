import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const postsTable = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    authorIdx: index("posts_author_idx").on(t.authorId),
    createdIdx: index("posts_created_idx").on(t.createdAt),
  }),
);

export type PostRow = typeof postsTable.$inferSelect;
