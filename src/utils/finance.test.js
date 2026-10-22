import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES } from './categories.js';
import {
  budgetSnapshot,
  budgetUsage,
  largestExpenseCategory,
  monthOverMonth,
  monthTotals,
  transactionsInMonth,
} from './calculations.js';
import { sumAmounts } from './currency.js';
import { transactionsToCsv } from './csvExport.js';
import { buildBackup, validateBackup, validateTransactionInput } from './dataValidation.js';
import {
  addBudget,
  addCategory,
  addTransaction,
  createEmptyState,
  deleteCategory,
  deleteTransaction,
  updateTransaction,
} from './dataOps.js';
import { buildDemoData } from './demoData.js';
import { filterTransactions } from './filters.js';
import { markRecurringAsPaid, nextDueDate, occurrencesInMonth } from './recurring.js';
import { markRecurringPaid } from './dataOps.js';
import { normalizeStoredState } from './storage.js';

const now = new Date('2026-10-22T09:00:00');

function expense(overrides = {}) {
  return {
    description: 'Coffee',
    amount: '120.5',
    type: 'expense',
    categoryId: 'exp_food',
    date: '2026-10-22',
    paymentMethod: 'UPI',
    notes: 'Morning coffee',
    ...overrides,
  };
}

function income(overrides = {}) {
  return {
    description: 'Salary',
    amount: '85000',
    type: 'income',
    categoryId: 'inc_salary',
    date: '2026-10-01',
    paymentMethod: 'Bank Transfer',
    notes: '',
    ...overrides,
  };
}

describe('transactions', () => {
  it('adds, edits, and deletes a transaction', () => {
    const created = addTransaction(createEmptyState(), expense(), now);
    expect(created.ok).toBe(true);
    expect(created.transaction.amount).toBe(120.5);
    expect(created.transaction.id).toBeTruthy();

    const edited = updateTransaction(
      created.state,
      created.transaction.id,
      expense({ description: 'Tea', amount: '80', notes: 'Kept the receipt' }),
      now,
    );
    expect(edited.ok).toBe(true);
    expect(edited.transaction).toMatchObject({
      id: created.transaction.id,
      description: 'Tea',
      amount: 80,
      notes: 'Kept the receipt',
      createdAt: created.transaction.createdAt,
    });

    const removed = deleteTransaction(edited.state, created.transaction.id);
    expect(removed.ok).toBe(true);
    expect(removed.state.transactions).toHaveLength(0);
  });

  it('rejects invalid amounts and keeps the caller state unchanged', () => {
    const state = createEmptyState();
    const result = addTransaction(state, expense({ amount: '-5' }));
    expect(result.ok).toBe(false);
    expect(result.errors.amount).toMatch(/greater than zero/);
    expect(state.transactions).toHaveLength(0);
  });

  it('requires a category that matches the transaction type', () => {
    const result = validateTransactionInput(expense({ categoryId: 'inc_salary' }), DEFAULT_CATEGORIES);
    expect(result.ok).toBe(false);
    expect(result.errors.categoryId).toMatch(/does not match/);
  });
});

describe('calculations', () => {
  it('sums income, expenses, and monthly savings without floating-point drift', () => {
    expect(sumAmounts([0.1, 0.2])).toBe(0.3);
    let state = createEmptyState();
    state = addTransaction(state, income(), now).state;
    state = addTransaction(state, expense(), now).state;
    state = addTransaction(state, expense({ description: 'Old bill', amount: '10', date: '2026-09-30' }), now).state;

    expect(monthTotals(state.transactions, 2026, 10)).toEqual({
      income: 85000,
      expense: 120.5,
      savings: 84879.5,
      count: 2,
    });
    expect(transactionsInMonth(state.transactions, 2025, 12)).toHaveLength(0);
    expect(monthTotals(state.transactions, 2026, 9).expense).toBe(10);
  });

  it('keeps December and January totals on the correct side of the year', () => {
    const transactions = [
      { ...expense({ amount: 10, date: '2025-12-31' }), id: 'a', type: 'expense' },
      { ...expense({ amount: 5, date: '2026-01-01' }), id: 'b', type: 'expense' },
    ];
    expect(monthTotals(transactions, 2025, 12).expense).toBe(10);
    expect(monthTotals(transactions, 2026, 1).expense).toBe(5);
  });

  it('compares spending with the previous month', () => {
    expect(monthOverMonth(80, 100)).toMatchObject({ change: -20, direction: 'down' });
    expect(monthOverMonth(50, 0)).toMatchObject({ percent: null, comparable: false, direction: 'up' });
    expect(monthOverMonth(0, 0)).toMatchObject({ percent: 0, direction: 'flat' });
  });

  it('flags warning and over-budget states, including a zero limit', () => {
    expect(budgetUsage(79.99, 100).status).toBe('normal');
    expect(budgetUsage(80, 100).status).toBe('warning');
    expect(budgetUsage(100, 100).status).toBe('warning');
    expect(budgetUsage(100.01, 100).status).toBe('exceeded');
    expect(budgetUsage(100.01, 100).remaining).toBe(-0.01);
    expect(budgetUsage(25, 0)).toMatchObject({ status: 'invalid', percent: null, remaining: null });
  });

  it('uses only expenses for category budget utilization', () => {
    let state = createEmptyState();
    state = addTransaction(state, income({ categoryId: 'inc_salary', amount: '5000' }), now).state;
    state = addTransaction(state, expense({ amount: '90' }), now).state;
    state = addBudget(state, { scope: 'category', categoryId: 'exp_food', limit: '100', month: 10, year: 2026 }, now).state;
    state = addBudget(state, { scope: 'overall', limit: '1000', month: 10, year: 2026 }, now).state;

    const snapshot = budgetSnapshot(state.budgets, state.transactions, 2026, 10);
    expect(snapshot.categories[0]).toMatchObject({ spent: 90, status: 'warning' });
    expect(snapshot.overall).toMatchObject({ spent: 90, status: 'normal' });
    expect(largestExpenseCategory(state.transactions, DEFAULT_CATEGORIES).name).toBe('Food & Dining');
  });

  it('rejects a second budget for the same category and month', () => {
    const first = addBudget(createEmptyState(), {
      scope: 'category',
      categoryId: 'exp_food',
      limit: '100',
      month: 10,
      year: 2026,
    });
    const second = addBudget(first.state, {
      scope: 'category',
      categoryId: 'exp_food',
      limit: '200',
      month: 10,
      year: 2026,
    });
    expect(second.ok).toBe(false);
    expect(first.state.budgets).toHaveLength(1);
  });
});

describe('filters', () => {
  const rows = [
    { id: '1', description: 'Coffee', notes: 'latte', amount: 80, type: 'expense', categoryId: 'exp_food', date: '2026-10-02', paymentMethod: 'UPI', createdAt: '2026-10-02T00:00:00.000Z' },
    { id: '2', description: 'Groceries', notes: '', amount: 400, type: 'expense', categoryId: 'exp_groceries', date: '2026-10-08', paymentMethod: 'Cash', createdAt: '2026-10-08T00:00:00.000Z' },
    { id: '3', description: 'Salary', notes: 'October', amount: 1000, type: 'income', categoryId: 'inc_salary', date: '2026-10-01', paymentMethod: 'Bank Transfer', createdAt: '2026-10-01T00:00:00.000Z' },
    { id: '4', description: 'Coffee beans', notes: 'for the office', amount: 250, type: 'expense', categoryId: 'exp_groceries', date: '2026-09-28', paymentMethod: 'UPI', createdAt: '2026-09-28T00:00:00.000Z' },
  ];

  it('combines search, type, category, payment method, and date range', () => {
    const filtered = filterTransactions(
      rows,
      {
        search: 'coffee',
        type: 'expense',
        categoryId: 'exp_food',
        paymentMethod: 'UPI',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        sortBy: 'amount',
        sortDir: 'asc',
      },
      DEFAULT_CATEGORIES,
    );
    expect(filtered.map((row) => row.id)).toEqual(['1']);
  });

  it('sorts by amount without dropping an active category filter', () => {
    const filtered = filterTransactions(
      rows,
      { categoryId: 'exp_groceries', sortBy: 'amount', sortDir: 'desc' },
      DEFAULT_CATEGORIES,
    );
    expect(filtered.map((row) => row.id)).toEqual(['2', '4']);
  });
});

describe('csv export', () => {
  it('exports matching transactions and escapes commas', () => {
    const csv = transactionsToCsv(
      [
        {
          id: 'txn_1',
          date: '2026-10-22',
          description: 'Lunch, team',
          type: 'expense',
          categoryId: 'exp_food',
          amount: 450,
          paymentMethod: 'UPI',
          notes: 'Shared',
        },
      ],
      DEFAULT_CATEGORIES,
      'INR',
    );
    expect(csv).toContain('Date,Description,Type,Category,Amount,Currency');
    expect(csv).toContain('"Lunch, team"');
    expect(csv).toContain('Food & Dining');
    expect(csv).toContain('INR');
  });

  it('returns a header row when there is nothing to export', () => {
    const csv = transactionsToCsv([], DEFAULT_CATEGORIES, 'INR');
    const lines = csv.trim().split(/\r?\n/);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Description');
  });
});

describe('recurring dates and payments', () => {
  it('keeps the anchor day across short months and leap years', () => {
    expect(nextDueDate('2026-01-31', 'monthly', '2026-01-31')).toBe('2026-02-28');
    expect(nextDueDate('2026-02-28', 'monthly', '2026-01-31')).toBe('2026-03-31');
    expect(nextDueDate('2024-02-29', 'yearly', '2024-02-29')).toBe('2025-02-28');
    expect(nextDueDate('2027-02-28', 'yearly', '2024-02-29')).toBe('2028-02-29');
    expect(nextDueDate('2026-10-22', 'weekly', '2026-10-01')).toBe('2026-10-29');
  });

  it('counts weekly occurrences inside one month', () => {
    const recurring = {
      status: 'active',
      frequency: 'weekly',
      startDate: '2026-10-01',
      endDate: null,
      amount: 100,
    };
    expect(occurrencesInMonth(recurring, 2026, 10)).toBe(5);
    expect(occurrencesInMonth({ ...recurring, status: 'paused' }, 2026, 10)).toBe(0);
  });

  it('does not record the same occurrence twice', () => {
    const state = {
      ...createEmptyState(),
      recurringExpenses: [
        {
          id: 'rec_rent',
          description: 'Rent',
          amount: 22000,
          categoryId: 'exp_housing',
          frequency: 'monthly',
          startDate: '2026-01-31',
          nextDueDate: '2026-01-31',
          endDate: null,
          status: 'active',
          paymentMethod: 'Bank Transfer',
          notes: '',
          lastPaidOccurrence: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          isDemo: false,
        },
      ],
    };

    const first = markRecurringPaid(state, 'rec_rent', now);
    expect(first.ok).toBe(true);
    expect(first.transaction).toMatchObject({
      type: 'expense',
      amount: 22000,
      date: '2026-01-31',
      occurrenceKey: 'rec_rent:2026-01-31',
    });
    expect(first.state.recurringExpenses[0].nextDueDate).toBe('2026-02-28');
    expect(monthTotals(first.state.transactions, 2026, 1).expense).toBe(22000);

    const replay = markRecurringAsPaid(state.recurringExpenses[0], first.state.transactions, now);
    expect(replay.ok).toBe(false);

    const second = markRecurringPaid(first.state, 'rec_rent', now);
    expect(second.ok).toBe(true);
    expect(second.state.transactions.map((item) => item.occurrenceKey)).toEqual([
      'rec_rent:2026-02-28',
      'rec_rent:2026-01-31',
    ]);
  });

  it('does not create a payment while the schedule is paused', () => {
    const state = {
      ...createEmptyState(),
      recurringExpenses: [
        {
          id: 'rec_gym',
          description: 'Gym',
          amount: 1500,
          categoryId: 'exp_care',
          frequency: 'monthly',
          startDate: '2026-10-01',
          nextDueDate: '2026-10-01',
          endDate: null,
          status: 'paused',
          paymentMethod: 'UPI',
          notes: '',
          lastPaidOccurrence: null,
          createdAt: '2026-10-01T00:00:00.000Z',
          updatedAt: '2026-10-01T00:00:00.000Z',
          isDemo: false,
        },
      ],
    };
    expect(markRecurringPaid(state, 'rec_gym', now).ok).toBe(false);
    expect(state.transactions).toHaveLength(0);
  });
});

describe('backup validation and demo data', () => {
  it('accepts a backup produced by the app and rejects an invalid file', () => {
    const created = addTransaction(createEmptyState(), expense(), now);
    const backup = buildBackup(created.state, '2026-10-22T09:00:00.000Z');
    const valid = validateBackup(backup);
    expect(valid.ok).toBe(true);
    expect(valid.data.transactions).toHaveLength(1);

    expect(validateBackup(null).ok).toBe(false);
    expect(validateBackup({ app: 'Other', schemaVersion: 1, data: {} }).ok).toBe(false);
    const broken = validateBackup({
      app: 'SmartSpend',
      schemaVersion: 1,
      data: { transactions: [{ id: 'bad', description: '' }] },
    });
    expect(broken.ok).toBe(false);
    expect(broken.errors.length).toBeGreaterThan(0);
  });

  it('reassigns records when a custom category is deleted', () => {
    let state = addCategory(createEmptyState(), {
      name: 'Pets',
      type: 'expense',
      icon: 'PawPrint',
      color: '#C43E78',
    }).state;
    const categoryId = state.customCategories[0].id;
    state = addTransaction(state, expense({ categoryId, description: 'Pet food' }), now).state;
    const removed = deleteCategory(state, categoryId, 'exp_other', now);
    expect(removed.ok).toBe(true);
    expect(removed.state.customCategories).toHaveLength(0);
    expect(removed.state.transactions[0].categoryId).toBe('exp_other');
  });

  it('refuses to delete a used category without a replacement', () => {
    let state = addCategory(createEmptyState(), {
      name: 'Pets',
      type: 'expense',
      icon: 'PawPrint',
      color: '#C43E78',
    }).state;
    const categoryId = state.customCategories[0].id;
    state = addTransaction(state, expense({ categoryId }), now).state;
    const removed = deleteCategory(state, categoryId);
    expect(removed.ok).toBe(false);
    expect(removed.needsReplacement).toBe(true);
    expect(state.customCategories).toHaveLength(1);
  });

  it('builds demo data that stays valid on several calendar edges', () => {
    const clocks = [
      new Date(2026, 0, 1),
      new Date(2026, 1, 28),
      new Date(2024, 1, 29),
      new Date(2026, 9, 22),
      new Date(2026, 9, 31),
      new Date(2026, 11, 31),
    ];
    clocks.forEach((clock) => {
      const demo = buildDemoData(clock);
      const normalized = normalizeStoredState({ ...createEmptyState(), ...demo });
      expect(normalized.ok, clock.toDateString()).toBe(true);
      expect(normalized.warnings, `${clock.toDateString()} ${normalized.warnings?.join('; ')}`).toEqual([]);
      expect(demo.transactions.length).toBeGreaterThan(0);
      expect(demo.budgets.length).toBeGreaterThan(0);
      expect(demo.recurringExpenses.some((item) => item.nextDueDate < clock.toISOString().slice(0, 10) && item.status === 'active')).toBe(true);
    });
  });
});
