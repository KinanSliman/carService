import { getTranslations } from 'next-intl/server';
import { Check, X } from 'lucide-react';
import type { BookingStatus } from '@/db/schema';
import { cn } from '@/lib/cn';

const FLOW: BookingStatus[] = ['requested', 'confirmed', 'in_progress', 'completed'];

/**
 * The status timeline.
 *
 * Nothing in the public UI can advance a booking — there is no admin panel in
 * this build — so this component would normally only ever be seen in its first
 * state. The seed therefore contains bookings in every status, which is what
 * makes the later states reachable at all. That is a deliberate trade, and the
 * case-study page says so.
 *
 * `canceled` is not a step in the flow: it ends it. Rendering it as a fifth
 * dot after "completed" would imply a booking passes through cancellation on
 * its way to being done.
 */
export async function StatusTimeline({ status }: { status: BookingStatus }) {
  const t = await getTranslations('status');

  if (status === 'canceled') {
    return (
      <div>
        <h2 className="text-xs font-semibold">{t('timelineTitle')}</h2>
        <div className="border-due/30 bg-due-10 rounded-card mt-3 flex items-start gap-3 border p-4">
          <span className="bg-due text-paper mt-0.5 grid size-6 shrink-0 place-items-center rounded-chip">
            <X className="size-3.5" strokeWidth={3} aria-hidden />
          </span>
          <div>
            <p className="text-due text-xs font-semibold">{t('canceled')}</p>
            <p className="text-steel mt-0.5 text-2xs">{t('canceledHint')}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = FLOW.indexOf(status);

  return (
    <div>
      <h2 className="text-xs font-semibold">{t('timelineTitle')}</h2>
      <ol className="mt-3">
        {FLOW.map((step, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;
          const last = index === FLOW.length - 1;

          return (
            <li key={step} className="flex gap-3">
              {/* The dot column, with the connector drawn as a fixed-width
                  element rather than an absolutely positioned line — absolute
                  positioning here is one of the reliable ways to break RTL. */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-chip border-2',
                    done && 'border-ok bg-ok text-paper',
                    current && 'border-ink bg-ink text-paper',
                    !done && !current && 'border-line bg-surface',
                  )}
                >
                  {done && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                  {current && <span className="bg-paper size-2 rounded-chip" />}
                </span>
                {!last && (
                  <span
                    aria-hidden
                    className={cn('w-0.5 flex-1', done ? 'bg-ok' : 'bg-line')}
                  />
                )}
              </div>

              <div className={cn('pb-5', last && 'pb-0')}>
                <p
                  className={cn(
                    'text-xs font-semibold',
                    !done && !current && 'text-steel font-normal',
                  )}
                  aria-current={current ? 'step' : undefined}
                >
                  {t(step)}
                </p>
                {current && <p className="text-steel mt-0.5 text-2xs">{t(`${step}Hint`)}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
