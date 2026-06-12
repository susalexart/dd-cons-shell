'use server';

/**
 * Server actions are public HTTP endpoints — admin status MUST be re-verified
 * inside the action, never trusted from the page that rendered the form.
 *
 * User-facing failures redirect back to /admin with a short message code
 * (rendered as an inline banner) instead of throwing: Next.js redacts thrown
 * Error messages in production, so a throw shows operators a useless generic
 * error page even when the input problem is trivially explainable.
 */
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '../../lib/auth';
import {
  deleteUserCascade,
  findUserByEmail,
  isLockedAdmin,
  isShellAdmin,
  parseProducts,
  PRODUCT_IDS,
  removePendingGrant,
  setPendingGrant,
  setUserProducts,
  setUserRole,
  type ProductId,
} from '../../lib/entitlements';
import { database } from '../../db/sqlite';

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isShellAdmin(session.user)) {
    throw new Error('Forbidden');
  }
  return session;
}

function backWithError(code: string): never {
  redirect(`/admin?error=${code}`);
}

function backWithNotice(code: string): never {
  revalidatePath('/admin');
  redirect(`/admin?notice=${code}`);
}

export async function toggleProduct(formData: FormData): Promise<void> {
  await requireAdmin();

  const userId = formData.get('userId');
  const product = formData.get('product');
  if (typeof userId !== 'string' || typeof product !== 'string') {
    backWithError('invalid-request');
  }
  if (!(PRODUCT_IDS as readonly string[]).includes(product)) {
    backWithError('invalid-request');
  }
  const productId = product as ProductId;

  const row = database
    .prepare('SELECT "products" FROM "user" WHERE "id" = ?')
    .get(userId) as { products: string | null } | undefined;
  if (!row) backWithError('unknown-user');

  const current = parseProducts(row.products);
  const next = current.includes(productId)
    ? current.filter((p) => p !== productId)
    : [...current, productId];

  setUserProducts(userId, next);
  revalidatePath('/admin');
}

export async function removeUser(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const userId = formData.get('userId');
  if (typeof userId !== 'string' || userId.length === 0) {
    backWithError('invalid-request');
  }
  if (userId === session.user.id) {
    backWithError('self-remove');
  }

  const target = database
    .prepare('SELECT "id", "email", "role" FROM "user" WHERE "id" = ?')
    .get(userId) as { id: string; email: string; role: string | null } | undefined;
  if (!target) backWithError('unknown-user');
  // Admins can't be removed from the UI. Locked admins (env list + first
  // user) aren't DB state at all; DB admins must be demoted first.
  if (isShellAdmin(target)) {
    backWithError('admin-remove');
  }

  deleteUserCascade(userId);
  revalidatePath('/admin');
}

export async function setRole(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const userId = formData.get('userId');
  const role = formData.get('role');
  if (typeof userId !== 'string' || (role !== 'admin' && role !== 'member')) {
    backWithError('invalid-request');
  }
  if (userId === session.user.id) {
    // Self-demotion lockout guard; self-promotion is a no-op anyway.
    backWithError('self-role');
  }

  const target = database
    .prepare('SELECT "id", "email" FROM "user" WHERE "id" = ?')
    .get(userId) as { id: string; email: string } | undefined;
  if (!target) backWithError('unknown-user');
  if (isLockedAdmin(target)) {
    // Env-list / first-user adminness doesn't live in the DB — the role
    // column can't grant or revoke it, so don't pretend it can.
    backWithError('role-locked');
  }

  setUserRole(userId, role);
  backWithNotice(role === 'admin' ? 'promoted' : 'demoted');
}

export async function addPendingGrant(formData: FormData): Promise<void> {
  await requireAdmin();

  const email = formData.get('email');
  if (typeof email !== 'string' || email.trim().length === 0) {
    backWithError('email-required');
  }
  const products = formData
    .getAll('product')
    .filter((p): p is string => typeof p === 'string')
    .filter((p): p is ProductId => (PRODUCT_IDS as readonly string[]).includes(p));

  // Already signed up? The grant belongs on the user row — apply it directly
  // (merged with whatever they already have) instead of erroring.
  const existing = findUserByEmail(email);
  if (existing) {
    const row = database
      .prepare('SELECT "products" FROM "user" WHERE "id" = ?')
      .get(existing.id) as { products: string | null } | undefined;
    const merged = [...new Set([...parseProducts(row?.products ?? null), ...products])];
    setUserProducts(existing.id, merged);
    backWithNotice('granted-existing');
  }

  let invalid = false;
  try {
    setPendingGrant(email, products);
  } catch {
    invalid = true; // EMAIL_RE rejection — redirect outside the catch
  }
  if (invalid) backWithError('invalid-email');
  backWithNotice('preauthorized');
}

export async function revokePendingGrant(formData: FormData): Promise<void> {
  await requireAdmin();

  const email = formData.get('email');
  if (typeof email !== 'string' || email.trim().length === 0) {
    backWithError('invalid-request');
  }
  removePendingGrant(email);
  revalidatePath('/admin');
}
