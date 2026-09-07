import 'dotenv/config';
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local', override: false });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set.');

/**
 * Drops and recreates the public schema, plus drizzle's migration bookkeeping.
 * This is the "drop" half of `pnpm db:reset` and is intentionally destructive —
 * it refuses to run against anything that is not a local database.
 */
const isLocal = /@(localhost|127\.0\.0\.1|host\.docker\.internal|db)[:/]/.test(url);
if (!isLocal && process.env.ALLOW_REMOTE_DROP !== 'yes') {
  throw new Error(
    `Refusing to drop a non-local database (${url.replace(/:[^:@/]*@/, ':***@')}).\n` +
      'Set ALLOW_REMOTE_DROP=yes if this is genuinely what you want.',
  );
}

const client = postgres(url, { max: 1 });

await client.unsafe(`
  drop schema if exists public cascade;
  create schema public;
  drop schema if exists drizzle cascade;
`);

console.log('schema dropped');
await client.end();
