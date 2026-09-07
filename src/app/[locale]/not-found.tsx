import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/primitives';
import { buttonClass } from '@/components/ui/button';

export default async function NotFound() {
  const t = await getTranslations('error');
  const nav = await getTranslations('nav');

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      {/* A wrench with nothing attached to it. Cheaper than an illustration
          and it does not need translating. */}
      <svg
        viewBox="0 0 120 80"
        aria-hidden
        className="text-line w-40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M74 22a14 14 0 0 1-17.6 18L34 62.4a6.4 6.4 0 1 1-9-9l22.4-22.4A14 14 0 0 1 65.4 13L56.8 21.6l3.2 9 9 3.2z" />
        <path d="M92 30h14M92 42h20M92 54h10" />
      </svg>

      <h1 className="mt-8 text-xl sm:text-2xl">{t('notFoundTitle')}</h1>
      <p className="text-steel measure mt-3 text-xs">{t('notFoundBody')}</p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClass('primary', 'md')}>
          {t('goHome')}
        </Link>
        <Link href="/services" className={buttonClass('secondary', 'md')}>
          {nav('services')}
        </Link>
      </div>
    </Container>
  );
}
