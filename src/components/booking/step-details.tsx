'use client';

import { useTranslations } from 'next-intl';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import type { CreateBookingState } from '@/server/actions/create-booking';
import type { BookingSelection } from './booking-flow';

/**
 * Step four: contact details and submit.
 *
 * A plain `<form action={...}>` posting to the Server Action, so it works
 * before hydration finishes. The selection made in the earlier steps rides
 * along as hidden fields — the server re-validates all of it anyway.
 *
 * Error keys come back from the action and are resolved to text here, because
 * the action has no locale.
 */
export function StepDetails({
  formAction,
  isPending,
  state,
  selection,
}: {
  formAction: (formData: FormData) => void;
  isPending: boolean;
  state: CreateBookingState;
  selection: BookingSelection & { providerSlug: string };
}) {
  const t = useTranslations('booking');
  const tf = useTranslations('form');

  const errors = state.status === 'error' ? (state.fieldErrors ?? {}) : {};
  const message = (key: string | undefined) => (key ? tf(key as 'required') : undefined);

  return (
    <form action={formAction} className="space-y-5">
      <h2 className="text-lg">{t('yourDetails')}</h2>

      <input type="hidden" name="serviceSlugs" value={selection.serviceSlugs.join(',')} />
      <input type="hidden" name="providerSlug" value={selection.providerSlug} />
      <input type="hidden" name="mode" value={selection.mode} />
      <input type="hidden" name="scheduledAt" value={selection.scheduledAt ?? ''} />

      <Field label={t('name')} error={message(errors.contactName)}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="contactName"
            required
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <Field label={t('phone')} hint={t('phoneHint')} error={message(errors.contactPhone)}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="contactPhone"
            required
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            // A phone number is read left-to-right even inside an RTL layout.
            dir="ltr"
            className="numeric text-start"
            placeholder={t('phonePlaceholder')}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <Field label={t('vehicle')} error={message(errors.vehicleLabel)}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="vehicleLabel"
            required
            placeholder={t('vehiclePlaceholder')}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <Field label={t('notes')} optional optionalLabel={tf('optional')}>
        {({ id, describedBy }) => (
          <Textarea
            id={id}
            name="notes"
            maxLength={500}
            placeholder={t('notesPlaceholder')}
            aria-describedby={describedBy}
          />
        )}
      </Field>

      {/* Slot errors have no field of their own on this step — the slot was
          chosen on the previous one — so they surface here explicitly. */}
      {errors.scheduledAt && (
        <p role="alert" className="text-due text-2xs">
          {message(errors.scheduledAt)}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending ? t('submitting') : t('confirm')}
      </Button>
    </form>
  );
}
