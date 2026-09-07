'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { BookingCatalog } from '@/server/queries/booking-catalog';
import { createBooking, type CreateBookingState } from '@/server/actions/create-booking';
import { CALLOUT_FEES, type DeliveryMode } from '@/server/services/pricing';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { StepServices } from './step-services';
import { StepWorkshop } from './step-workshop';
import { StepSlot } from './step-slot';
import { StepDetails } from './step-details';
import { BookingSummary } from './booking-summary';

export type BookingSelection = {
  serviceSlugs: string[];
  providerSlug: string | null;
  mode: DeliveryMode;
  /** ISO instant. */
  scheduledAt: string | null;
};

const STEPS = ['stepService', 'stepWorkshop', 'stepSlot', 'stepDetails'] as const;

/**
 * The whole booking flow in one panel, as briefed: four steps that swap inside
 * a fixed frame with the summary always visible, rather than four pages with a
 * back button.
 *
 * The catalog arrives with the page, so steps one and two involve no network
 * at all — only the slot step reaches the server, because availability is the
 * one thing that cannot be precomputed for every basket.
 *
 * Totals are computed here for display and computed *again* on the server at
 * submit. The client copy is a preview; the server copy is the one that is
 * written.
 */
export function BookingFlow({
  catalog,
  initialServices,
  initialProvider,
}: {
  catalog: BookingCatalog;
  initialServices: string[];
  initialProvider: string | null;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('booking');
  const tf = useTranslations('form');
  const router = useRouter();

  const [selection, setSelection] = useState<BookingSelection>({
    serviceSlugs: initialServices,
    providerSlug: initialProvider,
    mode: 'at_center',
    scheduledAt: null,
  });

  // Arriving from "book at this workshop" with no service chosen still starts
  // at step one — the workshop is remembered, not skipped past.
  const [step, setStep] = useState(() => (initialServices.length > 0 ? 1 : 0));

  const [state, formAction, isPending] = useActionState<CreateBookingState, FormData>(
    createBooking,
    { status: 'idle' },
  );

  useEffect(() => {
    if (state.status === 'success') router.push(`/booking/${state.code}`);
  }, [state, router]);

  const servicesBySlug = useMemo(() => {
    const map = new Map<string, BookingCatalog['categories'][number]['services'][number]>();
    for (const category of catalog.categories) {
      for (const service of category.services) map.set(service.slug, service);
    }
    return map;
  }, [catalog]);

  const chosenServices = selection.serviceSlugs
    .map((slug) => servicesBySlug.get(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  /** Workshops that cover the whole basket and support the chosen mode. */
  const eligibleProviders = useMemo(() => {
    if (selection.serviceSlugs.length === 0) return [];
    return catalog.providers
      .filter(
        (provider) =>
          provider.deliveryModes.includes(selection.mode) &&
          selection.serviceSlugs.every((slug) => provider.offers[slug]),
      )
      .sort((a, b) => Number(b.ratingAvg) - Number(a.ratingAvg));
  }, [catalog.providers, selection.serviceSlugs, selection.mode]);

  const provider = eligibleProviders.find((p) => p.slug === selection.providerSlug) ?? null;

  /** Priced against the chosen workshop; falls back to nothing before one is picked. */
  const lineItems = useMemo(() => {
    if (!provider) return [];
    return selection.serviceSlugs.map((slug) => {
      const offer = provider.offers[slug]!;
      return {
        slug,
        name: servicesBySlug.get(slug)?.name ?? slug,
        price: offer.price,
        durationMin: offer.durationMin,
      };
    });
  }, [provider, selection.serviceSlugs, servicesBySlug]);

  const totals = useMemo(() => {
    const subtotalMinor = lineItems.reduce(
      (sum, item) => sum + (item.price === null ? 0 : Math.round(Number(item.price) * 100)),
      0,
    );
    const calloutMinor = Math.round(CALLOUT_FEES[selection.mode] * 100);
    return {
      subtotal: subtotalMinor / 100,
      calloutFee: calloutMinor / 100,
      total: (subtotalMinor + calloutMinor) / 100,
      durationMin: lineItems.reduce((sum, item) => sum + item.durationMin, 0),
      hasQuoteItems: lineItems.some((item) => item.price === null),
    };
  }, [lineItems, selection.mode]);

  // The service step's durations are the catalog's; only once a workshop is
  // chosen does the real duration (and therefore the real slot length) exist.
  const durationForSlots =
    totals.durationMin || chosenServices.reduce((sum, s) => sum + s.durationMin, 0);

  const canAdvance = [
    selection.serviceSlugs.length > 0,
    Boolean(provider),
    Boolean(selection.scheduledAt),
    true,
  ];

  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;
  const Back = locale === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="grid gap-6 pb-14 lg:grid-cols-[1fr_20rem] lg:gap-10">
      <div className="bg-surface border-line rounded-sheet shadow-e2 order-2 border lg:order-1">
        {/* Step indicator. A row of labels rather than a progress bar: four
            named steps tell you where you are, a 50% bar does not. */}
        <ol className="border-line flex items-center gap-1 border-b px-4 py-3 text-2xs sm:px-6">
          {STEPS.map((key, index) => {
            const done = index < step;
            const current = index === step;
            return (
              <li key={key} className="flex min-w-0 items-center gap-1">
                {index > 0 && <span aria-hidden className="bg-line mx-1 h-px w-3 shrink-0" />}
                <button
                  type="button"
                  // Only steps already completed are navigable; jumping forward
                  // into a step whose prerequisite is unmet renders an empty one.
                  disabled={!done}
                  onClick={() => setStep(index)}
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'press rounded-chip truncate px-2 py-1 font-semibold',
                    current && 'bg-ink text-paper',
                    done && 'text-ink hover:bg-ink-8',
                    !current && !done && 'text-steel cursor-default',
                  )}
                >
                  {done ? <Check className="me-1 inline size-3" aria-hidden /> : null}
                  {t(key)}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="p-4 sm:p-6">
          {step === 0 && (
            <StepServices
              catalog={catalog}
              selected={selection.serviceSlugs}
              onChange={(serviceSlugs) =>
                setSelection((current) => ({
                  ...current,
                  serviceSlugs,
                  // Changing the basket can invalidate the workshop and the slot.
                  providerSlug:
                    current.providerSlug &&
                    serviceSlugs.every(
                      (slug) =>
                        catalog.providers.find((p) => p.slug === current.providerSlug)?.offers[
                          slug
                        ],
                    )
                      ? current.providerSlug
                      : null,
                  scheduledAt: null,
                }))
              }
            />
          )}

          {step === 1 && (
            <StepWorkshop
              providers={eligibleProviders}
              selectedSlug={selection.providerSlug}
              mode={selection.mode}
              availableModes={availableModes(chosenServices)}
              serviceSlugs={selection.serviceSlugs}
              onSelectProvider={(providerSlug) =>
                setSelection((current) => ({ ...current, providerSlug, scheduledAt: null }))
              }
              onSelectMode={(mode) =>
                setSelection((current) => ({
                  ...current,
                  mode,
                  providerSlug: null,
                  scheduledAt: null,
                }))
              }
            />
          )}

          {step === 2 && provider && (
            <StepSlot
              providerSlug={provider.slug}
              durationMin={durationForSlots}
              selected={selection.scheduledAt}
              onSelect={(scheduledAt) => setSelection((current) => ({ ...current, scheduledAt }))}
            />
          )}

          {step === 3 && provider && selection.scheduledAt && (
            <StepDetails
              formAction={formAction}
              isPending={isPending}
              state={state}
              selection={{ ...selection, providerSlug: provider.slug }}
            />
          )}
        </div>

        {step < 3 && (
          <div className="border-line flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-6">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="gap-2"
            >
              <Back className="size-4" aria-hidden />
              {t('back')}
            </Button>
            <Button
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={!canAdvance[step]}
              className="gap-2"
            >
              {t('next')}
              <Arrow className="size-4" aria-hidden />
            </Button>
          </div>
        )}

        {state.status === 'error' && state.formError && (
          <p role="alert" className="text-due border-line border-t px-4 py-3 text-2xs sm:px-6">
            {tf(state.formError as 'serverError')}
          </p>
        )}
      </div>

      {/* The summary is always visible, on both breakpoints — it is the thing
          that stops a four-step flow feeling like a form you cannot see the end
          of. */}
      <BookingSummary
        services={chosenServices.map((service) => ({
          slug: service.slug,
          name: service.name,
          price: provider?.offers[service.slug]?.price ?? null,
          durationMin: provider?.offers[service.slug]?.durationMin ?? service.durationMin,
        }))}
        provider={provider}
        mode={selection.mode}
        scheduledAt={selection.scheduledAt}
        totals={totals}
        onEditServices={() => setStep(0)}
      />
    </div>
  );
}

/** Modes every service in the basket supports; the intersection, not the union. */
function availableModes(
  services: { deliveryModes: DeliveryMode[] }[],
): DeliveryMode[] {
  const all: DeliveryMode[] = ['at_center', 'mobile', 'pickup'];
  if (services.length === 0) return all;
  return all.filter((mode) => services.every((service) => service.deliveryModes.includes(mode)));
}
