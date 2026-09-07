import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'marker';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  // Deep petrol, not black. The only full-weight action on a screen.
  primary:
    'bg-ink text-paper shadow-e1 hover:bg-ink/90 hover:shadow-e2 active:shadow-none',
  secondary:
    'bg-surface text-ink border border-line shadow-e1 hover:border-steel/50 hover:shadow-e2 active:shadow-none',
  ghost: 'bg-transparent text-ink hover:bg-ink-8',
  // Paint-marker yellow carries dark text: on #F2B705 the ink is 9.4:1, and
  // white would be 1.9:1. It is used at most once per view.
  marker: 'bg-marker text-ink shadow-e1 hover:brightness-[1.04] hover:shadow-e2 active:shadow-none',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-2xs gap-1.5 rounded-input',
  md: 'h-11 px-5 text-xs gap-2 rounded-input',
  lg: 'h-13 px-6 text-base gap-2.5 rounded-input',
};

const base =
  'press inline-flex items-center justify-center font-semibold whitespace-nowrap ' +
  'disabled:pointer-events-none disabled:opacity-50 select-none';

export type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

/**
 * The same surface as a Button but rendered as an anchor. Kept separate rather
 * than polymorphic, because a `Button as="a"` loses the `disabled` semantics
 * and invites `<button>`s that navigate.
 */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}
