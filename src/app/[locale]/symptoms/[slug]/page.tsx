import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Container } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/page-header';
import { SymptomNarrowing } from '@/components/symptoms/symptom-narrowing';
import { getAllSymptomSlugs, getSymptomWithServices } from '@/server/queries/catalog';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllSymptomSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const detail = await getSymptomWithServices(slug);
  if (!detail) return {};
  return {
    title: locale === 'ar' ? detail.symptom.labelAr : detail.symptom.labelEn,
    description: locale === 'ar' ? detail.symptom.questionAr : detail.symptom.questionEn,
  };
}

export default async function SymptomPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const detail = await getSymptomWithServices(slug);
  if (!detail) notFound();

  const t = await getTranslations('symptoms');
  const nav = await getTranslations('nav');

  return (
    <Container>
      <PageHeader
        crumbs={[
          { href: '/', label: nav('home') },
          { href: '/services', label: nav('services') },
        ]}
        title={locale === 'ar' ? detail.symptom.labelAr : detail.symptom.labelEn}
        description={t('subtitle')}
      />

      {/* The whole decision set is a handful of rows, so it ships with the page
          and the narrowing runs entirely on the client. A round trip per answer
          would make a three-tap flow feel like a form submission. */}
      <SymptomNarrowing detail={detail} />
    </Container>
  );
}
