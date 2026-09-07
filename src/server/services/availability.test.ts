import { describe, expect, it } from 'vitest';
import { formatInTimeZone } from 'date-fns-tz';
import {
  type DayOverride,
  type WeeklyHours,
  generateSlotsForDay,
  isOpenAt,
  localWeekday,
  openWindows,
} from './availability';

const TZ = 'Asia/Qatar';

/** Sun–Thu 07:00–20:00, Fri closed, Sat 08:00–18:00. */
const standardWeek: WeeklyHours[] = [
  { weekday: 0, opensAt: '07:00', closesAt: '20:00', breakStart: null, breakEnd: null, isClosed: false },
  { weekday: 1, opensAt: '07:00', closesAt: '20:00', breakStart: null, breakEnd: null, isClosed: false },
  { weekday: 2, opensAt: '07:00', closesAt: '20:00', breakStart: null, breakEnd: null, isClosed: false },
  { weekday: 3, opensAt: '07:00', closesAt: '20:00', breakStart: null, breakEnd: null, isClosed: false },
  { weekday: 4, opensAt: '07:00', closesAt: '20:00', breakStart: null, breakEnd: null, isClosed: false },
  { weekday: 5, opensAt: null, closesAt: null, breakStart: null, breakEnd: null, isClosed: true },
  { weekday: 6, opensAt: '08:00', closesAt: '18:00', breakStart: null, breakEnd: null, isClosed: false },
];

const splitShift: WeeklyHours[] = standardWeek.map((h) =>
  h.isClosed ? h : { ...h, opensAt: '07:30', closesAt: '21:00', breakStart: '12:30', breakEnd: '15:30' },
);

/** Local wall-clock time of a slot, which is what the grid actually shows. */
const at = (d: Date) => formatInTimeZone(d, TZ, 'HH:mm');

/** 2026-03-09 is a Monday; 09:00 Doha is 06:00 UTC. */
const MONDAY = '2026-03-09';
const FRIDAY = '2026-03-13';
const earlyMonday = new Date('2026-03-09T02:00:00Z'); // 05:00 Doha, before opening

describe('localWeekday', () => {
  it('maps a local date to Sunday-based weekday without UTC drift', () => {
    expect(localWeekday('2026-03-08', TZ)).toBe(0); // Sunday
    expect(localWeekday(MONDAY, TZ)).toBe(1);
    expect(localWeekday(FRIDAY, TZ)).toBe(5);
    expect(localWeekday('2026-03-14', TZ)).toBe(6); // Saturday
  });

  it('does not shift the weekday for a date whose UTC equivalent is the day before', () => {
    // 2026-03-09T00:30 Doha is 2026-03-08T21:30 UTC. Naive UTC maths would
    // call this Sunday.
    expect(localWeekday('2026-03-09', TZ)).toBe(1);
  });
});

describe('openWindows', () => {
  it('returns one window for a plain day', () => {
    const { windows } = openWindows(MONDAY, standardWeek, [], TZ);
    expect(windows).toEqual([{ open: 420, close: 1200 }]);
  });

  it('returns no windows on the weekly closing day', () => {
    const { windows } = openWindows(FRIDAY, standardWeek, [], TZ);
    expect(windows).toEqual([]);
  });

  it('splits the day in two around a midday break', () => {
    const { windows } = openWindows(MONDAY, splitShift, [], TZ);
    expect(windows).toEqual([
      { open: 450, close: 750 },
      { open: 930, close: 1260 },
    ]);
  });

  it('ignores a break that falls outside opening hours', () => {
    const odd: WeeklyHours[] = [
      { weekday: 1, opensAt: '09:00', closesAt: '17:00', breakStart: '06:00', breakEnd: '07:00', isClosed: false },
    ];
    const { windows } = openWindows(MONDAY, odd, [], TZ);
    expect(windows).toEqual([{ open: 540, close: 1020 }]);
  });

  it('lets a date override replace the weekly rule', () => {
    const overrides: DayOverride[] = [
      { day: MONDAY, opensAt: '09:00', closesAt: '14:00', isClosed: false, reasonAr: 'دوام مختصر', reasonEn: 'Short day' },
    ];
    const { windows, override } = openWindows(MONDAY, standardWeek, overrides, TZ);
    expect(windows).toEqual([{ open: 540, close: 840 }]);
    expect(override?.reasonEn).toBe('Short day');
  });

  it('lets an override close a day that is normally open', () => {
    const overrides: DayOverride[] = [
      { day: MONDAY, opensAt: null, closesAt: null, isClosed: true, reasonAr: 'إجازة', reasonEn: 'Holiday' },
    ];
    const { windows } = openWindows(MONDAY, standardWeek, overrides, TZ);
    expect(windows).toEqual([]);
  });

  it('lets an override open a day that is normally closed', () => {
    const overrides: DayOverride[] = [
      { day: FRIDAY, opensAt: '15:00', closesAt: '21:00', isClosed: false, reasonAr: null, reasonEn: null },
    ];
    const { windows } = openWindows(FRIDAY, standardWeek, overrides, TZ);
    expect(windows).toEqual([{ open: 900, close: 1260 }]);
  });
});

describe('generateSlotsForDay', () => {
  const base = {
    day: MONDAY,
    bayCount: 1,
    weekly: standardWeek,
    overrides: [] as DayOverride[],
    bookings: [],
    now: earlyMonday,
    timeZone: TZ,
  };

  it('produces a half-hourly grid from opening to the last finishable start', () => {
    const result = generateSlotsForDay({ ...base, durationMin: 60 });
    expect(result.isClosed).toBe(false);
    expect(at(result.slots[0]!.startsAt)).toBe('07:00');
    // Closes at 20:00, so a 60-minute job can start no later than 19:00.
    expect(at(result.slots.at(-1)!.startsAt)).toBe('19:00');
  });

  it('never offers a start the job cannot finish before closing', () => {
    const result = generateSlotsForDay({ ...base, durationMin: 180 });
    expect(at(result.slots.at(-1)!.startsAt)).toBe('17:00');
  });

  it('produces no slots at all when the job is longer than the open day', () => {
    const result = generateSlotsForDay({ ...base, durationMin: 900 });
    expect(result.slots).toEqual([]);
    expect(result.isClosed).toBe(false);
  });

  it('reports a closed day rather than an empty one', () => {
    const result = generateSlotsForDay({ ...base, day: FRIDAY, durationMin: 60 });
    expect(result.isClosed).toBe(true);
    expect(result.slots).toEqual([]);
  });

  it('carries the override reason through to the closed day', () => {
    const result = generateSlotsForDay({
      ...base,
      durationMin: 60,
      overrides: [
        { day: MONDAY, opensAt: null, closesAt: null, isClosed: true, reasonAr: 'إجازة رسمية', reasonEn: 'Public holiday' },
      ],
    });
    expect(result.isClosed).toBe(true);
    expect(result.closedReasonEn).toBe('Public holiday');
    expect(result.closedReasonAr).toBe('إجازة رسمية');
  });

  it('does not let a long job straddle the midday break', () => {
    const result = generateSlotsForDay({ ...base, weekly: splitShift, durationMin: 120 });
    const times = result.slots.map((s) => at(s.startsAt));
    // Morning window closes at 12:30, so 10:30 is the last two-hour start.
    expect(times).toContain('10:30');
    expect(times).not.toContain('11:00');
    // The afternoon window reopens at 15:30.
    expect(times).toContain('15:30');
  });

  it('rounds the first slot up to the grid instead of starting on the half-minute', () => {
    const result = generateSlotsForDay({ ...base, weekly: splitShift, durationMin: 30 });
    expect(at(result.slots[0]!.startsAt)).toBe('07:30');
  });

  it('omits slots inside the lead time', () => {
    const result = generateSlotsForDay({
      ...base,
      durationMin: 60,
      // 09:10 Doha; with a 90-minute lead time the first bookable start is 11:00.
      now: new Date('2026-03-09T06:10:00Z'),
    });
    expect(at(result.slots[0]!.startsAt)).toBe('11:00');
  });

  it('marks a slot unavailable when the only bay is occupied', () => {
    const result = generateSlotsForDay({
      ...base,
      durationMin: 60,
      bookings: [{ scheduledAt: new Date('2026-03-09T06:00:00Z'), durationMin: 60 }], // 09:00 Doha
    });
    const byTime = new Map(result.slots.map((s) => [at(s.startsAt), s.available]));
    expect(byTime.get('08:30')).toBe(false); // overlaps 09:00–10:00
    expect(byTime.get('09:00')).toBe(false);
    expect(byTime.get('09:30')).toBe(false);
    expect(byTime.get('10:00')).toBe(true); // starts exactly as the other ends
    expect(byTime.get('08:00')).toBe(true); // ends exactly as the other starts
  });

  it('keeps a slot available while a second bay is still free', () => {
    const booking = { scheduledAt: new Date('2026-03-09T06:00:00Z'), durationMin: 60 };
    const result = generateSlotsForDay({
      ...base,
      bayCount: 2,
      durationMin: 60,
      bookings: [booking],
    });
    expect(new Map(result.slots.map((s) => [at(s.startsAt), s.available])).get('09:00')).toBe(true);
  });

  it('closes a slot once every bay is taken', () => {
    const booking = { scheduledAt: new Date('2026-03-09T06:00:00Z'), durationMin: 60 };
    const result = generateSlotsForDay({
      ...base,
      bayCount: 2,
      durationMin: 60,
      bookings: [booking, { ...booking }],
    });
    expect(new Map(result.slots.map((s) => [at(s.startsAt), s.available])).get('09:00')).toBe(false);
  });

  it('generates instants that convert back to the intended Doha wall time', () => {
    const result = generateSlotsForDay({ ...base, durationMin: 60 });
    const nine = result.slots.find((s) => at(s.startsAt) === '09:00');
    // Qatar is UTC+3 with no DST, so 09:00 local is 06:00Z.
    expect(nine?.startsAt.toISOString()).toBe('2026-03-09T06:00:00.000Z');
  });
});

describe('isOpenAt', () => {
  it('is true inside opening hours and false outside them', () => {
    expect(isOpenAt(new Date('2026-03-09T06:00:00Z'), standardWeek, [], TZ)).toBe(true); // 09:00
    expect(isOpenAt(new Date('2026-03-09T02:00:00Z'), standardWeek, [], TZ)).toBe(false); // 05:00
    expect(isOpenAt(new Date('2026-03-09T18:00:00Z'), standardWeek, [], TZ)).toBe(false); // 21:00
  });

  it('is false during the midday break', () => {
    expect(isOpenAt(new Date('2026-03-09T10:30:00Z'), splitShift, [], TZ)).toBe(false); // 13:30
    expect(isOpenAt(new Date('2026-03-09T13:00:00Z'), splitShift, [], TZ)).toBe(true); // 16:00
  });

  it('respects a date override', () => {
    const overrides: DayOverride[] = [
      { day: MONDAY, opensAt: null, closesAt: null, isClosed: true, reasonAr: null, reasonEn: null },
    ];
    expect(isOpenAt(new Date('2026-03-09T06:00:00Z'), standardWeek, overrides, TZ)).toBe(false);
  });
});
