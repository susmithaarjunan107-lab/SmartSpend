import { differenceInCalendarDays, format } from 'date-fns';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseISODate(iso) {
  if (typeof iso !== 'string' || !ISO_DATE.test(iso)) return null;
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function isValidISODate(iso) {
  return parseISODate(iso) !== null;
}

export function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(now = new Date()) {
  return formatISODate(now);
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function addDaysISO(iso, days) {
  const date = parseISODate(iso);
  if (!date) return null;
  return formatISODate(addDays(date, days));
}

/**
 * Add calendar months without drifting off the original due day.
 * 31 Jan + 1 month becomes 28 Feb (or 29 in a leap year). The next step
 * uses the anchor day, so March returns to the 31st instead of staying on the 28th.
 */
export function addMonthsWithAnchor(fromDate, months, anchorDay) {
  const index = fromDate.getFullYear() * 12 + fromDate.getMonth() + months;
  const year = Math.floor(index / 12);
  const month = index - year * 12;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(anchorDay, lastDay));
}

/**
 * Add years while keeping the start month and day.
 * A 29 Feb start falls on 28 Feb in common years and returns to 29 Feb in leap years.
 */
export function addYearsWithAnchor(fromDate, years, anchorMonth, anchorDay) {
  const year = fromDate.getFullYear() + years;
  const lastDay = new Date(year, anchorMonth + 1, 0).getDate();
  return new Date(year, anchorMonth, Math.min(anchorDay, lastDay));
}

export function shiftMonth(year, month, offset) {
  const index = year * 12 + (month - 1) + offset;
  const nextYear = Math.floor(index / 12);
  const nextMonth = index - nextYear * 12;
  return { year: nextYear, month: nextMonth + 1 };
}

export function previousMonth(year, month) {
  return shiftMonth(year, month, -1);
}

export function monthRange(year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');
  return {
    start: `${year}-${mm}-01`,
    end: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function inMonth(iso, year, month) {
  if (!isValidISODate(iso)) return false;
  const range = monthRange(year, month);
  return iso >= range.start && iso <= range.end;
}

export function formatDisplayDate(iso, pattern = 'dd MMM yyyy') {
  const date = parseISODate(iso);
  if (!date) return '—';
  try {
    return format(date, pattern);
  } catch {
    return format(date, 'dd MMM yyyy');
  }
}

export function monthLabel(year, month, pattern = 'MMM yyyy') {
  return format(new Date(year, month - 1, 1), pattern);
}

export function currentYearMonth(now = new Date()) {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function daysFromToday(iso, today = todayISO()) {
  const target = parseISODate(iso);
  const origin = parseISODate(today);
  if (!target || !origin) return null;
  return differenceInCalendarDays(target, origin);
}

export function resolvePeriod(preset, year, month) {
  if (preset === 'year') {
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      seriesEndYear: year,
      seriesEndMonth: 12,
      seriesLength: 12,
    };
  }
  const seriesLength = preset === '12' ? 12 : preset === '6' ? 6 : 1;
  const startPoint = shiftMonth(year, month, -(seriesLength - 1));
  return {
    start: monthRange(startPoint.year, startPoint.month).start,
    end: monthRange(year, month).end,
    seriesEndYear: year,
    seriesEndMonth: month,
    seriesLength,
  };
}
