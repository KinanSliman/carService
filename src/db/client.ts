import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { isPooled } from './connection';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env.local and run `pnpm db:up`.',
  );
}

/**
 * Next dev reloads modules on every edit; without this the pool leaks a new
 * client per reload and Postgres runs out of connections within a minute.
 */
const globalForDb = globalThis as unknown as {
  karajClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.karajClient ??
  postgres(connectionString, {
    // A managed free tier caps connections hard, and every RSC render borrows one.
    max: process.env.NODE_ENV === 'production' ? 5 : 10,
    idle_timeout: 20,
    connect_timeout: 15,
    // postgres.js uses prepared statements by default. pgbouncer in transaction
    // mode cannot support them, and the failure is not clean — it surfaces as an
    // intermittent "prepared statement does not exist" under load rather than an
    // error at startup. Off whenever the URL points at a pooler.
    prepare: !isPooled(connectionString),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.karajClient = client;
}

export const db = drizzle(client, { schema });
export { client, schema };
export type Db = typeof db;
