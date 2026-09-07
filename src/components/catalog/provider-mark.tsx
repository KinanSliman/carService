import { cn } from '@/lib/cn';

/**
 * A generated identity mark for a workshop: the seed's `coverHue` tints a
 * pattern, and `logoKey` picks the glyph. There is no photography or logo
 * upload in this build, and inventing brand logos for fictional businesses
 * would be worse than not having any.
 *
 * The hue is used at low saturation against `--ink` so every mark stays inside
 * the palette rather than turning the workshop list into a colour chart.
 */

const glyphs: Record<string, string> = {
  wrench: 'M15.6 6.4a3.3 3.3 0 0 1-4.2 4.2L7.8 14.2a1.5 1.5 0 1 1-2.1-2.1l3.6-3.6a3.3 3.3 0 0 1 4.2-4.2l-2 2 .8 2.1 2.1.8z',
  gear: 'M10 7.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm7 3.6v-1.6l-1.7-.4a5.6 5.6 0 0 0-.6-1.4l.9-1.5-1.1-1.1-1.5.9a5.6 5.6 0 0 0-1.4-.6L11.2 3H8.8l-.4 1.7a5.6 5.6 0 0 0-1.4.6l-1.5-.9-1.1 1.1.9 1.5a5.6 5.6 0 0 0-.6 1.4L3 9.2v1.6l1.7.4c.13.49.34.96.6 1.4l-.9 1.5 1.1 1.1 1.5-.9c.44.26.91.47 1.4.6l.4 1.7h2.4l.4-1.7a5.6 5.6 0 0 0 1.4-.6l1.5.9 1.1-1.1-.9-1.5c.26-.44.47-.91.6-1.4z',
  tyre: 'M10 2.4a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2Zm0 3.4a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Z',
  snowflake: 'M10 2v16M3 6l14 8M17 6L3 14M10 2 8 4.4M10 2l2 2.4M10 18l-2-2.4M10 18l2-2.4',
  battery: 'M3.5 7h13v6h-13zM8.5 5.4h3V7h-3zM6 8.6h2.6M12 8.6h2.6M13.3 7.3v2.6',
  sparkle: 'M10 2.6l1.9 4.4 4.4 1.9-4.4 1.9L10 15.2l-1.9-4.4L3.7 8.9l4.4-1.9z',
  spray: 'M7 7h5v10H7zM8.5 4.6h2V7h-2zM13.6 4.4h1.2M13.6 6.6h1.2M13.6 8.8h1.2',
  bolt: 'M11.4 2.4 5.6 11h3.6l-.8 6.6L15 9h-3.8z',
  truck: 'M2.6 6.4h8.2v7.2H2.6zM10.8 8.8h3.4l2.4 2.6v2.2h-5.8zM6 15.6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  mountain: 'M2.4 15.6 7.6 6l3.2 5.4 1.8-2.6 5 6.8z',
  scan: 'M3.4 6.8V4.6a1.2 1.2 0 0 1 1.2-1.2h2.2M16.6 6.8V4.6a1.2 1.2 0 0 0-1.2-1.2h-2.2M3.4 13.2v2.2a1.2 1.2 0 0 0 1.2 1.2h2.2M16.6 13.2v2.2a1.2 1.2 0 0 1-1.2 1.2h-2.2M3.4 10h13.2',
};

/** Filled glyphs read as marks; stroked ones read as icons. */
const strokedGlyphs = new Set(['snowflake', 'battery', 'spray', 'scan']);

export function ProviderMark({
  hue,
  logoKey,
  className,
}: {
  hue: number;
  logoKey: string;
  className?: string;
}) {
  const path = glyphs[logoKey] ?? glyphs.wrench!;
  const stroked = strokedGlyphs.has(logoKey);

  return (
    <span
      aria-hidden
      className={cn('rounded-card grid place-items-center', className)}
      style={{
        backgroundColor: `oklch(0.93 0.045 ${hue})`,
        color: `oklch(0.38 0.07 ${hue})`,
      }}
    >
      <svg viewBox="0 0 20 20" className="size-[62%]">
        <path
          d={path}
          fill={stroked ? 'none' : 'currentColor'}
          stroke={stroked ? 'currentColor' : 'none'}
          strokeWidth={stroked ? 1.5 : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
