import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { cliConnectionString, describeConnection, selectDriver, type DriverName } from './connection';

/**
 * A drizzle instance for the CLI scripts, over whichever driver can actually
 * reach the database. See `connection.ts` for why there are two.
 *
 * The two drivers expose the same query-builder surface, so the scripts do not
 * care which one they get. What they do not share is transactions: the HTTP
 * driver has none, because each statement is its own request. Nothing in the
 * seed needs one — it is idempotent by construction, deleting before it
 * inserts — but anything added later that does must use the postgres driver.
 */
export type CliDb = ReturnType<typeof drizzlePostgres<typeof schema>>;

export type CliHandle = {
  db: CliDb;
  driver: DriverName;
  url: string;
  close: () => Promise<void>;
};

export function createCliDb(): CliHandle {
  const url = cliConnectionString();
  const driver = selectDriver(url);

  if (driver === 'neon-http') {
    const http = drizzleHttp(neon(url), { schema });
    return {
      // The HTTP driver's builder surface matches the postgres one for
      // everything the scripts use; the difference is transactions, which they
      // do not use. Narrowed here so the scripts stay driver-agnostic.
      db: http as unknown as CliDb,
      driver,
      url,
      close: async () => {
        // Nothing to close: each statement is a separate HTTPS request.
      },
    };
  }

  const client = postgres(url, { max: 1, prepare: false });
  return {
    db: drizzlePostgres(client, { schema }),
    driver,
    url,
    close: () => client.end(),
  };
}

export function announce(handle: CliHandle, verb: string): void {
  console.log(`${verb} ${describeConnection(handle.url)} via ${handle.driver}`);
}
