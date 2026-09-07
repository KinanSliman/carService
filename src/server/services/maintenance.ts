import { addMonths, differenceInCalendarMonths } from 'date-fns';

/**
 * Next-due projection for the demo garage.
 *
 * A maintenance rule can carry a distance interval, a time interval, or both.
 * When it has both, whichever threshold arrives first wins — which is the
 * whole point in Qatar, where a car doing 6,000 km a year still needs its oil
 * changed on the calendar because the heat degrades it regardless of use.
 *
 * Pure functions over plain inputs: no database, no clock of its own. `now`
 * and the odometer are passed in, which is what makes this the other file with
 * real tests.
 */

export type MaintenanceRuleInput = {
  serviceSlug: string;
  intervalKm: number | null;
  intervalMonths: number | null;
};

export type ServiceRecord = {
  serviceSlug: string;
  /** When the work was done. */
  performedAt: Date;
  /** Odometer reading at the time, in km. */
  odometerKm: number;
};

export type VehicleState = {
  /** Today's odometer reading. */
  odometerKm: number;
  /** Rough usage, used to convert a remaining distance into a rough date. */
  kmPerYear?: number;
};

export type DueStatus = 'overdue' | 'due-now' | 'due-soon' | 'later' | 'unknown';

export type DueItem = {
  serviceSlug: string;
  status: DueStatus;
  /** Positive = km remaining; negative = km overdue. Null when no km rule. */
  kmRemaining: number | null;
  /** Positive = months remaining; negative = overdue. Null when no time rule. */
  monthsRemaining: number | null;
  /** Which of the two thresholds is the binding one. */
  drivenBy: 'km' | 'months' | null;
  /** Best-effort date, for ordering the timeline. Null when only km is known
   *  and no usage estimate is available. */
  estimatedDueAt: Date | null;
  /** The record this was projected from, if any. */
  lastPerformedAt: Date | null;
  lastOdometerKm: number | null;
};

/** Default Qatari annual mileage, used only to turn km into a rough date. */
export const DEFAULT_KM_PER_YEAR = 18000;

/** Within this much of the threshold, an item is "due soon" rather than "later". */
const SOON_KM = 1500;
const SOON_MONTHS = 1;

function statusFor(kmRemaining: number | null, monthsRemaining: number | null): DueStatus {
  const values = [kmRemaining, monthsRemaining].filter((v): v is number => v !== null);
  if (values.length === 0) return 'unknown';

  // Whichever threshold is closest decides, including when it has passed.
  const km = kmRemaining;
  const months = monthsRemaining;

  if ((km !== null && km < 0) || (months !== null && months < 0)) return 'overdue';
  if ((km !== null && km === 0) || (months !== null && months === 0)) return 'due-now';
  if ((km !== null && km <= SOON_KM) || (months !== null && months <= SOON_MONTHS)) {
    return 'due-soon';
  }
  return 'later';
}

/**
 * Projects one rule against the vehicle's state and its service history.
 *
 * A service that has never been recorded is not an error: it is reported with
 * `lastPerformedAt: null` and projected from the interval alone, because a car
 * added to the garage today has no history and an empty maintenance list would
 * make the feature look broken on first use.
 */
export function projectDue(
  rule: MaintenanceRuleInput,
  vehicle: VehicleState,
  records: ServiceRecord[],
  now: Date,
): DueItem {
  const history = records
    .filter((r) => r.serviceSlug === rule.serviceSlug)
    .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
  const last = history[0] ?? null;

  let kmRemaining: number | null = null;
  let monthsRemaining: number | null = null;

  if (rule.intervalKm !== null) {
    if (last) {
      const dueAtKm = last.odometerKm + rule.intervalKm;
      kmRemaining = dueAtKm - vehicle.odometerKm;
    } else {
      // No record: assume the last one happened one full interval ago, which
      // makes an unlogged item read as "due now" rather than as "never".
      kmRemaining = 0;
    }
  }

  if (rule.intervalMonths !== null) {
    if (last) {
      const dueAt = addMonths(last.performedAt, rule.intervalMonths);
      monthsRemaining = differenceInCalendarMonths(dueAt, now);
    } else {
      monthsRemaining = 0;
    }
  }

  const drivenBy = pickDriver(kmRemaining, monthsRemaining);

  return {
    serviceSlug: rule.serviceSlug,
    status: statusFor(kmRemaining, monthsRemaining),
    kmRemaining,
    monthsRemaining,
    drivenBy,
    estimatedDueAt: estimateDueDate(kmRemaining, monthsRemaining, vehicle, now),
    lastPerformedAt: last?.performedAt ?? null,
    lastOdometerKm: last?.odometerKm ?? null,
  };
}

/**
 * Which threshold is binding. Distances are converted to months at the
 * vehicle's usage rate so the two are comparable at all — otherwise "3,000 km"
 * and "4 months" cannot be ranked against each other.
 */
function pickDriver(
  kmRemaining: number | null,
  monthsRemaining: number | null,
  kmPerYear = DEFAULT_KM_PER_YEAR,
): 'km' | 'months' | null {
  if (kmRemaining === null && monthsRemaining === null) return null;
  if (kmRemaining === null) return 'months';
  if (monthsRemaining === null) return 'km';
  const kmAsMonths = (kmRemaining / kmPerYear) * 12;
  return kmAsMonths <= monthsRemaining ? 'km' : 'months';
}

function estimateDueDate(
  kmRemaining: number | null,
  monthsRemaining: number | null,
  vehicle: VehicleState,
  now: Date,
): Date | null {
  const kmPerYear = vehicle.kmPerYear ?? DEFAULT_KM_PER_YEAR;
  const candidates: Date[] = [];

  if (monthsRemaining !== null) {
    candidates.push(addMonths(now, monthsRemaining));
  }
  if (kmRemaining !== null && kmPerYear > 0) {
    const days = (kmRemaining / kmPerYear) * 365;
    candidates.push(new Date(now.getTime() + days * 24 * 60 * 60 * 1000));
  }
  if (candidates.length === 0) return null;

  // The earliest threshold is the one that will actually come due.
  return candidates.reduce((earliest, date) => (date < earliest ? date : earliest));
}

const statusOrder: Record<DueStatus, number> = {
  overdue: 0,
  'due-now': 1,
  'due-soon': 2,
  later: 3,
  unknown: 4,
};

/**
 * The garage's "coming up" list: everything projected, most urgent first, and
 * ties broken by the estimated date so the order is stable between renders.
 */
export function buildSchedule(
  rules: MaintenanceRuleInput[],
  vehicle: VehicleState,
  records: ServiceRecord[],
  now: Date,
): DueItem[] {
  return rules
    .map((rule) => projectDue(rule, vehicle, records, now))
    .sort((a, b) => {
      const byStatus = statusOrder[a.status] - statusOrder[b.status];
      if (byStatus !== 0) return byStatus;
      const aTime = a.estimatedDueAt?.getTime() ?? Number.POSITIVE_INFINITY;
      const bTime = b.estimatedDueAt?.getTime() ?? Number.POSITIVE_INFINITY;
      if (aTime !== bTime) return aTime - bTime;
      return a.serviceSlug.localeCompare(b.serviceSlug);
    });
}
