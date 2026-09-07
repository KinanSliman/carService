import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Container } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/page-header';
import { BookingFlow } from '@/components/booking/booking-flow';
import { getBookingCatalog } from '@/server/queries/booking-catalog';

/**
 * Dynamic: the entry point carries `?service=` and `?provider=` from the
 * catalog, and this is the write path, so there is nothing to cache.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('booking');
  // A booking form has nothing to offer a search engine, and indexing it would
  // put a half-filled flow in front of someone arriving from a search result.
  return { title: t('title'), robots: { index: false, follow: true } };
}

export default async function BookPage({
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

  const catalog = await getBookingCatalog(locale as Locale);

  // `?service=a,b` is validated against the catalog rather than trusted, so a
  // hand-edited URL cannot seed the flow with services that do not exist.
  const known = new Set(
    catalog.categories.flatMap((category) => category.services.map((s) => s.slug)),
  );
  const initialServices = (one('service') ?? '')
    .split(',')
    .map((slug) => slug.trim())
    .filter((slug) => known.has(slug));

  const providerSlug = one('provider') ?? null;
  const initialProvider =
    providerSlug && catalog.providers.some((p) => p.slug === providerSlug) ? providerSlug : null;

  const t = await getTranslations('booking');
  const nav = await getTranslations('nav');

  return (
    <Container>
      <PageHeader crumbs={[{ href: '/', label: nav('home') }]} title={t('title')} />
      <BookingFlow
        catalog={catalog}
        initialServices={initialServices}
        initialProvider={initialProvider}
      />
    </Container>
  );
}
