'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { BannerRow } from '@/server/queries/content';
import { cn } from '@/lib/cn';
import { BannerArt } from './banner-art';

/**
 * The promo rail, built on CSS scroll-snap rather than a carousel library:
 * ~0 KB, RTL-correct without configuration, and it degrades to a plain
 * horizontal scroller if the JS never arrives.
 *
 * Auto-advance pauses on hover, on focus inside the rail, on touch, when the
 * tab is hidden, and under `prefers-reduced-motion`. A banner that keeps
 * moving while someone is reading it is the reason auto-advancing carousels
 * have the reputation they do.
 */
const INTERVAL_MS = 6000;

export function BannerRail({ banners }: { banners: BannerRow[] }) {
  const locale = useLocale() as Locale;
  const railRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollTo = useCallback((next: number) => {
    const rail = railRef.current;
    const card = rail?.children[next];
    if (!rail || !(card instanceof HTMLElement)) return;
    // `scrollIntoView` would also scroll the page vertically on a phone.
    rail.scrollTo({
      left: card.offsetLeft - rail.offsetLeft,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    if (paused || banners.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % banners.length;
        scrollTo(next);
        return next;
      });
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [paused, banners.length, scrollTo]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  /**
   * `scrollLeft` is negative in RTL on Chrome and Firefox but positive on
   * older WebKit, so the index is derived from element positions instead of
   * from the scroll offset — this is the exact bug called out in the plan's
   * RTL risk list.
   */
  const onScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const railBox = rail.getBoundingClientRect();
    let closest = 0;
    let smallest = Infinity;
    for (let i = 0; i < rail.children.length; i += 1) {
      const child = rail.children[i];
      if (!(child instanceof HTMLElement)) continue;
      const delta = Math.abs(child.getBoundingClientRect().left - railBox.left);
      if (delta < smallest) {
        smallest = delta;
        closest = i;
      }
    }
    setIndex(closest);
  }, []);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div
        ref={railRef}
        onScroll={onScroll}
        className="rail gap-3 pb-1"
        // A rail whose contents change on a timer is a live region that should
        // not be announced; the dots below carry the state instead.
        aria-live="off"
      >
        {banners.map((banner) => (
          <Link
            key={banner.id}
            href={banner.href}
            className={cn(
              'press rounded-card shadow-e1 hover:shadow-e2 relative w-[min(88vw,34rem)] overflow-hidden',
            )}
            style={{
              backgroundColor: `oklch(0.94 0.05 ${banner.hue})`,
              color: `oklch(0.32 0.06 ${banner.hue})`,
            }}
          >
            <BannerArt artKey={banner.artKey} className="absolute inset-y-0 end-0 h-full opacity-70" />
            <div className="relative flex min-h-36 flex-col justify-center gap-1 p-5 pe-28 sm:min-h-40">
              <p className="text-lg font-bold leading-tight">
                {locale === 'ar' ? banner.titleAr : banner.titleEn}
              </p>
              <p className="text-2xs opacity-80">
                {locale === 'ar' ? banner.subtitleAr : banner.subtitleEn}
              </p>
              <span className="mt-2 text-2xs font-semibold underline underline-offset-4">
                {locale === 'ar' ? banner.ctaAr : banner.ctaEn}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {banners.map((banner, i) => (
          <button
            key={banner.id}
            type="button"
            aria-label={locale === 'ar' ? banner.titleAr : banner.titleEn}
            aria-current={i === index}
            onClick={() => {
              setIndex(i);
              scrollTo(i);
            }}
            className={cn(
              'press h-1.5 rounded-chip transition-all',
              i === index ? 'bg-ink w-6' : 'bg-line hover:bg-steel/50 w-1.5',
            )}
          />
        ))}
      </div>
    </div>
  );
}
