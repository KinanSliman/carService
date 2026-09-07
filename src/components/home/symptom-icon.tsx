import {
  Battery,
  CircleDot,
  Disc3,
  Droplet,
  Flame,
  Fuel,
  ScanLine,
  Snowflake,
  Waves,
} from 'lucide-react';
import type { ComponentType } from 'react';

/**
 * Symptom and category icons. Lucide covers the generic ones; anything
 * mechanical (a brake disc, a strut) has no equivalent in a stock set, so
 * those are drawn here in the same weight rather than substituted with a
 * loosely related generic glyph.
 */
type IconProps = { className?: string };

const Steering = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M12 9.4V3.2M9.6 13.2 4.2 16.4M14.4 13.2l5.4 3.2" />
  </svg>
);

const Suspension = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3h8M12 3v3.5" />
    <path d="M8.4 6.5c3.6 0 3.6 2.2 0 2.2s-3.6 2.2 0 2.2 3.6 2.2 0 2.2 3.6 2.2 0 2.2" transform="translate(3.6 0)" />
    <path d="M8 21h8M12 21v-3" />
  </svg>
);

const icons: Record<string, ComponentType<IconProps>> = {
  steering: Steering,
  suspension: Suspension,
  'brake-disc': Disc3,
  snowflake: Snowflake,
  battery: Battery,
  scan: ScanLine,
  flame: Flame,
  droplet: Droplet,
  fuel: Fuel,
  waves: Waves,
};

export function SymptomIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  const Icon = icons[iconKey] ?? CircleDot;
  return <Icon className={className} />;
}
