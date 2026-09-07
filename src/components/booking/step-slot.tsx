'use client';

import { useEffect, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { fetchAvailability, type SlotDay } from '@/server/actions/fetch-availability';
import { partOfDay } from '@/server/services/availability';
import { EmptyState, Skeleton, chipClass } from '@/components/ui/primitives';
import { formatSlotTime } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * Step three: the day rail and the slot grid.
 *
 * This is the only step that talks to the server, because availability depends
 * on the workshop, the basket's total duration, its bay count, and everything
 * already booked — none of which can be precomputed for an arbitrary basket.
 *
 * Times render in Asia/Qatar regardless of where the viewer's device is set,
 * because a workshop in Doha opens at 07:00 Doha time and showing a reviewer in
 * London "04:00" would be precisely wrong.
 */
export function StepSlot({
  providerSlug,
  durationMin,
  selected,
  onSelect,
}: {
  providerSlug: string;
  durationMin: number;
  selected: string | null;
  onSelect: (iso: string) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('booking');
  const [days, setDays] = useState<SlotDay[] | null>(null);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setDays(null);
    startTransition(async () => {
      const result = await fetchAvailability({ providerSlug, durationMin });
      if (cancelled) return;
      setDays(result);
      // Open on the first day that actually has something bookable, not on
      // today — landing on a closed Friday looks like a broken calendar.
      const firstOpen =
        result.find((day) => day.slots.some((slot) => slot.available)) ?? result[0];
      setActiveDay(firstOpen?.day ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [providerSlug, durationMin]);

  const current = days?.find((day) => day.day === activeDay) ?? null;

  return (
    <div>
      <h2 className="text-lg">{t('chooseSlot')}</h2>

      {days === null ? (
        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="rail bleed mt-4 gap-2 pb-1">
            {days.map((day) => {
              const hasSlots = day.slots.some((slot) => slot.available);
              const date = new Date(`${day.day}T12:00:00Z`);
              return (
                <button
                  key={day.day}
                  type="button"
                  aria-pressed={activeDay === day.day}
                  onClick={() => setActiveDay(day.day)}
                  className={cn(
                    'press rounded-card flex w-16 shrink-0 flex-col items-center gap-0.5 border py-2',
                    activeDay === day.day
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line bg-surface hover:border-steel/50',
                    !hasSlots && activeDay !== day.day && 'opacity-45',
                  )}
                >
                  <span className="text-2xs">
                    {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-QA' : 'en-GB', {
                      weekday: 'short',
                      timeZone: 'UTC',
                    }).format(date)}
                  </span>
                  <span className="numeric text-base font-semibold">
                    {new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' }).format(
                      date,
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {!current || current.isClosed ? (
            <div className="mt-5">
              <EmptyState
                title={
                  current?.closedReasonAr || current?.closedReasonEn
                    ? t('closedOn', {
                        reason:
                          (locale === 'ar' ? current.closedReasonAr : current.closedReasonEn) ?? '',
                      })
                    : t('noSlots')
                }
                hint={t('noSlotsHint')}
              />
            </div>
          ) : current.slots.length === 0 ? (
            <div className="mt-5">
              <EmptyState title={t('noSlots')} hint={t('noSlotsHint')} />
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {(['morning', 'afternoon', 'evening'] as const).map((part) => {
                const slots = current.slots.filter(
                  (slot) => partOfDay(new Date(slot.startsAt)) === part,
                );
                if (slots.length === 0) return null;
                return (
                  <div key={part}>
                    <h3 className="text-steel text-2xs font-semibold">{t(part)}</h3>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                      {slots.map((slot) => (
                        <button
                          key={slot.startsAt}
                          type="button"
                          disabled={!slot.available}
                          aria-pressed={selected === slot.startsAt}
                          onClick={() => onSelect(slot.startsAt)}
                          className={chipClass(
                            selected === slot.startsAt,
                            cn(
                              'numeric h-10 w-full justify-center',
                              // A taken slot stays visible but struck through:
                              // seeing that 09:00 is gone is information, and
                              // removing it makes the grid look sparse.
                              !slot.available &&
                                'cursor-not-allowed line-through opacity-40 hover:border-line',
                            ),
                          )}
                        >
                          {formatSlotTime(new Date(slot.startsAt), locale)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
