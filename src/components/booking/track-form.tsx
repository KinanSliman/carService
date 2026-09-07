'use client';

import { useActionState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { Card } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { lookupBooking, type LookupState } from '@/server/actions/lookup-booking';

/**
 * Lookup by code plus the last four digits of the phone.
 *
 * This is not authentication and the page does not pretend otherwise — the
 * hint underneath points at the case-study page, where demo codes are listed
 * on purpose so a reviewer can exercise the flow without booking first.
 */
export function TrackForm() {
  const t = useTranslations('track');
  const tf = useTranslations('form');
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<LookupState, FormData>(lookupBooking, {
    status: 'idle',
  });

  useEffect(() => {
    if (state.status === 'found') router.push(`/booking/${state.code}`);
  }, [state, router]);

  const errors = state.status === 'error' ? (state.fieldErrors ?? {}) : {};
  const message = (key: string | undefined) => (key ? tf(key as 'required') : undefined);

  return (
    <Card className="p-5 sm:p-6">
      <form action={formAction} className="space-y-5">
        <Field label={t('codeLabel')} error={message(errors.code)}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="code"
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              // A booking code is a Latin string read left to right, whichever
              // direction the page runs in.
              dir="ltr"
              className="numeric text-start uppercase tracking-wider"
              placeholder={t('codePlaceholder')}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        <Field label={t('phoneLabel')} error={message(errors.last4)}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="last4"
              required
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              autoComplete="off"
              dir="ltr"
              className="numeric text-start tracking-wider"
              placeholder={t('phonePlaceholder')}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>

        {state.status === 'error' && state.formError && (
          <p role="alert" className="text-due bg-due-10 rounded-input p-3 text-2xs">
            {state.formError === 'notFound' ? t('notFound') : tf(state.formError as 'serverError')}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isPending} className="w-full">
          {isPending ? t('submitting') : t('submit')}
        </Button>
      </form>

      <p className="text-steel mt-5 flex items-start gap-2 text-2xs">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <Link href="/about" className="underline underline-offset-4">
            {t('demoHint')}
          </Link>
        </span>
      </p>
    </Card>
  );
}
