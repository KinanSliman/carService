'use client';

import { useParams } from 'next/navigation';
import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

/**
 * Swaps the locale while staying on the current route, keeping the dynamic
 * segments intact — `useParams()` is what carries `[category]`, `[slug]` and
 * so on across the switch. A plain `<Link href="/en">` would drop the viewer
 * back to the home page, which is the single most common bug in a bilingual
 * site.
 */
export function LocaleSwitch({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const other = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;
  const label = other === 'ar' ? 'العربية' : 'English';

  return (
    <button
      type="button"
      lang={other}
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.replace(
            // @ts-expect-error `params` is untyped route state; next-intl reads
            // whichever dynamic segments the current route actually declares.
            { pathname, params },
            { locale: other },
          );
        });
      }}
      className={cn(
        'press rounded-chip border-line hover:border-steel/50 inline-flex h-9 items-center border px-3 text-2xs font-semibold',
        isPending && 'opacity-60',
        className,
      )}
    >
      {label}
    </button>
  );
}
