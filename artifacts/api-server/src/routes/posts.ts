import { Router, type IRouter } from "express";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import {
  db,
  postsTable,
  likesTable,
  followsTable,
  notificationsTable,
} from "@workspace/db";
import { CreatePostBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { serializePosts } from "../lib/serializers";

const router: IRouter = Router();

function parseId(raw: string | string[] | undefined): number | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(v);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

router.get("/feed", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).authedUser;
  const followingRows = await db
    .select({ id: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, me.id));
  const ids = [me.id, ...followingRows.map((r) => r.id)];
  const posts = await db
    .select()
    .from(postsTable)
    .where(inArray(postsTable.authorId, ids))
    .orderBy(desc(postsTable.createdAt))
    .limit(80);
  res.json(await serializePosts(posts, me.id));
});

router.get("/feed/explore", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).authedUser;
  const posts = await db
    .select()
    .from(postsTable)
    .orderBy(desc(postsTable.createdAt))
    .limit(80);
  res.json(await serializePosts(posts, me.id));
});

router.get("/feed/trending", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).authedUser;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const trending = await db
    .select({
      postId: likesTable.postId,
      cnt: sql<number>`count(*)::int`,
    })
    .from(likesTable)
    .where(gte(likesTable.createdAt, weekAgo))
    .groupBy(likesTable.postId)
    .orderBy(sql`count(*) desc`)
    .limit(10);
  if (trending.length === 0) {
    res.json([]);
    return;
  }
  const posts = await db
    .select()
    .from(postsTable)
    .where(
      inArray(
        postsTable.id,
        trending.map((t) => t.postId),
      ),
    );
  const order = new Map(trending.map((t, i) => [t.postId, i] as const));
  posts.sort(
    (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
  );
  res.json(await serializePosts(posts, me.id));
});

router.post("/posts", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).authedUser;
  const parsed = CreatePostBody.safeParse(req.body);
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
    .insert(postsTable)
    .values({
      authorId: me.id,
      content,
      imageUrl: parsed.data.imageUrl ?? null,
    })
    .returning();
  const [serialized] = await serializePosts([post], me.id);
  res.status(201).json(serialized);
});

router.get("/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).authedUser;
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
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
  const [serialized] = await serializePosts([post], me.id);
  res.json(serialized);
});

router.delete("/posts/:id", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).authedUser;
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
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
  if (post.authorId !== me.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(postsTable).where(eq(postsTable.id, id));
  res.sendStatus(204);
});

router.post(
  "/posts/:id/like",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = (req as AuthedRequest).authedUser;
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid id" });
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
    await db
      .insert(likesTable)
      .values({ postId: id, userId: me.id })
      .onConflictDoNothing();
    if (post.authorId !== me.id) {
      await db.insert(notificationsTable).values({
        userId: post.authorId,
        actorId: me.id,
        type: "like",
        postId: id,
      });
    }
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likesTable)
      .where(eq(likesTable.postId, id));
    res.json({ liked: true, likeCount: Number(count) });
  },
);

router.delete(
  "/posts/:id/like",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = (req as AuthedRequest).authedUser;
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db
      .delete(likesTable)
      .where(and(eq(likesTable.postId, id), eq(likesTable.userId, me.id)));
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likesTable)
      .where(eq(likesTable.postId, id));
    res.json({ liked: false, likeCount: Number(count) });
  },
);

export default router;
