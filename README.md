# Connectly

A warm, modern social network — share moments with people you actually know.

Connectly is a friendly, small-circles alternative to mainstream social feeds: post text and photos, follow friends, like and comment, browse explore and trending, and get notified when people interact with your stuff.

## Features

- **Authentication** with Clerk (email/password + OAuth)
- **Profiles** with avatar, display name, username, bio, follower/following counts
- **Feed** of posts from people you follow, with a composer at the top
- **Explore** of recent posts across the network
- **Trending** posts from the last seven days
- **Suggested users** to follow
- **Posts** with text and an optional image URL
- **Likes** and **comments** with real-time counts
- **Follows / unfollows** with mutual relationship tracking
- **Notifications** for likes, comments, and new followers
- **Search** users by name or username
- **Settings** to edit your profile

## Tech Stack

- **Monorepo:** pnpm workspaces
- **Frontend** (`artifacts/social`): React, Vite, Wouter, TanStack Query, Tailwind CSS v4, Lucide icons
- **API** (`artifacts/api-server`): Express 5, Drizzle ORM, PostgreSQL, Clerk (`@clerk/express`)
- **Auth:** Clerk (`@clerk/react`) with proxied auth at `/__clerk`
- **Schema:** OpenAPI spec in `lib/api-spec/openapi.yaml`, codegen produces `lib/api-zod` (server validators) and `lib/api-client-react` (typed React Query hooks)
- **Database schema:** `lib/db/src/schema/` — users, posts, comments, likes, follows, notifications

## Project Structure

```
artifacts/
  social/         # React + Vite frontend
  api-server/     # Express API
lib/
  api-spec/       # OpenAPI spec
  api-zod/        # Generated zod validators (server)
  api-client-react/ # Generated TanStack Query hooks (client)
  db/             # Drizzle schema + client
```

## Routes

**Frontend:** `/` (landing or redirect to feed), `/sign-in`, `/sign-up`, `/feed`, `/explore`, `/search`, `/notifications`, `/u/:username`, `/post/:id`, `/settings`

**API** (under `/api`): `/me`, `/users`, `/users/:username`, `/users/:username/posts`, `/users/:username/follow`, `/users/:username/followers`, `/users/:username/following`, `/suggestions`, `/feed`, `/feed/explore`, `/feed/trending`, `/posts`, `/posts/:id`, `/posts/:id/like`, `/posts/:id/comments`, `/comments/:id`, `/notifications`, `/health`

## Local Development

This project is built on Replit. To run locally you'll need:

- Node.js 24
- pnpm
- PostgreSQL
- A Clerk application (publishable + secret key)

```bash
pnpm install
# Set DATABASE_URL, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY,
# VITE_CLERK_PUBLISHABLE_KEY, and SESSION_SECRET in your env.
pnpm --filter @workspace/db run push     # apply schema
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/social run dev
```

## Branding

Coral `#ff6b5b`, rose `#f0345e`, cream `#fff8f3`, ink `#2a1717`. Plus Jakarta Sans throughout. Original branding — not affiliated with any existing social network.

## License

MIT
