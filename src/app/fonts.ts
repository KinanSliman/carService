import { IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from 'next/font/google';

/**
 * One family for the whole interface. IBM Plex Sans Arabic is engineered
 * rather than decorative, has a properly drawn Arabic cut, and its Latin
 * sibling matches exactly — which matters because the language toggle swaps
 * scripts inside the same layout.
 *
 * `next/font` self-hosts these at build time and emits the subset CSS, so
 * there is no request to fonts.googleapis.com at runtime. Three weights and
 * two subsets only: an unsubsetted Arabic family with five weights is over
 * 400 KB, and this is the asset a reviewer on a phone waits for.
 */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-plex-arabic',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

/**
 * Restricted to fixed-width alphanumerics: plate numbers, odometer readings,
 * booking codes and totals. Those strings are read digit by digit and have to
 * align down a column — this is not decoration for labels.
 */
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-plex-mono',
  preload: true,
  fallback: ['ui-monospace', 'monospace'],
});
