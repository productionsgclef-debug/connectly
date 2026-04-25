import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable, type UserRow } from "@workspace/db";

export interface AuthedRequest extends Request {
  authedUser: UserRow;
}

function makeUsernameFromEmail(email: string | undefined, fallback: string) {
  const base = (email?.split("@")[0] ?? fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
  return base || fallback;
}

async function ensureUniqueUsername(seed: string): Promise<string> {
  let candidate = seed;
  let attempt = 0;
  while (true) {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, candidate));
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${seed}${attempt}`;
    if (attempt > 50) {
      candidate = `${seed}${Math.floor(Math.random() * 100000)}`;
    }
  }
}

export async function getOrCreateUserForClerk(
  clerkUserId: string,
): Promise<UserRow> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));
  if (existing) return existing;

  let displayName = "New Member";
  let avatarUrl: string | null = null;
  let usernameSeed = `user${Math.floor(Math.random() * 100000)}`;
  try {
    const cu = await clerkClient.users.getUser(clerkUserId);
    const email = cu.emailAddresses?.[0]?.emailAddress;
    displayName =
      [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() ||
      cu.username ||
      email?.split("@")[0] ||
      "New Member";
    avatarUrl = cu.imageUrl ?? null;
    usernameSeed = makeUsernameFromEmail(
      cu.username ?? email,
      `user${clerkUserId.slice(-6)}`,
    );
  } catch {
    /* ignore */
  }
  const username = await ensureUniqueUsername(usernameSeed);

  const [created] = await db
    .insert(usersTable)
    .values({
      clerkId: clerkUserId,
      username,
      displayName,
      avatarUrl,
    })
    .returning();
  return created;
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth?.sessionClaims?.userId
    ? String(auth.sessionClaims.userId)
    : auth?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await getOrCreateUserForClerk(clerkUserId);
    (req as AuthedRequest).authedUser = user;
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to load user");
    res.status(500).json({ error: "Failed to load user" });
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const auth = getAuth(req);
  const clerkUserId = auth?.sessionClaims?.userId
    ? String(auth.sessionClaims.userId)
    : auth?.userId;
  if (clerkUserId) {
    try {
      const user = await getOrCreateUserForClerk(clerkUserId);
      (req as AuthedRequest).authedUser = user;
    } catch (err) {
      req.log.warn({ err }, "Failed to load optional user");
    }
  }
  next();
};
