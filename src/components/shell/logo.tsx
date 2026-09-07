import { cn } from '@/lib/cn';

/**
 * The wordmark: a wrench whose head is drawn as the counter of a letterform,
 * in the same blueprint stroke weight as the car diagram. Inline SVG rather
 * than a file so it inherits `currentColor` on the dark footer and the light
 * header without shipping two assets.
 */
export function Logo({ className, label }: { className?: string; label: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 28 28"
        aria-hidden
        className="size-7 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="14" cy="14" r="12.2" className="opacity-25" />
        <path d="M18.6 9.4a3.9 3.9 0 0 1-4.9 5L9.4 18.7a1.8 1.8 0 1 1-2.5-2.5l4.3-4.3a3.9 3.9 0 0 1 5-4.9l-2.4 2.4.9 2.5 2.5.9z" />
      </svg>
      <span className="text-lg font-bold tracking-tight">{label}</span>
    </span>
  );
}
