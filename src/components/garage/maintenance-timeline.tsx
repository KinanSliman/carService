'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { GarageRule } from '@/server/queries/garage';
import type { DueItem, DueStatus } from '@/server/services/maintenance';
import { Badge, Card, EmptyState } from '@/components/ui/primitives';
import { buttonClass } from '@/components/ui/button';
import { formatOdometer, formatShortDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { GarageRecord } from './use-garage';

/**
 * The forward-projected schedule and the history behind it.
 *
 * This is the only place in the interface where `--marker` appears at rest,
 * and only on genuinely overdue items — the whole palette rule exists so that
 * when something here is yellow, it means something.
 */

const toneFor: Record<DueStatus, 'due' | 'wait' | 'ok' | 'neutral'> = {
  overdue: 'due',
  'due-now': 'due',
  'due-soon': 'wait',
  later: 'neutral',
  unknown: 'neutral',
};

export function MaintenanceTimeline({
  schedule,
  rules,
  records,
  onRemoveRecord,
}: {
  schedule: DueItem[];
  rules: GarageRule[];
  records: GarageRecord[];
  onRemoveRecord: (id: string) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('garage');

  const ruleBySlug = new Map(rules.map((rule) => [rule.serviceSlug, rule]));

  const history = [...records].sort(
    (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
  );

  /** "in 3,000 km" / "overdue by 2 months" — whichever threshold is binding. */
  const remainingLabel = (item: DueItem) => {
    if (item.status === 'due-now') return t('dueNow');

    const useKm = item.drivenBy === 'km' && item.kmRemaining !== null;
    const value = useKm
      ? t('dueInKm', { km: formatOdometer(Math.abs(item.kmRemaining!), locale) })
      : item.monthsRemaining !== null
        ? t('dueInMonths', { months: Math.abs(item.monthsRemaining) })
        : null;

    if (value === null) return t('neverDone');
    return item.status === 'overdue' ? t('overdueBy', { value }) : t('dueIn', { value });
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg">{t('upcomingTitle')}</h2>
        <ul className="mt-3 space-y-2">
          {schedule.map((item) => {
            const rule = ruleBySlug.get(item.serviceSlug);
            if (!rule) return null;
            const urgent = item.status === 'overdue' || item.status === 'due-now';

            return (
              <li key={item.serviceSlug}>
                <Card
                  className={cn(
                    'flex flex-wrap items-center gap-x-4 gap-y-2 p-4',
                    urgent && 'border-marker/60',
                  )}
                >
                  {/* The urgency stripe runs down the inline-start edge, so it
                      lands on the correct side in both directions. */}
                  <span
                    aria-hidden
                    className={cn(
                      'h-8 w-1 shrink-0 rounded-chip',
                      item.status === 'overdue' && 'bg-marker',
                      item.status === 'due-now' && 'bg-due',
                      item.status === 'due-soon' && 'bg-wait',
                      (item.status === 'later' || item.status === 'unknown') && 'bg-line',
                    )}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{rule.name}</p>
                    <p className="text-steel mt-0.5 text-2xs">
                      {item.lastPerformedAt ? (
                        <>
                          {formatShortDate(item.lastPerformedAt, locale)}
                          {item.lastOdometerKm !== null && (
                            <>
                              {' · '}
                              <span className="numeric">
                                {formatOdometer(item.lastOdometerKm, locale)}
                              </span>{' '}
                              {t('odometerUnit')}
                            </>
                          )}
                        </>
                      ) : (
                        t('neverDone')
                      )}
                    </p>
                  </div>

                  <Badge tone={toneFor[item.status]} className="shrink-0">
                    {remainingLabel(item)}
                  </Badge>

                  <Link
                    href={`/book?service=${item.serviceSlug}`}
                    className={buttonClass(urgent ? 'marker' : 'secondary', 'sm', 'shrink-0')}
                  >
                    {t('bookNow')}
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
        <p className="text-steel mt-3 text-2xs">{t('estimatedNote')}</p>
      </section>

      <section>
        <h2 className="text-lg">{t('timelineTitle')}</h2>
        {history.length === 0 ? (
          <div className="mt-3">
            <EmptyState title={t('noRecords')} hint={t('noRecordsHint')} />
          </div>
        ) : (
          <ol className="mt-3">
            {history.map((record, index) => {
              const rule = ruleBySlug.get(record.serviceSlug);
              const last = index === history.length - 1;
              return (
                <li key={record.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="border-line bg-surface mt-1 size-3 shrink-0 rounded-chip border-2" />
                    {!last && <span aria-hidden className="bg-line w-0.5 flex-1" />}
                  </div>
                  <div className={cn('flex flex-1 items-start gap-3 pb-5', last && 'pb-0')}>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{rule?.name ?? record.serviceSlug}</p>
                      <p className="text-steel mt-0.5 text-2xs">
                        {formatShortDate(new Date(record.performedAt), locale)}
                        {' · '}
                        <span className="numeric">
                          {formatOdometer(record.odometerKm, locale)}
                        </span>{' '}
                        {t('odometerUnit')}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`${t('removeCar')} — ${rule?.name ?? record.serviceSlug}`}
                      onClick={() => onRemoveRecord(record.id)}
                      className="press text-steel hover:text-due hover:bg-ink-8 rounded-input grid size-8 shrink-0 place-items-center"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
