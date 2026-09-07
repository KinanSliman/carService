'use client';

import { type CSSProperties, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { HotspotCategory } from '@/server/queries/catalog';
import { formatPrice } from '@/lib/format';
import { buttonClass } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { BODY_PATH, DETAIL_PATHS, VIEWBOX, WHEELS, ZONES } from './geometry';

/**
 * The spatial navigation model: the viewer points at the part of their car
 * that is misbehaving instead of guessing which category a garage would file
 * it under.
 *
 * Accessibility notes, because this is the component most likely to be built
 * as an inert picture:
 *  - SVG cannot contain an HTML `<button>`, so each zone is a focusable `<g>`
 *    carrying `role="button"`, `aria-pressed` and explicit Enter/Space/Escape
 *    handling — the behaviour a button would have given for free;
 *  - the SVG has `role="group"` and each button an `aria-label` carrying the
 *    category name and its from-price, so the diagram is usable without seeing
 *    it at all;
 *  - the same categories are listed as ordinary links underneath on small
 *    screens, which is both the touch fallback and the no-JS path.
 */
export function CarDiagram({ categories }: { categories: HotspotCategory[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const ts = useTranslations('services');
  const titleId = useId();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const byHotspot = useMemo(() => {
    const map = new Map<string, HotspotCategory>();
    for (const category of categories) {
      if (category.hotspotKey) map.set(category.hotspotKey, category);
    }
    return map;
  }, [categories]);

  /**
   * The draw-in is the page's single orchestrated, non-user-triggered moment,
   * and it runs once per session rather than on every soft navigation back to
   * the home page — an animation that replays every time reads as a glitch.
   */
  useEffect(() => {
    const seen = sessionStorage.getItem('karaj:diagram-drawn') === '1';
    if (seen) {
      setHasDrawn(true);
      return;
    }
    sessionStorage.setItem('karaj:diagram-drawn', '1');
  }, []);

  const active = activeKey ? byHotspot.get(activeKey) : undefined;
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        role="group"
        aria-labelledby={titleId}
        className={cn(
          'w-full',
          // The car faces the direction the language is read in. Mirroring is a
          // transform on the whole drawing, so no path is duplicated and the
          // zone buttons move with it.
          'rtl:-scale-x-100',
        )}
      >
        <title id={titleId}>{t('diagramTitle')}</title>

        <defs>
          {/* The blueprint grid behind the car. Faint enough to read as paper
              texture rather than as content. */}
          <pattern id="karaj-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M20 0 L0 0 0 20"
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="0.6"
              opacity="0.55"
            />
          </pattern>
        </defs>

        <rect
          x="0"
          y="0"
          width={VIEWBOX.width}
          height={VIEWBOX.height}
          fill="url(#karaj-grid)"
          opacity="0.5"
        />

        {/* Ground line */}
        <path
          d="M20 226 L580 226"
          stroke="var(--color-line)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Active zone tint sits under the outline so the stroke stays crisp. */}
        {ZONES.map((zone) =>
          byHotspot.has(zone.key) && activeKey === zone.key ? (
            <path
              key={`fill-${zone.key}`}
              d={zone.highlight}
              fill="var(--color-marker)"
              opacity="0.22"
              className="transition-opacity duration-150"
            />
          ) : null,
        )}

        <g
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d={BODY_PATH}
            className={hasDrawn ? undefined : 'animate-draw-in'}
            style={hasDrawn ? undefined : ({ '--draw-length': 2200 } as CSSProperties)}
          />
          {WHEELS.map((wheel) => (
            <g key={`${wheel.cx}-${wheel.cy}`}>
              <circle cx={wheel.cx} cy={wheel.cy} r={wheel.outer} />
              <circle cx={wheel.cx} cy={wheel.cy} r={wheel.inner} strokeWidth="1.6" />
            </g>
          ))}
        </g>

        <g
          fill="none"
          stroke="var(--color-steel)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        >
          {DETAIL_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>

        {/* Active outline, redrawn on top at a heavier weight. */}
        {ZONES.map((zone) =>
          byHotspot.has(zone.key) && activeKey === zone.key ? (
            <path
              key={`stroke-${zone.key}`}
              d={zone.highlight}
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth="3.4"
              strokeLinejoin="round"
            />
          ) : null,
        )}

        {/* Zones. Sorted so tabbing runs front-to-back along the car rather
            than in whatever order the categories came out of the database. */}
        {[...ZONES]
          .sort((a, b) => a.order - b.order)
          .map((zone) => {
            const category = byHotspot.get(zone.key);
            if (!category) return null;
            const name = locale === 'ar' ? category.nameAr : category.nameEn;
            const price = formatPrice(category.fromPrice, locale);
            const isActive = activeKey === zone.key;

            return (
              <g
                key={zone.key}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={
                  price ? `${name} — ${ts('from')} ${price} ${tc('currency')}` : name
                }
                className="cursor-pointer focus:outline-none [&:focus-visible>.ring]:opacity-100"
                onClick={() => setActiveKey(isActive ? null : zone.key)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setActiveKey(isActive ? null : zone.key);
                  }
                  if (event.key === 'Escape') setActiveKey(null);
                }}
                onPointerEnter={(event) => {
                  // Hover previews on a mouse; on touch the tap does the work,
                  // and a hover preview there would fire on the way to a tap.
                  if (event.pointerType === 'mouse') setActiveKey(zone.key);
                }}
              >
                {/* Transparent hit area, sized for a thumb rather than for the dot. */}
                <circle cx={zone.hit.cx} cy={zone.hit.cy} r={zone.hit.r} fill="transparent" />
                <circle
                  className="ring pointer-events-none opacity-0 transition-opacity"
                  cx={zone.hit.cx}
                  cy={zone.hit.cy}
                  r={zone.hit.r}
                  fill="none"
                  stroke="var(--color-ink)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <circle
                  cx={zone.dot.x}
                  cy={zone.dot.y}
                  r={isActive ? 9 : 6.5}
                  fill={isActive ? 'var(--color-ink)' : 'var(--color-surface)'}
                  stroke="var(--color-ink)"
                  strokeWidth="2.2"
                  className="pointer-events-none transition-all duration-150"
                />
              </g>
            );
          })}
      </svg>

      <p className="text-steel mt-2 text-center text-2xs">{t('diagramHint')}</p>

      {/* The detail card. On a wide screen it floats over the drawing's
          inline-end edge; on a phone it becomes a normal block underneath,
          because a floating card at 320px covers the thing being pointed at. */}
      {active && (
        <div
          className={cn(
            'animate-fade-rise bg-surface border-line rounded-card shadow-e2 border p-4',
            'mt-4 lg:absolute lg:bottom-6 lg:mt-0 lg:w-72 lg:end-0',
          )}
        >
          <p className="text-2xs text-steel font-semibold">
            {ts('serviceCount', { count: active.serviceCount })}
          </p>
          <h3 className="mt-0.5 text-lg">{locale === 'ar' ? active.nameAr : active.nameEn}</h3>
          {(locale === 'ar' ? active.blurbAr : active.blurbEn) && (
            <p className="text-steel mt-1 text-2xs">
              {locale === 'ar' ? active.blurbAr : active.blurbEn}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            {formatPrice(active.fromPrice, locale) && (
              <p className="text-2xs">
                <span className="text-steel">{ts('from')} </span>
                <span className="numeric font-semibold">
                  {formatPrice(active.fromPrice, locale)}
                </span>{' '}
                <span className="text-steel">{tc('currency')}</span>
              </p>
            )}
            <Link
              href={`/services/${active.slug}`}
              className={buttonClass('primary', 'sm', 'gap-1.5')}
            >
              {tc('seeAll')}
              <Arrow className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
