import type { ComponentProps, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The resting card: one elevation step, 12px radius, hairline border. The
 * border is what stops a white card disappearing into a white section — the
 * shadow alone is too soft on a laptop screen at an angle.
 */
export function Card({
  className,
  interactive = false,
  ...props
}: ComponentProps<'div'> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'bg-surface border-line rounded-card border shadow-e1',
        interactive && 'press hover:shadow-e2 hover:border-steel/40',
        className,
      )}
      {...props}
    />
  );
}

export function Section({
  title,
  action,
  children,
  className,
  headingLevel: Heading = 'h2',
  description,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headingLevel?: ElementType;
}) {
  return (
    <section className={cn('py-10 sm:py-14', className)}>
      {(title || action) && (
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            {title && <Heading className="text-lg sm:text-xl">{title}</Heading>}
            {description && <p className="text-steel measure mt-1 text-xs">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Container({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-6xl px-[var(--container-pad)]', className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Labels                                                                      */
/* -------------------------------------------------------------------------- */

type BadgeTone = 'neutral' | 'ok' | 'due' | 'wait' | 'marker' | 'ink';

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-ink-4 text-steel border-line',
  ok: 'bg-ok-10 text-ok border-ok/20',
  due: 'bg-due-10 text-due border-due/20',
  wait: 'bg-wait-10 text-wait border-wait/25',
  marker: 'bg-marker-12 text-ink border-marker/40',
  ink: 'bg-ink text-paper border-ink',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: ComponentProps<'span'> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'rounded-chip inline-flex items-center gap-1 border px-2.5 py-0.5 text-2xs font-semibold',
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

/**
 * A selectable chip. Rendered as a real `<button>` or `<a>` by the caller —
 * this is only the surface, so the same look can carry a link in the symptom
 * rail and a toggle in the filter bar.
 */
export function chipClass(selected = false, className?: string) {
  return cn(
    'press rounded-chip inline-flex h-9 items-center gap-1.5 border px-3.5 text-2xs font-semibold whitespace-nowrap',
    selected
      ? 'bg-ink text-paper border-ink shadow-e1'
      : 'bg-surface text-ink border-line hover:border-steel/50',
    className,
  );
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Skeletons mirror the real layout rather than showing a centred spinner: a
 * spinner tells the viewer to wait, a skeleton tells them what is arriving.
 * The shimmer is opacity-only so it costs nothing on a mid-range phone.
 */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn('bg-ink-8 animate-pulse rounded-input', className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Rating                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A single filled star plus the number, not five stars. Five glyphs at 13px
 * are a texture, not a value — and the number is what people actually compare.
 */
export function Rating({
  value,
  count,
  countLabel,
  className,
}: {
  value: string;
  count?: number;
  countLabel?: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      <svg
        viewBox="0 0 20 20"
        aria-hidden
        className="fill-marker size-3.5 translate-y-[0.15em]"
      >
        <path d="M10 1.6l2.47 5.2 5.53.75-4.05 3.84 1.02 5.6L10 14.3l-4.97 2.69 1.02-5.6L2 7.55l5.53-.75z" />
      </svg>
      <span className="numeric text-2xs font-semibold">{value}</span>
      {count !== undefined && (
        <span className="text-steel text-2xs">
          <span className="latn">({count})</span>
          {countLabel && <span className="sr-only"> {countLabel}</span>}
        </span>
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  title,
  hint,
  action,
  className,
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-line rounded-card bg-surface/60 border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-steel mx-auto mt-1 max-w-sm text-xs">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
