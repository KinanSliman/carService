import { describe, expect, it } from 'vitest';
import {
  type MaintenanceRuleInput,
  type ServiceRecord,
  buildSchedule,
  projectDue,
} from './maintenance';

const NOW = new Date('2026-09-07T09:00:00Z');

const oilChange: MaintenanceRuleInput = {
  serviceSlug: 'oil-change',
  intervalKm: 10000,
  intervalMonths: 6,
};
const brakePads: MaintenanceRuleInput = {
  serviceSlug: 'front-brake-pads',
  intervalKm: 40000,
  intervalMonths: null,
};
const battery: MaintenanceRuleInput = {
  serviceSlug: 'battery-replacement',
  intervalKm: null,
  intervalMonths: 30,
};

const record = (
  serviceSlug: string,
  performedAt: string,
  odometerKm: number,
): ServiceRecord => ({ serviceSlug, performedAt: new Date(performedAt), odometerKm });

describe('projectDue', () => {
  it('counts down the distance from the last recorded service', () => {
    const item = projectDue(
      oilChange,
      { odometerKm: 84000 },
      [record('oil-change', '2026-07-01T00:00:00Z', 80000)],
      NOW,
    );
    expect(item.kmRemaining).toBe(6000);
    expect(item.status).toBe('later');
  });

  it('reports a negative remaining distance once the interval is passed', () => {
    const item = projectDue(
      oilChange,
      { odometerKm: 92500 },
      [record('oil-change', '2026-08-20T00:00:00Z', 80000)],
      NOW,
    );
    expect(item.kmRemaining).toBe(-2500);
    expect(item.status).toBe('overdue');
  });

  it('lets the time interval come due first on a low-mileage car', () => {
    // Only 1,000 km since the service, but seven months have passed. This is
    // the Qatari case the rule exists for: heat ages the oil, not distance.
    const item = projectDue(
      oilChange,
      { odometerKm: 81000 },
      [record('oil-change', '2026-02-01T00:00:00Z', 80000)],
      NOW,
    );
    expect(item.kmRemaining).toBe(9000);
    expect(item.monthsRemaining).toBeLessThan(0);
    expect(item.status).toBe('overdue');
    expect(item.drivenBy).toBe('months');
  });

  it('lets the distance interval come due first on a high-mileage car', () => {
    const item = projectDue(
      oilChange,
      { odometerKm: 89800 },
      [record('oil-change', '2026-08-01T00:00:00Z', 80000)],
      NOW,
    );
    expect(item.kmRemaining).toBe(200);
    expect(item.drivenBy).toBe('km');
    expect(item.status).toBe('due-soon');
  });

  it('handles a rule with only a distance interval', () => {
    const item = projectDue(
      brakePads,
      { odometerKm: 100000 },
      [record('front-brake-pads', '2024-01-01T00:00:00Z', 70000)],
      NOW,
    );
    expect(item.monthsRemaining).toBeNull();
    expect(item.kmRemaining).toBe(10000);
    expect(item.drivenBy).toBe('km');
  });

  it('handles a rule with only a time interval', () => {
    const item = projectDue(
      battery,
      { odometerKm: 100000 },
      [record('battery-replacement', '2025-01-01T00:00:00Z', 70000)],
      NOW,
    );
    expect(item.kmRemaining).toBeNull();
    expect(item.monthsRemaining).toBe(10);
    expect(item.drivenBy).toBe('months');
    expect(item.status).toBe('later');
  });

  it('treats a service that was never logged as due now rather than unknown', () => {
    const item = projectDue(oilChange, { odometerKm: 84000 }, [], NOW);
    expect(item.lastPerformedAt).toBeNull();
    expect(item.lastOdometerKm).toBeNull();
    expect(item.status).toBe('due-now');
  });

  it('uses the most recent record when several exist', () => {
    const item = projectDue(
      oilChange,
      { odometerKm: 84000 },
      [
        record('oil-change', '2025-01-01T00:00:00Z', 60000),
        record('oil-change', '2026-08-01T00:00:00Z', 80000),
        record('oil-change', '2025-09-01T00:00:00Z', 70000),
      ],
      NOW,
    );
    expect(item.lastOdometerKm).toBe(80000);
    expect(item.kmRemaining).toBe(6000);
  });

  it('ignores records belonging to another service', () => {
    const item = projectDue(
      oilChange,
      { odometerKm: 84000 },
      [record('front-brake-pads', '2026-08-01T00:00:00Z', 83000)],
      NOW,
    );
    expect(item.lastPerformedAt).toBeNull();
  });

  it('projects an estimated date from remaining distance and usage', () => {
    const item = projectDue(
      brakePads,
      { odometerKm: 100000, kmPerYear: 12000 },
      [record('front-brake-pads', '2024-01-01T00:00:00Z', 94000)],
      NOW,
    );
    // 34,000 km left at 12,000 km/year is a little under three years out.
    expect(item.estimatedDueAt).not.toBeNull();
    const years =
      (item.estimatedDueAt!.getTime() - NOW.getTime()) / (365 * 24 * 60 * 60 * 1000);
    expect(years).toBeGreaterThan(2.5);
    expect(years).toBeLessThan(3.1);
  });

  it('picks the earlier of the two estimated dates', () => {
    const item = projectDue(
      oilChange,
      { odometerKm: 80500, kmPerYear: 6000 },
      [record('oil-change', '2026-08-01T00:00:00Z', 80000)],
      NOW,
    );
    // 9,500 km at 6,000 km/year is ~19 months; the 6-month rule lands first.
    const months =
      (item.estimatedDueAt!.getTime() - NOW.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
    expect(months).toBeLessThan(6);
  });
});

describe('buildSchedule', () => {
  const rules = [oilChange, brakePads, battery];

  it('orders overdue before due-soon before later', () => {
    const schedule = buildSchedule(
      rules,
      { odometerKm: 100000 },
      [
        // Eight months ago: past the 6-month oil interval.
        record('oil-change', '2026-01-01T00:00:00Z', 92000),
        // 39,000 km of the 40,000 km pad interval still to run.
        record('front-brake-pads', '2026-06-01T00:00:00Z', 99000),
        // 29 months into a 30-month battery interval: one month left.
        record('battery-replacement', '2024-04-07T00:00:00Z', 61000),
      ],
      NOW,
    );
    expect(schedule.map((i) => [i.serviceSlug, i.status])).toEqual([
      ['oil-change', 'overdue'],
      ['battery-replacement', 'due-soon'],
      ['front-brake-pads', 'later'],
    ]);
  });

  it('returns an item for every rule, including ones never logged', () => {
    const schedule = buildSchedule(rules, { odometerKm: 50000 }, [], NOW);
    expect(schedule).toHaveLength(3);
    expect(schedule.every((i) => i.status === 'due-now')).toBe(true);
  });

  it('is stable for items that tie on status and date', () => {
    const first = buildSchedule(rules, { odometerKm: 50000 }, [], NOW);
    const second = buildSchedule([...rules].reverse(), { odometerKm: 50000 }, [], NOW);
    expect(first.map((i) => i.serviceSlug)).toEqual(second.map((i) => i.serviceSlug));
  });
});
