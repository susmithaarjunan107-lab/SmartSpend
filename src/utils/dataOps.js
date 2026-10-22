import { EMPTY_META, PREFERENCE_DEFAULTS, SCHEMA_VERSION } from './constants.js';
import { getAllCategories } from './categories.js';
import { createId } from './ids.js';
import { markRecurringAsPaid } from './recurring.js';
import {
  normalizeMeta,
  normalizePreferences,
  validateBackup,
  validateBudgetInput,
  validateCategoryInput,
  validateRecurringInput,
  validateTransactionInput,
} from './dataValidation.js';
import { clearDemoFromState, loadDemoIntoState } from './demoData.js';

export function createEmptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    transactions: [],
    budgets: [],
    recurringExpenses: [],
    customCategories: [],
    preferences: { ...PREFERENCE_DEFAULTS },
    meta: { ...EMPTY_META },
  };
}

function categoriesOf(state) {
  return getAllCategories(state.customCategories);
}

function fail(errorsOrError) {
  if (typeof errorsOrError === 'string') return { ok: false, error: errorsOrError };
  return { ok: false, errors: errorsOrError };
}

export function budgetDuplicateKey(budget) {
  return `${budget.year}-${budget.month}-${budget.scope}-${budget.scope === 'overall' ? 'all' : budget.categoryId}`;
}

export function hasDuplicateBudget(budgets, candidate, exceptId) {
  const key = budgetDuplicateKey(candidate);
  return budgets.some((budget) => budget.id !== exceptId && budgetDuplicateKey(budget) === key);
}

export function countCategoryUsage(state, categoryId) {
  const transactions = state.transactions.filter((item) => item.categoryId === categoryId).length;
  const budgets = state.budgets.filter((item) => item.categoryId === categoryId).length;
  const recurring = state.recurringExpenses.filter((item) => item.categoryId === categoryId).length;
  return { transactions, budgets, recurring, total: transactions + budgets + recurring };
}

export function addTransaction(state, input, now = new Date()) {
  const validated = validateTransactionInput(input, categoriesOf(state));
  if (!validated.ok) return fail(validated.errors);
  const timestamp = now.toISOString();
  const transaction = {
    id: createId('txn'),
    ...validated.value,
    createdAt: timestamp,
    updatedAt: timestamp,
    isDemo: false,
  };
  return {
    ok: true,
    transaction,
    state: { ...state, transactions: [transaction, ...state.transactions] },
  };
}

export function updateTransaction(state, id, input, now = new Date()) {
  const existing = state.transactions.find((item) => item.id === id);
  if (!existing) return fail('Transaction not found.');
  const validated = validateTransactionInput(input, categoriesOf(state));
  if (!validated.ok) return fail(validated.errors);
  const transaction = {
    ...existing,
    ...validated.value,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: now.toISOString(),
    isDemo: existing.isDemo,
  };
  if (existing.recurringExpenseId) transaction.recurringExpenseId = existing.recurringExpenseId;
  if (existing.occurrenceKey) transaction.occurrenceKey = existing.occurrenceKey;
  return {
    ok: true,
    transaction,
    state: {
      ...state,
      transactions: state.transactions.map((item) => (item.id === id ? transaction : item)),
    },
  };
}

export function deleteTransaction(state, id) {
  if (!state.transactions.some((item) => item.id === id)) return fail('Transaction not found.');
  return {
    ok: true,
    state: { ...state, transactions: state.transactions.filter((item) => item.id !== id) },
  };
}

export function addBudget(state, input, now = new Date()) {
  const validated = validateBudgetInput(input, categoriesOf(state));
  if (!validated.ok) return fail(validated.errors);
  if (hasDuplicateBudget(state.budgets, validated.value)) {
    return fail({
      scope: 'A budget for this category and month already exists.',
      categoryId: 'A budget for this category and month already exists.',
    });
  }
  const timestamp = now.toISOString();
  const budget = {
    id: createId('bdg'),
    ...validated.value,
    createdAt: timestamp,
    updatedAt: timestamp,
    isDemo: false,
  };
  return { ok: true, budget, state: { ...state, budgets: [budget, ...state.budgets] } };
}

export function updateBudget(state, id, input, now = new Date()) {
  const existing = state.budgets.find((item) => item.id === id);
  if (!existing) return fail('Budget not found.');
  const validated = validateBudgetInput(input, categoriesOf(state));
  if (!validated.ok) return fail(validated.errors);
  if (hasDuplicateBudget(state.budgets, validated.value, id)) {
    return fail({
      scope: 'A budget for this category and month already exists.',
      categoryId: 'A budget for this category and month already exists.',
    });
  }
  const budget = {
    ...existing,
    ...validated.value,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: now.toISOString(),
    isDemo: existing.isDemo,
  };
  return {
    ok: true,
    budget,
    state: { ...state, budgets: state.budgets.map((item) => (item.id === id ? budget : item)) },
  };
}

export function deleteBudget(state, id) {
  if (!state.budgets.some((item) => item.id === id)) return fail('Budget not found.');
  return { ok: true, state: { ...state, budgets: state.budgets.filter((item) => item.id !== id) } };
}

export function addRecurring(state, input, now = new Date()) {
  const validated = validateRecurringInput(input, categoriesOf(state));
  if (!validated.ok) return fail(validated.errors);
  const timestamp = now.toISOString();
  const recurring = {
    id: createId('rec'),
    ...validated.value,
    lastPaidOccurrence: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    isDemo: false,
  };
  return {
    ok: true,
    recurring,
    state: { ...state, recurringExpenses: [recurring, ...state.recurringExpenses] },
  };
}

export function updateRecurring(state, id, input, now = new Date()) {
  const existing = state.recurringExpenses.find((item) => item.id === id);
  if (!existing) return fail('Recurring expense not found.');
  const validated = validateRecurringInput(input, categoriesOf(state));
  if (!validated.ok) return fail(validated.errors);
  const recurring = {
    ...existing,
    ...validated.value,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: now.toISOString(),
    isDemo: existing.isDemo,
    lastPaidOccurrence: existing.lastPaidOccurrence || null,
  };
  return {
    ok: true,
    recurring,
    state: {
      ...state,
      recurringExpenses: state.recurringExpenses.map((item) => (item.id === id ? recurring : item)),
    },
  };
}

export function deleteRecurring(state, id) {
  if (!state.recurringExpenses.some((item) => item.id === id)) return fail('Recurring expense not found.');
  return {
    ok: true,
    state: { ...state, recurringExpenses: state.recurringExpenses.filter((item) => item.id !== id) },
  };
}

export function setRecurringStatus(state, id, status, now = new Date()) {
  if (status !== 'active' && status !== 'paused') return fail('Choose active or paused.');
  const existing = state.recurringExpenses.find((item) => item.id === id);
  if (!existing) return fail('Recurring expense not found.');
  const recurring = { ...existing, status, updatedAt: now.toISOString() };
  return {
    ok: true,
    recurring,
    state: {
      ...state,
      recurringExpenses: state.recurringExpenses.map((item) => (item.id === id ? recurring : item)),
    },
  };
}

export function markRecurringPaid(state, id, now = new Date()) {
  const recurring = state.recurringExpenses.find((item) => item.id === id);
  const result = markRecurringAsPaid(recurring, state.transactions, now);
  if (!result.ok) return result;
  return {
    ok: true,
    transaction: result.transaction,
    state: {
      ...state,
      transactions: [result.transaction, ...state.transactions],
      recurringExpenses: state.recurringExpenses.map((item) => (item.id === id ? result.recurring : item)),
    },
  };
}

export function addCategory(state, input) {
  const validated = validateCategoryInput(input, categoriesOf(state));
  if (!validated.ok) return fail(validated.errors);
  const category = {
    id: createId('cat'),
    ...validated.value,
    isCustom: true,
    isDemo: false,
  };
  return {
    ok: true,
    category,
    state: { ...state, customCategories: [...state.customCategories, category] },
  };
}

export function updateCategory(state, id, input) {
  const existing = state.customCategories.find((item) => item.id === id);
  if (!existing) return fail('Only custom categories can be renamed.');
  const validated = validateCategoryInput(
    { ...existing, ...input, type: existing.type },
    categoriesOf(state),
    id,
  );
  if (!validated.ok) return fail(validated.errors);
  const category = { ...existing, ...validated.value, id, isCustom: true };
  return {
    ok: true,
    category,
    state: {
      ...state,
      customCategories: state.customCategories.map((item) => (item.id === id ? category : item)),
    },
  };
}

export function deleteCategory(state, categoryId, replacementId, now = new Date()) {
  const category = state.customCategories.find((item) => item.id === categoryId);
  if (!category) return fail('Only custom categories can be deleted.');
  const usage = countCategoryUsage(state, categoryId);
  let next = state;
  let notice = '';

  if (usage.total > 0) {
    if (!replacementId) {
      return { ok: false, needsReplacement: true, usage, error: 'Choose a replacement category before deleting this one.' };
    }
    const replacement = categoriesOf(state).find((item) => item.id === replacementId);
    if (!replacement || replacement.id === categoryId || replacement.type !== category.type) {
      return fail('Choose a different category of the same type.');
    }
    const timestamp = now.toISOString();
    let removedBudgets = 0;
    const budgets = [];
    state.budgets.forEach((budget) => {
      if (budget.categoryId !== categoryId) {
        budgets.push(budget);
        return;
      }
      const moved = { ...budget, categoryId: replacement.id, updatedAt: timestamp };
      const clash = state.budgets.some(
        (other) =>
          other.id !== budget.id &&
          other.scope === 'category' &&
          other.categoryId === replacement.id &&
          other.month === budget.month &&
          other.year === budget.year,
      );
      if (clash) removedBudgets += 1;
      else budgets.push(moved);
    });
    next = {
      ...state,
      transactions: state.transactions.map((item) =>
        item.categoryId === categoryId ? { ...item, categoryId: replacement.id, updatedAt: timestamp } : item,
      ),
      recurringExpenses: state.recurringExpenses.map((item) =>
        item.categoryId === categoryId ? { ...item, categoryId: replacement.id, updatedAt: timestamp } : item,
      ),
      budgets,
    };
    if (removedBudgets > 0) {
      notice = `${removedBudgets} budget${removedBudgets === 1 ? '' : 's'} removed because the replacement category already had a budget for that month.`;
    }
  }

  return {
    ok: true,
    notice,
    state: { ...next, customCategories: next.customCategories.filter((item) => item.id !== categoryId) },
  };
}

export function updatePreferences(state, patch) {
  return {
    ok: true,
    state: { ...state, preferences: normalizePreferences({ ...state.preferences, ...patch }) },
  };
}

export function importBackup(payload) {
  const validated = validateBackup(payload);
  if (!validated.ok) return { ok: false, errors: validated.errors, error: validated.errors[0] };
  return { ok: true, state: validated.data };
}

export function resetAllData() {
  const state = createEmptyState();
  return { ok: true, state: { ...state, meta: { ...state.meta, demoPromptSeen: false } } };
}

export function dismissDemoPrompt(state) {
  return { ok: true, state: { ...state, meta: { ...normalizeMeta(state.meta), demoPromptSeen: true } } };
}

export { loadDemoIntoState, clearDemoFromState };

export function applyDemoLoad(state, now = new Date()) {
  return loadDemoIntoState(state, now);
}

export function applyDemoClear(state) {
  return clearDemoFromState(state);
}
