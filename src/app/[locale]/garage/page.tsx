import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Container } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/page-header';
import { Garage } from '@/components/garage/garage';
import { getGarageReference } from '@/server/queries/garage';

/**
 * The reference data — makes, models, maintenance intervals — is catalog
 * content and caches like the rest of it. The car itself is in the visitor's
 * browser and never reaches this page.
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('garage');
  return { title: t('title'), description: t('subtitle') };
}

export default async function GaragePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { makes, rules } = await getGarageReference(locale as Locale);
  const t = await getTranslations('garage');
  const nav = await getTranslations('nav');

  return (
    <Container>
      <PageHeader
        crumbs={[{ href: '/', label: nav('home') }]}
        title={t('title')}
        description={t('subtitle')}
      />
      <Garage makes={makes} rules={rules} />
    </Container>
  );
}
