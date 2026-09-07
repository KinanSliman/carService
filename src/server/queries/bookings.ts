import { and, asc, eq, gte, lt } from 'drizzle-orm';
import { addDays, subDays } from 'date-fns';
import { db } from '@/db/client';
import {
  bookingItems,
  bookings,
  providerHourOverrides,
  providerHours,
  providers,
} from '@/db/schema';
import {
  type DayAvailability,
  generateSlotsForDay,
  upcomingDays,
} from '@/server/services/availability';

export async function getBookingByCode(code: string) {
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.code, code),
  });
  if (!booking) return null;

  const [provider, items] = await Promise.all([
    db.query.providers.findFirst({ where: eq(providers.id, booking.providerId) }),
    db
      .select()
      .from(bookingItems)
      .where(eq(bookingItems.bookingId, booking.id))
      .orderBy(asc(bookingItems.id)),
  ]);

  if (!provider) return null;
  return { booking, provider, items };
}

export type BookingDetail = NonNullable<Awaited<ReturnType<typeof getBookingByCode>>>;

/**
 * Availability for one workshop across the next `dayCount` days.
 *
 * All the reads happen once, up front, and the generation is pure over them —
 * the alternative is a query per day, which is fourteen round trips to render
 * one calendar.
 */
export async function getAvailability({
  providerId,
  durationMin,
  dayCount = 14,
  now = new Date(),
}: {
  providerId: number;
  durationMin: number;
  dayCount?: number;
  now?: Date;
}): Promise<DayAvailability[]> {
  const provider = await db.query.providers.findFirst({
    where: eq(providers.id, providerId),
    columns: { bayCount: true },
  });
  if (!provider) return [];

  const days = upcomingDays(now, dayCount);

  const [weekly, overrides, existing] = await Promise.all([
    db.select().from(providerHours).where(eq(providerHours.providerId, providerId)),
    db
      .select()
      .from(providerHourOverrides)
      .where(eq(providerHourOverrides.providerId, providerId)),
    db
      .select({ scheduledAt: bookings.scheduledAt, durationMin: bookings.durationMin })
      .from(bookings)
      .where(
        and(
          eq(bookings.providerId, providerId),
          // One day either side of the window, so a job that starts the evening
          // before and runs late still blocks the following morning.
          gte(bookings.scheduledAt, subDays(now, 1)),
          lt(bookings.scheduledAt, addDays(now, dayCount + 1)),
        ),
      ),
  ]);

  return days.map((day) =>
    generateSlotsForDay({
      day,
      durationMin,
      bayCount: provider.bayCount,
      weekly,
      overrides,
      bookings: existing,
      now,
    }),
  );
}

/**
 * Booking codes shown on the case-study page so a reviewer can exercise
 * `/track` without creating a booking first. Only seeded rows — a code created
 * by a visitor is theirs, not demo material.
 */
export async function getDemoBookingCodes(limit = 4) {
  return db
    .select({ code: bookings.code, status: bookings.status, phoneLast4: bookings.phoneLast4 })
    .from(bookings)
    .where(eq(bookings.source, 'seed'))
    .orderBy(asc(bookings.id))
    .limit(limit);
}
