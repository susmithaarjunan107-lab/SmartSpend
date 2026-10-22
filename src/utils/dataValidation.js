import {
  APP_NAME,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CURRENCIES,
  DATE_FORMATS,
  EMPTY_META,
  FREQUENCIES,
  PAYMENT_METHODS,
  PREFERENCE_DEFAULTS,
  SCHEMA_VERSION,
} from './constants.js';
import {
  DEFAULT_CATEGORIES,
  categoryNameTaken,
  getAllCategories,
} from './categories.js';
import { isValidISODate } from './dateUtils.js';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const FREQUENCY_IDS = FREQUENCIES.map((item) => item.id);

export function parseAmount(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0 || value > 999999999) return { ok: false };
    const amount = Math.round(value * 100) / 100;
    if (amount <= 0) return { ok: false };
    return { ok: true, amount };
  }
  const trimmed = String(value ?? '').trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return { ok: false };
  const amount = Math.round(Number(trimmed) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999) return { ok: false };
  return { ok: true, amount };
}

export function normalizePreferences(input) {
  const source = input && typeof input === 'object' ? input : {};
  const currency = CURRENCIES.some((item) => item.code === source.currency)
    ? source.currency
    : PREFERENCE_DEFAULTS.currency;
  const dateFormat = DATE_FORMATS.some((item) => item.id === source.dateFormat)
    ? source.dateFormat
    : PREFERENCE_DEFAULTS.dateFormat;
  let displayName = PREFERENCE_DEFAULTS.displayName;
  if (typeof source.displayName === 'string' && source.displayName.trim()) {
    displayName = source.displayName.trim().slice(0, 40);
  }
  return {
    currency,
    dateFormat,
    dashboardMonth: source.dashboardMonth === 'remember' ? 'remember' : 'current',
    theme: source.theme === 'dark' ? 'dark' : 'light',
    displayName,
  };
}

export function normalizeMeta(input) {
  const source = input && typeof input === 'object' ? input : {};
  const last = source.lastViewedMonth;
  const lastViewedMonth =
    last &&
    Number.isInteger(Number(last.month)) &&
    Number(last.month) >= 1 &&
    Number(last.month) <= 12 &&
    Number.isInteger(Number(last.year)) &&
    Number(last.year) >= 2000 &&
    Number(last.year) <= 2100
      ? { year: Number(last.year), month: Number(last.month) }
      : null;
  return {
    demoPromptSeen: Boolean(source.demoPromptSeen),
    demoLoaded: Boolean(source.demoLoaded),
    lastViewedMonth,
  };
}

export function validateTransactionInput(input, categories) {
  const errors = {};
  const description = String(input?.description ?? '').trim();
  if (!description) errors.description = 'Description is required.';
  else if (description.length > 120) errors.description = 'Description must be 120 characters or fewer.';

  const parsed = parseAmount(input?.amount);
  if (!parsed.ok) errors.amount = 'Enter an amount greater than zero, with up to 2 decimal places.';

  if (input?.type !== 'income' && input?.type !== 'expense') errors.type = 'Choose income or expense.';

  const category = categories.find((item) => item.id === input?.categoryId);
  if (!input?.categoryId) errors.categoryId = 'Category is required.';
  else if (!category) errors.categoryId = 'Choose a valid category.';
  else if ((input?.type === 'income' || input?.type === 'expense') && category.type !== input.type) {
    errors.categoryId = 'Category does not match the transaction type.';
  }

  if (!isValidISODate(input?.date)) errors.date = 'Enter a valid date.';
  if (!PAYMENT_METHODS.includes(input?.paymentMethod)) errors.paymentMethod = 'Choose a payment method.';

  const notes = String(input?.notes ?? '').trim();
  if (notes.length > 500) errors.notes = 'Notes must be 500 characters or fewer.';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: parsed.ok
      ? {
          description,
          amount: parsed.amount,
          type: input.type,
          categoryId: input.categoryId,
          date: input.date,
          paymentMethod: input.paymentMethod,
          notes,
        }
      : null,
  };
}

export function validateBudgetInput(input, categories) {
  const errors = {};
  const scope = input?.scope;
  if (scope !== 'overall' && scope !== 'category') errors.scope = 'Choose a budget type.';

  const parsed = parseAmount(input?.limit);
  if (!parsed.ok) errors.limit = 'Enter a limit greater than zero, with up to 2 decimal places.';

  const month = Number(input?.month);
  const year = Number(input?.year);
  if (!Number.isInteger(month) || month < 1 || month > 12) errors.month = 'Choose a valid month.';
  if (!Number.isInteger(year) || year < 2000 || year > 2100) errors.year = 'Choose a year between 2000 and 2100.';

  let categoryId = null;
  if (scope === 'category') {
    const category = categories.find((item) => item.id === input?.categoryId && item.type === 'expense');
    if (!category) errors.categoryId = 'Choose an expense category.';
    else categoryId = category.id;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value:
      parsed.ok && !errors.month && !errors.year && !errors.scope && !errors.categoryId
        ? { scope, categoryId, limit: parsed.amount, month, year }
        : null,
  };
}

export function validateRecurringInput(input, categories) {
  const errors = {};
  const description = String(input?.description ?? '').trim();
  if (!description) errors.description = 'Description is required.';
  else if (description.length > 120) errors.description = 'Description must be 120 characters or fewer.';

  const parsed = parseAmount(input?.amount);
  if (!parsed.ok) errors.amount = 'Enter an amount greater than zero, with up to 2 decimal places.';

  const category = categories.find((item) => item.id === input?.categoryId && item.type === 'expense');
  if (!category) errors.categoryId = 'Choose an expense category.';

  if (!FREQUENCY_IDS.includes(input?.frequency)) errors.frequency = 'Choose weekly, monthly, or yearly.';
  if (!isValidISODate(input?.startDate)) errors.startDate = 'Enter a valid start date.';
  if (!isValidISODate(input?.nextDueDate)) errors.nextDueDate = 'Enter a valid next due date.';
  if (isValidISODate(input?.startDate) && isValidISODate(input?.nextDueDate) && input.nextDueDate < input.startDate) {
    errors.nextDueDate = 'Next due date cannot be before the start date.';
  }

  const endDate = String(input?.endDate ?? '').trim();
  if (endDate && !isValidISODate(endDate)) errors.endDate = 'Enter a valid end date or leave it blank.';
  if (endDate && isValidISODate(input?.startDate) && endDate < input.startDate) {
    errors.endDate = 'End date cannot be before the start date.';
  }
  if (endDate && isValidISODate(input?.nextDueDate) && input.nextDueDate > endDate) {
    errors.nextDueDate = 'Next due date must be on or before the end date.';
  }

  if (!PAYMENT_METHODS.includes(input?.paymentMethod)) errors.paymentMethod = 'Choose a payment method.';
  const status = input?.status === 'paused' ? 'paused' : input?.status === 'active' ? 'active' : '';
  if (!status) errors.status = 'Choose active or paused.';

  const notes = String(input?.notes ?? '').trim();
  if (notes.length > 500) errors.notes = 'Notes must be 500 characters or fewer.';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value:
      parsed.ok && Object.keys(errors).length === 0
        ? {
            description,
            amount: parsed.amount,
            categoryId: input.categoryId,
            frequency: input.frequency,
            startDate: input.startDate,
            nextDueDate: input.nextDueDate,
            endDate: endDate || null,
            status,
            paymentMethod: input.paymentMethod,
            notes,
          }
        : null,
  };
}

export function validateCategoryInput(input, categories, exceptId) {
  const errors = {};
  const name = String(input?.name ?? '').trim();
  if (name.length < 2) errors.name = 'Name must be at least 2 characters.';
  else if (name.length > 40) errors.name = 'Name must be 40 characters or fewer.';

  if (input?.type !== 'income' && input?.type !== 'expense') errors.type = 'Choose income or expense.';
  if (!CATEGORY_ICONS.includes(input?.icon)) errors.icon = 'Choose an icon.';
  if (typeof input?.color !== 'string' || !HEX_COLOR.test(input.color)) errors.color = 'Choose a color.';
  if (!errors.name && !errors.type && categoryNameTaken(name, input.type, categories, exceptId)) {
    errors.name = 'A category with this name already exists for this type.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: Object.keys(errors).length === 0 ? { name, type: input.type, icon: input.icon, color: input.color } : null,
  };
}

function timestampOrNull(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : null;
}

function pushUnique(errors, seen, id, label) {
  if (seen.has(id)) errors.push(`Duplicate ${label} id "${id}".`);
  seen.add(id);
}

export function normalizeTransactionRecord(record, categories) {
  if (!record || typeof record !== 'object') return { ok: false, error: 'A transaction is not an object.' };
  if (typeof record.id !== 'string' || !record.id.trim()) return { ok: false, error: 'A transaction is missing an id.' };
  const validated = validateTransactionInput(record, categories);
  if (!validated.ok) {
    return { ok: false, error: `Transaction "${record.description || record.id}": ${Object.values(validated.errors)[0]}` };
  }
  const createdAt = timestampOrNull(record.createdAt);
  if (!createdAt) return { ok: false, error: `Transaction "${record.id}" has an invalid createdAt timestamp.` };
  const value = {
    id: record.id.trim(),
    ...validated.value,
    createdAt,
    updatedAt: timestampOrNull(record.updatedAt) || createdAt,
    isDemo: Boolean(record.isDemo),
  };
  if (typeof record.recurringExpenseId === 'string' && record.recurringExpenseId.trim()) {
    value.recurringExpenseId = record.recurringExpenseId.trim();
  }
  if (typeof record.occurrenceKey === 'string' && record.occurrenceKey.trim()) {
    value.occurrenceKey = record.occurrenceKey.trim();
  }
  return { ok: true, value };
}

export function normalizeBudgetRecord(record, categories) {
  if (!record || typeof record !== 'object') return { ok: false, error: 'A budget is not an object.' };
  if (typeof record.id !== 'string' || !record.id.trim()) return { ok: false, error: 'A budget is missing an id.' };
  const validated = validateBudgetInput(record, categories);
  if (!validated.ok) {
    return { ok: false, error: `Budget "${record.id}": ${Object.values(validated.errors)[0]}` };
  }
  const createdAt = timestampOrNull(record.createdAt);
  if (!createdAt) return { ok: false, error: `Budget "${record.id}" has an invalid createdAt timestamp.` };
  return {
    ok: true,
    value: {
      id: record.id.trim(),
      ...validated.value,
      createdAt,
      updatedAt: timestampOrNull(record.updatedAt) || createdAt,
      isDemo: Boolean(record.isDemo),
    },
  };
}

export function normalizeRecurringRecord(record, categories) {
  if (!record || typeof record !== 'object') return { ok: false, error: 'A recurring expense is not an object.' };
  if (typeof record.id !== 'string' || !record.id.trim()) {
    return { ok: false, error: 'A recurring expense is missing an id.' };
  }
  const validated = validateRecurringInput(record, categories);
  if (!validated.ok) {
    return {
      ok: false,
      error: `Recurring expense "${record.description || record.id}": ${Object.values(validated.errors)[0]}`,
    };
  }
  const createdAt = timestampOrNull(record.createdAt);
  if (!createdAt) return { ok: false, error: `Recurring expense "${record.id}" has an invalid createdAt timestamp.` };
  const value = {
    id: record.id.trim(),
    ...validated.value,
    createdAt,
    updatedAt: timestampOrNull(record.updatedAt) || createdAt,
    isDemo: Boolean(record.isDemo),
    lastPaidOccurrence: isValidISODate(record.lastPaidOccurrence) ? record.lastPaidOccurrence : null,
  };
  return { ok: true, value };
}

export function normalizeCategoryRecord(record, categories) {
  if (!record || typeof record !== 'object') return { ok: false, error: 'A category is not an object.' };
  if (typeof record.id !== 'string' || !record.id.trim()) return { ok: false, error: 'A category is missing an id.' };
  if (DEFAULT_CATEGORIES.some((category) => category.id === record.id)) {
    return { ok: false, error: `Custom category id "${record.id}" conflicts with a built-in category.` };
  }
  const validated = validateCategoryInput(record, categories, record.id);
  if (!validated.ok) {
    return { ok: false, error: `Category "${record.name || record.id}": ${Object.values(validated.errors)[0]}` };
  }
  return {
    ok: true,
    value: {
      id: record.id.trim(),
      ...validated.value,
      isCustom: true,
      isDemo: Boolean(record.isDemo),
    },
  };
}

function collectRecords(list, normalize, label, errors, categories) {
  if (!Array.isArray(list)) {
    errors.push(`${label} must be a list.`);
    return [];
  }
  const seen = new Set();
  const values = [];
  list.forEach((record, index) => {
    const result = normalize(record, categories);
    if (!result.ok) {
      if (errors.length < 12) errors.push(result.error || `${label} ${index + 1} is invalid.`);
      return;
    }
    pushUnique(errors, seen, result.value.id, label.toLowerCase());
    values.push(result.value);
  });
  return values;
}

export function validateBackup(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, errors: ['The file is not a SmartSpend backup.'] };
  }
  if (payload.app && payload.app !== APP_NAME) errors.push('This file was not exported by SmartSpend.');
  const version = payload.schemaVersion;
  if (version !== SCHEMA_VERSION) {
    errors.push(`Unsupported backup version (${version ?? 'missing'}). This app reads version ${SCHEMA_VERSION}.`);
  }
  const data = payload.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, errors: [...errors, 'The backup is missing a data object.'] };
  }

  const customCategories = [];
  const categorySeen = new Set();
  const categoryNames = new Set(
    DEFAULT_CATEGORIES.map((category) => `${category.type}:${category.name.trim().toLowerCase()}`),
  );
  if (!Array.isArray(data.customCategories || [])) {
    errors.push('Categories must be a list.');
  } else {
    (data.customCategories || []).forEach((record) => {
      const result = normalizeCategoryRecord(record, getAllCategories(customCategories));
      if (!result.ok) {
        if (errors.length < 12) errors.push(result.error);
        return;
      }
      const nameKey = `${result.value.type}:${result.value.name.trim().toLowerCase()}`;
      if (categorySeen.has(result.value.id) || categoryNames.has(nameKey)) {
        if (errors.length < 12) errors.push(`Category "${result.value.name}" is duplicated.`);
        return;
      }
      categorySeen.add(result.value.id);
      categoryNames.add(nameKey);
      customCategories.push(result.value);
    });
  }
  const categories = getAllCategories(customCategories);
  const transactions = collectRecords(data.transactions || [], normalizeTransactionRecord, 'Transactions', errors, categories);
  const budgets = collectRecords(data.budgets || [], normalizeBudgetRecord, 'Budgets', errors, categories);
  const recurringExpenses = collectRecords(
    data.recurringExpenses || [],
    normalizeRecurringRecord,
    'Recurring expenses',
    errors,
    categories,
  );

  const budgetKeys = new Set();
  budgets.forEach((budget) => {
    const key = `${budget.year}-${budget.month}-${budget.scope}-${budget.categoryId || 'all'}`;
    if (budgetKeys.has(key)) {
      errors.push(`Duplicate budget for ${budget.month}/${budget.year}.`);
    }
    budgetKeys.add(key);
  });

  if (errors.length) return { ok: false, errors: errors.slice(0, 12) };
  return {
    ok: true,
    errors: [],
    data: {
      schemaVersion: SCHEMA_VERSION,
      transactions,
      budgets,
      recurringExpenses,
      customCategories,
      preferences: normalizePreferences(data.preferences),
      meta: { ...normalizeMeta(data.meta), demoPromptSeen: true },
    },
  };
}

export function buildBackup(state, exportedAt = new Date().toISOString()) {
  return {
    app: APP_NAME,
    schemaVersion: SCHEMA_VERSION,
    exportedAt,
    data: {
      transactions: state?.transactions || [],
      budgets: state?.budgets || [],
      recurringExpenses: state?.recurringExpenses || [],
      customCategories: state?.customCategories || [],
      preferences: state?.preferences || { ...PREFERENCE_DEFAULTS },
      meta: state?.meta || { ...EMPTY_META },
    },
  };
}

export { CATEGORY_COLORS };
