/**
 * Entitlements: parse / admin / effective-products / persistence — plus the
 * get-session contract test that pins the exact field names both products
 * (dev-division, consulting-agency) parse off the shell response.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Fresh temp dir BEFORE importing anything that opens the SQLite handle
// (both auth.ts and entitlements.ts read process.cwd() at module load).
const TMP = mkdtempSync(join(tmpdir(), 'dd-cons-shell-ent-test-'));
const originalCwd = process.cwd();
process.chdir(TMP);
process.env.SHELL_BETTER_AUTH_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
delete process.env.SHELL_ADMIN_EMAILS;

const { auth } = await import('../../apps/web/src/lib/auth.ts');
const {
  PRODUCT_IDS,
  parseProducts,
  adminEmails,
  isShellAdmin,
  effectiveProducts,
  listUsers,
  setUserProducts,
} = await import('../../apps/web/src/lib/entitlements.ts');
const { getMigrations } = await import('better-auth/db/migration');

interface UserRow {
  id: string;
  email: string;
}

let firstUser: UserRow;
let secondUser: UserRow;

async function createUser(email: string, createdAt: Date): Promise<UserRow> {
  const ctx = await auth.$context;
  return (await ctx.adapter.create({
    model: 'user',
    data: {
      email,
      name: 'Ent Test',
      image: null,
      emailVerified: true,
      provider: 'test',
      umbrellaSubs: '{}',
      products: '[]',
      createdAt,
      updatedAt: createdAt,
    },
  })) as UserRow;
}

async function signedCookieFor(userId: string): Promise<string> {
  const ctx = await auth.$context;
  const token = `sess_${Math.random().toString(36).slice(2)}`;
  await ctx.adapter.create({
    model: 'session',
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      ipAddress: '127.0.0.1',
      userAgent: 'ent-test',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const { makeSignature } = await import('better-auth/crypto');
  const signature = await makeSignature(token, ctx.secret);
  return `${ctx.authCookies.sessionToken.name}=${encodeURIComponent(`${token}.${signature}`)}`;
}

beforeAll(async () => {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  firstUser = await createUser('first@example.test', new Date('2026-01-01T00:00:00Z'));
  secondUser = await createUser('second@example.test', new Date('2026-02-01T00:00:00Z'));
});

beforeEach(() => {
  delete process.env.SHELL_ADMIN_EMAILS;
});

afterAll(() => {
  process.chdir(originalCwd);
  rmSync(TMP, { recursive: true, force: true });
});

describe('parseProducts', () => {
  it('tolerates NULL, garbage, and non-arrays', () => {
    expect(parseProducts(null)).toEqual([]);
    expect(parseProducts(undefined)).toEqual([]);
    expect(parseProducts('')).toEqual([]);
    expect(parseProducts('not json')).toEqual([]);
    expect(parseProducts('{"a":1}')).toEqual([]);
    expect(parseProducts('42')).toEqual([]);
  });

  it('filters to known product ids only', () => {
    expect(parseProducts('["consulting","bogus","dev-division",7]')).toEqual([
      'consulting',
      'dev-division',
    ]);
  });
});

describe('admin resolution', () => {
  it('the first user ever is auto-admin; later users are not', () => {
    expect(isShellAdmin(firstUser)).toBe(true);
    expect(isShellAdmin(secondUser)).toBe(false);
  });

  it('SHELL_ADMIN_EMAILS grants admin (case-insensitive, comma-separated)', () => {
    process.env.SHELL_ADMIN_EMAILS = ' Other@x.test , SECOND@example.test ';
    expect(adminEmails().has('second@example.test')).toBe(true);
    expect(isShellAdmin(secondUser)).toBe(true);
  });
});

describe('effectiveProducts', () => {
  it('admins implicitly have every product', () => {
    expect(effectiveProducts({ ...firstUser, products: '[]' })).toEqual([
      ...PRODUCT_IDS,
    ]);
  });

  it('non-admins get exactly their granted list', () => {
    expect(effectiveProducts({ ...secondUser, products: '[]' })).toEqual([]);
    expect(effectiveProducts({ ...secondUser, products: '["consulting"]' })).toEqual([
      'consulting',
    ]);
  });
});

describe('setUserProducts', () => {
  it('round-trips grants through the database', () => {
    setUserProducts(secondUser.id, ['consulting']);
    const row = listUsers().find((u) => u.id === secondUser.id);
    expect(row?.products).toEqual(['consulting']);
    setUserProducts(secondUser.id, []);
    expect(listUsers().find((u) => u.id === secondUser.id)?.products).toEqual([]);
  });

  it('rejects unknown user ids', () => {
    expect(() => setUserProducts('no-such-user', ['consulting'])).toThrow();
  });
});

describe('get-session contract (the shape both products parse)', () => {
  it('non-admin: carries products, isAdmin=false, effectiveProducts=grants', async () => {
    setUserProducts(secondUser.id, ['consulting']);
    const cookie = await signedCookieFor(secondUser.id);
    const res = await auth.handler(
      new Request('http://localhost:3000/api/auth/get-session', {
        method: 'GET',
        headers: { cookie },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      user: { isAdmin: boolean; effectiveProducts: string[]; products?: string };
      session: unknown;
    } | null;
    expect(body).not.toBeNull();
    expect(body?.user.isAdmin).toBe(false);
    expect(body?.user.effectiveProducts).toEqual(['consulting']);
    expect(parseProducts(body?.user.products)).toEqual(['consulting']);
    expect(body?.session).toBeTruthy();
    setUserProducts(secondUser.id, []);
  });

  it('admin: isAdmin=true, effectiveProducts=all', async () => {
    const cookie = await signedCookieFor(firstUser.id);
    const res = await auth.handler(
      new Request('http://localhost:3000/api/auth/get-session', {
        method: 'GET',
        headers: { cookie },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      user: { isAdmin: boolean; effectiveProducts: string[] };
    } | null;
    expect(body?.user.isAdmin).toBe(true);
    expect(body?.user.effectiveProducts).toEqual([...PRODUCT_IDS]);
  });
});
