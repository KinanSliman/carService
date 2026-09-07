'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { DayOverride, WeeklyHours } from '@/server/services/availability';
import { isOpenAt, localDay, localWeekday } from '@/server/services/availability';
import { formatWallTime } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * Opening hours, plus an "open now" badge.
 *
 * The badge is computed in an effect rather than during render. The profile
 * page is statically rendered and revalidates hourly, so a server-computed
 * badge would be baked in at build and could claim a workshop is open at
 * 3 a.m. Deriving it on the client after mount keeps the page static *and*
 * the badge true — and its absence before hydration is the honest state.
 */
export function OpeningHours({
  hours,
  overrides,
}: {
  hours: WeeklyHours[];
  overrides: DayOverride[];
}) {
  const t = useTranslations('workshops');
  const weekday = useTranslations('weekday');
  const locale = useLocale() as Locale;
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    // Re-check on the minute boundary rather than on a tight timer; the badge
    // only ever changes on the hour in practice.
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const openNow = now ? isOpenAt(now, hours, overrides) : null;
  const todayWeekday = now ? localWeekday(localDay(now)) : null;

  const sorted = [...hours].sort((a, b) => a.weekday - b.weekday);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold">{t('hoursTitle')}</h2>
        {openNow !== null && (
          <span
            className={cn(
              'rounded-chip inline-flex items-center gap-1.5 px-2.5 py-0.5 text-2xs font-semibold',
              openNow ? 'bg-ok-10 text-ok' : 'bg-ink-4 text-steel',
            )}
          >
            <span className={cn('size-1.5 rounded-chip', openNow ? 'bg-ok' : 'bg-steel')} />
            {openNow ? t('openNow') : t('closedNow')}
          </span>
        )}
      </div>

      <dl className="mt-3 space-y-1.5 text-2xs">
        {sorted.map((day) => {
          const isToday = todayWeekday === day.weekday;
          return (
            <div
              key={day.weekday}
              className={cn('flex items-baseline justify-between gap-3', isToday && 'font-semibold')}
            >
              <dt className={isToday ? undefined : 'text-steel'}>
                {weekday(String(day.weekday))}
              </dt>
              <dd className={cn('latn', day.isClosed && 'text-steel')}>
                {day.isClosed || !day.opensAt || !day.closesAt ? (
                  t('closedToday')
                ) : (
                  <span dir="ltr">
                    {formatWallTime(day.opensAt, locale)} – {formatWallTime(day.closesAt, locale)}
                    {day.breakStart && day.breakEnd && (
                      <>
                        {' · '}
                        {formatWallTime(day.breakStart, locale)} –{' '}
                        {formatWallTime(day.breakEnd, locale)}
                      </>
                    )}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {/* Upcoming date-specific changes. A profile that shows only the weekly
          pattern will send somebody to a workshop that is shut for a holiday. */}
      {overrides.length > 0 && (
        <ul className="border-line mt-3 space-y-1 border-t pt-3 text-2xs">
          {overrides.map((override) => (
            <li key={override.day} className="flex items-baseline justify-between gap-3">
              <span className="latn text-steel">{override.day}</span>
              <span className="text-wait font-semibold">
                {override.isClosed
                  ? (locale === 'ar' ? override.reasonAr : override.reasonEn) ?? t('closedToday')
                  : `${override.opensAt ? formatWallTime(override.opensAt, locale) : ''} – ${
                      override.closesAt ? formatWallTime(override.closesAt, locale) : ''
                    }`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
