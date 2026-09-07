import { pgEnum } from 'drizzle-orm/pg-core';

/** How a service's price is shown. `quote` services have no base_price. */
export const priceModeEnum = pgEnum('price_mode', ['fixed', 'from', 'quote']);

/** Where the work happens. Stored on the booking, offered per service. */
export const deliveryModeEnum = pgEnum('delivery_mode', ['at_center', 'mobile', 'pickup']);

/**
 * Booking lifecycle. Deliberately not a transition machine in this build —
 * nothing in the public UI can advance a booking. The seed contains bookings
 * in every state so the timeline component is visible in all of them.
 */
export const bookingStatusEnum = pgEnum('booking_status', [
  'requested',
  'confirmed',
  'in_progress',
  'completed',
  'canceled',
]);

/**
 * Where a booking came from. The nightly cleanup deletes only 'public' rows —
 * the seeded ones are demo content and must survive, since they are the only
 * bookings that exist in the later statuses.
 */
export const bookingSourceEnum = pgEnum('booking_source', ['seed', 'public']);
