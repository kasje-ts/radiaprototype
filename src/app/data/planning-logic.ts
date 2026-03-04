/**
 * Shared planning logic for reflection & monthly plan rules.
 *
 * REFLECTIE voor maand X:
 *   - Invullen vanaf: laatste dag van maand X
 *   - Deadline: 7e van maand X+1
 *   - Verplicht als er een maandplan was voor maand X
 *   - Optioneel als er geen maandplan was
 *
 * MAANDPLAN (doelen) voor maand X:
 *   - Invullen: pas nadat reflectie van maand X-1 is afgerond (indien verplicht)
 *   - Als geen reflectie verplicht was (geen doelen vorige maand), kan direct
 *   - Deadline: 7e van maand X
 *   - Te laat indienen = "late start"
 */

export const monthNames = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
];

/** Last day of a given month (0-indexed month) */
export function getLastDayOfMonth(month: number, year: number): Date {
  return new Date(year, month + 1, 0);
}

/** Reflection deadline for a given month: 7th of the next month, end of day */
export function getReflectionDeadline(month: number, year: number): Date {
  const nm = getNextMonth(month, year);
  return new Date(nm.year, nm.month, 7, 23, 59, 59);
}

/** Goals deadline for a given month: 7th of that month, end of day */
export function getGoalsDeadline(month: number, year: number): Date {
  return new Date(year, month, 7, 23, 59, 59);
}

/** Can the user start filling in the reflection for month X? (from last day of month X) */
export function isReflectionOpen(month: number, year: number, now: Date): boolean {
  const lastDay = getLastDayOfMonth(month, year);
  const availableFrom = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 0, 0, 0);
  return now >= availableFrom;
}

/** Is the reflection deadline passed? */
export function isReflectionOverdue(month: number, year: number, now: Date): boolean {
  return now > getReflectionDeadline(month, year);
}

/** Can the user set goals for month X?
 *  Previous month's reflection must be done (if required).
 *  "Required" = there was a monthly plan for the previous month.
 */
export function canSetGoalsForMonth(
  hasPrevMonthPlan: boolean,
  hasPrevMonthReflection: boolean,
): boolean {
  if (!hasPrevMonthPlan) return true;
  return hasPrevMonthReflection;
}

/** Is this a "late start"? Goals set after the 7th of the month */
export function isLateStart(planCreatedAt: string, month: number, year: number): boolean {
  const deadline = getGoalsDeadline(month, year);
  return new Date(planCreatedAt) > deadline;
}

/** Compute the previous month/year */
export function getPrevMonth(month: number, year: number): { month: number; year: number } {
  return month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year };
}

/** Compute the next month/year */
export function getNextMonth(month: number, year: number): { month: number; year: number } {
  return month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year };
}

/** Format a date as "7 maart 2026" */
export function formatDeadline(date: Date): string {
  return `${date.getDate()} ${monthNames[date.getMonth()].toLowerCase()} ${date.getFullYear()}`;
}

/** Days remaining until a date (returns negative if past) */
export function daysUntil(target: Date, now: Date): number {
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
