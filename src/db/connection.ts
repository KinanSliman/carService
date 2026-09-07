/**
 * Connection and driver selection for the CLI scripts (migrate, drop, seed).
 *
 * Two axes:
 *
 * **Which endpoint.** Managed Postgres hands out a pooled endpoint (through
 * pgbouncer) and a direct one. pgbouncer runs in transaction mode and does not
 * keep a session across statements, which breaks DDL that expects one. So
 * schema- and bulk-shaped work uses the direct endpoint when one is
 * configured; the running app keeps the pooled URL, because that is the one
 * that survives many concurrent serverless invocations.
 *
 * **Which driver.** postgres.js speaks the wire protocol on port 5432. Plenty
 * of networks — corporate egress filters, some VPNs, some hotel Wi-Fi — accept
 * the TCP handshake on 5432 and then reset the connection the moment they see
 * non-HTTP bytes. Neon also exposes SQL over HTTPS on 443, which those
 * networks do not touch, so a Neon host defaults to the HTTP driver here.
 *
 * Override with `DATABASE_DRIVER=postgres` or `DATABASE_DRIVER=neon-http`.
 */

export type DriverName = 'postgres' | 'neon-http';

export function cliConnectionString(): string {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'No database URL. Set DATABASE_URL (and optionally DATABASE_URL_UNPOOLED) ' +
        'in .env.local, or pass an env file with `dotenv -e <file> --`.',
    );
  }
  return url;
}

/** The host and database, with credentials stripped — safe to print. */
export function describeConnection(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return '<unparseable connection string>';
  }
}

/**
 * True when the connection goes through a pooler. postgres.js uses prepared
 * statements by default and pgbouncer in transaction mode cannot support them —
 * the symptom is an intermittent "prepared statement does not exist" under
 * load rather than a clean failure at startup.
 */
export function isPooled(url: string): boolean {
  return /-pooler\./.test(url) || /pgbouncer=true/.test(url);
}

export function isNeon(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('.neon.tech');
  } catch {
    return false;
  }
}

export function selectDriver(url: string): DriverName {
  const forced = process.env.DATABASE_DRIVER;
  if (forced === 'postgres' || forced === 'neon-http') return forced;
  return isNeon(url) ? 'neon-http' : 'postgres';
}
