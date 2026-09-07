import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

export type Crumb = { href: string; label: string };

/**
 * The page header, with an optional breadcrumb.
 *
 * The chevron between crumbs is chosen by direction rather than flipped with a
 * transform: a mirrored chevron is fine, but reversing the *reading order* of
 * the trail is the part that actually matters, and that falls out of the
 * document direction for free.
 */
export async function PageHeader({
  title,
  description,
  crumbs,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  action?: ReactNode;
  className?: string;
}) {
  const locale = (await getLocale()) as Locale;
  const Chevron = locale === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <div className={cn('pt-8 pb-6 sm:pt-12 sm:pb-8', className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="text-steel flex flex-wrap items-center gap-1 text-2xs">
            {crumbs.map((crumb, index) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {index > 0 && <Chevron className="size-3.5 shrink-0 opacity-60" aria-hidden />}
                <Link href={crumb.href} className="hover:text-ink">
                  {crumb.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl">{title}</h1>
          {description && <p className="text-steel measure mt-2 text-xs">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
