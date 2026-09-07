import type { ComponentType } from 'react';
import { Battery, ScanLine, Snowflake, SprayCan, Sparkles, Wrench } from 'lucide-react';

/**
 * Category icons. The mechanical ones — an oil can, a brake disc, a tyre —
 * are drawn here rather than approximated from a stock set: no general icon
 * library contains "brake pad", and substituting a generic circle for one is
 * how an interface stops looking like it knows its own subject.
 */
type IconProps = { className?: string };

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const OilCan = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <path d="M3 12h10l4 3v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    <path d="M13 12V9H8" />
    <path d="M17 14h3l2-4" />
    <path d="M6 16h6" />
  </svg>
);

const BrakeDisc = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <circle cx="12" cy="12" r="8.4" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.6v2.6M12 17.8v2.6M3.6 12h2.6M17.8 12h2.6" />
    <path d="M18.4 6.4 16.5 8.3M5.6 17.6l1.9-1.9M5.6 6.4l1.9 1.9M18.4 17.6l-1.9-1.9" />
  </svg>
);

const Tyre = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} {...stroke}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.6" />
    <path d="M12 3v4.4M12 16.6V21M3 12h4.4M16.6 12H21" />
  </svg>
);

const icons: Record<string, ComponentType<IconProps>> = {
  'oil-can': OilCan,
  'brake-disc': BrakeDisc,
  tyre: Tyre,
  snowflake: Snowflake,
  battery: Battery,
  scan: ScanLine,
  spray: SprayCan,
  sparkle: Sparkles,
};

export function CategoryIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  const Icon = icons[iconKey] ?? Wrench;
  return <Icon className={className} />;
}
