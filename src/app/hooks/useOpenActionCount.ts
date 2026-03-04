import { useApp } from '../data/AppContext';
import {
  isReflectionOpen,
  getPrevMonth,
  getNextMonth,
} from '../data/planning-logic';

/**
 * Returns the number of open actions (excluding "executing" state).
 * Counts: reflection needed (1) + goals to set (1) = max 2.
 */
export function useOpenActionCount(): number {
  const { getActivePlan, getMonthlyPlan, getMonthlyReflection, getNow } = useApp();
  const now = getNow();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const activePlan = getActivePlan();

  if (!activePlan) return 0;

  let count = 0;

  const prev = getPrevMonth(currentMonth, currentYear);
  const prevMonthlyPlan = getMonthlyPlan(activePlan.id, prev.month, prev.year);
  const prevReflection = prevMonthlyPlan
    ? getMonthlyReflection(prevMonthlyPlan.id)
    : undefined;

  const currentMonthlyPlan = getMonthlyPlan(activePlan.id, currentMonth, currentYear);
  const currentReflection = currentMonthlyPlan
    ? getMonthlyReflection(currentMonthlyPlan.id)
    : undefined;

  // Reflection needed for previous month?
  const prevReflectionNeeded = !!prevMonthlyPlan && !prevReflection;
  if (prevReflectionNeeded && isReflectionOpen(prev.month, prev.year, now)) {
    count++;
  }

  // Reflection needed for current month?
  const currentReflectionOpen = currentMonthlyPlan && !currentReflection && isReflectionOpen(currentMonth, currentYear, now);
  if (currentReflectionOpen) {
    count++;
  }

  // Goals to set for current month? (counts even when blocked by pending reflection)
  if (!currentMonthlyPlan) {
    count++;
  }

  // Goals to set for next month? (when reflection window is open for current month and next month has no plan yet)
  const currentReflectionWindowOpen = isReflectionOpen(currentMonth, currentYear, now);
  if (currentReflectionWindowOpen && currentMonthlyPlan) {
    const next = getNextMonth(currentMonth, currentYear);
    const nextMonthlyPlan = getMonthlyPlan(activePlan.id, next.month, next.year);
    if (!nextMonthlyPlan) {
      count++;
    }
  }

  return count;
}