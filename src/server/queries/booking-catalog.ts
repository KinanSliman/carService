import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { providerServices, providers, serviceCategories, services } from '@/db/schema';
import type { Locale } from '@/i18n/routing';
import { DOHA_CENTRE, distanceKm } from '@/lib/format';

/**
 * Everything the booking sheet needs, resolved to one locale on the server.
 *
 * The whole catalog ships with the page rather than being fetched step by
 * step, because it is small — 39 services and 14 workshops — and because the
 * alternative is a network round trip between "which service" and "which
 * workshop", which is the exact moment a booking flow feels slow.
 *
 * Sending only the active locale's strings roughly halves the payload; the
 * language toggle re-renders the page from the server anyway.
 */

export type BookingService = {
  slug: string;
  name: string;
  summary: string;
  priceMode: 'fixed' | 'from' | 'quote';
  durationMin: number;
  deliveryModes: ('at_center' | 'mobile' | 'pickup')[];
};

export type BookingCategory = {
  slug: string;
  name: string;
  iconKey: string;
  services: BookingService[];
};

export type BookingProvider = {
  slug: string;
  name: string;
  zone: string;
  zoneNumber: number | null;
  logoKey: string;
  coverHue: number;
  isVerified: boolean;
  ratingAvg: string;
  ratingCount: number;
  deliveryModes: ('at_center' | 'mobile' | 'pickup')[];
  distanceKm: number;
  /** service slug -> what this workshop charges and how long it takes. */
  offers: Record<string, { price: string | null; durationMin: number }>;
};

export type BookingCatalog = {
  categories: BookingCategory[];
  providers: BookingProvider[];
};

export async function getBookingCatalog(locale: Locale): Promise<BookingCatalog> {
  const isAr = locale === 'ar';

  const [categoryRows, serviceRows, providerRows, offerRows] = await Promise.all([
    db.select().from(serviceCategories).orderBy(asc(serviceCategories.sort)),
    db.select().from(services).orderBy(asc(services.sort)),
    db.select().from(providers).orderBy(asc(providers.nameEn)),
    db.select().from(providerServices),
  ]);

  const serviceSlugById = new Map(serviceRows.map((s) => [s.id, s.slug]));

  const offersByProvider = new Map<number, BookingProvider['offers']>();
  for (const offer of offerRows) {
    const slug = serviceSlugById.get(offer.serviceId);
    if (!slug) continue;
    const bucket = offersByProvider.get(offer.providerId) ?? {};
    bucket[slug] = { price: offer.price, durationMin: offer.durationMin };
    offersByProvider.set(offer.providerId, bucket);
  }

  const categories: BookingCategory[] = categoryRows.map((category) => ({
    slug: category.slug,
    name: isAr ? category.nameAr : category.nameEn,
    iconKey: category.iconKey,
    services: serviceRows
      .filter((service) => service.categoryId === category.id)
      .map((service) => ({
        slug: service.slug,
        name: isAr ? service.nameAr : service.nameEn,
        summary: isAr ? service.summaryAr : service.summaryEn,
        priceMode: service.priceMode,
        durationMin: service.durationMin,
        deliveryModes: service.deliveryModes,
      })),
  }));

  const providerList: BookingProvider[] = providerRows.map((provider) => ({
    slug: provider.slug,
    name: isAr ? provider.nameAr : provider.nameEn,
    zone: isAr ? provider.zoneAr : provider.zoneEn,
    zoneNumber: provider.zoneNumber,
    logoKey: provider.logoKey,
    coverHue: provider.coverHue,
    isVerified: provider.isVerified,
    ratingAvg: provider.ratingAvg,
    ratingCount: provider.ratingCount,
    deliveryModes: provider.deliveryModes,
    distanceKm: distanceKm(DOHA_CENTRE, {
      lat: Number(provider.lat),
      lng: Number(provider.lng),
    }),
    offers: offersByProvider.get(provider.id) ?? {},
  }));

  return { categories, providers: providerList };
}

/** Resolves `?provider=` to an id, so the sheet can start on step two. */
export async function getProviderIdBySlug(slug: string) {
  const row = await db.query.providers.findFirst({
    where: eq(providers.slug, slug),
    columns: { id: true },
  });
  return row?.id ?? null;
}
