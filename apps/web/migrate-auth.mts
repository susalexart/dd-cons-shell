// One-off: create better-auth's tables in the shell's SQLite database.
// Mirrors dev-devison/apps/web/src/lib/better-auth.ts (getMigrations + runMigrations).
import { getMigrations } from 'better-auth/db/migration';
import { auth } from './src/lib/auth';

const { runMigrations } = await getMigrations(auth.options);
await runMigrations();
console.log('[migrate] better-auth schema applied');

const Database = (await import('better-sqlite3')).default;
const db = new Database('.shell-auth/shell-auth.db');
const tables = db
  .prepare("select name from sqlite_master where type='table'")
  .all()
  .map((r) => (r as { name: string }).name);
console.log('[migrate] tables:', tables.join(', '));
db.close();
