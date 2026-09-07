import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Badge, Card } from '@/components/ui/primitives';
import { formatDuration, formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

type ServiceLike = {
  slug: string;
  nameAr: string;
  nameEn: string;
  summaryAr: string;
  summaryEn: string;
  priceMode: 'fixed' | 'from' | 'quote';
  durationMin: number;
  fromPrice: string | null;
  basePrice: string | null;
  providerCount?: number;
};

/**
 * The price line is the point of this card, so it is the one thing that is
 * always in the same place: start-aligned, on its own row, mono figures. A
 * price that moves between cards cannot be scanned down a column.
 */
export async function ServiceCard({
  service,
  categorySlug,
  className,
}: {
  service: ServiceLike;
  categorySlug: string;
  className?: string;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('services');
  const tc = await getTranslations('common');

  const name = locale === 'ar' ? service.nameAr : service.nameEn;
  const summary = locale === 'ar' ? service.summaryAr : service.summaryEn;
  const price = formatPrice(service.fromPrice ?? service.basePrice, locale);

  return (
    <Card interactive className={cn('relative flex flex-col p-4', className)}>
      <h3 className="text-base font-semibold">
        {/* The whole card is the target; a stretched link keeps it one tab
            stop rather than wrapping every element in an anchor. */}
        <Link href={`/services/${categorySlug}/${service.slug}`} className="after:absolute after:inset-0">
          {name}
        </Link>
      </h3>

      <p className="text-steel mt-1.5 line-clamp-2 text-2xs">{summary}</p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <p className="text-2xs">
          {service.priceMode === 'quote' || !price ? (
            <span className="text-steel font-semibold">{t('quoteOnly')}</span>
          ) : (
            <>
              {service.priceMode === 'from' && <span className="text-steel">{t('from')} </span>}
              <span className="numeric text-base font-semibold">{price}</span>{' '}
              <span className="text-steel">{tc('currency')}</span>
            </>
          )}
        </p>
        <Badge className="shrink-0">{formatDuration(service.durationMin, locale)}</Badge>
      </div>
    </Card>
  );
}
