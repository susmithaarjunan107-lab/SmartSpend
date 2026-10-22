import { differenceInCalendarDays } from 'date-fns';
import { createId } from './ids.js';
import {
  addDays,
  addDaysISO,
  addMonthsWithAnchor,
  addYearsWithAnchor,
  formatISODate,
  monthRange,
  parseISODate,
  todayISO,
} from './dateUtils.js';

export function occurrenceKeyFor(recurringId, dueDate) {
  return `${recurringId}:${dueDate}`;
}

export function nextDueDate(currentDueISO, frequency, anchorISO) {
  const current = parseISODate(currentDueISO);
  const anchor = parseISODate(anchorISO);
  if (!current || !anchor) return null;
  if (frequency === 'weekly') return formatISODate(addDays(current, 7));
  if (frequency === 'monthly') return formatISODate(addMonthsWithAnchor(current, 1, anchor.getDate()));
  if (frequency === 'yearly') {
    return formatISODate(addYearsWithAnchor(current, 1, anchor.getMonth(), anchor.getDate()));
  }
  return null;
}

/**
 * Count scheduled occurrences inside a calendar month.
 * Weekly dates walk forward from the start date. Monthly and yearly dates use the
 * start date's day (and month, for yearly) so short months and 29 Feb stay predictable.
 * Paused schedules contribute nothing to the estimate.
 */
export function occurrencesInMonth(recurring, year, month) {
  if (!recurring || recurring.status === 'paused') return 0;
  const range = monthRange(year, month);
  if (recurring.startDate > range.end) return 0;
  if (recurring.endDate && recurring.endDate < range.start) return 0;

  if (recurring.frequency === 'monthly' || recurring.frequency === 'yearly') {
    const anchor = parseISODate(recurring.startDate);
    if (!anchor) return 0;
    if (recurring.frequency === 'yearly' && anchor.getMonth() + 1 !== month) return 0;
    const lastDay = new Date(year, month, 0).getDate();
    const day = Math.min(anchor.getDate(), lastDay);
    const due = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (due < recurring.startDate || due < range.start || due > range.end) return 0;
    if (recurring.endDate && due > recurring.endDate) return 0;
    return 1;
  }

  if (recurring.frequency === 'weekly') {
    let cursor = parseISODate(recurring.startDate);
    const startBound = parseISODate(range.start);
    const endBound = parseISODate(range.end);
    const limit = recurring.endDate ? parseISODate(recurring.endDate) : null;
    if (!cursor || !startBound || !endBound) return 0;
    const diff = differenceInCalendarDays(startBound, cursor);
    if (diff > 0) cursor = addDays(cursor, Math.floor(diff / 7) * 7);
    let catchUp = 0;
    while (cursor < startBound && catchUp < 6) {
      cursor = addDays(cursor, 7);
      catchUp += 1;
    }
    let count = 0;
    let steps = 0;
    while (cursor <= endBound && steps < 6) {
      if ((!limit || cursor <= limit) && cursor >= startBound) count += 1;
      cursor = addDays(cursor, 7);
      steps += 1;
    }
    return count;
  }

  return 0;
}

export function estimatedMonthlyCost(recurringExpenses, year, month) {
  const cents = recurringExpenses.reduce((total, item) => {
    const count = occurrencesInMonth(item, year, month);
    return total + Math.round(Number(item.amount) * 100) * count;
  }, 0);
  return cents / 100;
}

export function recurringTiming(recurring, today = todayISO()) {
  if (recurring.status === 'paused') return 'paused';
  if (recurring.endDate && recurring.nextDueDate > recurring.endDate) return 'ended';
  if (recurring.nextDueDate < today) return 'overdue';
  return 'upcoming';
}

export function partitionRecurring(list, today = todayISO()) {
  const groups = { overdue: [], upcoming: [], paused: [], ended: [] };
  list.forEach((item) => {
    groups[recurringTiming(item, today)].push(item);
  });
  const byDate = (a, b) => a.nextDueDate.localeCompare(b.nextDueDate);
  groups.overdue.sort(byDate);
  groups.upcoming.sort(byDate);
  return groups;
}

/**
 * Record one occurrence as a normal expense and move the due date forward.
 * The same occurrence cannot be recorded twice: the guard is the occurrence key
 * stored on the transaction. Opening the app never calls this function.
 */
export function markRecurringAsPaid(recurring, transactions, now = new Date()) {
  if (!recurring) return { ok: false, error: 'Recurring expense not found.' };
  if (recurring.status !== 'active') {
    return { ok: false, error: 'Resume this recurring expense before marking it as paid.' };
  }
  if (recurring.endDate && recurring.nextDueDate > recurring.endDate) {
    return { ok: false, error: 'This recurring expense has ended.' };
  }
  const occurrenceKey = occurrenceKeyFor(recurring.id, recurring.nextDueDate);
  if (transactions.some((transaction) => transaction.occurrenceKey === occurrenceKey)) {
    return {
      ok: false,
      error: 'This occurrence is already recorded. A second payment was not created.',
    };
  }
  const upcoming = nextDueDate(recurring.nextDueDate, recurring.frequency, recurring.startDate);
  if (!upcoming) return { ok: false, error: 'The next due date could not be calculated.' };

  const timestamp = now.toISOString();
  const note = recurring.notes?.trim();
  const transaction = {
    id: createId('txn'),
    description: recurring.description,
    amount: recurring.amount,
    type: 'expense',
    categoryId: recurring.categoryId,
    date: recurring.nextDueDate,
    paymentMethod: recurring.paymentMethod,
    notes: note ? `Recurring payment. ${note}` : 'Recurring payment',
    createdAt: timestamp,
    updatedAt: timestamp,
    recurringExpenseId: recurring.id,
    occurrenceKey,
    isDemo: Boolean(recurring.isDemo),
  };

  return {
    ok: true,
    transaction,
    recurring: {
      ...recurring,
      nextDueDate: upcoming,
      lastPaidOccurrence: recurring.nextDueDate,
      updatedAt: timestamp,
    },
  };
}

export function previewNextDate(startDate, frequency) {
  return nextDueDate(startDate, frequency, startDate) || addDaysISO(startDate, frequency === 'weekly' ? 7 : 0);
}
