# dd-cons-shell

Umbrella shell that hosts `dd-cons.aroma-cloud.online` — the single sign-in,
marketing, and pricing surface for both **dev-division** and
**consulting-agency**.

This repo owns:

- **Auth issuer** — better-auth with GitHub + Google providers. Session cookie
  is set on `.dd-cons.aroma-cloud.online` so both sub-paths (`/dev-division/*`
  and `/consulting/*`) can verify it via `/api/auth/get-session`.
- **Marketing + pricing pages** (added in Phase 26).
- The reserved `umbrellaSubs` JSON column on the user row, which Phase 26+ will
  use for Stripe state (parked in v1.5).

This repo does **not** own:

- Dev-division's workspace/RBAC tables (stay in `/home/ubuntu/dev-devision`).
- Consulting-agency's engagement tables (stay in
  `/home/ubuntu/consulting-agency`).
- Caddy/Docker Compose wiring (Phase 28/29).

The full milestone brief lives in dev-division at
[`.planning/v1.4-umbrella-dashboard.md`](../dev-devision/.planning/v1.4-umbrella-dashboard.md).

## Layout

```
apps/web/        Next.js 15 App Router app (the shell itself)
  src/app/       Routes (placeholder `/` for P25; marketing/pricing in P26)
  src/lib/       better-auth instance + helpers
  src/db/        SQLite database handle (will move to Postgres in P29)
tests/           Vitest projects (unit + integration)
```

## Run locally

```bash
pnpm install
cp .env.example .env.local
# fill in SHELL_BETTER_AUTH_SECRET (openssl rand -hex 32) + OAuth client ids
pnpm dev          # starts apps/web on http://localhost:3000
```

Smoke the session endpoint:

```bash
curl -i http://localhost:3000/api/auth/get-session
# -> 401 without a cookie
```

## Test

```bash
pnpm test
```

## Phase status

- [x] **P25** — Shell scaffold + better-auth issuer (this commit)
- [ ] P26 — Marketing + pricing pages
- [ ] P27 — Dev-division + consulting-agency port to shell-issued cookie
- [ ] P28 — Caddy umbrella + Studio admin gate
- [ ] P29 — Deploy + DNS + e2e smoke
