import type { Locale } from '@/i18n/routing';

/**
 * Money, distance and duration formatting.
 *
 * All of it forces Latin digits (`-u-nu-latn`). Arabic-Indic numerals are not
 * what Qatari price tags, plate numbers or invoices use, and mixing numeral
 * systems between the Arabic and English versions of the same page makes the
 * two impossible to compare side by side.
 */

const numberLocale: Record<Locale, string> = {
  ar: 'ar-QA-u-nu-latn',
  en: 'en-QA-u-nu-latn',
};

/**
 * Prices are whole riyals everywhere in this interface. The column is scanned,
 * not audited, and `.00` on every row is noise — the numeric(10,2) precision
 * exists for the data, not the display.
 */
export function formatPrice(value: string | number | null, locale: Locale): string | null {
  if (value === null) return null;
  const amount = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(amount)) return null;
  return new Intl.NumberFormat(numberLocale[locale], {
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "1 س 30 د" / "1 h 30 m" — never "90 minutes", which nobody pictures. */
export function formatDuration(minutes: number, locale: Locale): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const nf = new Intl.NumberFormat(numberLocale[locale], { maximumFractionDigits: 0 });

  if (hours === 0) return locale === 'ar' ? `${nf.format(rest)} د` : `${nf.format(rest)} min`;
  if (rest === 0) return locale === 'ar' ? `${nf.format(hours)} س` : `${nf.format(hours)} h`;
  return locale === 'ar'
    ? `${nf.format(hours)} س ${nf.format(rest)} د`
    : `${nf.format(hours)} h ${nf.format(rest)} m`;
}

export function formatDistance(km: number, locale: Locale): string {
  const nf = new Intl.NumberFormat(numberLocale[locale], {
    maximumFractionDigits: km < 10 ? 1 : 0,
  });
  return locale === 'ar' ? `${nf.format(km)} كم` : `${nf.format(km)} km`;
}

export function formatOdometer(km: number, locale: Locale): string {
  return new Intl.NumberFormat(numberLocale[locale], { maximumFractionDigits: 0 }).format(km);
}

export function formatRating(value: string | number, locale: Locale): string {
  const rating = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat(numberLocale[locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);
}

export function formatCount(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberLocale[locale]).format(value);
}

/**
 * `time` columns come back as `HH:MM:SS`. Rendered as a wall-clock time in the
 * viewer's locale without pretending to be an instant — these are opening
 * hours, not timestamps.
 */
export function formatWallTime(time: string, locale: Locale): string {
  const [hourPart = '0', minutePart = '0'] = time.split(':');
  const date = new Date(Date.UTC(2000, 0, 1, Number(hourPart), Number(minutePart)));
  return new Intl.DateTimeFormat(numberLocale[locale], {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

/** A UTC instant rendered as Doha wall-clock time. */
export function formatSlotTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(numberLocale[locale], {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Qatar',
  }).format(date);
}

export function formatSlotDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(numberLocale[locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Qatar',
  }).format(date);
}

export function formatShortDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(numberLocale[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Qatar',
  }).format(date);
}

/**
 * Haversine. Plain lat/lng ordering rather than PostGIS: with no coverage
 * polygons to model, a spatial extension would be a migration we never need.
 */
export function distanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/** West Bay, used as the "you are here" origin for the distance sort. */
export const DOHA_CENTRE = { lat: 25.3209, lng: 51.5309 } as const;
