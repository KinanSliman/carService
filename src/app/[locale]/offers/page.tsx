import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/page-header';
import { BannerArt } from '@/components/home/banner-art';
import { getActiveBanners } from '@/server/queries/content';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('offers');
  return { title: t('title'), description: t('subtitle') };
}

export default async function OffersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const banners = await getActiveBanners();
  const t = await getTranslations('offers');
  const nav = await getTranslations('nav');
  const current = (await getLocale()) as Locale;

  return (
    <Container>
      <PageHeader
        crumbs={[{ href: '/', label: nav('home') }]}
        title={t('title')}
        description={t('subtitle')}
      />

      {/* The same cards as the home rail, laid out as a grid. The first one
          spans two columns so the page has a lead item instead of five equal
          tiles — the rail has an order, and the grid should keep it. */}
      <ul className="grid gap-3 pb-14 sm:grid-cols-2">
        {banners.map((banner, index) => (
          <li key={banner.id} className={index === 0 ? 'sm:col-span-2' : undefined}>
            <Link
              href={banner.href}
              className="press rounded-card shadow-e1 hover:shadow-e2 relative flex h-full overflow-hidden"
              style={{
                backgroundColor: `oklch(0.94 0.05 ${banner.hue})`,
                color: `oklch(0.32 0.06 ${banner.hue})`,
              }}
            >
              <BannerArt
                artKey={banner.artKey}
                className="absolute inset-y-0 end-0 h-full opacity-70"
              />
              <div className="relative flex min-h-40 flex-col justify-center gap-1 p-5 pe-28 sm:min-h-44">
                <p className="text-lg font-bold leading-tight sm:text-xl">
                  {current === 'ar' ? banner.titleAr : banner.titleEn}
                </p>
                <p className="text-2xs opacity-80 sm:text-xs">
                  {current === 'ar' ? banner.subtitleAr : banner.subtitleEn}
                </p>
                <span className="mt-2 text-2xs font-semibold underline underline-offset-4">
                  {current === 'ar' ? banner.ctaAr : banner.ctaEn}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
