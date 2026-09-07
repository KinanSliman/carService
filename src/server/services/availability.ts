import { addMinutes, isBefore, isEqual } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/**
 * Slot generation — the one genuinely non-trivial piece of server logic in
 * this build, and the thing that separates a styled catalog from an
 * application.
 *
 * The rules it has to hold at once:
 *
 *  1. Opening hours are stored as local wall-clock `time` plus weekday, never
 *     as instants. A workshop opens at 07:00 Doha time regardless of what UTC
 *     offset that is on a given date.
 *  2. Slots are produced as UTC instants, converted once, at the boundary.
 *     Qatar has no DST today, but hand-rolled offset arithmetic is how a
 *     codebase quietly becomes unportable — `date-fns-tz` does the conversion.
 *  3. A date-specific override beats the weekday rule. That is what makes
 *     public holidays and Ramadan hours expressible without a second table of
 *     exceptions to the exceptions.
 *  4. A job has to *finish* before closing. A 3-hour service cannot start at
 *     19:30 against a 20:00 close, and an availability grid that offers it is
 *     worse than one that offers nothing.
 *  5. A midday break splits the day into two windows rather than blocking the
 *     slots that overlap it — otherwise a long job can be offered across a
 *     three-hour closure.
 *  6. Capacity is per bay. A workshop with three bays can run three jobs at
 *     once, so a slot is unavailable only when every bay is occupied for some
 *     part of it.
 *  7. Slots in the past are never offered, and neither are slots inside the
 *     lead time — nobody staffs a booking made four minutes ago.
 *
 * Everything here is pure. The database read lives in the caller, which is
 * what makes it testable without a database.
 */

export const TIMEZONE = 'Asia/Qatar';

/** Slots land on the half hour. A 20-minute grid produces noise, not choice. */
export const SLOT_STEP_MIN = 30;

/** A booking must start at least this far ahead. */
export const LEAD_TIME_MIN = 90;

export type WeeklyHours = {
  /** 0 = Sunday .. 6 = Saturday. */
  weekday: number;
  /** `HH:MM` or `HH:MM:SS` local wall-clock. Null when closed. */
  opensAt: string | null;
  closesAt: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  isClosed: boolean;
};

export type DayOverride = {
  /** `yyyy-MM-dd` in the workshop's local calendar. */
  day: string;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  reasonAr: string | null;
  reasonEn: string | null;
};

export type ExistingBooking = {
  scheduledAt: Date;
  durationMin: number;
};

export type Slot = {
  /** The UTC instant the job would start. */
  startsAt: Date;
  available: boolean;
};

export type DayAvailability = {
  /** `yyyy-MM-dd`, local to the workshop. */
  day: string;
  isClosed: boolean;
  closedReasonAr: string | null;
  closedReasonEn: string | null;
  slots: Slot[];
};

type Window = { open: number; close: number };

/** `HH:MM[:SS]` to minutes past local midnight. */
function toMinutes(time: string): number {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
}

/** Local calendar date for a UTC instant, in the workshop's timezone. */
export function localDay(instant: Date, timeZone = TIMEZONE): string {
  return formatInTimeZone(instant, timeZone, 'yyyy-MM-dd');
}

/** The weekday (0 = Sunday) a local date falls on, without UTC drift. */
export function localWeekday(day: string, timeZone = TIMEZONE): number {
  // Midday avoids any chance of the conversion landing on the previous date.
  return Number(formatInTimeZone(fromZonedTime(`${day}T12:00:00`, timeZone), timeZone, 'i')) % 7;
}

/** A local wall-clock time on a local date, as a UTC instant. */
function instantAt(day: string, minutes: number, timeZone: string): Date {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return fromZonedTime(`${day}T${h}:${m}:00`, timeZone);
}

/**
 * The open windows for one local day, as minutes past local midnight.
 * A break splits one window into two; an override replaces the weekday rule
 * outright rather than merging with it.
 */
export function openWindows(
  day: string,
  weekly: WeeklyHours[],
  overrides: DayOverride[],
  timeZone = TIMEZONE,
): { windows: Window[]; override: DayOverride | null } {
  const override = overrides.find((o) => o.day === day) ?? null;

  if (override) {
    if (override.isClosed || !override.opensAt || !override.closesAt) {
      return { windows: [], override };
    }
    return {
      windows: [{ open: toMinutes(override.opensAt), close: toMinutes(override.closesAt) }],
      override,
    };
  }

  const weekday = localWeekday(day, timeZone);
  const rule = weekly.find((h) => h.weekday === weekday);
  if (!rule || rule.isClosed || !rule.opensAt || !rule.closesAt) {
    return { windows: [], override: null };
  }

  const open = toMinutes(rule.opensAt);
  const close = toMinutes(rule.closesAt);

  if (rule.breakStart && rule.breakEnd) {
    const breakStart = toMinutes(rule.breakStart);
    const breakEnd = toMinutes(rule.breakEnd);
    // A break that falls outside opening hours is data noise, not two windows.
    if (breakStart > open && breakEnd < close) {
      return {
        windows: [
          { open, close: breakStart },
          { open: breakEnd, close },
        ],
        override: null,
      };
    }
  }

  return { windows: [{ open, close }], override: null };
}

/** Two half-open intervals overlap when each starts before the other ends. */
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd);
}

/**
 * How many of the workshop's bays are busy for any part of `[start, end)`.
 *
 * This is deliberately a count of overlapping bookings rather than a bin-packing
 * solve: with `bayCount` concurrent jobs and no per-bay identity, "can one more
 * job start here" is exactly "are fewer than `bayCount` jobs in flight", and
 * modelling individual bays would be inventing precision the data does not have.
 */
function busyBays(start: Date, end: Date, bookings: ExistingBooking[]): number {
  let count = 0;
  for (const booking of bookings) {
    const bookingEnd = addMinutes(booking.scheduledAt, booking.durationMin);
    if (overlaps(start, end, booking.scheduledAt, bookingEnd)) count += 1;
  }
  return count;
}

export type GenerateSlotsInput = {
  /** `yyyy-MM-dd` local to the workshop. */
  day: string;
  /** Total minutes the booked services need, back to back. */
  durationMin: number;
  bayCount: number;
  weekly: WeeklyHours[];
  overrides: DayOverride[];
  bookings: ExistingBooking[];
  /** "Now", injected so this is testable and so SSR and the client agree. */
  now: Date;
  timeZone?: string;
  leadTimeMin?: number;
  stepMin?: number;
};

export function generateSlotsForDay({
  day,
  durationMin,
  bayCount,
  weekly,
  overrides,
  bookings,
  now,
  timeZone = TIMEZONE,
  leadTimeMin = LEAD_TIME_MIN,
  stepMin = SLOT_STEP_MIN,
}: GenerateSlotsInput): DayAvailability {
  const { windows, override } = openWindows(day, weekly, overrides, timeZone);

  if (windows.length === 0) {
    return {
      day,
      isClosed: true,
      closedReasonAr: override?.reasonAr ?? null,
      closedReasonEn: override?.reasonEn ?? null,
      slots: [],
    };
  }

  const earliest = addMinutes(now, leadTimeMin);
  const slots: Slot[] = [];

  for (const window of windows) {
    // The last start that still lets the job finish before this window closes.
    const latestStart = window.close - durationMin;
    // Round the first slot up to the grid rather than starting at the minute
    // the workshop opens, so 07:00 / 07:30 / 08:00 stays a readable column.
    const firstStart = Math.ceil(window.open / stepMin) * stepMin;

    for (let minute = firstStart; minute <= latestStart; minute += stepMin) {
      const startsAt = instantAt(day, minute, timeZone);
      const endsAt = addMinutes(startsAt, durationMin);

      if (isBefore(startsAt, earliest) || isEqual(startsAt, earliest)) {
        // Too soon to staff. Not rendered at all rather than rendered disabled:
        // a morning of greyed-out slots reads as a broken workshop.
        continue;
      }

      slots.push({
        startsAt,
        available: busyBays(startsAt, endsAt, bookings) < bayCount,
      });
    }
  }

  return {
    day,
    isClosed: false,
    closedReasonAr: null,
    closedReasonEn: null,
    slots,
  };
}

/** The next `count` local dates starting from `now`'s local day. */
export function upcomingDays(now: Date, count: number, timeZone = TIMEZONE): string[] {
  const days: string[] = [];
  for (let i = 0; i < count; i += 1) {
    days.push(formatInTimeZone(addMinutes(now, i * 24 * 60), timeZone, 'yyyy-MM-dd'));
  }
  return days;
}

/** Morning / afternoon / evening, for grouping the slot grid. */
export function partOfDay(instant: Date, timeZone = TIMEZONE): 'morning' | 'afternoon' | 'evening' {
  const hour = Number(formatInTimeZone(instant, timeZone, 'H'));
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Whether the workshop is open at this instant. Used for the "open now" badge
 * on the directory, which is the one place hours appear outside the booking
 * flow.
 */
export function isOpenAt(
  instant: Date,
  weekly: WeeklyHours[],
  overrides: DayOverride[],
  timeZone = TIMEZONE,
): boolean {
  const day = localDay(instant, timeZone);
  const { windows } = openWindows(day, weekly, overrides, timeZone);
  const minutes = Number(formatInTimeZone(instant, timeZone, 'H')) * 60 +
    Number(formatInTimeZone(instant, timeZone, 'm'));
  return windows.some((w) => minutes >= w.open && minutes < w.close);
}
