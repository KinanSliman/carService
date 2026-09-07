'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { providers } from '@/db/schema';
import { getAvailability } from '@/server/queries/bookings';
import { checkRateLimit, clientKey } from '@/server/rate-limit';

const schema = z.object({
  providerSlug: z.string().min(1).max(80),
  durationMin: z.number().int().positive().max(24 * 60),
});

export type SlotDay = {
  day: string;
  isClosed: boolean;
  closedReasonAr: string | null;
  closedReasonEn: string | null;
  /** ISO instants; Date objects do not survive the action boundary cleanly. */
  slots: { startsAt: string; available: boolean }[];
};

/**
 * A read exposed as a Server Action.
 *
 * This is a read, not a mutation, so a route handler would be the textbook
 * home for it — but the plan cuts API routes on purpose, and an action keeps
 * the whole flow inside one typed module boundary with no fetch, no URL and no
 * hand-written response type. It is still rate-limited: it is a public
 * endpoint that runs a query, and those get found.
 */
export async function fetchAvailability(input: {
  providerSlug: string;
  durationMin: number;
}): Promise<SlotDay[]> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return [];

  const limit = checkRateLimit(await clientKey(), {
    scope: 'availability',
    limit: 120,
    windowMs: 5 * 60 * 1000,
  });
  if (!limit.ok) return [];

  const provider = await db.query.providers.findFirst({
    where: eq(providers.slug, parsed.data.providerSlug),
    columns: { id: true },
  });
  if (!provider) return [];

  const days = await getAvailability({
    providerId: provider.id,
    durationMin: parsed.data.durationMin,
  });

  return days.map((day) => ({
    day: day.day,
    isClosed: day.isClosed,
    closedReasonAr: day.closedReasonAr,
    closedReasonEn: day.closedReasonEn,
    slots: day.slots.map((slot) => ({
      startsAt: slot.startsAt.toISOString(),
      available: slot.available,
    })),
  }));
}
