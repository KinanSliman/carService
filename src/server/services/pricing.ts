/**
 * Line items, call-out fees and totals.
 *
 * Money is handled as integer minor units internally and only formatted at the
 * edge. Adding `Number('120.00') + Number('90.50')` across a basket is how a
 * total ends up reading 210.50000000000003.
 */

export type DeliveryMode = 'at_center' | 'mobile' | 'pickup';

export type PricedItem = {
  serviceId: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  /** Null when the service is quote-only at this workshop. */
  price: string | null;
  durationMin: number;
};

export type Totals = {
  /** Sum of the priced items, as a `numeric(10,2)`-safe string. */
  subtotal: string;
  calloutFee: string;
  total: string;
  durationMin: number;
  /** True when at least one item has no price, so the total is partial. */
  hasQuoteItems: boolean;
};

/**
 * Coming to the customer costs the workshop a van and a driver, and taking the
 * car away costs it two trips. Flat fees rather than distance-based ones: this
 * build has no address, only a mode.
 */
export const CALLOUT_FEES: Record<DeliveryMode, number> = {
  at_center: 0,
  mobile: 50,
  pickup: 75,
};

/** `"120.00"` to 12000. Rounds, so a stray third decimal cannot drift a total. */
function toMinor(value: string | number): number {
  return Math.round(Number(value) * 100);
}

function fromMinor(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function calculateTotals(items: PricedItem[], mode: DeliveryMode): Totals {
  let subtotalMinor = 0;
  let durationMin = 0;
  let hasQuoteItems = false;

  for (const item of items) {
    if (item.price === null) hasQuoteItems = true;
    else subtotalMinor += toMinor(item.price);
    durationMin += item.durationMin;
  }

  const calloutMinor = toMinor(CALLOUT_FEES[mode]);

  return {
    subtotal: fromMinor(subtotalMinor),
    calloutFee: fromMinor(calloutMinor),
    total: fromMinor(subtotalMinor + calloutMinor),
    durationMin,
    hasQuoteItems,
  };
}

/**
 * The snapshot written to `booking_items`. Without it, re-running the seed or
 * repricing a service would silently rewrite what past customers were quoted.
 */
export function toItemSnapshots(items: PricedItem[], bookingId: number) {
  return items.map((item) => ({
    bookingId,
    serviceId: item.serviceId,
    nameArSnapshot: item.nameAr,
    nameEnSnapshot: item.nameEn,
    priceSnapshot: item.price,
    durationMinSnapshot: item.durationMin,
  }));
}
