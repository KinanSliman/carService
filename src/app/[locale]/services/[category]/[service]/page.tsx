import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Clock, Wrench } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { Badge, Card, Container, Section } from '@/components/ui/primitives';
import { buttonClass } from '@/components/ui/button';
import { PageHeader } from '@/components/shell/page-header';
import { ProviderCard } from '@/components/catalog/provider-card';
import { CategoryIcon } from '@/components/home/category-icon';
import {
  getAllServiceSlugs,
  getCategoryBySlug,
  getServiceBySlug,
  getServicesForCategory,
} from '@/server/queries/catalog';
import { listProviders } from '@/server/queries/providers';
import { formatDuration, formatPrice } from '@/lib/format';

export const revalidate = 3600;

export async function generateStaticParams() {
  const rows = await getAllServiceSlugs();
  return routing.locales.flatMap((locale) =>
    rows.map((row) => ({ locale, category: row.categorySlug, service: row.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; service: string }>;
}): Promise<Metadata> {
  const { locale, service: slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  const isAr = locale === 'ar';
  return {
    title: isAr ? service.nameAr : service.nameEn,
    description: isAr ? service.summaryAr : service.summaryEn,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; service: string }>;
}) {
  const { locale, category: categorySlug, service: serviceSlug } = await params;
  setRequestLocale(locale);

  const service = await getServiceBySlug(serviceSlug);
  // The category is part of the URL, so a service reached under the wrong one
  // is a 404 rather than a silent redirect — two URLs for one page is how a
  // catalog ends up with duplicate content.
  if (!service || service.categorySlug !== categorySlug) notFound();

  const [category, siblings, providers] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getServicesForCategory(service.categoryId),
    listProviders({ serviceSlug, sort: 'price' }),
  ]);
  if (!category) notFound();

  const t = await getTranslations('services');
  const tc = await getTranslations('common');
  const td = await getTranslations('delivery');
  const nav = await getTranslations('nav');
  const tw = await getTranslations('workshops');
  const tb = await getTranslations('booking');
  const current = (await getLocale()) as Locale;

  const name = current === 'ar' ? service.nameAr : service.nameEn;
  const summary = current === 'ar' ? service.summaryAr : service.summaryEn;
  const cheapest = providers.find((p) => p.fromPrice !== null)?.fromPrice ?? service.basePrice;
  const price = formatPrice(cheapest, current);
  const related = siblings.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <Container>
      <PageHeader
        crumbs={[
          { href: '/', label: nav('home') },
          { href: '/services', label: t('title') },
          {
            href: `/services/${category.slug}`,
            label: current === 'ar' ? category.nameAr : category.nameEn,
          },
        ]}
        title={name}
        description={summary}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-12">
        <div className="order-2 lg:order-1">
          <Section title={t('deliveryTitle')} className="pt-0">
            <ul className="flex flex-wrap gap-2">
              {service.deliveryModes.map((mode) => (
                <li key={mode}>
                  <Badge tone="neutral" className="h-8 px-3">
                    {td(mode)}
                  </Badge>
                </li>
              ))}
            </ul>
          </Section>

          {(service.intervalKm !== null || service.intervalMonths !== null) && (
            <Section title={t('maintenanceTitle')} className="pt-0">
              <Card className="p-4">
                <p className="text-base font-semibold">
                  {[
                    service.intervalKm !== null
                      ? t('everyKm', { km: service.intervalKm.toLocaleString('en') })
                      : null,
                    service.intervalMonths !== null
                      ? t('everyMonths', { months: service.intervalMonths })
                      : null,
                  ]
                    .filter(Boolean)
                    .join(` — ${t('orWhicheverFirst')} · `)}
                </p>
                {(current === 'ar' ? service.intervalNoteAr : service.intervalNoteEn) && (
                  <p className="text-steel measure mt-2 text-2xs">
                    {current === 'ar' ? service.intervalNoteAr : service.intervalNoteEn}
                  </p>
                )}
              </Card>
            </Section>
          )}

          <Section
            title={tw('title')}
            description={t('availableAt', { count: providers.length })}
            className="pt-0"
          >
            <ul className="grid gap-3 sm:grid-cols-2">
              {providers.slice(0, 6).map((provider) => (
                <li key={provider.id} className="contents">
                  <ProviderCard provider={provider} showPrice />
                </li>
              ))}
            </ul>
          </Section>

          {related.length > 0 && (
            <Section title={t('relatedTitle')} className="pt-0 pb-14">
              <ul className="grid gap-3 sm:grid-cols-3">
                {related.map((sibling) => (
                  <li key={sibling.id}>
                    <Link
                      href={`/services/${category.slug}/${sibling.slug}`}
                      className="press bg-surface border-line rounded-card shadow-e1 hover:shadow-e2 flex h-full flex-col border p-4"
                    >
                      <p className="text-xs font-semibold">
                        {current === 'ar' ? sibling.nameAr : sibling.nameEn}
                      </p>
                      <p className="text-steel mt-auto pt-3 text-2xs">
                        {formatPrice(sibling.fromPrice ?? sibling.basePrice, current)
                          ? `${t('from')} ${formatPrice(sibling.fromPrice ?? sibling.basePrice, current)} ${tc('currency')}`
                          : t('quoteOnly')}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* The booking panel. Sticky on desktop so the price and the action stay
            in view while the workshop list is scrolled; a plain block on mobile,
            where a sticky panel would eat a third of the screen. */}
        <aside className="order-1 lg:order-2">
          <Card className="p-5 lg:sticky lg:top-24">
            <CategoryIcon iconKey={service.categoryIconKey} className="text-steel size-7" />
            <p className="mt-4 text-2xs">
              {service.priceMode === 'quote' || !price ? (
                <span className="text-steel font-semibold">{t('quoteOnly')}</span>
              ) : (
                <>
                  {service.priceMode === 'from' && (
                    <span className="text-steel">{t('from')} </span>
                  )}
                  <span className="numeric text-2xl font-semibold">{price}</span>{' '}
                  <span className="text-steel">{tc('currency')}</span>
                </>
              )}
            </p>

            <dl className="border-line mt-4 space-y-2 border-t pt-4 text-2xs">
              <div className="flex items-center gap-2">
                <Clock className="text-steel size-4 shrink-0" aria-hidden />
                <dt className="text-steel">{tb('duration')}</dt>
                <dd className="ms-auto font-semibold">
                  {formatDuration(service.durationMin, current)}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="text-steel size-4 shrink-0" aria-hidden />
                <dt className="text-steel">{tw('title')}</dt>
                <dd className="latn ms-auto font-semibold">{providers.length}</dd>
              </div>
            </dl>

            <Link
              href={`/book?service=${service.slug}`}
              className={buttonClass('primary', 'lg', 'mt-5 w-full')}
            >
              {t('bookThis')}
            </Link>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
