'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { BookingCatalog } from '@/server/queries/booking-catalog';
import { CategoryIcon } from '@/components/home/category-icon';
import { chipClass } from '@/components/ui/primitives';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * Step one: pick one or more services.
 *
 * Filtered by category chip rather than shown as 39 rows at once. The chips
 * default to "all" so the flow never opens on an empty panel — an empty first
 * step reads as broken even when it is technically correct.
 */
export function StepServices({
  catalog,
  selected,
  onChange,
}: {
  catalog: BookingCatalog;
  selected: string[];
  onChange: (slugs: string[]) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('booking');
  const ts = useTranslations('services');
  const [category, setCategory] = useState<string | null>(null);

  const shown = category
    ? catalog.categories.filter((c) => c.slug === category)
    : catalog.categories;

  const toggle = (slug: string) => {
    onChange(
      selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug],
    );
  };

  return (
    <div>
      <h2 className="text-lg">{t('chooseServices')}</h2>

      <div className="rail bleed mt-4 gap-2 pb-1">
        <button
          type="button"
          onClick={() => setCategory(null)}
          aria-pressed={category === null}
          className={chipClass(category === null)}
        >
          {ts('title')}
        </button>
        {catalog.categories.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => setCategory(item.slug)}
            aria-pressed={category === item.slug}
            className={chipClass(category === item.slug)}
          >
            <CategoryIcon iconKey={item.iconKey} className="size-3.5" />
            {item.name}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-6">
        {shown.map((group) => (
          <div key={group.slug}>
            {!category && <h3 className="text-steel text-2xs font-semibold">{group.name}</h3>}
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {group.services.map((service) => {
                const isSelected = selected.includes(service.slug);
                return (
                  <li key={service.slug}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => toggle(service.slug)}
                      className={cn(
                        'press rounded-card flex w-full items-start gap-3 border p-3 text-start',
                        isSelected
                          ? 'border-ink bg-ink-4 shadow-e1'
                          : 'border-line bg-surface hover:border-steel/50',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-[6px] border',
                          isSelected ? 'border-ink bg-ink text-paper' : 'border-line',
                        )}
                      >
                        {isSelected && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold">{service.name}</span>
                        <span className="text-steel mt-0.5 block text-2xs">
                          {service.priceMode === 'quote'
                            ? ts('quoteOnly')
                            : formatDuration(service.durationMin, locale)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
