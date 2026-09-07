'use client';

import { Car, Home, Search, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

const items = [
  { href: '/', icon: Home, key: 'home' },
  { href: '/services', icon: Wrench, key: 'services' },
  { href: '/workshops', icon: Search, key: 'workshops' },
  { href: '/garage', icon: Car, key: 'garage' },
] as const;

/**
 * Mobile-only tab bar. The active state is decided from the pathname prefix so
 * `/services/brakes-suspension/front-brake-pads` still lights up "Services";
 * an exact match would leave the bar looking broken on every detail page.
 */
export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('menu')}
      className="border-line bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-4">
        {items.map(({ href, icon: Icon, key }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'press flex flex-col items-center gap-1 py-2.5 text-2xs font-semibold',
                  active ? 'text-ink' : 'text-steel',
                )}
              >
                <Icon className={cn('size-5', active && 'stroke-[2.25]')} aria-hidden />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
