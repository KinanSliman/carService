import { and, asc, desc, eq, inArray, min, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  providerHourOverrides,
  providerHours,
  providerServices,
  providers,
  reviews,
  serviceCategories,
  services,
} from '@/db/schema';
import { DOHA_CENTRE, distanceKm } from '@/lib/format';

export type ProviderSort = 'rating' | 'reviews' | 'price' | 'distance' | 'name';
export type DeliveryMode = 'at_center' | 'mobile' | 'pickup';

export type ProviderFilters = {
  serviceSlug?: string;
  zoneNumber?: number;
  mode?: DeliveryMode;
  verifiedOnly?: boolean;
  sort?: ProviderSort;
};

/**
 * The workshop directory query.
 *
 * Distance is computed in JS rather than SQL: Haversine over 14 rows is free,
 * and pushing it into the query would mean either a PostGIS dependency or an
 * unreadable trigonometric expression in the ORDER BY. Everything that
 * benefits from the index — the filters and the rating sort — stays in SQL.
 */
export async function listProviders(filters: ProviderFilters = {}) {
  const conditions = [];

  if (filters.verifiedOnly) conditions.push(eq(providers.isVerified, true));
  if (filters.zoneNumber !== undefined) {
    conditions.push(eq(providers.zoneNumber, filters.zoneNumber));
  }
  if (filters.mode) {
    conditions.push(sql`${filters.mode} = any(${providers.deliveryModes})`);
  }
  if (filters.serviceSlug) {
    conditions.push(
      sql`exists (
        select 1 from ${providerServices}
        join ${services} on ${services.id} = ${providerServices.serviceId}
        where ${providerServices.providerId} = ${providers.id}
          and ${services.slug} = ${filters.serviceSlug}
      )`,
    );
  }

  const rows = await db
    .select({
      id: providers.id,
      slug: providers.slug,
      nameAr: providers.nameAr,
      nameEn: providers.nameEn,
      logoKey: providers.logoKey,
      coverHue: providers.coverHue,
      zoneAr: providers.zoneAr,
      zoneEn: providers.zoneEn,
      zoneNumber: providers.zoneNumber,
      lat: providers.lat,
      lng: providers.lng,
      isVerified: providers.isVerified,
      deliveryModes: providers.deliveryModes,
      ratingAvg: providers.ratingAvg,
      ratingCount: providers.ratingCount,
      bayCount: providers.bayCount,
      // When a service filter is active this is that service's price at this
      // workshop; otherwise it is the cheapest thing the workshop does.
      fromPrice: min(providerServices.price),
    })
    .from(providers)
    .leftJoin(
      providerServices,
      filters.serviceSlug
        ? and(
            eq(providerServices.providerId, providers.id),
            sql`${providerServices.serviceId} = (select id from ${services} where slug = ${filters.serviceSlug})`,
          )
        : eq(providerServices.providerId, providers.id),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(providers.id);

  const withDistance = rows.map((row) => ({
    ...row,
    distanceKm: distanceKm(DOHA_CENTRE, { lat: Number(row.lat), lng: Number(row.lng) }),
  }));

  const sort = filters.sort ?? 'rating';
  withDistance.sort((a, b) => {
    switch (sort) {
      case 'reviews':
        return b.ratingCount - a.ratingCount;
      case 'price': {
        // A workshop with no price for the filtered service sorts last rather
        // than first, which is what `null` would otherwise do.
        const ap = a.fromPrice === null ? Number.POSITIVE_INFINITY : Number(a.fromPrice);
        const bp = b.fromPrice === null ? Number.POSITIVE_INFINITY : Number(b.fromPrice);
        return ap - bp;
      }
      case 'distance':
        return a.distanceKm - b.distanceKm;
      case 'name':
        return a.nameEn.localeCompare(b.nameEn);
      case 'rating':
      default:
        return Number(b.ratingAvg) - Number(a.ratingAvg) || b.ratingCount - a.ratingCount;
    }
  });

  return withDistance;
}

export type ProviderCard = Awaited<ReturnType<typeof listProviders>>[number];

/** The zone list for the filter bar, with a count so empty options never render. */
export async function getProviderZones() {
  return db
    .select({
      zoneNumber: providers.zoneNumber,
      zoneAr: providers.zoneAr,
      zoneEn: providers.zoneEn,
      count: sql<number>`count(*)::int`,
    })
    .from(providers)
    .groupBy(providers.zoneNumber, providers.zoneAr, providers.zoneEn)
    .orderBy(asc(providers.zoneEn));
}

export async function getAllProviderSlugs() {
  const rows = await db.select({ slug: providers.slug }).from(providers);
  return rows.map((r) => r.slug);
}

export async function getProviderBySlug(slug: string) {
  const provider = await db.query.providers.findFirst({ where: eq(providers.slug, slug) });
  if (!provider) return null;

  const [hours, overrides, offered, providerReviews] = await Promise.all([
    db
      .select()
      .from(providerHours)
      .where(eq(providerHours.providerId, provider.id))
      .orderBy(asc(providerHours.weekday)),
    db
      .select()
      .from(providerHourOverrides)
      .where(eq(providerHourOverrides.providerId, provider.id))
      .orderBy(asc(providerHourOverrides.day)),
    db
      .select({
        serviceId: services.id,
        slug: services.slug,
        nameAr: services.nameAr,
        nameEn: services.nameEn,
        summaryAr: services.summaryAr,
        summaryEn: services.summaryEn,
        priceMode: services.priceMode,
        price: providerServices.price,
        durationMin: providerServices.durationMin,
        deliveryModes: services.deliveryModes,
        categorySlug: serviceCategories.slug,
        categoryNameAr: serviceCategories.nameAr,
        categoryNameEn: serviceCategories.nameEn,
        categorySort: serviceCategories.sort,
      })
      .from(providerServices)
      .innerJoin(services, eq(services.id, providerServices.serviceId))
      .innerJoin(serviceCategories, eq(serviceCategories.id, services.categoryId))
      .where(eq(providerServices.providerId, provider.id))
      .orderBy(asc(serviceCategories.sort), asc(services.sort)),
    db
      .select()
      .from(reviews)
      .where(eq(reviews.providerId, provider.id))
      .orderBy(desc(reviews.createdAt)),
  ]);

  return {
    provider,
    hours,
    overrides,
    offered,
    reviews: providerReviews,
    distanceKm: distanceKm(DOHA_CENTRE, {
      lat: Number(provider.lat),
      lng: Number(provider.lng),
    }),
  };
}

export type ProviderDetail = NonNullable<Awaited<ReturnType<typeof getProviderBySlug>>>;

/** Workshops that offer every one of the given services — the booking step 2 list. */
export async function getProvidersOfferingAll(serviceIds: number[], mode?: DeliveryMode) {
  if (serviceIds.length === 0) return [];

  const conditions = [inArray(providerServices.serviceId, serviceIds)];
  if (mode) conditions.push(sql`${mode} = any(${providers.deliveryModes})`);

  const rows = await db
    .select({
      id: providers.id,
      slug: providers.slug,
      nameAr: providers.nameAr,
      nameEn: providers.nameEn,
      logoKey: providers.logoKey,
      coverHue: providers.coverHue,
      zoneAr: providers.zoneAr,
      zoneEn: providers.zoneEn,
      zoneNumber: providers.zoneNumber,
      lat: providers.lat,
      lng: providers.lng,
      isVerified: providers.isVerified,
      deliveryModes: providers.deliveryModes,
      ratingAvg: providers.ratingAvg,
      ratingCount: providers.ratingCount,
      bayCount: providers.bayCount,
      matched: sql<number>`count(*)::int`,
      // Null for any quote-only line, which the UI shows as a partial total.
      subtotal: sql<string | null>`sum(${providerServices.price})`,
      durationMin: sql<number>`sum(${providerServices.durationMin})::int`,
      quoteItems: sql<number>`count(*) filter (where ${providerServices.price} is null)::int`,
    })
    .from(providerServices)
    .innerJoin(providers, eq(providers.id, providerServices.providerId))
    .where(and(...conditions))
    .groupBy(providers.id)
    // Only workshops that cover the whole basket; a partial match would let a
    // viewer book a service the workshop does not do.
    .having(sql`count(*) = ${serviceIds.length}`)
    .orderBy(desc(providers.ratingAvg));

  return rows.map((row) => ({
    ...row,
    distanceKm: distanceKm(DOHA_CENTRE, { lat: Number(row.lat), lng: Number(row.lng) }),
  }));
}

export type BookableProvider = Awaited<ReturnType<typeof getProvidersOfferingAll>>[number];

/** Highest-rated workshops for the home rail. */
export async function getFeaturedProviders(limit = 8) {
  const rows = await listProviders({ sort: 'rating' });
  return rows.slice(0, limit);
}
