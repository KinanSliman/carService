/**
 * The car diagram's geometry, kept as data so the component stays a renderer.
 *
 * The drawing is hand-authored line art on a 600×260 viewBox, not a traced
 * photograph: a trace would be four thousand path nodes, heavy to ship and
 * impossible to attach named zones to. Every path here is a handful of curves,
 * which is also why it can animate its own stroke on first paint.
 *
 * `hotspotKey` values must match `service_categories.hotspot_key` in the seed.
 * The two lists are checked against each other at render time so a renamed
 * category fails loudly instead of quietly producing a dead zone.
 */

export const VIEWBOX = { width: 600, height: 260 } as const;

/** The car's outline, drawn front-to-the-inline-end. */
export const BODY_PATH =
  'M64 188 C56 182 52 170 54 156 C56 140 66 132 82 128 L150 118 ' +
  'C170 100 196 90 232 88 L330 88 C366 88 392 96 412 112 L470 132 ' +
  'C500 140 520 150 528 164 C534 174 534 182 530 188 L486 188 ' +
  'A38 38 0 0 1 410 188 L232 188 A38 38 0 0 1 156 188 Z';

export const DETAIL_PATHS = [
  // Side glass
  'M176 116 C196 102 218 96 244 96 L318 96 L322 116 Z',
  // Windshield
  'M336 96 L372 98 C390 104 402 112 412 124 L340 116 Z',
  // Door shut line
  'M262 96 L262 186',
  // Rear door shut line
  'M188 112 L188 186',
  // Bonnet shut line
  'M418 124 L470 134',
  // Sill
  'M120 178 L470 178',
  // Front bumper detail
  'M498 168 L526 172',
  // Headlight
  'M482 146 L508 152 L506 162 L484 158 Z',
  // Rear light
  'M60 148 L74 150 L74 162 L60 160 Z',
  // Door handle
  'M292 132 L308 132',
] as const;

export const WHEELS = [
  { cx: 448, cy: 188, outer: 38, inner: 19 },
  { cx: 194, cy: 188, outer: 38, inner: 19 },
] as const;

export type Zone = {
  /** Matches service_categories.hotspot_key. */
  key: string;
  /** The region that tints when the zone is active. */
  highlight: string;
  /** Where the marker dot sits. */
  dot: { x: number; y: number };
  /**
   * The touch target, kept separate from the dot: 34 units on a 600-wide
   * viewBox is roughly a 44px target at the width this renders on a phone.
   */
  hit: { cx: number; cy: number; r: number };
  /** Reading order for the keyboard, front of the car to the back. */
  order: number;
};

export const ZONES: Zone[] = [
  {
    key: 'hood',
    highlight: 'M412 124 L470 134 C500 141 519 150 528 164 L500 168 L418 140 Z',
    dot: { x: 462, y: 142 },
    hit: { cx: 462, cy: 142, r: 34 },
    order: 1,
  },
  {
    key: 'battery',
    highlight: 'M496 150 L528 162 C534 173 534 182 530 188 L494 188 Z',
    dot: { x: 512, y: 168 },
    hit: { cx: 512, cy: 168, r: 30 },
    order: 2,
  },
  {
    key: 'brakes',
    highlight: 'M486 188 A38 38 0 0 0 410 188 A38 38 0 0 0 486 188 Z',
    dot: { x: 448, y: 188 },
    hit: { cx: 448, cy: 188, r: 36 },
    order: 3,
  },
  {
    key: 'dash',
    highlight: 'M336 96 L372 98 C390 104 402 112 412 124 L340 116 Z',
    dot: { x: 372, y: 110 },
    hit: { cx: 372, cy: 110, r: 30 },
    order: 4,
  },
  {
    key: 'ac',
    highlight: 'M262 96 L322 96 L326 140 L262 140 Z',
    dot: { x: 296, y: 118 },
    hit: { cx: 296, cy: 118, r: 30 },
    order: 5,
  },
  {
    key: 'interior',
    highlight: 'M188 112 L262 96 L262 172 L188 172 Z',
    dot: { x: 226, y: 142 },
    hit: { cx: 226, cy: 142, r: 32 },
    order: 6,
  },
  {
    key: 'wheel-fl',
    highlight: 'M232 188 A38 38 0 0 0 156 188 A38 38 0 0 0 232 188 Z',
    dot: { x: 194, y: 188 },
    hit: { cx: 194, cy: 188, r: 36 },
    order: 7,
  },
  {
    key: 'body',
    highlight: 'M64 188 C54 178 52 168 54 156 C56 140 66 132 82 128 L150 118 L176 116 L176 188 Z',
    dot: { x: 112, y: 152 },
    hit: { cx: 112, cy: 152, r: 32 },
    order: 8,
  },
];

export const ZONES_BY_KEY = new Map(ZONES.map((zone) => [zone.key, zone]));
