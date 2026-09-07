'use client';

import { useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Select } from '@/components/ui/field';
import { chipClass } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';

/**
 * Filters as URL state rather than component state: the result is linkable,
 * survives a reload, and the back button undoes a filter change the way a
 * viewer expects. `router.replace` rather than `push` so ten filter tweaks do
 * not become ten history entries.
 */
export function WorkshopFilters({
  zones,
  serviceGroups,
}: {
  zones: { value: string; label: string; count: number }[];
  serviceGroups: { label: string; services: { slug: string; label: string }[] }[];
}) {
  const t = useTranslations('workshops');
  const td = useTranslations('delivery');
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  const active = ['service', 'zone', 'mode', 'verified'].filter((key) => params.get(key));

  return (
    <div className={cn('space-y-3', isPending && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label={t('filterService')}
          value={params.get('service') ?? ''}
          onChange={(event) => setParam('service', event.target.value || null)}
          className="h-9 w-auto min-w-40 text-2xs"
        >
          <option value="">{t('filterService')}</option>
          {serviceGroups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.services.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.label}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>

        <Select
          aria-label={t('filterZone')}
          value={params.get('zone') ?? ''}
          onChange={(event) => setParam('zone', event.target.value || null)}
          className="h-9 w-auto min-w-36 text-2xs"
        >
          <option value="">{t('filterZone')}</option>
          {zones.map((zone) => (
            <option key={zone.value} value={zone.value}>
              {zone.label} ({zone.count})
            </option>
          ))}
        </Select>

        <Select
          aria-label={t('sortTitle')}
          value={params.get('sort') ?? 'rating'}
          onChange={(event) => setParam('sort', event.target.value)}
          className="h-9 w-auto min-w-36 text-2xs"
        >
          <option value="rating">{t('sortRating')}</option>
          <option value="reviews">{t('sortReviews')}</option>
          <option value="price">{t('sortPrice')}</option>
          <option value="name">{t('sortName')}</option>
        </Select>
      </div>

      <div className="rail gap-2 pb-1">
        {(['at_center', 'mobile', 'pickup'] as const).map((mode) => {
          const selected = params.get('mode') === mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={selected}
              onClick={() => setParam('mode', selected ? null : mode)}
              className={chipClass(selected)}
            >
              {td(mode)}
            </button>
          );
        })}

        <button
          type="button"
          aria-pressed={params.get('verified') === '1'}
          onClick={() => setParam('verified', params.get('verified') === '1' ? null : '1')}
          className={chipClass(params.get('verified') === '1')}
        >
          {t('filterVerified')}
        </button>

        {active.length > 0 && (
          <button
            type="button"
            onClick={() => {
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className={chipClass(false, 'text-steel')}
          >
            <X className="size-3.5" aria-hidden />
            {t('clearFilters')}
          </button>
        )}
      </div>
    </div>
  );
}
