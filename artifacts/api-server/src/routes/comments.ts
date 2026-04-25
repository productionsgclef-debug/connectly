import { Router, type IRouter } from "express";
import { asc, eq, inArray } from "drizzle-orm";
import {
  db,
  commentsTable,
  postsTable,
  usersTable,
  notificationsTable,
} from "@workspace/db";
import { CreateCommentBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { serializeComment } from "../lib/serializers";

const router: IRouter = Router();

function parseId(raw: string | string[] | undefined): number | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(v);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

router.get(
  "/posts/:id/comments",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const rows = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.postId, id))
      .orderBy(asc(commentsTable.createdAt));
    const authorIds = Array.from(new Set(rows.map((r) => r.authorId)));
    const authors = authorIds.length
      ? await db
          .select()
          .from(usersTable)
          .where(inArray(usersTable.id, authorIds))
      : [];
    const byId = new Map(authors.map((a) => [a.id, a] as const));
    res.json(
      rows
        .filter((r) => byId.has(r.authorId))
        .map((r) => serializeComment(r, byId.get(r.authorId)!)),
    );
  },
);

router.post(
  "/posts/:id/comments",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = (req as AuthedRequest).authedUser;
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = CreateCommentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const content = parsed.data.content.trim();
    if (!content) {
      res.status(400).json({ error: "Content is required" });
      return;
    }
    const [post] = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, id));
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    const [comment] = await db
      .insert(commentsTable)
      .values({ postId: id, authorId: me.id, content })
      .returning();
    if (post.authorId !== me.id) {
      await db.insert(notificationsTable).values({
        userId: post.authorId,
        actorId: me.id,
        type: "comment",
        postId: id,
      });
    }
    res.status(201).json(serializeComment(comment, me));
  },
);

router.delete(
  "/comments/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = (req as AuthedRequest).authedUser;
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [c] = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, id));
    if (!c) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (c.authorId !== me.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db.delete(commentsTable).where(eq(commentsTable.id, id));
    res.sendStatus(204);
  },
);

export default router;
