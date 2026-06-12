/**
 * Per-user product entitlements — single source of truth.
 *
 * Admins (SHELL_ADMIN_EMAILS env list + the first user ever created) always
 * have every product. Everyone else gets exactly what an admin granted via
 * /admin, stored as a JSON array in the `user.products` column.
 *
 * All statements are prepared lazily inside try/catch because `next build`
 * imports this module with an empty (or absent) database.
 */
import { database } from '../db/sqlite';

export const PRODUCT_IDS = ['dev-division', 'consulting'] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

export interface EntitlementUser {
  id: string;
  email: string;
  products?: string | null;
  role?: string | null;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  products: ProductId[];
  isAdmin: boolean;
  /** Adminness comes from SHELL_ADMIN_EMAILS or first-user bootstrap — not editable from the UI. */
  adminLocked: boolean;
}

function isProductId(value: unknown): value is ProductId {
  return typeof value === 'string' && (PRODUCT_IDS as readonly string[]).includes(value);
}

/** Tolerant parse: NULL, garbage, or non-array input → []. */
export function parseProducts(raw: string | null | undefined): ProductId[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isProductId);
  } catch {
    return [];
  }
}

export function adminEmails(): Set<string> {
  return new Set(
    (process.env.SHELL_ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** The very first user to sign up is auto-admin (owner bootstrap, prevents lockout). */
export function firstUserId(): string | null {
  try {
    const row = database
      .prepare('SELECT "id" FROM "user" ORDER BY "createdAt" ASC, "id" ASC LIMIT 1')
      .get() as { id: string } | undefined;
    return row?.id ?? null;
  } catch {
    return null;
  }
}

/** Env-list and first-user admins: their adminness lives outside the DB, so the UI can't change it. */
export function isLockedAdmin(user: Pick<EntitlementUser, 'id' | 'email'>): boolean {
  if (adminEmails().has(user.email.toLowerCase())) return true;
  return user.id === firstUserId();
}

function getUserRole(userId: string): string | null {
  try {
    const row = database
      .prepare('SELECT "role" FROM "user" WHERE "id" = ?')
      .get(userId) as { role: string | null } | undefined;
    return row?.role ?? null;
  } catch {
    // pre-migration DB without the role column
    return null;
  }
}

export function isShellAdmin(user: Pick<EntitlementUser, 'id' | 'email' | 'role'>): boolean {
  if (isLockedAdmin(user)) return true;
  // Session objects carry role (better-auth additionalField); plain {id,email}
  // callers fall back to a DB lookup.
  const role = user.role !== undefined ? user.role : getUserRole(user.id);
  return role === 'admin';
}

export function setUserRole(userId: string, role: 'admin' | 'member'): void {
  const result = database
    .prepare('UPDATE "user" SET "role" = ?, "updatedAt" = ? WHERE "id" = ?')
    .run(role, new Date().toISOString(), userId);
  if (result.changes === 0) {
    throw new Error(`No user with id ${userId}`);
  }
}

/** Admins implicitly have every product; others get their granted list. */
export function effectiveProducts(user: EntitlementUser): ProductId[] {
  if (isShellAdmin(user)) return [...PRODUCT_IDS];
  return parseProducts(user.products);
}

export function listUsers(): AdminUserRow[] {
  try {
    const rows = database
      .prepare(
        'SELECT "id", "email", "name", "createdAt", "products", "role" FROM "user" ORDER BY "createdAt" ASC, "id" ASC',
      )
      .all() as Array<{
      id: string;
      email: string;
      name: string | null;
      createdAt: string;
      products: string | null;
      role: string | null;
    }>;
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      createdAt: r.createdAt,
      products: parseProducts(r.products),
      isAdmin: isShellAdmin(r),
      adminLocked: isLockedAdmin(r),
    }));
  } catch {
    return [];
  }
}

export function findUserByEmail(email: string): { id: string; email: string } | null {
  try {
    const row = database
      .prepare('SELECT "id", "email" FROM "user" WHERE lower("email") = ? LIMIT 1')
      .get(email.trim().toLowerCase()) as { id: string; email: string } | undefined;
    return row ?? null;
  } catch {
    return null;
  }
}

export function setUserProducts(userId: string, products: ProductId[]): void {
  const invalid = products.filter((p) => !isProductId(p));
  if (invalid.length > 0) {
    throw new Error(`Unknown product id(s): ${invalid.join(', ')}`);
  }
  const deduped = [...new Set(products)];
  const result = database
    .prepare('UPDATE "user" SET "products" = ?, "updatedAt" = ? WHERE "id" = ?')
    .run(JSON.stringify(deduped), new Date().toISOString(), userId);
  if (result.changes === 0) {
    throw new Error(`No user with id ${userId}`);
  }
}

/**
 * Remove a user and their auth state (sessions + linked OAuth accounts).
 * Caller is responsible for the policy guards (no self-removal, no admins).
 */
export function deleteUserCascade(userId: string): void {
  const tx = database.transaction((id: string) => {
    database.prepare('DELETE FROM "session" WHERE "userId" = ?').run(id);
    database.prepare('DELETE FROM "account" WHERE "userId" = ?').run(id);
    const result = database.prepare('DELETE FROM "user" WHERE "id" = ?').run(id);
    if (result.changes === 0) {
      throw new Error(`No user with id ${id}`);
    }
  });
  tx(userId);
}

// ── Pending grants — pre-authorized emails ──────────────────────────────────
//
// OAuth-only sign-up means admins can't create users ahead of time. A pending
// grant lets an admin authorize an email BEFORE first login; the better-auth
// user.create hook applies it to the new row (see lib/auth.ts) and the grant
// is consumed.

export interface PendingGrantRow {
  email: string;
  products: ProductId[];
  createdAt: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ensurePendingGrantTable(): void {
  database.exec(
    `CREATE TABLE IF NOT EXISTS "pending_grant" (
      "email" TEXT PRIMARY KEY,
      "products" TEXT NOT NULL DEFAULT '[]',
      "createdAt" TEXT NOT NULL
    )`,
  );
}

export function listPendingGrants(): PendingGrantRow[] {
  try {
    ensurePendingGrantTable();
    const rows = database
      .prepare(
        'SELECT "email", "products", "createdAt" FROM "pending_grant" ORDER BY "createdAt" ASC, "email" ASC',
      )
      .all() as Array<{ email: string; products: string | null; createdAt: string }>;
    return rows.map((r) => ({
      email: r.email,
      products: parseProducts(r.products),
      createdAt: r.createdAt,
    }));
  } catch {
    return [];
  }
}

/** Upsert: re-adding an email replaces its product list. */
export function setPendingGrant(email: string, products: ProductId[]): void {
  const norm = email.trim().toLowerCase();
  if (!EMAIL_RE.test(norm)) {
    throw new Error('Invalid email address');
  }
  const invalid = products.filter((p) => !isProductId(p));
  if (invalid.length > 0) {
    throw new Error(`Unknown product id(s): ${invalid.join(', ')}`);
  }
  ensurePendingGrantTable();
  database
    .prepare(
      `INSERT INTO "pending_grant" ("email", "products", "createdAt") VALUES (?, ?, ?)
       ON CONFLICT("email") DO UPDATE SET "products" = excluded."products"`,
    )
    .run(norm, JSON.stringify([...new Set(products)]), new Date().toISOString());
}

export function getPendingGrant(email: string): ProductId[] | null {
  try {
    ensurePendingGrantTable();
    const row = database
      .prepare('SELECT "products" FROM "pending_grant" WHERE "email" = ?')
      .get(email.trim().toLowerCase()) as { products: string | null } | undefined;
    return row ? parseProducts(row.products) : null;
  } catch {
    return null;
  }
}

export function removePendingGrant(email: string): void {
  try {
    ensurePendingGrantTable();
    database
      .prepare('DELETE FROM "pending_grant" WHERE "email" = ?')
      .run(email.trim().toLowerCase());
  } catch {
    // best-effort cleanup — a stale row is harmless (consumed at most once)
  }
}
