import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { services } from './catalog';
import { deliveryModeEnum } from './enums';

/**
 * A workshop. `lat`/`lng` are plain numerics ordered by Haversine at query
 * time — PostGIS is rejected in the plan because there are no real coverage
 * polygons to model.
 *
 * `ratingAvg` / `ratingCount` are denormalised from `reviews` by the seed.
 * Nothing in the public UI writes reviews, so they cannot drift.
 */
export const providers = pgTable(
  'providers',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 80 }).notNull(),
    nameAr: text('name_ar').notNull(),
    nameEn: text('name_en').notNull(),
    aboutAr: text('about_ar').notNull(),
    aboutEn: text('about_en').notNull(),
    logoKey: varchar('logo_key', { length: 40 }).notNull(),
    /** Hue in degrees, used to tint the generated cover pattern. */
    coverHue: smallint('cover_hue').notNull().default(190),
    zoneAr: text('zone_ar').notNull(),
    zoneEn: text('zone_en').notNull(),
    /** Doha zone number, as used in Qatari addresses. */
    zoneNumber: smallint('zone_number'),
    streetAr: text('street_ar'),
    streetEn: text('street_en'),
    lat: numeric('lat', { precision: 9, scale: 6 }).notNull(),
    lng: numeric('lng', { precision: 9, scale: 6 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    isVerified: boolean('is_verified').notNull().default(false),
    deliveryModes: deliveryModeEnum('delivery_modes').array().notNull(),
    ratingAvg: numeric('rating_avg', { precision: 3, scale: 2 }).notNull().default('0'),
    ratingCount: integer('rating_count').notNull().default(0),
    /** Concurrent bays. Availability generation allows this many bookings per slot. */
    bayCount: smallint('bay_count').notNull().default(2),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('providers_slug_idx').on(t.slug),
    index('providers_rating_idx').on(t.ratingAvg),
    index('providers_zone_idx').on(t.zoneNumber),
  ],
);

/**
 * Opening hours stored as local wall-clock time plus weekday. The availability
 * service converts these to UTC instants per date with date-fns-tz; storing
 * them as timestamps would be wrong the moment the calendar moves.
 *
 * weekday: 0 = Sunday .. 6 = Saturday, matching the Qatari working week where
 * Friday (5) is the common closing day.
 */
export const providerHours = pgTable(
  'provider_hours',
  {
    id: serial('id').primaryKey(),
    providerId: integer('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    weekday: smallint('weekday').notNull(),
    opensAt: time('opens_at'),
    closesAt: time('closes_at'),
    /** Optional midday break, common for smaller garages. */
    breakStart: time('break_start'),
    breakEnd: time('break_end'),
    isClosed: boolean('is_closed').notNull().default(false),
  },
  (t) => [uniqueIndex('provider_hours_day_idx').on(t.providerId, t.weekday)],
);

/**
 * Date-specific overrides: public holidays, Ramadan hours, a one-off closure.
 * A small table, but it is what makes slot generation look considered rather
 * than a naive weekday lookup.
 */
export const providerHourOverrides = pgTable(
  'provider_hour_overrides',
  {
    id: serial('id').primaryKey(),
    providerId: integer('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    /** Local Asia/Qatar calendar date. */
    day: date('day').notNull(),
    opensAt: time('opens_at'),
    closesAt: time('closes_at'),
    isClosed: boolean('is_closed').notNull().default(false),
    reasonAr: text('reason_ar'),
    reasonEn: text('reason_en'),
  },
  (t) => [uniqueIndex('provider_hour_overrides_day_idx').on(t.providerId, t.day)],
);

export const providerServices = pgTable(
  'provider_services',
  {
    providerId: integer('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    serviceId: integer('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    /** Overrides services.basePrice for this workshop. Null for quote-only. */
    price: numeric('price', { precision: 10, scale: 2 }),
    /** Overrides services.durationMin; feeds slot length directly. */
    durationMin: integer('duration_min').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.providerId, t.serviceId] }),
    index('provider_services_service_idx').on(t.serviceId),
  ],
);

export const reviews = pgTable(
  'reviews',
  {
    id: serial('id').primaryKey(),
    providerId: integer('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    rating: smallint('rating').notNull(),
    authorName: text('author_name').notNull(),
    bodyAr: text('body_ar').notNull(),
    bodyEn: text('body_en').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('reviews_provider_idx').on(t.providerId, t.createdAt)],
);

export const providersRelations = relations(providers, ({ many }) => ({
  hours: many(providerHours),
  overrides: many(providerHourOverrides),
  offeredServices: many(providerServices),
  reviews: many(reviews),
}));

export const providerHoursRelations = relations(providerHours, ({ one }) => ({
  provider: one(providers, { fields: [providerHours.providerId], references: [providers.id] }),
}));

export const providerHourOverridesRelations = relations(providerHourOverrides, ({ one }) => ({
  provider: one(providers, {
    fields: [providerHourOverrides.providerId],
    references: [providers.id],
  }),
}));

export const providerServicesRelations = relations(providerServices, ({ one }) => ({
  provider: one(providers, { fields: [providerServices.providerId], references: [providers.id] }),
  service: one(services, { fields: [providerServices.serviceId], references: [services.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  provider: one(providers, { fields: [reviews.providerId], references: [providers.id] }),
}));

export type Provider = typeof providers.$inferSelect;
export type ProviderHour = typeof providerHours.$inferSelect;
export type ProviderHourOverride = typeof providerHourOverrides.$inferSelect;
export type ProviderService = typeof providerServices.$inferSelect;
export type Review = typeof reviews.$inferSelect;
