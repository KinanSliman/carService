import 'dotenv/config';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({ path: '.env.local', override: false });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set.');

/** `max: 1` — a migration must not interleave across connections. */
const client = postgres(url, { max: 1 });

await migrate(drizzle(client), { migrationsFolder: './drizzle' });
console.log('migrations applied');
await client.end();
