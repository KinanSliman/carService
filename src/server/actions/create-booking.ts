'use server';

import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import { addMinutes, subMinutes } from 'date-fns';
import { db } from '@/db/client';
import {
  bookingItems,
  bookings,
  providerHourOverrides,
  providerHours,
  providerServices,
  providers,
  services,
} from '@/db/schema';
import { BOOKING_LIMIT, checkRateLimit, clientKey } from '@/server/rate-limit';
import { createBookingSchema, fieldErrors } from '@/server/validation';
import { calculateTotals, toItemSnapshots, type PricedItem } from '@/server/services/pricing';
import { generateUniqueBookingCode } from '@/server/services/booking-code';
import { generateSlotsForDay, localDay } from '@/server/services/availability';

export type CreateBookingState =
  | { status: 'idle' }
  | { status: 'error'; formError?: string; fieldErrors?: Record<string, string> }
  | { status: 'success'; code: string };

/**
 * Every Server Action in this build opens the same way: parse, then rate-limit.
 * There is no session to check, so those two lines are the entire trust
 * boundary.
 *
 * The action re-derives prices and durations from the database rather than
 * accepting the ones the client displayed. A form that posts its own totals is
 * a form that can be told to post any total.
 */
export async function createBooking(
  _prev: CreateBookingState,
  formData: FormData,
): Promise<CreateBookingState> {
  const parsed = createBookingSchema.safeParse({
    serviceSlugs: formData.get('serviceSlugs'),
    providerSlug: formData.get('providerSlug'),
    mode: formData.get('mode'),
    scheduledAt: formData.get('scheduledAt'),
    contactName: formData.get('contactName'),
    contactPhone: formData.get('contactPhone'),
    vehicleLabel: formData.get('vehicleLabel'),
    notes: formData.get('notes') ?? undefined,
  });

  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrors(parsed.error) };
  }

  const limit = checkRateLimit(await clientKey(), BOOKING_LIMIT);
  if (!limit.ok) {
    return { status: 'error', formError: 'tooManyRequests' };
  }

  const input = parsed.data;

  const provider = await db.query.providers.findFirst({
    where: eq(providers.slug, input.providerSlug),
  });
  if (!provider) return { status: 'error', fieldErrors: { providerSlug: 'selectWorkshop' } };

  if (!provider.deliveryModes.includes(input.mode)) {
    return { status: 'error', fieldErrors: { mode: 'selectWorkshop' } };
  }

  // Prices and durations come from provider_services, never from the client.
  const offered = await db
    .select({
      serviceId: services.id,
      slug: services.slug,
      nameAr: services.nameAr,
      nameEn: services.nameEn,
      price: providerServices.price,
      durationMin: providerServices.durationMin,
      deliveryModes: services.deliveryModes,
    })
    .from(providerServices)
    .innerJoin(services, eq(services.id, providerServices.serviceId))
    .where(
      and(
        eq(providerServices.providerId, provider.id),
        inArray(services.slug, input.serviceSlugs),
      ),
    );

  // A basket the workshop cannot fully serve is rejected outright rather than
  // quietly booked for whichever items it does cover.
  if (offered.length !== input.serviceSlugs.length) {
    return { status: 'error', fieldErrors: { serviceSlugs: 'selectService' } };
  }
  if (offered.some((item) => !item.deliveryModes.includes(input.mode))) {
    return { status: 'error', fieldErrors: { mode: 'selectService' } };
  }

  const items: PricedItem[] = offered.map((item) => ({
    serviceId: item.serviceId,
    slug: item.slug,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    price: item.price,
    durationMin: item.durationMin,
  }));

  const totals = calculateTotals(items, input.mode);

  // Re-check the slot server-side. The picker was rendered from a snapshot of
  // availability; between then and now the last bay may have been taken.
  const day = localDay(input.scheduledAt);
  const [weekly, overrides, sameDayBookings] = await Promise.all([
    db.select().from(providerHours).where(eq(providerHours.providerId, provider.id)),
    db
      .select()
      .from(providerHourOverrides)
      .where(eq(providerHourOverrides.providerId, provider.id)),
    db
      .select({ scheduledAt: bookings.scheduledAt, durationMin: bookings.durationMin })
      .from(bookings)
      .where(
        and(
          eq(bookings.providerId, provider.id),
          // A window either side of the requested day catches a long job that
          // started the previous evening and still overlaps this morning.
          gte(bookings.scheduledAt, subMinutes(input.scheduledAt, 24 * 60)),
          lt(bookings.scheduledAt, addMinutes(input.scheduledAt, 24 * 60)),
        ),
      ),
  ]);

  const availability = generateSlotsForDay({
    day,
    durationMin: totals.durationMin,
    bayCount: provider.bayCount,
    weekly,
    overrides,
    bookings: sameDayBookings,
    now: new Date(),
  });

  const requested = input.scheduledAt.getTime();
  const slot = availability.slots.find((s) => s.startsAt.getTime() === requested);
  if (!slot || !slot.available) {
    return { status: 'error', fieldErrors: { scheduledAt: 'slotTaken' } };
  }

  const code = await generateUniqueBookingCode(async (candidate) => {
    const existing = await db.query.bookings.findFirst({
      where: eq(bookings.code, candidate),
      columns: { id: true },
    });
    return Boolean(existing);
  });

  // One transaction: a booking whose items failed to insert is worse than no
  // booking, because it shows a confirmation page with an empty basket.
  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(bookings)
      .values({
        code,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        phoneLast4: input.contactPhone.slice(-4),
        vehicleLabel: input.vehicleLabel,
        providerId: provider.id,
        mode: input.mode,
        scheduledAt: input.scheduledAt,
        durationMin: totals.durationMin,
        status: 'requested',
        subtotal: totals.subtotal,
        calloutFee: totals.calloutFee,
        total: totals.total,
        hasQuoteItems: totals.hasQuoteItems ? 1 : 0,
        notes: input.notes,
      })
      .returning({ id: bookings.id });

    if (!created) throw new Error('booking insert returned no row');
    await tx.insert(bookingItems).values(toItemSnapshots(items, created.id));
  });

  // The redirect happens in the client component, because throwing a redirect
  // out of a `useActionState` action loses the returned state on error paths.
  return { status: 'success', code };
}
