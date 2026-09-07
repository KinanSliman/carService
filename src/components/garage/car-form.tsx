'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { GarageMake } from '@/server/queries/garage';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import type { GarageCar } from './use-garage';

/**
 * Add-a-car form.
 *
 * Validated in the browser only, because nothing here is submitted anywhere —
 * this is the one form in the build with no Server Action behind it, and
 * pretending otherwise would be theatre.
 */
export function CarForm({
  makes,
  onSave,
  onCancel,
}: {
  makes: GarageMake[];
  onSave: (car: Omit<GarageCar, 'id' | 'addedAt'>) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('garage');
  const tf = useTranslations('form');

  const [makeSlug, setMakeSlug] = useState(makes[0]?.slug ?? '');
  const [modelSlug, setModelSlug] = useState(makes[0]?.models[0]?.slug ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const make = makes.find((item) => item.slug === makeSlug) ?? null;
  const models = make?.models ?? [];
  const model = models.find((item) => item.slug === modelSlug) ?? models[0] ?? null;

  const thisYear = new Date().getFullYear();
  const years = useMemo(() => {
    if (!model) return [];
    const last = model.yearTo ?? thisYear;
    const out: number[] = [];
    for (let year = last; year >= model.yearFrom; year -= 1) out.push(year);
    return out;
  }, [model, thisYear]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const year = Number(data.get('year'));
    const odometerKm = Number(data.get('odometer'));
    const plate = String(data.get('plate') ?? '').trim();

    const nextErrors: Record<string, string> = {};
    if (!make || !model) nextErrors.model = tf('required');
    if (!Number.isInteger(year) || year < 1980 || year > thisYear + 1) {
      nextErrors.year = tf('yearInvalid');
    }
    if (!Number.isFinite(odometerKm) || odometerKm < 0 || odometerKm > 2_000_000) {
      nextErrors.odometer = tf('odometerInvalid');
    }
    if (!/^\d{1,6}$/.test(plate)) nextErrors.plate = tf('required');

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !make || !model) return;

    onSave({
      makeSlug: make.slug,
      modelSlug: model.slug,
      label: `${make.name} ${model.name}`,
      year,
      plate,
      odometerKm: Math.round(odometerKm),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg">{t('addCar')}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('make')}>
          {({ id }) => (
            <Select
              id={id}
              name="make"
              value={makeSlug}
              onChange={(event) => {
                const next = event.target.value;
                setMakeSlug(next);
                // The old model belongs to the old make; carrying it over is
                // how a form ends up saving "Toyota Patrol".
                setModelSlug(makes.find((m) => m.slug === next)?.models[0]?.slug ?? '');
              }}
            >
              {makes.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('model')} error={errors.model}>
          {({ id, invalid }) => (
            <Select
              id={id}
              name="model"
              value={modelSlug}
              aria-invalid={invalid}
              onChange={(event) => setModelSlug(event.target.value)}
            >
              {models.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('year')} error={errors.year}>
          {({ id, invalid }) => (
            <Select id={id} name="year" aria-invalid={invalid} className="numeric">
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('plate')} error={errors.plate}>
          {({ id, invalid }) => (
            <Input
              id={id}
              name="plate"
              inputMode="numeric"
              maxLength={6}
              dir="ltr"
              className="numeric text-start"
              placeholder={t('platePlaceholder')}
              aria-invalid={invalid}
            />
          )}
        </Field>
      </div>

      <Field label={`${t('odometer')} (${t('odometerUnit')})`} error={errors.odometer}>
        {({ id, invalid }) => (
          <Input
            id={id}
            name="odometer"
            type="number"
            min={0}
            step={100}
            dir="ltr"
            className="numeric text-start"
            placeholder="120000"
            aria-invalid={invalid}
          />
        )}
      </Field>

      <div className="flex gap-2">
        <Button type="submit" size="lg" className="flex-1">
          {t('save')}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
