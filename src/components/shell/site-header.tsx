import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container } from '@/components/ui/primitives';
import { buttonClass } from '@/components/ui/button';
import { Logo } from './logo';
import { LocaleSwitch } from './locale-switch';
import { MobileMenu } from './mobile-menu';

export async function SiteHeader() {
  const t = await getTranslations('nav');
  const brand = await getTranslations('brand');

  const links = [
    { href: '/services', label: t('services') },
    { href: '/workshops', label: t('workshops') },
    { href: '/offers', label: t('offers') },
    { href: '/garage', label: t('garage') },
  ] as const;

  return (
    <header className="border-line bg-paper/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <Container className="flex h-16 items-center gap-3">
        <MobileMenu
          label={t('menu')}
          closeLabel={t('close')}
          links={[...links, { href: '/track', label: t('track') }, { href: '/about', label: t('about') }]}
        />

        <Link href="/" className="press me-auto" aria-label={brand('name')}>
          <Logo label={brand('name')} />
        </Link>

        <nav aria-label={t('menu')} className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="press hover:bg-ink-8 rounded-input px-3 py-2 text-2xs font-semibold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/track" className={buttonClass('secondary', 'sm', 'hidden sm:inline-flex')}>
            {t('track')}
          </Link>
          <LocaleSwitch />
        </div>
      </Container>
    </header>
  );
}
