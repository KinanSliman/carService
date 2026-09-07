import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Banner artwork as inline SVG in the same blueprint stroke language as the car
 * diagram. Committed vector rather than raster: five promo images at retina
 * sizes would outweigh the entire rest of the page, and these have to tint
 * themselves from the banner's hue.
 */
const art: Record<string, ReactNode> = {
  ac: (
    <>
      <circle cx="60" cy="60" r="34" />
      <path d="M60 20v80M26 40l68 40M94 40 26 80" />
      <path d="M60 20l-8 9M60 20l8 9M60 100l-8-9M60 100l8-9" />
    </>
  ),
  oil: (
    <>
      <path d="M34 46h34l16 12v26a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8z" />
      <path d="M68 46V34h-14M84 58h12l6 10" />
      <path d="M46 66h26" />
    </>
  ),
  mobile: (
    <>
      <path d="M22 44h44v34H22zM66 54h16l12 12v12H66z" />
      <circle cx="38" cy="82" r="7" />
      <circle cx="80" cy="82" r="7" />
      <path d="M96 40h10M96 48h14M96 56h8" />
    </>
  ),
  inspection: (
    <>
      <path d="M36 26h36l14 14v54H36z" />
      <path d="M72 26v14h14" />
      <path d="M46 56h30M46 68h30M46 80h18" />
    </>
  ),
  shine: (
    <>
      <path d="M60 24l7 17 17 7-17 7-7 17-7-17-17-7 17-7z" />
      <path d="M92 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM26 70l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" />
    </>
  ),
};

export function BannerArt({ artKey, className }: { artKey: string; className?: string }) {
  const shape = art[artKey] ?? art.shine;
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden
      className={cn('aspect-square', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shape}
    </svg>
  );
}
