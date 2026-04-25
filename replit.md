# Connectly

A warm, modern social network ("share moments with people you actually know"). Original branding to avoid IP/legal issues.

## Stack

- pnpm monorepo
- Frontend: `artifacts/social` — React + Vite + Wouter + TanStack Query + Tailwind v4
- API: `artifacts/api-server` — Express 5 + Drizzle + Postgres + Clerk
- Auth: Clerk (`@clerk/react` web, `@clerk/express` server) with `/__clerk` proxy
- Schema/types: OpenAPI in `lib/api-spec/openapi.yaml` → `lib/api-zod` (server validators) and `lib/api-client-react` (React Query hooks)
- DB schema: `lib/db/src/schema/` (users, posts, comments, likes, follows, notifications)

## Features

Auth (Clerk), profiles, feed, posts (text + image URL), likes, comments, follows, notifications, explore, trending, search, suggested users, settings.

## Routes

Frontend: `/` landing or redirect, `/sign-in`, `/sign-up`, `/feed`, `/explore`, `/search`, `/notifications`, `/u/:username`, `/post/:id`, `/settings`.

API (under `/api`): `/me`, `/users`, `/users/:username[/posts|/follow|/followers|/following]`, `/suggestions`, `/feed`, `/feed/explore`, `/feed/trending`, `/posts`, `/posts/:id[/like|/comments]`, `/comments/:id`, `/notifications`, `/health`.

## Conventions

- `lib/api-zod/src/index.ts` exports only `./generated/api` (zod schemas). Re-exporting `./generated/types` causes duplicate-export TS errors.
- `vite.config.ts` uses `tailwindcss({ optimize: false })` so Clerk's `@layer clerk` is preserved in prod.
- `index.css` declares `@layer theme, base, clerk, components, utilities;` BEFORE `@import "tailwindcss"` and imports `@clerk/themes/shadcn.css`.
- API users row is auto-created on first authenticated request via `getOrCreateUserForClerk` in `artifacts/api-server/src/lib/auth.ts`.
- Brand colors: coral `#ff6b5b`, rose `#f0345e`, cream `#fff8f3`, ink `#2a1717`. Font: Plus Jakarta Sans.

## Seed data

3 demo users (maya, jules, rio) with posts, likes, comments, mutual follows. Re-seed by running the SQL block in `artifacts/api-server/src/scripts/seed.ts` — script is idempotent (skips if any users exist).
