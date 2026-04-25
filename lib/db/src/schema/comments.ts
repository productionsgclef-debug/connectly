import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { postsTable } from "./posts";

export const commentsTable = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    postIdx: index("comments_post_idx").on(t.postId),
  }),
);

export type CommentRow = typeof commentsTable.$inferSelect;
