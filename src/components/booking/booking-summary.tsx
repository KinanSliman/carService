'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { BookingProvider } from '@/server/queries/booking-catalog';
import type { DeliveryMode } from '@/server/services/pricing';
import { Card } from '@/components/ui/primitives';
import { formatDuration, formatPrice, formatSlotDate, formatSlotTime } from '@/lib/format';

/**
 * The running summary. Always on screen, on both breakpoints — on desktop as a
 * sticky column, on mobile as the block above the sheet, so the total is never
 * something you have to scroll to find.
 *
 * The quote-only note is not fine print. When a basket contains a service that
 * needs an inspection, the number shown is a partial total, and saying so is
 * the difference between a price and a surprise.
 */
export function BookingSummary({
  services,
  provider,
  mode,
  scheduledAt,
  totals,
  onEditServices,
}: {
  services: { slug: string; name: string; price: string | null; durationMin: number }[];
  provider: BookingProvider | null;
  mode: DeliveryMode;
  scheduledAt: string | null;
  totals: {
    subtotal: number;
    calloutFee: number;
    total: number;
    durationMin: number;
    hasQuoteItems: boolean;
  };
  onEditServices: () => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('booking');
  const ts = useTranslations('services');
  const tc = useTranslations('common');
  const td = useTranslations('delivery');

  return (
    <aside className="order-1 lg:order-2">
      <Card className="p-4 sm:p-5 lg:sticky lg:top-24">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-semibold">{t('summary')}</h2>
          {services.length > 0 && (
            <button
              type="button"
              onClick={onEditServices}
              className="press text-steel hover:text-ink text-2xs underline underline-offset-4"
            >
              {t('changeService')}
            </button>
          )}
        </div>

        {services.length === 0 ? (
          <p className="text-steel mt-3 text-2xs">{t('selectedCount', { count: 0 })}</p>
        ) : (
          <ul className="divide-line mt-3 divide-y text-2xs">
            {services.map((service) => (
              <li key={service.slug} className="flex items-start justify-between gap-3 py-2">
                <span className="min-w-0 flex-1">{service.name}</span>
                <span className="shrink-0">
                  {service.price === null ? (
                    <span className="text-steel">{ts('quoteOnly')}</span>
                  ) : (
                    <span className="numeric font-semibold">
                      {formatPrice(service.price, locale)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {provider && (
          <div className="border-line mt-3 space-y-1 border-t pt-3 text-2xs">
            <p className="font-semibold">{provider.name}</p>
            <p className="text-steel">{td(mode)}</p>
            {scheduledAt && (
              <p className="text-steel">
                {formatSlotDate(new Date(scheduledAt), locale)}
                {' · '}
                <span className="numeric">{formatSlotTime(new Date(scheduledAt), locale)}</span>
              </p>
            )}
            {totals.durationMin > 0 && (
              <p className="text-steel">
                {t('duration')}: {formatDuration(totals.durationMin, locale)}
              </p>
            )}
          </div>
        )}

        {services.length > 0 && (
          <dl className="border-line mt-3 space-y-1.5 border-t pt-3 text-2xs">
            <div className="flex justify-between gap-3">
              <dt className="text-steel">{t('subtotal')}</dt>
              <dd className="numeric">{formatPrice(totals.subtotal, locale)}</dd>
            </div>
            {totals.calloutFee > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-steel">{t('callout')}</dt>
                <dd className="numeric">{formatPrice(totals.calloutFee, locale)}</dd>
              </div>
            )}
            <div className="border-line flex items-baseline justify-between gap-3 border-t pt-2">
              <dt className="font-semibold">{t('total')}</dt>
              <dd>
                <span className="numeric text-lg font-semibold">
                  {formatPrice(totals.total, locale)}
                </span>{' '}
                <span className="text-steel">{tc('currency')}</span>
              </dd>
            </div>
          </dl>
        )}

        {totals.hasQuoteItems && (
          <p className="bg-wait-10 text-wait rounded-input mt-3 p-2.5 text-2xs">
            {t('quoteNote')}
          </p>
        )}
      </Card>
    </aside>
  );
}
