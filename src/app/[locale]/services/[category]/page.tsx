import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { Container } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/page-header';
import { ServiceCard } from '@/components/catalog/service-card';
import {
  getAllCategorySlugs,
  getCategoryBySlug,
  getServicesForCategory,
} from '@/server/queries/catalog';

export const revalidate = 3600;

/**
 * Pre-rendered at build for every locale × category. The catalog only changes
 * when the seed is re-run, so there is no reason for a viewer to wait on a
 * database round trip — or on a cold free-tier instance waking up.
 */
export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return routing.locales.flatMap((locale) => slugs.map((category) => ({ locale, category })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const isAr = locale === 'ar';
  return {
    title: isAr ? category.nameAr : category.nameEn,
    description: (isAr ? category.blurbAr : category.blurbEn) ?? undefined,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: slug } = await params;
  setRequestLocale(locale);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const services = await getServicesForCategory(category.id);
  const t = await getTranslations('services');
  const nav = await getTranslations('nav');
  const current = (await getLocale()) as Locale;

  return (
    <Container>
      <PageHeader
        crumbs={[
          { href: '/', label: nav('home') },
          { href: '/services', label: t('title') },
        ]}
        title={current === 'ar' ? category.nameAr : category.nameEn}
        description={(current === 'ar' ? category.blurbAr : category.blurbEn) ?? undefined}
      />

      <ul className="grid gap-3 pb-14 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <li key={service.id} className="contents">
            <ServiceCard service={service} categorySlug={category.slug} />
          </li>
        ))}
      </ul>
    </Container>
  );
}
