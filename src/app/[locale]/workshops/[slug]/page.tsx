import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { BadgeCheck, MapPin, Phone } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { Badge, Card, Container, Rating, Section } from '@/components/ui/primitives';
import { buttonClass } from '@/components/ui/button';
import { PageHeader } from '@/components/shell/page-header';
import { ProviderMark } from '@/components/catalog/provider-mark';
import { OpeningHours } from '@/components/catalog/opening-hours';
import { getAllProviderSlugs, getProviderBySlug } from '@/server/queries/providers';
import { formatDistance, formatDuration, formatPrice, formatShortDate } from '@/lib/format';

/**
 * Statically rendered and revalidated hourly. The one time-dependent thing on
 * this page — the "open now" badge — is derived on the client inside
 * `OpeningHours`, so the page stays static without the badge going stale.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllProviderSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const detail = await getProviderBySlug(slug);
  if (!detail) return {};
  const isAr = locale === 'ar';
  return {
    title: isAr ? detail.provider.nameAr : detail.provider.nameEn,
    description: isAr ? detail.provider.aboutAr : detail.provider.aboutEn,
  };
}

export default async function WorkshopPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const detail = await getProviderBySlug(slug);
  if (!detail) notFound();

  const { provider, hours, overrides, offered, reviews, distanceKm } = detail;
  const t = await getTranslations('workshops');
  const ts = await getTranslations('services');
  const tc = await getTranslations('common');
  const td = await getTranslations('delivery');
  const nav = await getTranslations('nav');
  const current = (await getLocale()) as Locale;

  const name = current === 'ar' ? provider.nameAr : provider.nameEn;
  const about = current === 'ar' ? provider.aboutAr : provider.aboutEn;
  const zone = current === 'ar' ? provider.zoneAr : provider.zoneEn;
  const street = current === 'ar' ? provider.streetAr : provider.streetEn;

  // Group the offered services under their category heading, which is how a
  // viewer scans a 14-item list without reading all of it.
  const byCategory = new Map<string, typeof offered>();
  for (const item of offered) {
    const key = current === 'ar' ? item.categoryNameAr : item.categoryNameEn;
    const list = byCategory.get(key) ?? [];
    list.push(item);
    byCategory.set(key, list);
  }

  return (
    <Container>
      <PageHeader
        crumbs={[
          { href: '/', label: nav('home') },
          { href: '/workshops', label: t('title') },
        ]}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {name}
            {provider.isVerified && (
              <BadgeCheck className="text-ok size-5 shrink-0" aria-label={t('verified')} />
            )}
          </span>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-12">
        <div>
          <div className="flex items-start gap-4">
            <ProviderMark
              hue={provider.coverHue}
              logoKey={provider.logoKey}
              className="size-16 shrink-0"
            />
            <div className="min-w-0">
              <Rating
                value={Number(provider.ratingAvg).toFixed(1)}
                count={provider.ratingCount}
                countLabel={t('ratingCount', { count: provider.ratingCount })}
              />
              <p className="text-steel mt-1.5 flex flex-wrap items-center gap-x-2 text-2xs">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {street && <span>{street}</span>}
                <span>{zone}</span>
                {provider.zoneNumber !== null && (
                  <span className="latn">{t('zone', { number: provider.zoneNumber })}</span>
                )}
                <span aria-hidden>·</span>
                <span className="latn">{formatDistance(distanceKm, current)}</span>
              </p>
            </div>
          </div>

          <Section title={t('aboutTitle')}>
            <p className="measure text-xs">{about}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {provider.deliveryModes.map((mode) => (
                <Badge key={mode} className="h-8 px-3">
                  {td(mode)}
                </Badge>
              ))}
              <Badge className="h-8 px-3">{t('bays', { count: provider.bayCount })}</Badge>
            </div>
          </Section>

          <Section title={t('servicesTitle')} className="pt-0">
            <div className="space-y-6">
              {[...byCategory.entries()].map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-steel text-2xs font-semibold">{category}</h3>
                  <ul className="divide-line border-line mt-2 divide-y border-t">
                    {items.map((item) => (
                      <li key={item.serviceId}>
                        <Link
                          href={`/services/${item.categorySlug}/${item.slug}`}
                          className="press hover:bg-surface -mx-2 flex items-center gap-4 px-2 py-3"
                        >
                          <span className="min-w-0 flex-1 text-xs">
                            {current === 'ar' ? item.nameAr : item.nameEn}
                          </span>
                          <span className="text-steel shrink-0 text-2xs">
                            {formatDuration(item.durationMin, current)}
                          </span>
                          <span className="shrink-0 text-2xs">
                            {item.price === null ? (
                              <span className="text-steel">{ts('quoteOnly')}</span>
                            ) : (
                              <>
                                <span className="numeric font-semibold">
                                  {formatPrice(item.price, current)}
                                </span>{' '}
                                <span className="text-steel">{tc('currency')}</span>
                              </>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t('reviewsTitle')} className="pt-0 pb-14">
            <ul className="grid gap-3 sm:grid-cols-2">
              {reviews.map((review) => (
                <li key={review.id}>
                  <Card className="h-full p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold">{review.authorName}</p>
                      <Rating value={review.rating.toFixed(1)} />
                    </div>
                    <p className="text-steel mt-2 text-2xs">
                      {current === 'ar' ? review.bodyAr : review.bodyEn}
                    </p>
                    <p className="text-steel/70 latn mt-3 text-2xs">
                      {formatShortDate(review.createdAt, current)}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <aside>
          <Card className="p-5 lg:sticky lg:top-24">
            <OpeningHours hours={hours} overrides={overrides} />

            <a
              href={`tel:${provider.phone.replace(/\s/g, '')}`}
              className={buttonClass('secondary', 'md', 'mt-4 w-full gap-2')}
            >
              <Phone className="size-4" aria-hidden />
              <span className="numeric" dir="ltr">
                {provider.phone}
              </span>
            </a>

            <Link
              href={`/book?provider=${provider.slug}`}
              className={buttonClass('primary', 'lg', 'mt-2 w-full')}
            >
              {t('bookHere')}
            </Link>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
