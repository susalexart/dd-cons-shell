/**
 * P25 smoke test: the umbrella's session endpoint.
 *
 * Verifies:
 *   1. GET /api/auth/get-session with NO cookie → 401-shaped response
 *      (better-auth returns `200 { data: null }` when no session; our
 *      wrapper / consumers treat null as "unauthenticated". We assert
 *      `data === null` here, which is the contract dev-division will
 *      check in P27.)
 *   2. GET /api/auth/get-session WITH a session token issued via the
 *      better-auth in-process sign-in path → returns `{ user, session }`
 *      with the expected user-shape (id, email, name, plus the reserved
 *      `umbrellaSubs` JSON column).
 *
 * The test calls `auth.handler` directly with `Request` objects, which is
 * exactly what `toNextJsHandler` does inside the App Router route — so this
 * exercises the same surface dev-division + consulting-agency will hit.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Force the SQLite handle to a fresh temp dir BEFORE we import the auth
// instance — the module reads process.cwd() at top-level.
const TMP = mkdtempSync(join(tmpdir(), 'dd-cons-shell-test-'));
const originalCwd = process.cwd();
process.chdir(TMP);
process.env.SHELL_BETTER_AUTH_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { auth } = await import('../../apps/web/src/lib/auth.ts');
const { getMigrations } = await import('better-auth/db/migration');

// Materialise the better-auth schema (user, session, account, verification)
// against the temp SQLite DB before any test runs.
beforeAll(async () => {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
});

afterAll(() => {
  process.chdir(originalCwd);
  rmSync(TMP, { recursive: true, force: true });
});

describe('P25 — /api/auth/get-session', () => {
  it('returns null session when no cookie is presented', async () => {
    const res = await auth.handler(
      new Request('http://localhost:3000/api/auth/get-session', {
        method: 'GET',
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown;
    // better-auth's contract: no cookie → null body. Dev-division's P27 port
    // will treat this as unauthenticated (the moral equivalent of 401).
    expect(body).toBeNull();
  });

  it('returns the user + session shape when a valid session cookie is presented', async () => {
    // Enable email+password just for this test so we can mint a session
    // without going through OAuth. The production config keeps it disabled.
    // Instead of monkey-patching, we use the built-in API to create a user
    // via the internal context, then read back the cookie.

    // 1. Create a user directly via better-auth's internal API.
    const email = `p25-${Date.now()}@example.test`;
    const password = 'p25-smoke-test-password!!';

    // better-auth exposes a sign-up endpoint when email+password is on; since
    // we disabled it, we use the lower-level api.signUpEmail off the auth
    // instance. If it's gated by config, fall back to creating via the
    // adapter directly.
    const ctx = await auth.$context;
    const adapter = ctx.adapter;

    // Create user row in the underlying SQLite store. better-auth's adapter
    // generates ids — we let it, then read back.
    const userRow = (await adapter.create({
      model: 'user',
      data: {
        email,
        name: 'P25 Smoke',
        image: null,
        emailVerified: true,
        provider: 'test',
        umbrellaSubs: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })) as { id: string; email: string; umbrellaSubs?: string };
    expect(userRow.id).toBeTruthy();
    // Sanity-check the reserved Stripe-state column landed on the row.
    expect(userRow.umbrellaSubs ?? '{}').toBe('{}');

    // Create a session row.
    const sessionToken = `sess_${Math.random().toString(36).slice(2)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await adapter.create({
      model: 'session',
      data: {
        token: sessionToken,
        userId: userRow.id,
        expiresAt,
        ipAddress: '127.0.0.1',
        userAgent: 'p25-smoke',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 2. Build a signed cookie in the exact shape better-auth verifies.
    //    Format: "<value>.<hmac-sha256(value, secret)>" (express-style).
    const { makeSignature } = await import('better-auth/crypto');
    const signature = await makeSignature(sessionToken, ctx.secret);
    const signedValue = `${sessionToken}.${signature}`;
    const cookieName = ctx.authCookies.sessionToken.name;

    const res = await auth.handler(
      new Request('http://localhost:3000/api/auth/get-session', {
        method: 'GET',
        headers: {
          cookie: `${cookieName}=${encodeURIComponent(signedValue)}`,
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user?: { email?: string }; session?: unknown } | null;

    // If better-auth's cookie format differs across versions, the body could
    // be null — in that case we make the failure mode explicit so future
    // maintainers see exactly which assumption broke.
    expect(body).not.toBeNull();
    expect(body?.user?.email).toBe(email);
    expect(body?.session).toBeTruthy();
  });
});
