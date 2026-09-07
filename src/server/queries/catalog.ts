import { and, asc, desc, eq, inArray, isNotNull, min, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  maintenanceRules,
  providerServices,
  serviceCategories,
  services,
  symptomOptions,
  symptomServices,
  symptoms,
} from '@/db/schema';

/**
 * Read models for the catalog. These are plain functions rather than a
 * repository class: there is one consumer for each, and the SQL shape is the
 * interesting part.
 */

/**
 * Categories with the cheapest price actually offered for anything in them.
 *
 * The price comes from `provider_services`, not `services.base_price` — the
 * home page promises "from 120 ر.ق" and that has to be a number somebody will
 * really quote, not a catalog list price no workshop charges.
 */
export async function getCategoriesWithFromPrice() {
  const rows = await db
    .select({
      id: serviceCategories.id,
      slug: serviceCategories.slug,
      nameAr: serviceCategories.nameAr,
      nameEn: serviceCategories.nameEn,
      blurbAr: serviceCategories.blurbAr,
      blurbEn: serviceCategories.blurbEn,
      iconKey: serviceCategories.iconKey,
      hotspotKey: serviceCategories.hotspotKey,
      sort: serviceCategories.sort,
      fromPrice: min(providerServices.price),
      serviceCount: sql<number>`count(distinct ${services.id})::int`,
    })
    .from(serviceCategories)
    .leftJoin(services, eq(services.categoryId, serviceCategories.id))
    .leftJoin(providerServices, eq(providerServices.serviceId, services.id))
    .groupBy(serviceCategories.id)
    .orderBy(asc(serviceCategories.sort));

  return rows;
}

export type CategoryCard = Awaited<ReturnType<typeof getCategoriesWithFromPrice>>[number];

export async function getCategoryBySlug(slug: string) {
  return db.query.serviceCategories.findFirst({
    where: eq(serviceCategories.slug, slug),
  });
}

export async function getAllCategorySlugs() {
  const rows = await db
    .select({ slug: serviceCategories.slug })
    .from(serviceCategories)
    .orderBy(asc(serviceCategories.sort));
  return rows.map((r) => r.slug);
}

/**
 * Services in one category, each with the lowest price a workshop offers and
 * how many workshops offer it — both are shown on the card, and doing it in
 * one grouped query avoids an N+1 across the whole category page.
 */
export async function getServicesForCategory(categoryId: number) {
  return db
    .select({
      id: services.id,
      slug: services.slug,
      nameAr: services.nameAr,
      nameEn: services.nameEn,
      summaryAr: services.summaryAr,
      summaryEn: services.summaryEn,
      priceMode: services.priceMode,
      basePrice: services.basePrice,
      durationMin: services.durationMin,
      deliveryModes: services.deliveryModes,
      isPopular: services.isPopular,
      fromPrice: min(providerServices.price),
      providerCount: sql<number>`count(distinct ${providerServices.providerId})::int`,
    })
    .from(services)
    .leftJoin(providerServices, eq(providerServices.serviceId, services.id))
    .where(eq(services.categoryId, categoryId))
    .groupBy(services.id)
    .orderBy(desc(services.isPopular), asc(services.sort));
}

export type ServiceCard = Awaited<ReturnType<typeof getServicesForCategory>>[number];

export async function getPopularServices(limit = 6) {
  return db
    .select({
      id: services.id,
      slug: services.slug,
      categorySlug: serviceCategories.slug,
      nameAr: services.nameAr,
      nameEn: services.nameEn,
      summaryAr: services.summaryAr,
      summaryEn: services.summaryEn,
      priceMode: services.priceMode,
      basePrice: services.basePrice,
      durationMin: services.durationMin,
      deliveryModes: services.deliveryModes,
      iconKey: serviceCategories.iconKey,
      fromPrice: min(providerServices.price),
      providerCount: sql<number>`count(distinct ${providerServices.providerId})::int`,
    })
    .from(services)
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .leftJoin(providerServices, eq(providerServices.serviceId, services.id))
    .where(eq(services.isPopular, true))
    .groupBy(services.id, serviceCategories.id)
    .orderBy(asc(serviceCategories.sort), asc(services.sort))
    .limit(limit);
}

export async function getServiceBySlug(slug: string) {
  const [row] = await db
    .select({
      id: services.id,
      slug: services.slug,
      nameAr: services.nameAr,
      nameEn: services.nameEn,
      summaryAr: services.summaryAr,
      summaryEn: services.summaryEn,
      priceMode: services.priceMode,
      basePrice: services.basePrice,
      durationMin: services.durationMin,
      deliveryModes: services.deliveryModes,
      categoryId: serviceCategories.id,
      categorySlug: serviceCategories.slug,
      categoryNameAr: serviceCategories.nameAr,
      categoryNameEn: serviceCategories.nameEn,
      categoryIconKey: serviceCategories.iconKey,
      intervalKm: maintenanceRules.intervalKm,
      intervalMonths: maintenanceRules.intervalMonths,
      intervalNoteAr: maintenanceRules.noteAr,
      intervalNoteEn: maintenanceRules.noteEn,
    })
    .from(services)
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .leftJoin(maintenanceRules, eq(maintenanceRules.serviceId, services.id))
    .where(eq(services.slug, slug))
    .limit(1);

  return row ?? null;
}

export async function getAllServiceSlugs() {
  const rows = await db
    .select({ slug: services.slug, categorySlug: serviceCategories.slug })
    .from(services)
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id));
  return rows;
}

/** Resolves a set of service slugs to the rows the booking flow needs. */
export async function getServicesBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  return db
    .select({
      id: services.id,
      slug: services.slug,
      nameAr: services.nameAr,
      nameEn: services.nameEn,
      priceMode: services.priceMode,
      basePrice: services.basePrice,
      durationMin: services.durationMin,
      deliveryModes: services.deliveryModes,
    })
    .from(services)
    .where(inArray(services.slug, slugs));
}

/* -------------------------------------------------------------------------- */
/* Symptoms                                                                    */
/* -------------------------------------------------------------------------- */

export async function getSymptoms() {
  return db.select().from(symptoms).orderBy(asc(symptoms.sort));
}

export async function getAllSymptomSlugs() {
  const rows = await db.select({ slug: symptoms.slug }).from(symptoms);
  return rows.map((r) => r.slug);
}

/**
 * One symptom with its options and every service it can recommend, tagged with
 * the option that unlocks it. The narrowing itself is client-side: the whole
 * decision set is a few rows, so shipping it beats a round trip per answer.
 */
export async function getSymptomWithServices(slug: string) {
  const symptom = await db.query.symptoms.findFirst({ where: eq(symptoms.slug, slug) });
  if (!symptom) return null;

  const options = await db
    .select()
    .from(symptomOptions)
    .where(eq(symptomOptions.symptomId, symptom.id))
    .orderBy(asc(symptomOptions.sort));

  const recommended = await db
    .select({
      optionKey: symptomServices.optionKey,
      rank: symptomServices.rank,
      id: services.id,
      slug: services.slug,
      categorySlug: serviceCategories.slug,
      nameAr: services.nameAr,
      nameEn: services.nameEn,
      summaryAr: services.summaryAr,
      summaryEn: services.summaryEn,
      priceMode: services.priceMode,
      basePrice: services.basePrice,
      durationMin: services.durationMin,
      deliveryModes: services.deliveryModes,
      fromPrice: min(providerServices.price),
      providerCount: sql<number>`count(distinct ${providerServices.providerId})::int`,
    })
    .from(symptomServices)
    .innerJoin(services, eq(symptomServices.serviceId, services.id))
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .leftJoin(providerServices, eq(providerServices.serviceId, services.id))
    .where(eq(symptomServices.symptomId, symptom.id))
    .groupBy(symptomServices.optionKey, symptomServices.rank, services.id, serviceCategories.slug)
    .orderBy(asc(symptomServices.rank));

  return { symptom, options, recommended };
}

export type SymptomDetail = NonNullable<Awaited<ReturnType<typeof getSymptomWithServices>>>;

/** Categories that have a diagram zone, for the interactive car hero. */
export async function getHotspotCategories() {
  return db
    .select({
      slug: serviceCategories.slug,
      nameAr: serviceCategories.nameAr,
      nameEn: serviceCategories.nameEn,
      blurbAr: serviceCategories.blurbAr,
      blurbEn: serviceCategories.blurbEn,
      hotspotKey: serviceCategories.hotspotKey,
      iconKey: serviceCategories.iconKey,
      fromPrice: min(providerServices.price),
      serviceCount: sql<number>`count(distinct ${services.id})::int`,
    })
    .from(serviceCategories)
    .leftJoin(services, eq(services.categoryId, serviceCategories.id))
    .leftJoin(providerServices, eq(providerServices.serviceId, services.id))
    .where(and(isNotNull(serviceCategories.hotspotKey)))
    .groupBy(serviceCategories.id)
    .orderBy(asc(serviceCategories.sort));
}

export type HotspotCategory = Awaited<ReturnType<typeof getHotspotCategories>>[number];
