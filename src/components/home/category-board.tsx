import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { CategoryCard } from '@/server/queries/catalog';
import { formatPrice } from '@/lib/format';
import { CategoryIcon } from './category-icon';
import { cn } from '@/lib/cn';

/**
 * The category board, deliberately asymmetric.
 *
 * The generic answer to this brief is a 3×3 grid of identical icon tiles. Here
 * the first two categories — the ones people actually arrive looking for — get
 * a double-width tile with a blurb, and the rest are compact. Size carries
 * meaning instead of the grid flattening everything to equal weight.
 */
export async function CategoryBoard({ categories }: { categories: CategoryCard[] }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('services');
  const tc = await getTranslations('common');

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category, index) => {
        const featured = index < 2;
        const price = formatPrice(category.fromPrice, locale);
        const blurb = locale === 'ar' ? category.blurbAr : category.blurbEn;

        return (
          <li
            key={category.id}
            className={cn(featured && 'col-span-2 sm:col-span-3 lg:col-span-2')}
          >
            <Link
              href={`/services/${category.slug}`}
              className={cn(
                'press bg-surface border-line rounded-card shadow-e1 hover:shadow-e2 hover:border-steel/40',
                'flex h-full flex-col border p-4',
                featured && 'sm:flex-row sm:items-center sm:gap-5',
              )}
            >
              <CategoryIcon
                iconKey={category.iconKey}
                className={cn('text-ink shrink-0', featured ? 'size-9' : 'size-7')}
              />

              <div className={cn('mt-3 flex-1', featured && 'sm:mt-0')}>
                <p className={cn('font-semibold', featured ? 'text-lg' : 'text-xs')}>
                  {locale === 'ar' ? category.nameAr : category.nameEn}
                </p>
                {featured && blurb && (
                  <p className="text-steel measure mt-1 text-2xs">{blurb}</p>
                )}
                <p className="text-steel mt-1.5 text-2xs">
                  {price ? (
                    <>
                      {t('from')}{' '}
                      <span className="numeric text-ink font-semibold">{price}</span>{' '}
                      {tc('currency')}
                    </>
                  ) : (
                    t('quoteOnly')
                  )}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
