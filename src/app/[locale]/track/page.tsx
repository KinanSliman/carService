import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/page-header';
import { TrackForm } from '@/components/booking/track-form';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('track');
  return { title: t('title'), description: t('subtitle') };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('track');
  const nav = await getTranslations('nav');

  return (
    <Container>
      <PageHeader
        crumbs={[{ href: '/', label: nav('home') }]}
        title={t('title')}
        description={t('subtitle')}
      />
      <div className="max-w-md pb-14">
        <TrackForm />
      </div>
    </Container>
  );
}
