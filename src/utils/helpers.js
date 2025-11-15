import { differenceInYears, differenceInDays, parseISO, isValid } from "date-fns";

/**
 * Safely parse a date string (YYYY-MM-DD / ISO). Returns Date or null.
 */
export function safeParseDate(d) {
  if (!d) return null;
  try {
    const dt = typeof d === "string" ? parseISO(d) : d;
    return isValid(dt) ? dt : null;
  } catch (e) {
    return null;
  }
}

/**
 * Compute tenure in years (float), e.g., 1.75
 * If date is invalid, return 0
 */
export function computeTenureYears(date) {
  const dt = safeParseDate(date);
  if (!dt) return 0;
  const days = differenceInDays(new Date(), dt);
  const years = days / 365.25;
  return Math.round(years * 100) / 100;
}

/**
 * Count employees whose dateJoined falls within the last N days from today.
 * Expects employee.dateJoined to be parseable.
 */
export function lastNDaysCount(employees = [], n = 30) {
  const now = new Date();
  return employees.reduce((acc, e) => {
    const dt = safeParseDate(e.dateJoined);
    if (!dt) return acc;
    const days = differenceInDays(now, dt);
    return acc + (days >= 0 && days < n ? 1 : 0);
  }, 0);
}

/**
 * Group employees by position/role. Returns { positionName: count }
 */
export function groupByPosition(employees = []) {
  return employees.reduce((acc, e) => {
    const pos = (e.position || e.role || "Unknown").trim();
    if (!pos) return acc;
    acc[pos] = (acc[pos] || 0) + 1;
    return acc;
  }, {});
}
