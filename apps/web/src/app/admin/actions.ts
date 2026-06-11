'use server';

/**
 * Server actions are public HTTP endpoints — admin status MUST be re-verified
 * inside the action, never trusted from the page that rendered the form.
 */
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '../../lib/auth';
import {
  isShellAdmin,
  parseProducts,
  PRODUCT_IDS,
  setUserProducts,
  type ProductId,
} from '../../lib/entitlements';
import { database } from '../../db/sqlite';

export async function toggleProduct(formData: FormData): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isShellAdmin(session.user)) {
    throw new Error('Forbidden');
  }

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
