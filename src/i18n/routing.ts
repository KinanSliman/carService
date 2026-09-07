import { defineRouting } from 'next-intl/routing';

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const localeDirection: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
};

/**
 * Arabic is the default and is *not* prefixed, so the canonical URL of the site
 * is `/` rather than `/ar`. English lives under `/en`. This is deliberate: the
 * product is Arabic-first, and a default-locale prefix reads as a translation
 * of an English site rather than the other way round.
 */
export const routing = defineRouting({
  locales,
  defaultLocale: 'ar',
  localePrefix: 'as-needed',
  // The site is Arabic-first by design, so '/' is Arabic for every visitor.
  // With detection on, a reviewer with an English browser never sees the
  // Arabic build at all — which is the build the design was made for.
  localeDetection: false,
});

/**
 * Local type guard. next-intl ships one under some versions and not others;
 * owning it keeps the layout and the request config on one implementation.
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
