import 'dotenv/config';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { migrate as migrateHttp } from 'drizzle-orm/neon-http/migrator';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { cliConnectionString, describeConnection, selectDriver } from './connection';

config({ path: '.env.local', override: false });

const url = cliConnectionString();
const driver = selectDriver(url);
const folder = './drizzle';

console.log(`migrating ${describeConnection(url)} via ${driver}`);

if (driver === 'neon-http') {
  await migrateHttp(drizzleHttp(neon(url)), { migrationsFolder: folder });
} else {
  // `max: 1` — a migration must not interleave across connections.
  const client = postgres(url, { max: 1, prepare: false });
  await migratePostgres(drizzlePostgres(client), { migrationsFolder: folder });
  await client.end();
}

console.log('migrations applied');
