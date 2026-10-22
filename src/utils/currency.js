import { CURRENCIES } from './constants.js';

export function currencyMeta(code) {
  return CURRENCIES.find((item) => item.code === code) || CURRENCIES[0];
}

export function formatCurrency(amount, currency = 'INR') {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '—';
  const meta = currencyMeta(currency);
  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: meta.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(amount, currency = 'INR') {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '—';
  const meta = currencyMeta(currency);
  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: meta.code,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value, digits = 0) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${Number(value).toFixed(digits)}%`;
}

/**
 * Currency totals are summed in integer paise/cents so 0.1 + 0.2 does not become 0.30000000000000004.
 */
export function sumAmounts(values) {
  const cents = values.reduce((total, value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return total;
    return total + Math.round(amount * 100);
  }, 0);
  return cents / 100;
}

export function roundMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}
