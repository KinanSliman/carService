import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { deliveryModeEnum, priceModeEnum } from './enums';

/**
 * Two levels maximum: a top-level category and optional children.
 * `hotspotKey` is what binds a category to a zone on the home-page car diagram.
 * A category with no hotspot simply never appears on the diagram.
 */
export const serviceCategories = pgTable(
  'service_categories',
  {
    id: serial('id').primaryKey(),
    parentId: integer('parent_id'),
    slug: varchar('slug', { length: 80 }).notNull(),
    nameAr: text('name_ar').notNull(),
    nameEn: text('name_en').notNull(),
    blurbAr: text('blurb_ar'),
    blurbEn: text('blurb_en'),
    iconKey: varchar('icon_key', { length: 40 }).notNull(),
    hotspotKey: varchar('hotspot_key', { length: 40 }),
    sort: smallint('sort').notNull().default(0),
  },
  (t) => [
    uniqueIndex('service_categories_slug_idx').on(t.slug),
    index('service_categories_parent_idx').on(t.parentId),
    index('service_categories_hotspot_idx').on(t.hotspotKey),
  ],
);

export const services = pgTable(
  'services',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => serviceCategories.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 80 }).notNull(),
    nameAr: text('name_ar').notNull(),
    nameEn: text('name_en').notNull(),
    summaryAr: text('summary_ar').notNull(),
    summaryEn: text('summary_en').notNull(),
    priceMode: priceModeEnum('price_mode').notNull(),
    /** QAR. Null only when priceMode is 'quote'. */
    basePrice: numeric('base_price', { precision: 10, scale: 2 }),
    durationMin: integer('duration_min').notNull(),
    deliveryModes: deliveryModeEnum('delivery_modes').array().notNull(),
    isPopular: boolean('is_popular').notNull().default(false),
    sort: smallint('sort').notNull().default(0),
  },
  (t) => [
    uniqueIndex('services_slug_idx').on(t.slug),
    index('services_category_idx').on(t.categoryId),
  ],
);

/**
 * Symptom-first navigation. `question` plus the linked options drive the short
 * guided narrowing described in the plan. Kept as plain columns rather than a
 * rules engine, because the data is static and small.
 */
export const symptoms = pgTable(
  'symptoms',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 80 }).notNull(),
    labelAr: text('label_ar').notNull(),
    labelEn: text('label_en').notNull(),
    questionAr: text('question_ar').notNull(),
    questionEn: text('question_en').notNull(),
    iconKey: varchar('icon_key', { length: 40 }).notNull(),
    /** 1 = can wait, 2 = book soon, 3 = do not drive on it. Drives the badge. */
    urgency: smallint('urgency').notNull().default(1),
    sort: smallint('sort').notNull().default(0),
  },
  (t) => [uniqueIndex('symptoms_slug_idx').on(t.slug)],
);

/**
 * One answer option on a symptom's narrowing question. Choosing an option
 * filters `symptom_services` to rows carrying the same `optionKey`; rows with
 * a null optionKey are recommended whatever the answer.
 */
export const symptomOptions = pgTable(
  'symptom_options',
  {
    id: serial('id').primaryKey(),
    symptomId: integer('symptom_id')
      .notNull()
      .references(() => symptoms.id, { onDelete: 'cascade' }),
    optionKey: varchar('option_key', { length: 40 }).notNull(),
    labelAr: text('label_ar').notNull(),
    labelEn: text('label_en').notNull(),
    verdictAr: text('verdict_ar').notNull(),
    verdictEn: text('verdict_en').notNull(),
    sort: smallint('sort').notNull().default(0),
  },
  (t) => [
    uniqueIndex('symptom_options_key_idx').on(t.symptomId, t.optionKey),
    index('symptom_options_symptom_idx').on(t.symptomId),
  ],
);

export const symptomServices = pgTable(
  'symptom_services',
  {
    symptomId: integer('symptom_id')
      .notNull()
      .references(() => symptoms.id, { onDelete: 'cascade' }),
    serviceId: integer('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    /** Null = recommended regardless of which option was answered. */
    optionKey: varchar('option_key', { length: 40 }),
    rank: smallint('rank').notNull().default(1),
  },
  (t) => [
    primaryKey({ columns: [t.symptomId, t.serviceId] }),
    index('symptom_services_service_idx').on(t.serviceId),
  ],
);

/**
 * Drives the demo garage's next-due computation. Either interval may be null;
 * whichever threshold arrives first wins.
 */
export const maintenanceRules = pgTable(
  'maintenance_rules',
  {
    id: serial('id').primaryKey(),
    serviceId: integer('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    intervalKm: integer('interval_km'),
    intervalMonths: integer('interval_months'),
    noteAr: text('note_ar'),
    noteEn: text('note_en'),
  },
  (t) => [uniqueIndex('maintenance_rules_service_idx').on(t.serviceId)],
);

export const vehicleMakes = pgTable(
  'vehicle_makes',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 60 }).notNull(),
    nameAr: text('name_ar').notNull(),
    nameEn: text('name_en').notNull(),
    sort: smallint('sort').notNull().default(0),
  },
  (t) => [uniqueIndex('vehicle_makes_slug_idx').on(t.slug)],
);

export const vehicleModels = pgTable(
  'vehicle_models',
  {
    id: serial('id').primaryKey(),
    makeId: integer('make_id')
      .notNull()
      .references(() => vehicleMakes.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 60 }).notNull(),
    nameAr: text('name_ar').notNull(),
    nameEn: text('name_en').notNull(),
    yearFrom: smallint('year_from').notNull(),
    yearTo: smallint('year_to'),
  },
  (t) => [
    uniqueIndex('vehicle_models_slug_idx').on(t.makeId, t.slug),
    index('vehicle_models_make_idx').on(t.makeId),
  ],
);

export const serviceCategoriesRelations = relations(serviceCategories, ({ one, many }) => ({
  parent: one(serviceCategories, {
    fields: [serviceCategories.parentId],
    references: [serviceCategories.id],
    relationName: 'category_tree',
  }),
  children: many(serviceCategories, { relationName: 'category_tree' }),
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  maintenanceRule: one(maintenanceRules),
  symptomLinks: many(symptomServices),
}));

export const symptomsRelations = relations(symptoms, ({ many }) => ({
  options: many(symptomOptions),
  serviceLinks: many(symptomServices),
}));

export const symptomOptionsRelations = relations(symptomOptions, ({ one }) => ({
  symptom: one(symptoms, { fields: [symptomOptions.symptomId], references: [symptoms.id] }),
}));

export const symptomServicesRelations = relations(symptomServices, ({ one }) => ({
  symptom: one(symptoms, { fields: [symptomServices.symptomId], references: [symptoms.id] }),
  service: one(services, { fields: [symptomServices.serviceId], references: [services.id] }),
}));

export const maintenanceRulesRelations = relations(maintenanceRules, ({ one }) => ({
  service: one(services, { fields: [maintenanceRules.serviceId], references: [services.id] }),
}));

export const vehicleMakesRelations = relations(vehicleMakes, ({ many }) => ({
  models: many(vehicleModels),
}));

export const vehicleModelsRelations = relations(vehicleModels, ({ one }) => ({
  make: one(vehicleMakes, { fields: [vehicleModels.makeId], references: [vehicleMakes.id] }),
}));

export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Symptom = typeof symptoms.$inferSelect;
export type SymptomOption = typeof symptomOptions.$inferSelect;
export type MaintenanceRule = typeof maintenanceRules.$inferSelect;
export type VehicleMake = typeof vehicleMakes.$inferSelect;
export type VehicleModel = typeof vehicleModels.$inferSelect;
