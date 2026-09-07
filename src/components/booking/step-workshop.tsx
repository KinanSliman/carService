'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BadgeCheck } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { BookingProvider } from '@/server/queries/booking-catalog';
import type { DeliveryMode } from '@/server/services/pricing';
import { EmptyState, Rating, chipClass } from '@/components/ui/primitives';
import { ProviderMark } from '@/components/catalog/provider-mark';
import { formatDistance, formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * Step two: delivery mode, then workshop.
 *
 * Mode comes first because it changes the list: a mobile service cannot be
 * offered by a workshop that has no van, and showing all fourteen and then
 * rejecting the choice later is worse than showing the four that can do it.
 */
export function StepWorkshop({
  providers,
  selectedSlug,
  mode,
  availableModes,
  serviceSlugs,
  onSelectProvider,
  onSelectMode,
}: {
  providers: BookingProvider[];
  selectedSlug: string | null;
  mode: DeliveryMode;
  availableModes: DeliveryMode[];
  serviceSlugs: string[];
  onSelectProvider: (slug: string) => void;
  onSelectMode: (mode: DeliveryMode) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('booking');
  const td = useTranslations('delivery');
  const tw = useTranslations('workshops');
  const ts = useTranslations('services');
  const tc = useTranslations('common');

  return (
    <div>
      <h2 className="text-lg">{t('chooseWorkshop')}</h2>

      <fieldset className="mt-4">
        <legend className="text-steel text-2xs font-semibold">{t('modeTitle')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['at_center', 'mobile', 'pickup'] as const).map((option) => {
            const enabled = availableModes.includes(option);
            return (
              <button
                key={option}
                type="button"
                disabled={!enabled}
                aria-pressed={mode === option}
                onClick={() => onSelectMode(option)}
                className={chipClass(
                  mode === option,
                  !enabled ? 'cursor-not-allowed opacity-40' : undefined,
                )}
              >
                {td(option)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {providers.length === 0 ? (
        <div className="mt-5">
          <EmptyState title={tw('noResults')} hint={tw('noResultsHint')} />
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {providers.map((provider) => {
            const isSelected = selectedSlug === provider.slug;
            // The basket's price at this workshop, so the list is comparable.
            const subtotal = serviceSlugs.reduce((sum, slug) => {
              const price = provider.offers[slug]?.price;
              return sum + (price === null || price === undefined ? 0 : Number(price));
            }, 0);
            const hasQuote = serviceSlugs.some(
              (slug) => provider.offers[slug]?.price === null,
            );

            return (
              <li key={provider.slug}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectProvider(provider.slug)}
                  className={cn(
                    'press rounded-card flex w-full items-center gap-3 border p-3 text-start',
                    isSelected
                      ? 'border-ink bg-ink-4 shadow-e1'
                      : 'border-line bg-surface hover:border-steel/50',
                  )}
                >
                  <ProviderMark
                    hue={provider.coverHue}
                    logoKey={provider.logoKey}
                    className="size-10 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-semibold">{provider.name}</span>
                      {provider.isVerified && (
                        <BadgeCheck
                          className="text-ok size-3.5 shrink-0"
                          aria-label={tw('verified')}
                        />
                      )}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <Rating
                        value={Number(provider.ratingAvg).toFixed(1)}
                        count={provider.ratingCount}
                      />
                      <span className="text-steel latn text-2xs">
                        {formatDistance(provider.distanceKm, locale)}
                      </span>
                      <span className="text-steel truncate text-2xs">{provider.zone}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-end text-2xs">
                    <span className="numeric block font-semibold">
                      {formatPrice(subtotal, locale)}
                    </span>
                    <span className="text-steel block">
                      {hasQuote ? `+ ${ts('quoteOnly')}` : tc('currency')}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
