'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Info, Plus, Trash2 } from 'lucide-react';
import type { Locale } from '@/i18n/routing';
import type { GarageMake, GarageRule } from '@/server/queries/garage';
import { buildSchedule } from '@/server/services/maintenance';
import { Card, EmptyState, Skeleton } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { useGarage } from './use-garage';
import { CarForm } from './car-form';
import { MaintenanceTimeline } from './maintenance-timeline';
import { ServiceLogForm } from './service-log-form';
import { formatOdometer } from '@/lib/format';

/**
 * The demo garage.
 *
 * The projection runs on the client against `maintenance.ts` — the same pure
 * module the tests cover. The car never leaves the browser, so there is
 * nothing to send anywhere and no reason to.
 */
export function Garage({ makes, rules }: { makes: GarageMake[]; rules: GarageRule[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('garage');
  const { state, hydrated, addCar, removeCar, addRecord, removeRecord } = useGarage();
  const [adding, setAdding] = useState(false);
  const [logging, setLogging] = useState(false);

  // One car at a time keeps the screen legible; the storage layer holds a list
  // so multi-car is a UI change rather than a migration.
  const car = state.cars[0] ?? null;

  const records = useMemo(
    () => (car ? state.records.filter((record) => record.carId === car.id) : []),
    [car, state.records],
  );

  const schedule = useMemo(() => {
    if (!car) return [];
    return buildSchedule(
      rules.map((rule) => ({
        serviceSlug: rule.serviceSlug,
        intervalKm: rule.intervalKm,
        intervalMonths: rule.intervalMonths,
      })),
      { odometerKm: car.odometerKm },
      records.map((record) => ({
        serviceSlug: record.serviceSlug,
        performedAt: new Date(record.performedAt),
        odometerKm: record.odometerKm,
      })),
      new Date(),
    );
  }, [car, records, rules]);

  // Before hydration there is no way to know whether a car exists, so the page
  // shows the shape of the answer rather than flashing the empty state.
  if (!hydrated) {
    return (
      <div className="space-y-4 pb-14">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="pb-14">
        {adding ? (
          <Card className="p-5 sm:p-6">
            <CarForm
              makes={makes}
              onCancel={() => setAdding(false)}
              onSave={(value) => {
                addCar(value);
                setAdding(false);
              }}
            />
          </Card>
        ) : (
          <EmptyState
            title={t('empty')}
            hint={t('emptyHint')}
            action={
              <Button size="lg" onClick={() => setAdding(true)} className="gap-2">
                <Plus className="size-4" aria-hidden />
                {t('addCar')}
              </Button>
            }
          />
        )}
        <LocalOnlyNote />
      </div>
    );
  }

  return (
    <div className="grid gap-6 pb-14 lg:grid-cols-[20rem_1fr] lg:gap-10">
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg">{car.label}</h2>
              <p className="text-steel latn mt-0.5 text-2xs">{car.year}</p>
            </div>
            <button
              type="button"
              aria-label={t('removeCar')}
              onClick={() => {
                if (window.confirm(t('removeConfirm'))) removeCar(car.id);
              }}
              className="press text-steel hover:text-due hover:bg-ink-8 rounded-input -me-2 grid size-9 shrink-0 place-items-center"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>

          <dl className="border-line mt-4 space-y-2 border-t pt-4 text-2xs">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-steel">{t('plate')}</dt>
              {/* A plate is read digit by digit and always left to right. */}
              <dd className="numeric" dir="ltr">
                {car.plate}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-steel">{t('odometer')}</dt>
              <dd className="numeric">
                {formatOdometer(car.odometerKm, locale)}{' '}
                <span className="text-steel">{t('odometerUnit')}</span>
              </dd>
            </div>
          </dl>

          <Button
            variant="secondary"
            onClick={() => setLogging((value) => !value)}
            className="mt-4 w-full gap-2"
          >
            <Plus className="size-4" aria-hidden />
            {t('logService')}
          </Button>
        </Card>

        {logging && (
          <Card className="p-5">
            <ServiceLogForm
              rules={rules}
              defaultOdometer={car.odometerKm}
              onCancel={() => setLogging(false)}
              onSave={(value) => {
                addRecord({ ...value, carId: car.id });
                setLogging(false);
              }}
            />
          </Card>
        )}

        <LocalOnlyNote />
      </div>

      <MaintenanceTimeline
        schedule={schedule}
        rules={rules}
        records={records}
        onRemoveRecord={removeRecord}
      />
    </div>
  );
}

function LocalOnlyNote() {
  const t = useTranslations('garage');
  return (
    <p className="text-steel measure mt-6 flex items-start gap-2 text-2xs">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      {t('localOnly')}
    </p>
  );
}
