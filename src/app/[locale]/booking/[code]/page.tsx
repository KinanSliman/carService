import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { CalendarDays, Info, MapPin, Phone, User } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Badge, Card, Container } from '@/components/ui/primitives';
import { buttonClass } from '@/components/ui/button';
import { PageHeader } from '@/components/shell/page-header';
import { StatusTimeline } from '@/components/booking/status-timeline';
import { CopyCode } from '@/components/booking/copy-code';
import { getBookingByCode } from '@/server/queries/bookings';
import { formatDuration, formatPrice, formatSlotDate, formatSlotTime } from '@/lib/format';

/** A booking is per-visitor state; nothing here is cacheable or indexable. */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('confirmation');
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  const detail = await getBookingByCode(decodeURIComponent(code).toUpperCase());
  if (!detail) notFound();

  const { booking, provider, items } = detail;
  const t = await getTranslations('confirmation');
  const tb = await getTranslations('booking');
  const ts = await getTranslations('services');
  const tc = await getTranslations('common');
  const td = await getTranslations('delivery');
  const tw = await getTranslations('workshops');
  const current = (await getLocale()) as Locale;

  const zone = current === 'ar' ? provider.zoneAr : provider.zoneEn;
  const street = current === 'ar' ? provider.streetAr : provider.streetEn;

  return (
    <Container>
      <PageHeader title={t('title')} description={t('subtitle')} />

      <div className="grid gap-6 pb-14 lg:grid-cols-[1fr_20rem] lg:gap-10">
        <div className="space-y-6">
          {/* The code is the only thing on this page the viewer has to keep, so
              it gets the largest type on the page and a copy button. */}
          <Card className="p-5">
            <p className="text-steel text-2xs font-semibold">{t('codeLabel')}</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <p className="numeric text-2xl font-semibold tracking-wider" dir="ltr">
                {booking.code}
              </p>
              <CopyCode code={booking.code} label={t('copyCode')} copiedLabel={t('copied')} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xs font-semibold">{t('whatTitle')}</h2>
            <ul className="divide-line mt-3 divide-y text-2xs">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block">
                      {current === 'ar' ? item.nameArSnapshot : item.nameEnSnapshot}
                    </span>
                    <span className="text-steel">
                      {formatDuration(item.durationMinSnapshot, current)}
                    </span>
                  </span>
                  <span className="shrink-0">
                    {item.priceSnapshot === null ? (
                      <span className="text-steel">{ts('quoteOnly')}</span>
                    ) : (
                      <span className="numeric font-semibold">
                        {formatPrice(item.priceSnapshot, current)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="border-line mt-3 space-y-1.5 border-t pt-3 text-2xs">
              <div className="flex justify-between gap-3">
                <dt className="text-steel">{tb('subtotal')}</dt>
                <dd className="numeric">{formatPrice(booking.subtotal, current)}</dd>
              </div>
              {Number(booking.calloutFee) > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-steel">{tb('callout')}</dt>
                  <dd className="numeric">{formatPrice(booking.calloutFee, current)}</dd>
                </div>
              )}
              <div className="border-line flex items-baseline justify-between gap-3 border-t pt-2">
                <dt className="font-semibold">{tb('total')}</dt>
                <dd>
                  <span className="numeric text-lg font-semibold">
                    {formatPrice(booking.total, current)}
                  </span>{' '}
                  <span className="text-steel">{tc('currency')}</span>
                </dd>
              </div>
            </dl>

            {booking.hasQuoteItems === 1 && (
              <p className="bg-wait-10 text-wait rounded-input mt-3 p-2.5 text-2xs">
                {tb('quoteNote')}
              </p>
            )}
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-xs font-semibold">{t('whenTitle')}</h2>
              <p className="mt-2 flex items-start gap-2 text-2xs">
                <CalendarDays className="text-steel mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {formatSlotDate(booking.scheduledAt, current)}
                  <br />
                  <span className="numeric">{formatSlotTime(booking.scheduledAt, current)}</span>
                  {' · '}
                  {formatDuration(booking.durationMin, current)}
                </span>
              </p>
              <Badge className="mt-3">{td(booking.mode)}</Badge>
            </Card>

            <Card className="p-5">
              <h2 className="text-xs font-semibold">{t('whereTitle')}</h2>
              <p className="mt-2 flex items-start gap-2 text-2xs">
                <MapPin className="text-steel mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <Link
                    href={`/workshops/${provider.slug}`}
                    className="font-semibold underline underline-offset-4"
                  >
                    {current === 'ar' ? provider.nameAr : provider.nameEn}
                  </Link>
                  <br />
                  {street && `${street} · `}
                  {zone}
                  {provider.zoneNumber !== null && (
                    <>
                      {' · '}
                      <span className="latn">{tw('zone', { number: provider.zoneNumber })}</span>
                    </>
                  )}
                </span>
              </p>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="text-xs font-semibold">{t('contactTitle')}</h2>
            <dl className="mt-2 space-y-1.5 text-2xs">
              <div className="flex items-center gap-2">
                <User className="text-steel size-4 shrink-0" aria-hidden />
                <dt className="sr-only">{tb('name')}</dt>
                <dd>{booking.contactName}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="text-steel size-4 shrink-0" aria-hidden />
                <dt className="sr-only">{tb('phone')}</dt>
                <dd className="numeric" dir="ltr">
                  {booking.contactPhone}
                </dd>
              </div>
            </dl>
            {booking.vehicleLabel && (
              <p className="border-line mt-3 border-t pt-3 text-2xs">
                <span className="text-steel">{tb('vehicle')}: </span>
                {booking.vehicleLabel}
              </p>
            )}
            {booking.notes && (
              <p className="text-steel mt-2 text-2xs">
                <span className="font-semibold">{tb('notes')}: </span>
                {booking.notes}
              </p>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5 lg:sticky lg:top-24">
            <StatusTimeline status={booking.status} />

            <p className="text-steel measure mt-5 flex items-start gap-2 text-2xs">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('demoNotice')}
            </p>

            <Link href="/track" className={buttonClass('secondary', 'md', 'mt-4 w-full')}>
              {t('trackLink')}
            </Link>
            <Link href="/" className={buttonClass('ghost', 'md', 'mt-2 w-full')}>
              {t('backHome')}
            </Link>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
