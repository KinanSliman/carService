import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/primitives';
import { Logo } from './logo';

export async function SiteFooter() {
  const t = await getTranslations('footer');
  const nav = await getTranslations('nav');
  const brand = await getTranslations('brand');

  return (
    /* The one dark surface in the interface, and it is --ink rather than a
       tinted near-black — a footer that is nearly the text colour reads as
       part of the page, not as a separate slab. */
    <footer className="bg-ink text-paper mt-auto">
      <Container className="grid gap-8 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo label={brand('name')} />
          <p className="text-paper/70 measure mt-3 text-xs">{t('builtWith')}</p>
        </div>

        <nav aria-label={nav('menu')} className="flex flex-col gap-2 text-xs">
          <Link href="/services" className="text-paper/80 hover:text-paper w-fit">
            {nav('services')}
          </Link>
          <Link href="/workshops" className="text-paper/80 hover:text-paper w-fit">
            {nav('workshops')}
          </Link>
          <Link href="/offers" className="text-paper/80 hover:text-paper w-fit">
            {nav('offers')}
          </Link>
          <Link href="/garage" className="text-paper/80 hover:text-paper w-fit">
            {nav('garage')}
          </Link>
        </nav>

        <nav className="flex flex-col gap-2 text-xs">
          <Link href="/track" className="text-paper/80 hover:text-paper w-fit">
            {nav('track')}
          </Link>
          <Link href="/about" className="text-paper/80 hover:text-paper w-fit">
            {t('caseStudy')}
          </Link>
        </nav>
      </Container>

      <div className="border-paper/15 border-t">
        <Container className="py-5">
          <p className="text-paper/55 text-2xs">{t('rights')}</p>
        </Container>
      </div>
    </footer>
  );
}
