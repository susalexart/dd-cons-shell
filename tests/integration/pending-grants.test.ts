/**
 * Pending grants (pre-authorized emails) + user removal.
 *
 * The signup-hook test goes through better-auth's internalAdapter.createUser
 * because that is the path that fires databaseHooks.user.create — the same
 * path OAuth sign-up uses. Plain adapter.create bypasses hooks.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Fresh temp dir BEFORE importing anything that opens the SQLite handle
// (both auth.ts and entitlements.ts read process.cwd() at module load).
const TMP = mkdtempSync(join(tmpdir(), 'dd-cons-shell-pending-test-'));
const originalCwd = process.cwd();
process.chdir(TMP);
process.env.SHELL_BETTER_AUTH_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
delete process.env.SHELL_ADMIN_EMAILS;

const { auth } = await import('../../apps/web/src/lib/auth.ts');
const {
  setPendingGrant,
  getPendingGrant,
  removePendingGrant,
  listPendingGrants,
  findUserByEmail,
  deleteUserCascade,
  parseProducts,
} = await import('../../apps/web/src/lib/entitlements.ts');
const { database } = await import('../../apps/web/src/db/sqlite.ts');
const { getMigrations } = await import('better-auth/db/migration');

async function createUserViaHooks(email: string): Promise<{ id: string; email: string }> {
  const ctx = await auth.$context;
  return (await ctx.internalAdapter.createUser({
    email,
    name: 'Pending Test',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as { id: string; email: string };
}

beforeAll(async () => {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
});

afterAll(() => {
  process.chdir(originalCwd);
  rmSync(TMP, { recursive: true, force: true });
});

describe('pending grant CRUD', () => {
  it('round-trips and normalises the email (trim + lowercase)', () => {
    setPendingGrant('  Mixed.Case@Example.TEST ', ['consulting']);
    expect(getPendingGrant('mixed.case@example.test')).toEqual(['consulting']);
    expect(getPendingGrant('MIXED.CASE@EXAMPLE.TEST')).toEqual(['consulting']);
    removePendingGrant('mixed.case@example.test');
    expect(getPendingGrant('mixed.case@example.test')).toBeNull();
  });

  it('upsert replaces the product list', () => {
    setPendingGrant('upsert@example.test', ['dev-division']);
    setPendingGrant('upsert@example.test', ['consulting']);
    expect(getPendingGrant('upsert@example.test')).toEqual(['consulting']);
    expect(listPendingGrants().filter((g) => g.email === 'upsert@example.test')).toHaveLength(1);
    removePendingGrant('upsert@example.test');
  });

  it('rejects invalid emails and unknown product ids', () => {
    expect(() => setPendingGrant('not-an-email', ['consulting'])).toThrow(/invalid email/i);
    // @ts-expect-error — deliberately invalid product id
    expect(() => setPendingGrant('ok@example.test', ['bogus'])).toThrow(/unknown product/i);
  });

  it('returns null for unknown emails', () => {
    expect(getPendingGrant('nobody@example.test')).toBeNull();
  });
});

describe('signup hook applies pending grants', () => {
  it('a pre-authorized email signs up with its products and the grant is consumed', async () => {
    setPendingGrant('granted@example.test', ['dev-division']);
    const user = await createUserViaHooks('granted@example.test');

    const row = database
      .prepare('SELECT "products" FROM "user" WHERE "id" = ?')
      .get(user.id) as { products: string | null };
    expect(parseProducts(row.products)).toEqual(['dev-division']);
    expect(getPendingGrant('granted@example.test')).toBeNull();
  });

  it('an email without a pending grant signs up with no products', async () => {
    const user = await createUserViaHooks('ungrated@example.test');
    const row = database
      .prepare('SELECT "products" FROM "user" WHERE "id" = ?')
      .get(user.id) as { products: string | null };
    expect(parseProducts(row.products)).toEqual([]);
  });
});

describe('deleteUserCascade', () => {
  it('removes the user with their sessions and accounts', async () => {
    const user = await createUserViaHooks('doomed@example.test');
    const ctx = await auth.$context;
    await ctx.adapter.create({
      model: 'session',
      data: {
        token: 'sess_doomed',
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600_000),
        ipAddress: '127.0.0.1',
        userAgent: 'pending-test',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    deleteUserCascade(user.id);

    expect(findUserByEmail('doomed@example.test')).toBeNull();
    const sessions = database
      .prepare('SELECT COUNT(*) AS n FROM "session" WHERE "userId" = ?')
      .get(user.id) as { n: number };
    expect(sessions.n).toBe(0);
  });

  it('throws on an unknown user id', () => {
    expect(() => deleteUserCascade('no-such-id')).toThrow(/no user/i);
  });
});
