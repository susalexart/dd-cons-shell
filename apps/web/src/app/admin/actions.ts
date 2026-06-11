'use server';

/**
 * Server actions are public HTTP endpoints — admin status MUST be re-verified
 * inside the action, never trusted from the page that rendered the form.
 */
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '../../lib/auth';
import {
  deleteUserCascade,
  findUserByEmail,
  isShellAdmin,
  parseProducts,
  PRODUCT_IDS,
  removePendingGrant,
  setPendingGrant,
  setUserProducts,
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

export async function toggleProduct(formData: FormData): Promise<void> {
  await requireAdmin();

  const userId = formData.get('userId');
  const product = formData.get('product');
  if (typeof userId !== 'string' || typeof product !== 'string') {
    throw new Error('Invalid request');
  }
  if (!(PRODUCT_IDS as readonly string[]).includes(product)) {
    throw new Error('Unknown product');
  }
  const productId = product as ProductId;

  const row = database
    .prepare('SELECT "products" FROM "user" WHERE "id" = ?')
    .get(userId) as { products: string | null } | undefined;
  if (!row) throw new Error('Unknown user');

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
    throw new Error('Invalid request');
  }
  if (userId === session.user.id) {
    throw new Error('You cannot remove yourself');
  }

  const target = database
    .prepare('SELECT "id", "email" FROM "user" WHERE "id" = ?')
    .get(userId) as { id: string; email: string } | undefined;
  if (!target) throw new Error('Unknown user');
  // Admins (env list + first user) can't be removed from the UI — their
  // adminness doesn't live in the DB, so deletion wouldn't revoke anything
  // except the owner's own account.
  if (isShellAdmin(target)) {
    throw new Error('Admins cannot be removed');
  }

  deleteUserCascade(userId);
  revalidatePath('/admin');
}

export async function addPendingGrant(formData: FormData): Promise<void> {
  await requireAdmin();

  const email = formData.get('email');
  if (typeof email !== 'string' || email.trim().length === 0) {
    throw new Error('Email is required');
  }
  const products = formData
    .getAll('product')
    .filter((p): p is string => typeof p === 'string')
    .filter((p): p is ProductId => (PRODUCT_IDS as readonly string[]).includes(p));

  // If they already signed up, the grant belongs on the user row — the
  // pending table would never be consumed.
  if (findUserByEmail(email)) {
    throw new Error('User already exists — use the product toggles above');
  }

  setPendingGrant(email, products);
  revalidatePath('/admin');
}

export async function revokePendingGrant(formData: FormData): Promise<void> {
  await requireAdmin();

  const email = formData.get('email');
  if (typeof email !== 'string' || email.trim().length === 0) {
    throw new Error('Invalid request');
  }
  removePendingGrant(email);
  revalidatePath('/admin');
}
