import {
  db,
  usersTable,
  postsTable,
  followsTable,
  likesTable,
  commentsTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

const seedUsers = [
  {
    clerkId: "seed_maya",
    username: "maya",
    displayName: "Maya Lin",
    bio: "Sunday baker. Trail walker. Big fan of small moments.",
    avatarUrl: "https://i.pravatar.cc/200?img=47",
  },
  {
    clerkId: "seed_jules",
    username: "jules",
    displayName: "Jules Okafor",
    bio: "Designer + amateur potter. Coffee snob.",
    avatarUrl: "https://i.pravatar.cc/200?img=12",
  },
  {
    clerkId: "seed_rio",
    username: "rio",
    displayName: "Rio Castellanos",
    bio: "Cyclist. Plant dad. Will recommend you a book.",
    avatarUrl: "https://i.pravatar.cc/200?img=33",
  },
];

const seedPosts = [
  {
    user: "maya",
    content:
      "Tried a new sourdough recipe with rye and honey. Best loaf yet — the crumb is unreasonably soft.",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=80",
  },
  {
    user: "jules",
    content:
      "Three coffee shops, one Saturday. The middle one had the best pour-over but the worst music.",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80",
  },
  {
    user: "rio",
    content:
      "Sunset ride along the river. Met a dog named Moose. He stopped to greet every other dog. Worth every minute.",
    imageUrl:
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=900&q=80",
  },
  {
    user: "maya",
    content:
      "Sunday plan: long walk, longer nap, very long phone call with mom.",
    imageUrl: null,
  },
  {
    user: "jules",
    content:
      "Finished a new mug today. Slightly wonky handle. I'm calling it 'character'.",
    imageUrl:
      "https://images.unsplash.com/photo-1514982400370-06d4cc3a8be9?w=900&q=80",
  },
];

async function main() {
  const existing = await db.select().from(usersTable).limit(1);
  if (existing.length > 0) {
    console.log("Seed data already present, skipping.");
    return;
  }
  console.log("Seeding users...");
  const users = await db.insert(usersTable).values(seedUsers).returning();
  const byUsername = new Map(users.map((u) => [u.username, u] as const));

  console.log("Seeding posts...");
  const posts = await db
    .insert(postsTable)
    .values(
      seedPosts.map((p) => ({
        authorId: byUsername.get(p.user)!.id,
        content: p.content,
        imageUrl: p.imageUrl,
      })),
    )
    .returning();

  console.log("Seeding likes...");
  const allUserIds = users.map((u) => u.id);
  for (const post of posts) {
    for (const uid of allUserIds) {
      if (uid === post.authorId) continue;
      if (Math.random() > 0.3) {
        await db
          .insert(likesTable)
          .values({ postId: post.id, userId: uid })
          .onConflictDoNothing();
      }
    }
  }

  console.log("Seeding follows...");
  for (const a of users) {
    for (const b of users) {
      if (a.id === b.id) continue;
      await db
        .insert(followsTable)
        .values({ followerId: a.id, followingId: b.id })
        .onConflictDoNothing();
    }
  }

  console.log("Seeding comments...");
  await db.insert(commentsTable).values([
    {
      postId: posts[0].id,
      authorId: byUsername.get("jules")!.id,
      content: "Recipe please!",
    },
    {
      postId: posts[2].id,
      authorId: byUsername.get("maya")!.id,
      content: "Moose deserves a cameo.",
    },
  ]);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable);
  console.log(`Done. Users in DB: ${Number(count)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
