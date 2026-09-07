import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { services } from './catalog';
import { providers } from './providers';
import { bookingSourceEnum, bookingStatusEnum, deliveryModeEnum } from './enums';

/**
 * A guest booking. There is no users table in this build, so the booking
 * carries its own contact details and is retrieved with
 * `code + last 4 digits of phone` — enough for a demo, and honest about being
 * one.
 *
 * `vehicleLabel` is free text from the form ("لاند كروزر 2019") rather than a
 * foreign key: the garage is a localStorage demo and never reaches the server.
 */
export const bookings = pgTable(
  'bookings',
  {
    id: serial('id').primaryKey(),
    /** Public lookup code, e.g. KRJ-8F2A. Generated in booking-code.ts. */
    code: varchar('code', { length: 12 }).notNull(),
    contactName: text('contact_name').notNull(),
    contactPhone: varchar('contact_phone', { length: 20 }).notNull(),
    /** Denormalised for lookup without exposing the full number in a query. */
    phoneLast4: varchar('phone_last4', { length: 4 }).notNull(),
    vehicleLabel: text('vehicle_label').notNull(),
    providerId: integer('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'restrict' }),
    mode: deliveryModeEnum('mode').notNull(),
    /** UTC instant. Rendered in Asia/Qatar. */
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    /** Total minutes reserved, summed from the booked items. */
    durationMin: integer('duration_min').notNull(),
    status: bookingStatusEnum('status').notNull().default('requested'),
    source: bookingSourceEnum('source').notNull().default('public'),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    /** Mobile and pickup modes add a call-out fee; see pricing.ts. */
    calloutFee: numeric('callout_fee', { precision: 10, scale: 2 }).notNull().default('0'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    /** True when any booked item is quote-only, so `total` is a partial figure. */
    hasQuoteItems: integer('has_quote_items').notNull().default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('bookings_code_idx').on(t.code),
    index('bookings_lookup_idx').on(t.code, t.phoneLast4),
    // Availability reads every booking for one provider on one day.
    index('bookings_slot_idx').on(t.providerId, t.scheduledAt),
    // The nightly cleanup route deletes public rows by age.
    index('bookings_cleanup_idx').on(t.source, t.createdAt),
  ],
);

/**
 * Line items snapshot name and price at booking time. Without the snapshot,
 * re-seeding or repricing a service would silently rewrite historical
 * bookings.
 */
export const bookingItems = pgTable(
  'booking_items',
  {
    id: serial('id').primaryKey(),
    bookingId: integer('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    serviceId: integer('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),
    nameArSnapshot: text('name_ar_snapshot').notNull(),
    nameEnSnapshot: text('name_en_snapshot').notNull(),
    /** Null when the item was quote-only at booking time. */
    priceSnapshot: numeric('price_snapshot', { precision: 10, scale: 2 }),
    durationMinSnapshot: integer('duration_min_snapshot').notNull(),
  },
  (t) => [index('booking_items_booking_idx').on(t.bookingId)],
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  provider: one(providers, { fields: [bookings.providerId], references: [providers.id] }),
  items: many(bookingItems),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, { fields: [bookingItems.bookingId], references: [bookings.id] }),
  service: one(services, { fields: [bookingItems.serviceId], references: [services.id] }),
}));

export type Booking = typeof bookings.$inferSelect;
export type BookingItem = typeof bookingItems.$inferSelect;
export type BookingStatus = Booking['status'];
