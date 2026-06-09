/**
 * SQLite handle for the better-auth issuer state.
 *
 * Path resolves to <cwd>/.shell-auth/shell-auth.db. This will be swapped for
 * Postgres in Phase 29 when the umbrella moves into Docker Compose.
 */
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const dbPath = resolve(process.cwd(), '.shell-auth', 'shell-auth.db');
mkdirSync(dirname(dbPath), { recursive: true });

export const database = new Database(dbPath);
