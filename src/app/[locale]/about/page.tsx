import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Badge, Card, Container } from '@/components/ui/primitives';
import { buttonClass } from '@/components/ui/button';
import { PageHeader } from '@/components/shell/page-header';
import { getDemoBookingCodes } from '@/server/queries/bookings';
import { getCaseStudy } from './content';

/**
 * The case study. Half of what a reviewer judges never appears in the product
 * itself — this page is where the decisions, and the things left out on
 * purpose, are stated rather than left to be inferred.
 */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const study = getCaseStudy(locale as Locale);
  return { title: study.title, description: study.intro };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const study = getCaseStudy(locale as Locale);
  const demoCodes = await getDemoBookingCodes(4);
  const nav = await getTranslations('nav');
  const status = await getTranslations('status');
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <Container>
      <PageHeader
        crumbs={[{ href: '/', label: nav('home') }]}
        title={study.title}
        description={study.intro}
      />

      <div className="grid gap-10 pb-14 lg:grid-cols-[1fr_18rem] lg:gap-14">
        <article className="space-y-10">
          {study.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg sm:text-xl">{section.heading}</h2>

              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="measure mt-3 text-xs">
                  {paragraph}
                </p>
              ))}

              {section.comparison && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Card className="border-line/80 bg-ink-4 p-4">
                    <p className="text-steel flex items-center gap-2 text-2xs font-semibold">
                      <X className="size-3.5 shrink-0" aria-hidden />
                      {locale === 'ar' ? 'الحل البديهي' : 'The obvious answer'}
                    </p>
                    <p className="text-steel mt-2 text-2xs">{section.comparison.generic}</p>
                  </Card>
                  <Card className="border-marker/50 bg-marker-12/50 p-4">
                    <p className="flex items-center gap-2 text-2xs font-semibold">
                      <Check className="size-3.5 shrink-0" aria-hidden />
                      {locale === 'ar' ? 'ما بُني هنا' : 'What is here'}
                    </p>
                    <p className="mt-2 text-2xs">{section.comparison.here}</p>
                  </Card>
                </div>
              )}

              {section.points && (
                <ul className="divide-line border-line mt-5 divide-y border-y">
                  {section.points.map((point) => (
                    <li key={point.label} className="py-3">
                      <p className="text-xs font-semibold">{point.label}</p>
                      <p className="text-steel measure mt-1 text-2xs">{point.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section>
            <h2 className="text-lg sm:text-xl">{study.outOfScopeTitle}</h2>
            <p className="text-steel measure mt-3 text-xs">{study.outOfScopeIntro}</p>
            <ul className="mt-4 space-y-2">
              {study.outOfScope.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-2xs">
                  <X className="text-steel mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="measure">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Demo codes, so the tracking flow can be exercised without creating
              a booking first. Seeded rows only — a code a visitor created is
              theirs, not demo material. */}
          <section>
            <h2 className="text-lg sm:text-xl">{study.demoTitle}</h2>
            <p className="text-steel measure mt-3 text-xs">{study.demoIntro}</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-80 text-2xs">
                <thead>
                  <tr className="border-line text-steel border-b text-start">
                    <th scope="col" className="py-2 text-start font-semibold">
                      {study.demoCodeLabel}
                    </th>
                    <th scope="col" className="py-2 text-start font-semibold">
                      {study.demoPhoneLabel}
                    </th>
                    <th scope="col" className="py-2 text-start font-semibold">
                      {study.demoStatusLabel}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-line divide-y">
                  {demoCodes.map((booking) => (
                    <tr key={booking.code}>
                      <td className="numeric py-2.5" dir="ltr">
                        {booking.code}
                      </td>
                      <td className="numeric py-2.5" dir="ltr">
                        {booking.phoneLast4}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          tone={
                            booking.status === 'completed'
                              ? 'ok'
                              : booking.status === 'canceled'
                                ? 'due'
                                : 'neutral'
                          }
                        >
                          {status(booking.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Link href="/track" className={buttonClass('primary', 'md', 'mt-5 gap-2')}>
              {nav('track')}
              <Arrow className="size-4" aria-hidden />
            </Link>
          </section>
        </article>

        <aside>
          <Card className="p-5 lg:sticky lg:top-24">
            <h2 className="text-xs font-semibold">{study.stackTitle}</h2>
            <dl className="mt-3 space-y-3 text-2xs">
              {study.stack.map((entry) => (
                <div key={entry.label}>
                  <dt className="text-steel">{entry.label}</dt>
                  <dd className="mt-0.5">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
