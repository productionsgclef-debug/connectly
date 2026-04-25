import { Router, type IRouter } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { serializeUser } from "../lib/serializers";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).authedUser;
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, me.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  if (rows.length === 0) {
    res.json([]);
    return;
  }
  const actorIds = Array.from(new Set(rows.map((r) => r.actorId)));
  const actors = await db
    .select()
    .from(usersTable)
    .where(inArray(usersTable.id, actorIds));
  const byId = new Map(actors.map((a) => [a.id, a] as const));
  res.json(
    rows
      .filter((r) => byId.has(r.actorId))
      .map((r) => ({
        id: r.id,
        type: r.type,
        actor: serializeUser(byId.get(r.actorId)!),
        postId: r.postId ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
  );
});

export default router;
