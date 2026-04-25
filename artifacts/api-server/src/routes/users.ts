import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, ne, notInArray, or, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  followsTable,
  postsTable,
} from "@workspace/db";
import { UpdateMeBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import {
  getCounts,
  isFollowing,
  recentPostsForUsers,
  serializePosts,
  serializeUser,
} from "../lib/serializers";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).authedUser;
  res.json(serializeUser(me));
});

router.patch("/me", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).authedUser;
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.displayName !== undefined)
    updates.displayName = parsed.data.displayName;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio ?? null;
  if (parsed.data.avatarUrl !== undefined)
    updates.avatarUrl = parsed.data.avatarUrl ?? null;
  if (parsed.data.username !== undefined) {
    const u = parsed.data.username
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20);
    if (!u) {
      res.status(400).json({ error: "Invalid username" });
      return;
    }
    if (u !== me.username) {
      const [taken] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, u));
      if (taken) {
        res.status(400).json({ error: "Username already taken" });
        return;
      }
      updates.username = u;
    }
  }
  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, me.id))
    .returning();
  res.json(serializeUser(updated));
});

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const me = (req as AuthedRequest).authedUser;
  const rows = q
    ? await db
        .select()
        .from(usersTable)
        .where(
          and(
            ne(usersTable.id, me.id),
            or(
              ilike(usersTable.username, `%${q}%`),
              ilike(usersTable.displayName, `%${q}%`),
            ),
          ),
        )
        .limit(30)
    : await db
        .select()
        .from(usersTable)
        .where(ne(usersTable.id, me.id))
        .orderBy(desc(usersTable.createdAt))
        .limit(30);
  res.json(rows.map(serializeUser));
});

router.get("/suggestions", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).authedUser;
  const followingRows = await db
    .select({ id: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, me.id));
  const excluded = [me.id, ...followingRows.map((r) => r.id)];
  const rows = await db
    .select()
    .from(usersTable)
    .where(notInArray(usersTable.id, excluded))
    .orderBy(desc(usersTable.createdAt))
    .limit(8);
  res.json(rows.map(serializeUser));
});

router.get("/users/:username", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).authedUser;
  const username = String(req.params.username);
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const counts = await getCounts(user.id);
  const following =
    user.id === me.id ? false : await isFollowing(me.id, user.id);
  res.json({
    ...serializeUser(user),
    followerCount: counts.followerCount,
    followingCount: counts.followingCount,
    postCount: counts.postCount,
    isFollowing: following,
    isMe: user.id === me.id,
  });
});

router.get(
  "/users/:username/posts",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = (req as AuthedRequest).authedUser;
    const username = String(req.params.username);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const posts = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.authorId, user.id))
      .orderBy(desc(postsTable.createdAt))
      .limit(50);
    res.json(await serializePosts(posts, me.id));
  },
);

router.post(
  "/users/:username/follow",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = (req as AuthedRequest).authedUser;
    const username = String(req.params.username);
    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (target.id === me.id) {
      res.status(400).json({ error: "Cannot follow yourself" });
      return;
    }
    await db
      .insert(followsTable)
      .values({ followerId: me.id, followingId: target.id })
      .onConflictDoNothing();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(followsTable)
      .where(eq(followsTable.followingId, target.id));
    res.json({ following: true, followerCount: Number(count) });
  },
);

router.delete(
  "/users/:username/follow",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = (req as AuthedRequest).authedUser;
    const username = String(req.params.username);
    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    await db
      .delete(followsTable)
      .where(
        and(
          eq(followsTable.followerId, me.id),
          eq(followsTable.followingId, target.id),
        ),
      );
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(followsTable)
      .where(eq(followsTable.followingId, target.id));
    res.json({ following: false, followerCount: Number(count) });
  },
);

router.get(
  "/users/:username/followers",
  requireAuth,
  async (req, res): Promise<void> => {
    const username = String(req.params.username);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const rows = await db
      .select({ user: usersTable })
      .from(followsTable)
      .innerJoin(usersTable, eq(usersTable.id, followsTable.followerId))
      .where(eq(followsTable.followingId, user.id));
    res.json(rows.map((r) => serializeUser(r.user)));
  },
);

router.get(
  "/users/:username/following",
  requireAuth,
  async (req, res): Promise<void> => {
    const username = String(req.params.username);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const rows = await db
      .select({ user: usersTable })
      .from(followsTable)
      .innerJoin(usersTable, eq(usersTable.id, followsTable.followingId))
      .where(eq(followsTable.followerId, user.id));
    res.json(rows.map((r) => serializeUser(r.user)));
  },
);

export { recentPostsForUsers };
export default router;
