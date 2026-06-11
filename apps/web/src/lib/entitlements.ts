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
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  products: ProductId[];
  isAdmin: boolean;
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

export function isShellAdmin(user: Pick<EntitlementUser, 'id' | 'email'>): boolean {
  if (adminEmails().has(user.email.toLowerCase())) return true;
  return user.id === firstUserId();
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
        'SELECT "id", "email", "name", "createdAt", "products" FROM "user" ORDER BY "createdAt" ASC, "id" ASC',
      )
      .all() as Array<{
      id: string;
      email: string;
      name: string | null;
      createdAt: string;
      products: string | null;
    }>;
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      createdAt: r.createdAt,
      products: parseProducts(r.products),
      isAdmin: isShellAdmin(r),
    }));
  } catch {
    return [];
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
