import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Container } from '@/components/ui/primitives';
import { CategoryIcon } from '@/components/home/category-icon';
import { getCategoriesWithFromPrice } from '@/server/queries/catalog';
import { formatPrice } from '@/lib/format';
import { PageHeader } from '@/components/shell/page-header';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('services');
  return { title: t('title'), description: t('subtitle') };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const categories = await getCategoriesWithFromPrice();
  const t = await getTranslations('services');
  const tc = await getTranslations('common');
  const current = (await getLocale()) as Locale;

  return (
    <Container>
      <PageHeader title={t('title')} description={t('subtitle')} />

      {/* A single-column list of wide rows rather than a card grid: these are
          eight items with real descriptions, and a grid would force each one
          into a truncated square for no gain. */}
      <ul className="border-line divide-line divide-y border-y pb-14">
        {categories.map((category) => {
          const price = formatPrice(category.fromPrice, current);
          const blurb = current === 'ar' ? category.blurbAr : category.blurbEn;

          return (
            <li key={category.id}>
              <Link
                href={`/services/${category.slug}`}
                className="press hover:bg-surface -mx-3 flex items-center gap-4 px-3 py-5"
              >
                <CategoryIcon iconKey={category.iconKey} className="text-ink size-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold">
                    {current === 'ar' ? category.nameAr : category.nameEn}
                  </p>
                  {blurb && <p className="text-steel measure mt-0.5 text-2xs">{blurb}</p>}
                </div>
                <div className="shrink-0 text-end">
                  {price ? (
                    <p className="text-2xs">
                      <span className="text-steel">{t('from')} </span>
                      <span className="numeric font-semibold">{price}</span>{' '}
                      <span className="text-steel">{tc('currency')}</span>
                    </p>
                  ) : (
                    <p className="text-steel text-2xs">{t('quoteOnly')}</p>
                  )}
                  <p className="text-steel mt-0.5 text-2xs">
                    {t('serviceCount', { count: category.serviceCount })}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
