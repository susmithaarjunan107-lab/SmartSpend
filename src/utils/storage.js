import { SCHEMA_VERSION, STORAGE_BACKUP_KEY, STORAGE_KEY } from './constants.js';
import { getAllCategories } from './categories.js';
import { createEmptyState } from './dataOps.js';
import {
  normalizeBudgetRecord,
  normalizeCategoryRecord,
  normalizeMeta,
  normalizePreferences,
  normalizeRecurringRecord,
  normalizeTransactionRecord,
} from './dataValidation.js';

function backupInvalid(raw) {
  try {
    localStorage.setItem(STORAGE_BACKUP_KEY, raw);
  } catch {
    // The unreadable copy could not be preserved. The caller still avoids using it.
  }
}

function skipInvalid(list, normalize, categories, warnings, label) {
  if (list == null) return [];
  if (!Array.isArray(list)) {
    warnings.push(`${label} was not a list and was skipped.`);
    return [];
  }
  const values = [];
  const seen = new Set();
  list.forEach((record) => {
    const result = normalize(record, categories);
    if (!result.ok || seen.has(result.value?.id)) {
      warnings.push(result.ok ? `Duplicate ${label} id skipped.` : result.error);
      return;
    }
    seen.add(result.value.id);
    values.push(result.value);
  });
  return values;
}

export function normalizeStoredState(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'invalid' };
  }
  if (typeof parsed.schemaVersion === 'number' && parsed.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, reason: 'newer', preserve: true };
  }
  const known = ['transactions', 'budgets', 'recurringExpenses', 'customCategories', 'preferences', 'meta', 'schemaVersion'];
  if (!known.some((key) => Object.prototype.hasOwnProperty.call(parsed, key))) {
    return { ok: false, reason: 'invalid' };
  }
  if (parsed.schemaVersion != null && parsed.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, reason: 'invalid' };
  }

  const warnings = [];
  const customCategories = skipInvalid(
    parsed.customCategories,
    normalizeCategoryRecord,
    getAllCategories([]),
    warnings,
    'category',
  );
  const categories = getAllCategories(customCategories);
  const transactions = skipInvalid(parsed.transactions, normalizeTransactionRecord, categories, warnings, 'transaction');
  const budgets = skipInvalid(parsed.budgets, normalizeBudgetRecord, categories, warnings, 'budget');
  const recurringExpenses = skipInvalid(
    parsed.recurringExpenses,
    normalizeRecurringRecord,
    categories,
    warnings,
    'recurring expense',
  );

  const uniqueBudgets = [];
  const budgetKeys = new Set();
  budgets.forEach((budget) => {
    const key = `${budget.year}-${budget.month}-${budget.scope}-${budget.categoryId || 'all'}`;
    if (budgetKeys.has(key)) {
      warnings.push('A duplicate budget was skipped.');
      return;
    }
    budgetKeys.add(key);
    uniqueBudgets.push(budget);
  });

  return {
    ok: true,
    warnings,
    data: {
      schemaVersion: SCHEMA_VERSION,
      transactions,
      budgets: uniqueBudgets,
      recurringExpenses,
      customCategories,
      preferences: normalizePreferences(parsed.preferences),
      meta: normalizeMeta(parsed.meta),
    },
  };
}

export function loadAppData() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return {
      data: createEmptyState(),
      warning: 'Browser storage is unavailable. Changes in this tab will not be saved.',
      unavailable: true,
      preserve: true,
    };
  }

  if (raw == null) {
    return { data: createEmptyState(), warning: null, unavailable: false, preserve: false };
  }

  try {
    const parsed = JSON.parse(raw);
    const result = normalizeStoredState(parsed);
    if (!result.ok && result.preserve) {
      return {
        data: createEmptyState(),
        warning: 'Saved data was written by a newer version of SmartSpend. It was left untouched and was not loaded.',
        unavailable: false,
        preserve: true,
      };
    }
    if (!result.ok) {
      backupInvalid(raw);
      return {
        data: createEmptyState(),
        warning: 'Saved data could not be read. A copy was kept in this browser and SmartSpend started fresh.',
        unavailable: false,
        preserve: false,
      };
    }
    if (result.warnings.length) backupInvalid(raw);
    return {
      data: result.data,
      warning: result.warnings.length
        ? `Some saved records were skipped because they were invalid (${result.warnings.length}). A copy of the previous save was kept in this browser.`
        : null,
      unavailable: false,
      preserve: false,
    };
  } catch {
    backupInvalid(raw);
    return {
      data: createEmptyState(),
      warning: 'Saved data was corrupted. A copy was kept in this browser and SmartSpend started fresh.',
      unavailable: false,
      preserve: false,
    };
  }
}

export function saveAppData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Changes could not be saved. Browser storage may be full or disabled.',
    };
  }
}

export { STORAGE_KEY, STORAGE_BACKUP_KEY };
