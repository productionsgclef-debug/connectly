import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  postsTable,
  likesTable,
  commentsTable,
  followsTable,
  type UserRow,
  type PostRow,
  type CommentRow,
} from "@workspace/db";

export function serializeUser(u: UserRow) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio ?? null,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

export function serializeComment(c: CommentRow, author: UserRow) {
  return {
    id: c.id,
    postId: c.postId,
    author: serializeUser(author),
    content: c.content,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function serializePosts(
  posts: PostRow[],
  viewerId: number | null,
) {
  if (posts.length === 0) return [];
  const authorIds = Array.from(new Set(posts.map((p) => p.authorId)));
  const postIds = posts.map((p) => p.id);

  const authors = await db
    .select()
    .from(usersTable)
    .where(inArray(usersTable.id, authorIds));
  const authorById = new Map(authors.map((a) => [a.id, a] as const));

  const likeCounts = await db
    .select({
      postId: likesTable.postId,
      count: sql<number>`count(*)::int`,
    })
    .from(likesTable)
    .where(inArray(likesTable.postId, postIds))
    .groupBy(likesTable.postId);
  const likeCountById = new Map(
    likeCounts.map((r) => [r.postId, Number(r.count)] as const),
  );

  const commentCounts = await db
    .select({
      postId: commentsTable.postId,
      count: sql<number>`count(*)::int`,
    })
    .from(commentsTable)
    .where(inArray(commentsTable.postId, postIds))
    .groupBy(commentsTable.postId);
  const commentCountById = new Map(
    commentCounts.map((r) => [r.postId, Number(r.count)] as const),
  );

  let likedSet = new Set<number>();
  if (viewerId != null) {
    const liked = await db
      .select({ postId: likesTable.postId })
      .from(likesTable)
      .where(
        and(
          eq(likesTable.userId, viewerId),
          inArray(likesTable.postId, postIds),
        ),
      );
    likedSet = new Set(liked.map((l) => l.postId));
  }

  return posts.map((p) => {
    const author = authorById.get(p.authorId);
    return {
      id: p.id,
      author: author
        ? serializeUser(author)
        : {
            id: p.authorId,
            username: "unknown",
            displayName: "Unknown",
            bio: null,
            avatarUrl: null,
            createdAt: new Date(0).toISOString(),
          },
      content: p.content,
      imageUrl: p.imageUrl ?? null,
      createdAt: p.createdAt.toISOString(),
      likeCount: likeCountById.get(p.id) ?? 0,
      commentCount: commentCountById.get(p.id) ?? 0,
      likedByMe: likedSet.has(p.id),
    };
  });
}

export async function getCounts(userId: number) {
  const [{ count: followerCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followingId, userId));
  const [{ count: followingCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followerId, userId));
  const [{ count: postCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(eq(postsTable.authorId, userId));
  return {
    followerCount: Number(followerCount),
    followingCount: Number(followingCount),
    postCount: Number(postCount),
  };
}

export async function isFollowing(viewerId: number, targetId: number) {
  const [row] = await db
    .select()
    .from(followsTable)
    .where(
      and(
        eq(followsTable.followerId, viewerId),
        eq(followsTable.followingId, targetId),
      ),
    );
  return !!row;
}

export async function recentPostsForUsers(userIds: number[], limit = 50) {
  if (userIds.length === 0) return [];
  return db
    .select()
    .from(postsTable)
    .where(inArray(postsTable.authorId, userIds))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit);
}
