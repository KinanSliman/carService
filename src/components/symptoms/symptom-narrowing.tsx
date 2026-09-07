'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Info, RotateCcw } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { SymptomDetail } from '@/server/queries/catalog';
import { Badge, Card } from '@/components/ui/primitives';
import { Button, buttonClass } from '@/components/ui/button';
import { formatDuration, formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * The guided narrowing: one question, one answer, a short verdict, and one to
 * three recommended services.
 *
 * Deliberately one question deep. A decision tree that keeps asking is a
 * diagnostic questionnaire, and the honest answer after two or three questions
 * is still "a technician has to look at it" — so the flow stops where its
 * confidence does, and says so.
 */
export function SymptomNarrowing({ detail }: { detail: SymptomDetail }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('symptoms');
  const ts = useTranslations('services');
  const tc = useTranslations('common');
  const [answer, setAnswer] = useState<string | null>(null);

  const { symptom, options, recommended } = detail;
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  const selected = options.find((option) => option.optionKey === answer) ?? null;

  const services = useMemo(() => {
    if (answer === null) return [];
    // Rows with a null optionKey are the baseline — recommended whichever
    // answer was given — so they always come through.
    return recommended
      .filter((row) => row.optionKey === null || row.optionKey === answer)
      .sort((a, b) => a.rank - b.rank);
  }, [answer, recommended]);

  const urgencyTone = symptom.urgency === 3 ? 'due' : symptom.urgency === 2 ? 'wait' : 'neutral';

  return (
    <div className="pb-14">
      <Badge tone={urgencyTone}>{t(`urgency${symptom.urgency}` as 'urgency1')}</Badge>

      <Card className="mt-4 p-5 sm:p-6">
        <p className="text-steel text-2xs font-semibold">
          {t('step', { current: answer ? 2 : 1, total: 2 })}
        </p>
        <h2 className="mt-1 text-lg sm:text-xl">
          {locale === 'ar' ? symptom.questionAr : symptom.questionEn}
        </h2>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const isSelected = answer === option.optionKey;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setAnswer(isSelected ? null : option.optionKey)}
                  className={cn(
                    'press rounded-card w-full border p-4 text-start text-xs font-semibold',
                    isSelected
                      ? 'border-ink bg-ink text-paper shadow-e2'
                      : 'border-line bg-surface hover:border-steel/50 hover:shadow-e1',
                  )}
                >
                  {locale === 'ar' ? option.labelAr : option.labelEn}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {selected && (
        <div className="animate-fade-rise mt-6">
          {/* The verdict is the actual product of this flow — the sentence that
              tells someone whether to drive the car. It sits above the service
              list, not below it. */}
          <Card className="border-marker/50 bg-marker-12/60 p-5">
            <p className="measure text-xs font-semibold">
              {locale === 'ar' ? selected.verdictAr : selected.verdictEn}
            </p>
          </Card>

          <h2 className="mt-8 text-lg">{t('recommended')}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const price = formatPrice(service.fromPrice ?? service.basePrice, locale);
              return (
                <li key={service.id}>
                  <Card interactive className="relative flex h-full flex-col p-4">
                    <h3 className="text-xs font-semibold">
                      <Link
                        href={`/services/${service.categorySlug}/${service.slug}`}
                        className="after:absolute after:inset-0"
                      >
                        {locale === 'ar' ? service.nameAr : service.nameEn}
                      </Link>
                    </h3>
                    <p className="text-steel mt-1.5 line-clamp-3 text-2xs">
                      {locale === 'ar' ? service.summaryAr : service.summaryEn}
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <p className="text-2xs">
                        {price ? (
                          <>
                            <span className="text-steel">{ts('from')} </span>
                            <span className="numeric font-semibold">{price}</span>{' '}
                            <span className="text-steel">{tc('currency')}</span>
                          </>
                        ) : (
                          <span className="text-steel font-semibold">{ts('quoteOnly')}</span>
                        )}
                      </p>
                      <Badge className="shrink-0">
                        {formatDuration(service.durationMin, locale)}
                      </Badge>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/book?service=${services.map((s) => s.slug).join(',')}`}
              className={buttonClass('primary', 'lg', 'gap-2')}
            >
              {ts('bookThis')}
              <Arrow className="size-4" aria-hidden />
            </Link>
            <Button variant="ghost" size="md" onClick={() => setAnswer(null)} className="gap-2">
              <RotateCcw className="size-4" aria-hidden />
              {t('startOver')}
            </Button>
          </div>

          <p className="text-steel measure mt-8 flex items-start gap-2 text-2xs">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('disclaimer')}
          </p>
        </div>
      )}
    </div>
  );
}
