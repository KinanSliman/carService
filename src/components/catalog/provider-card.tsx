import { getLocale, getTranslations } from 'next-intl/server';
import { BadgeCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Badge, Card, Rating } from '@/components/ui/primitives';
import type { ProviderCard as ProviderRow } from '@/server/queries/providers';
import { formatDistance, formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import { ProviderMark } from './provider-mark';

/**
 * A workshop card. There is no photography in this build — stock workshop
 * photos read as filler and real ones do not exist — so identity comes from a
 * generated mark tinted by the workshop's own hue. It stays honest and it
 * costs nothing to load.
 */
export async function ProviderCard({
  provider,
  className,
  showPrice = false,
}: {
  provider: ProviderRow;
  className?: string;
  showPrice?: boolean;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('workshops');
  const ts = await getTranslations('services');
  const tc = await getTranslations('common');

  const name = locale === 'ar' ? provider.nameAr : provider.nameEn;
  const zone = locale === 'ar' ? provider.zoneAr : provider.zoneEn;
  const price = formatPrice(provider.fromPrice, locale);

  return (
    <Card interactive className={cn('relative flex flex-col p-4', className)}>
      <div className="flex items-start gap-3">
        <ProviderMark hue={provider.coverHue} logoKey={provider.logoKey} className="size-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold leading-snug">
            <Link href={`/workshops/${provider.slug}`} className="after:absolute after:inset-0">
              {name}
            </Link>
          </h3>
          <p className="text-steel mt-0.5 truncate text-2xs">
            {zone}
            {provider.zoneNumber !== null && (
              <>
                {' · '}
                <span className="latn">{t('zone', { number: provider.zoneNumber })}</span>
              </>
            )}
          </p>
        </div>
        {provider.isVerified && (
          <BadgeCheck className="text-ok size-4 shrink-0" aria-label={t('verified')} />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Rating
          value={Number(provider.ratingAvg).toFixed(1)}
          count={provider.ratingCount}
          countLabel={t('ratingCount', { count: provider.ratingCount })}
        />
        <span aria-hidden className="bg-line h-3 w-px" />
        <span className="text-steel latn text-2xs">{formatDistance(provider.distanceKm, locale)}</span>
        {showPrice && price && (
          <Badge tone="marker" className="ms-auto">
            {ts('from')} <span className="numeric">{price}</span> {tc('currency')}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {provider.deliveryModes.map((mode) => (
          <DeliveryChip key={mode} mode={mode} />
        ))}
      </div>
    </Card>
  );
}

async function DeliveryChip({ mode }: { mode: 'at_center' | 'mobile' | 'pickup' }) {
  const t = await getTranslations('delivery');
  return (
    <span className="border-line text-steel rounded-chip border px-2 py-0.5 text-2xs">
      {t(`${mode}_short`)}
    </span>
  );
}
