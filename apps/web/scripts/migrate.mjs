/**
 * Boot-time guarded migration: ensure user.products exists.
 *
 * better-auth materialises additionalFields only on fresh tables — it does
 * NOT alter existing ones. This runs before `next start` (see package.json)
 * and is idempotent: the ALTER's NOT NULL DEFAULT '[]' backfills old rows.
 *
 * Same DB path resolution as src/db/sqlite.ts.
 */
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const dbPath = resolve(process.cwd(), '.shell-auth', 'shell-auth.db');
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
try {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user'")
    .all();
  if (tables.length === 0) {
    // Fresh DB: better-auth will create the table with the products column.
    console.log('[migrate] no user table yet — skipping (fresh database)');
  } else {
    const columns = db.prepare('PRAGMA table_info("user")').all();
    const hasProducts = columns.some((c) => c.name === 'products');
    if (hasProducts) {
      console.log('[migrate] user.products already present — nothing to do');
    } else {
      db.exec(
        `ALTER TABLE "user" ADD COLUMN "products" text NOT NULL DEFAULT '[]'`,
      );
      console.log('[migrate] added user.products (backfilled existing rows with [])');
    }
  }
} finally {
  db.close();
}
