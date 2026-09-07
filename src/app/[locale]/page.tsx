import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Container, Section } from '@/components/ui/primitives';
import { buttonClass } from '@/components/ui/button';
import { CarDiagram } from '@/components/car-diagram/car-diagram';
import { BannerRail } from '@/components/home/banner-rail';
import { SymptomRail } from '@/components/home/symptom-rail';
import { CategoryBoard } from '@/components/home/category-board';
import { ProviderCard } from '@/components/catalog/provider-card';
import {
  getCategoriesWithFromPrice,
  getHotspotCategories,
  getSymptoms,
} from '@/server/queries/catalog';
import { getFeaturedProviders } from '@/server/queries/providers';
import { getActiveBanners } from '@/server/queries/content';

/**
 * Static with a one-hour revalidate. The catalog changes only when the seed is
 * re-run, and a cold free-tier Postgres takes a moment to wake — a static home
 * page means the first impression never waits on the database.
 */
export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [hotspots, categories, symptoms, providers, banners] = await Promise.all([
    getHotspotCategories(),
    getCategoriesWithFromPrice(),
    getSymptoms(),
    getFeaturedProviders(8),
    getActiveBanners(),
  ]);

  const t = await getTranslations('home');
  const tc = await getTranslations('common');
  const current = (await getLocale()) as Locale;
  const Arrow = current === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <>
      {/* Hero. On desktop the diagram and the copy sit side by side; on mobile
          the diagram leads, because the diagram is the idea. */}
      <Container className="pt-6 sm:pt-10">
        <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div className="order-1 lg:order-2">
            <h1 className="text-2xl sm:text-3xl">{t('heroTitle')}</h1>
            <p className="text-steel measure mt-4 text-xs sm:text-base">{t('heroBody')}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/book" className={buttonClass('primary', 'lg')}>
                {t('heroCta')}
              </Link>
              <p className="text-steel hidden text-2xs lg:block">{t('heroAlt')}</p>
            </div>
          </div>

          <div className="order-2 lg:order-1">
            <CarDiagram categories={hotspots} />
          </div>
        </div>
      </Container>

      <Container>
        <Section title={t('symptomsTitle')} description={t('symptomsBody')}>
          <SymptomRail symptoms={symptoms} />
        </Section>

        <Section className="pt-0">
          <BannerRail banners={banners} />
        </Section>

        <Section title={t('categoriesTitle')}>
          <CategoryBoard categories={categories} />
        </Section>

        <Section
          title={t('nearbyTitle')}
          action={
            <Link
              href="/workshops"
              className="press text-2xs inline-flex items-center gap-1 font-semibold"
            >
              {t('nearbyLink')}
              <Arrow className="size-3.5" aria-hidden />
            </Link>
          }
        >
          {/* A snap rail rather than a grid: a grid of eight cards on a phone is
              four screens of scrolling before anything else on the page. */}
          <div className="rail bleed gap-3 pb-2">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                className="w-[min(78vw,20rem)]"
              />
            ))}
          </div>
          <p className="text-steel mt-4 text-2xs">{tc('demoBadge')}</p>
        </Section>
      </Container>
    </>
  );
}
