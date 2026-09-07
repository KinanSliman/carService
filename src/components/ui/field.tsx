'use client';

import { type ComponentProps, type ReactNode, useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * Form fields with field-level error text, wired up properly:
 * `aria-describedby` points at hint and error, `aria-invalid` flips on the
 * input itself, and the error is `role="alert"` so a screen reader announces
 * it when a Server Action returns.
 *
 * Errors are red *and* prefixed with an icon — colour alone fails for the
 * ~5% of male viewers with a red-green deficiency, and this interface has a
 * red status colour (`--due`) in play elsewhere.
 */

export function Field({
  label,
  hint,
  error,
  optional,
  optionalLabel,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  optionalLabel?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline gap-2 text-2xs font-semibold">
        {label}
        {optional && optionalLabel && (
          <span className="text-steel font-normal">({optionalLabel})</span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-steel text-2xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-due flex items-start gap-1.5 text-2xs">
          <svg viewBox="0 0 16 16" aria-hidden className="mt-[0.3em] size-3.5 shrink-0 fill-current">
            <path d="M8 1.5 15 14H1L8 1.5Zm0 4.2a.8.8 0 0 0-.8.85l.2 3.1a.6.6 0 0 0 1.2 0l.2-3.1A.8.8 0 0 0 8 5.7Zm0 5.3a.85.85 0 1 0 0 1.7.85.85 0 0 0 0-1.7Z" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

const controlBase =
  'w-full rounded-input border bg-surface px-3.5 text-xs transition-colors ' +
  'placeholder:text-steel/60 disabled:opacity-50 ' +
  'aria-[invalid=true]:border-due aria-[invalid=true]:bg-due-10/40';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlBase, 'border-line h-11', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea className={cn(controlBase, 'border-line min-h-24 py-2.5', className)} {...props} />
  );
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        controlBase,
        'border-line h-11 appearance-none bg-[length:1rem] bg-no-repeat pe-9',
        // A chevron drawn in the background so the arrow sits on the inline-end
        // edge in both directions; a native arrow lands on the wrong side in RTL.
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%235D6E73'%3E%3Cpath d='M4 6l4 4 4-4z'/%3E%3C/svg%3E\")]",
        'bg-[position:right_0.85rem_center] rtl:bg-[position:left_0.85rem_center]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
