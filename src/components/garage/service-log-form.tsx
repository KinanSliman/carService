'use client';

import { type FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GarageRule } from '@/server/queries/garage';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import type { GarageRecord } from './use-garage';

/** Logs a past service, which is what makes the next-due projection real. */
export function ServiceLogForm({
  rules,
  defaultOdometer,
  onSave,
  onCancel,
}: {
  rules: GarageRule[];
  defaultOdometer: number;
  onSave: (record: Omit<GarageRecord, 'id' | 'carId'>) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('garage');
  const tf = useTranslations('form');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().slice(0, 10);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const serviceSlug = String(data.get('service') ?? '');
    const performedAt = String(data.get('date') ?? '');
    const odometerKm = Number(data.get('odometer'));

    const nextErrors: Record<string, string> = {};
    if (!serviceSlug) nextErrors.service = tf('required');
    // A service logged in the future would project a next-due date behind it.
    if (!performedAt || performedAt > today) nextErrors.date = tf('required');
    if (!Number.isFinite(odometerKm) || odometerKm < 0) {
      nextErrors.odometer = tf('odometerInvalid');
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({
      serviceSlug,
      performedAt: new Date(`${performedAt}T00:00:00Z`).toISOString(),
      odometerKm: Math.round(odometerKm),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xs font-semibold">{t('logServiceTitle')}</h2>

      <Field label={t('logService')} error={errors.service}>
        {({ id, invalid }) => (
          <Select id={id} name="service" aria-invalid={invalid}>
            {rules.map((rule) => (
              <option key={rule.serviceSlug} value={rule.serviceSlug}>
                {rule.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label={t('serviceDate')} error={errors.date}>
        {({ id, invalid }) => (
          <Input
            id={id}
            name="date"
            type="date"
            max={today}
            defaultValue={today}
            dir="ltr"
            className="numeric text-start"
            aria-invalid={invalid}
          />
        )}
      </Field>

      <Field label={`${t('serviceOdometer')} (${t('odometerUnit')})`} error={errors.odometer}>
        {({ id, invalid }) => (
          <Input
            id={id}
            name="odometer"
            type="number"
            min={0}
            step={100}
            defaultValue={defaultOdometer}
            dir="ltr"
            className="numeric text-start"
            aria-invalid={invalid}
          />
        )}
      </Field>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {t('save')}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
