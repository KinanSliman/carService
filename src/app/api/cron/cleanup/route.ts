import { NextResponse } from 'next/server';
import { and, eq, lt } from 'drizzle-orm';
import { subDays } from 'date-fns';
import { db } from '@/db/client';
import { bookings } from '@/db/schema';

/**
 * Nightly cleanup of demo bookings older than a week.
 *
 * Anyone can create a booking on the live URL, and without this the demo
 * database slowly fills with other people's test rows — which then show up in
 * availability and make the calendar look busy for no reason.
 *
 * `booking_items` has `on delete cascade`, so deleting the booking takes its
 * lines with it.
 *
 * This is the one route handler in the build. It is not a public API — it is a
 * scheduled task, and Vercel Cron cannot invoke a Server Action.
 */
export const dynamic = 'force-dynamic';

const RETENTION_DAYS = 7;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Without a secret configured this endpoint would be a public "delete rows"
  // button, so a missing secret fails closed rather than open.
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }

  // Vercel Cron sends the secret as a bearer token.
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const cutoff = subDays(new Date(), RETENTION_DAYS);
  const deleted = await db
    .delete(bookings)
    // Only public writes. The seeded bookings are demo content and the only
    // rows that exist in the later statuses, so sweeping them would empty the
    // status timeline for every future visitor.
    .where(and(eq(bookings.source, 'public'), lt(bookings.createdAt, cutoff)))
    .returning({ id: bookings.id });

  return NextResponse.json({
    deleted: deleted.length,
    cutoff: cutoff.toISOString(),
  });
}
