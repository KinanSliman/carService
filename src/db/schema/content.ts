import { boolean, index, pgTable, serial, smallint, text, varchar } from 'drizzle-orm/pg-core';

/**
 * The promo rail on the home page. Images are committed assets, not uploads —
 * there is no admin panel in this build.
 */
export const banners = pgTable(
  'banners',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 60 }).notNull(),
    titleAr: text('title_ar').notNull(),
    titleEn: text('title_en').notNull(),
    subtitleAr: text('subtitle_ar').notNull(),
    subtitleEn: text('subtitle_en').notNull(),
    ctaAr: text('cta_ar').notNull(),
    ctaEn: text('cta_en').notNull(),
    href: text('href').notNull(),
    /** Key into the committed SVG artwork set, not an uploaded file path. */
    artKey: varchar('art_key', { length: 40 }).notNull(),
    /** Hue in degrees for the generated gradient behind the artwork. */
    hue: smallint('hue').notNull().default(190),
    sort: smallint('sort').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => [index('banners_active_idx').on(t.isActive, t.sort)],
);

export type Banner = typeof banners.$inferSelect;
