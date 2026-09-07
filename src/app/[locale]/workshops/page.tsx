import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Container, EmptyState } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/page-header';
import { ProviderCard } from '@/components/catalog/provider-card';
import { WorkshopFilters } from '@/components/catalog/workshop-filters';
import {
  type DeliveryMode,
  type ProviderSort,
  getProviderZones,
  listProviders,
} from '@/server/queries/providers';
import { getCategoriesWithFromPrice, getServicesForCategory } from '@/server/queries/catalog';

/**
 * Dynamic, because the filters live in the query string and every combination
 * is its own result set. The catalog pages carry the static-rendering budget;
 * this one is a search page and is honest about it.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('workshops');
  return { title: t('title') };
}

const SORTS: ProviderSort[] = ['rating', 'reviews', 'price', 'distance', 'name'];
const MODES: DeliveryMode[] = ['at_center', 'mobile', 'pickup'];

function parseSort(value: string | undefined): ProviderSort {
  return SORTS.includes(value as ProviderSort) ? (value as ProviderSort) : 'rating';
}

function parseMode(value: string | undefined): DeliveryMode | undefined {
  return MODES.includes(value as DeliveryMode) ? (value as DeliveryMode) : undefined;
}

export default async function WorkshopsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;

  const one = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const zoneRaw = one('zone');
  const zoneNumber = zoneRaw && /^\d+$/.test(zoneRaw) ? Number(zoneRaw) : undefined;

  const filters = {
    serviceSlug: one('service'),
    zoneNumber,
    mode: parseMode(one('mode')),
    verifiedOnly: one('verified') === '1',
    sort: parseSort(one('sort')),
  };

  const [providers, zones, categories] = await Promise.all([
    listProviders(filters),
    getProviderZones(),
    getCategoriesWithFromPrice(),
  ]);

  // The service filter lists every service, grouped by category, so the select
  // reads like the catalog rather than like a flat 39-item dropdown.
  const grouped = await Promise.all(
    categories.map(async (category) => ({
      label: locale === 'ar' ? category.nameAr : category.nameEn,
      services: (await getServicesForCategory(category.id)).map((service) => ({
        slug: service.slug,
        label: locale === 'ar' ? service.nameAr : service.nameEn,
      })),
    })),
  );

  const t = await getTranslations('workshops');
  const nav = await getTranslations('nav');
  const current = (await getLocale()) as Locale;

  return (
    <Container>
      <PageHeader
        crumbs={[{ href: '/', label: nav('home') }]}
        title={t('title')}
        description={t('subtitle', { count: providers.length })}
      />

      <WorkshopFilters
        zones={zones.map((zone) => ({
          value: String(zone.zoneNumber ?? ''),
          label: current === 'ar' ? zone.zoneAr : zone.zoneEn,
          count: zone.count,
        }))}
        serviceGroups={grouped}
      />

      <p className="text-steel mt-4 text-2xs" aria-live="polite">
        {t('resultCount', { count: providers.length })}
      </p>

      {providers.length === 0 ? (
        <div className="py-6 pb-14">
          <EmptyState title={t('noResults')} hint={t('noResultsHint')} />
        </div>
      ) : (
        <ul className="mt-3 grid gap-3 pb-14 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <li key={provider.id} className="contents">
              <ProviderCard provider={provider} showPrice={Boolean(filters.serviceSlug)} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
