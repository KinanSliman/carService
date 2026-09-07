import { getRequestConfig } from 'next-intl/server';
import { isLocale, routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Asia/Qatar',
    formats: {
      dateTime: {
        slot: { hour: 'numeric', minute: '2-digit' },
        dayLong: { weekday: 'long', day: 'numeric', month: 'long' },
        dayShort: { weekday: 'short', day: 'numeric', month: 'short' },
        full: { dateStyle: 'long', timeStyle: 'short' },
      },
      number: {
        qar: { style: 'currency', currency: 'QAR', maximumFractionDigits: 0 },
      },
    },
  };
});
