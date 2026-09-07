import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, routing, localeDirection } from '@/i18n/routing';
import { plexArabic, plexMono } from '../fonts';
import { SiteHeader } from '@/components/shell/site-header';
import { SiteFooter } from '@/components/shell/site-footer';
import { BottomNav } from '@/components/shell/bottom-nav';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brand' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${t('name')} — ${t('tagline')}`, template: `%s · ${t('name')}` },
    description: t('tagline'),
    alternates: {
      canonical: locale === routing.defaultLocale ? '/' : `/${locale}`,
      languages: { ar: '/', en: '/en' },
    },
    openGraph: {
      type: 'website',
      siteName: t('name'),
      title: `${t('name')} — ${t('tagline')}`,
      description: t('tagline'),
      locale: locale === 'ar' ? 'ar_QA' : 'en_QA',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Without this, every page under [locale] opts into dynamic rendering and
  // the static catalog pages stop being static.
  setRequestLocale(locale);

  const dir = localeDirection[locale];
  const [t, messages] = await Promise.all([
    getTranslations({ locale, namespace: 'nav' }),
    getMessages({ locale }),
  ]);

  return (
    <html lang={locale} dir={dir} className={`${plexArabic.variable} ${plexMono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main"
            className="sr-only-focusable bg-ink text-paper rounded-input absolute z-50 m-3 px-4 py-2 text-2xs font-semibold"
          >
            {t('skipToContent')}
          </a>
          <SiteHeader />
          {/* The bottom nav is fixed on mobile; the padding stops the last row
              of every page from sitting underneath it. */}
          <main id="main" className="flex-1 pb-20 sm:pb-0">
            {children}
          </main>
          <SiteFooter />
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
