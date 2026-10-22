import { categoryName } from './categories.js';
import { roundMoney, sumAmounts } from './currency.js';
import { inMonth, monthLabel, monthRange, previousMonth, shiftMonth } from './dateUtils.js';

export function transactionsInMonth(transactions, year, month) {
  return transactions.filter((transaction) => inMonth(transaction.date, year, month));
}

export function totalByType(transactions, type) {
  return sumAmounts(
    transactions.filter((transaction) => transaction.type === type).map((transaction) => transaction.amount),
  );
}

export function monthTotals(transactions, year, month) {
  const rows = transactionsInMonth(transactions, year, month);
  const income = totalByType(rows, 'income');
  const expense = totalByType(rows, 'expense');
  return {
    income,
    expense,
    savings: roundMoney(income - expense),
    count: rows.length,
  };
}

/**
 * Month-over-month change. When the previous month is zero, percent is null
 * because there is no baseline to divide by.
 */
export function monthOverMonth(current, previous) {
  const change = roundMoney(current - previous);
  if (previous === 0 && current === 0) {
    return { change: 0, percent: 0, direction: 'flat', comparable: true };
  }
  if (previous === 0) {
    return { change, percent: null, direction: current > 0 ? 'up' : 'flat', comparable: false };
  }
  const percent = (change / previous) * 100;
  let direction = 'flat';
  if (change > 0) direction = 'up';
  if (change < 0) direction = 'down';
  return { change, percent, direction, comparable: true };
}

/**
 * Budget status:
 * - invalid: limit is missing or not positive, so a percentage is not shown
 * - exceeded: spending is greater than the limit
 * - warning: 80% or more is used, including a limit that is exactly met
 * - normal: under 80%
 */
export function budgetUsage(spent, limit) {
  const spentValue = Number.isFinite(Number(spent)) ? Number(spent) : 0;
  const limitValue = Number(limit);
  if (!Number.isFinite(limitValue) || limitValue <= 0) {
    return {
      spent: spentValue,
      limit: Number.isFinite(limitValue) ? limitValue : 0,
      remaining: null,
      percent: null,
      status: 'invalid',
    };
  }
  const remaining = roundMoney(limitValue - spentValue);
  const percent = (spentValue / limitValue) * 100;
  let status = 'normal';
  if (spentValue > limitValue) status = 'exceeded';
  else if (percent >= 80) status = 'warning';
  return { spent: spentValue, limit: limitValue, remaining, percent, status };
}

export function spendForCategory(transactions, categoryId) {
  return sumAmounts(
    transactions
      .filter((transaction) => transaction.type === 'expense' && transaction.categoryId === categoryId)
      .map((transaction) => transaction.amount),
  );
}

export function largestExpenseCategory(transactions, categories) {
  const totals = new Map();
  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const cents = Math.round(Number(transaction.amount) * 100);
      totals.set(transaction.categoryId, (totals.get(transaction.categoryId) || 0) + cents);
    });
  let best = null;
  totals.forEach((cents, categoryId) => {
    if (!best || cents > best.cents) best = { categoryId, cents };
  });
  if (!best) return null;
  return {
    categoryId: best.categoryId,
    name: categoryName(categories, best.categoryId),
    amount: best.cents / 100,
  };
}

export function spendingByCategory(transactions, categories) {
  const totals = new Map();
  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const cents = Math.round(Number(transaction.amount) * 100);
      totals.set(transaction.categoryId, (totals.get(transaction.categoryId) || 0) + cents);
    });
  const rows = [];
  totals.forEach((cents, categoryId) => {
    const category = categories.find((item) => item.id === categoryId);
    rows.push({
      categoryId,
      name: category?.name || 'Unknown category',
      color: category?.color || '#8A97A6',
      value: cents / 100,
    });
  });
  rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  return rows;
}

export function dailySpending(transactions, year, month) {
  const { end } = monthRange(year, month);
  const last = Number(end.slice(-2));
  const days = [];
  for (let day = 1; day <= last; day += 1) {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({ date: iso, label: String(day), expense: 0, income: 0 });
  }
  const expenseCents = Array(last).fill(0);
  const incomeCents = Array(last).fill(0);
  transactions.forEach((transaction) => {
    if (!inMonth(transaction.date, year, month)) return;
    const index = Number(transaction.date.slice(-2)) - 1;
    if (index < 0 || index >= last) return;
    const cents = Math.round(Number(transaction.amount) * 100);
    if (transaction.type === 'expense') expenseCents[index] += cents;
    if (transaction.type === 'income') incomeCents[index] += cents;
  });
  return days.map((day, index) => ({
    ...day,
    expense: expenseCents[index] / 100,
    income: incomeCents[index] / 100,
  }));
}

export function monthlySeries(transactions, endYear, endMonth, count = 6) {
  const series = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const point = shiftMonth(endYear, endMonth, -offset);
    const totals = monthTotals(transactions, point.year, point.month);
    series.push({
      year: point.year,
      month: point.month,
      label: monthLabel(point.year, point.month, 'MMM yy'),
      ...totals,
    });
  }
  return series;
}

export function monthOverMonthSeries(transactions, endYear, endMonth, count = 6) {
  const series = monthlySeries(transactions, endYear, endMonth, count);
  return series.map((point, index) => {
    const priorPoint = index === 0 ? previousMonth(point.year, point.month) : null;
    const previousExpense = priorPoint
      ? monthTotals(transactions, priorPoint.year, priorPoint.month).expense
      : series[index - 1].expense;
    return { ...point, comparison: monthOverMonth(point.expense, previousExpense) };
  });
}

export function paymentMethodBreakdown(transactions) {
  const totals = new Map();
  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const key = transaction.paymentMethod || 'Other';
      totals.set(key, (totals.get(key) || 0) + Math.round(Number(transaction.amount) * 100));
    });
  return [...totals.entries()]
    .map(([name, cents]) => ({ name, value: cents / 100 }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

export function topExpenseCategories(transactions, categories, limit = 5) {
  return spendingByCategory(transactions, categories).slice(0, limit);
}

export function highestExpenses(transactions, limit = 5) {
  return transactions
    .filter((transaction) => transaction.type === 'expense')
    .slice()
    .sort((a, b) => b.amount - a.amount || b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function overallBudget(budgets, year, month) {
  return budgets.find((budget) => budget.year === year && budget.month === month && budget.scope === 'overall') || null;
}

export function categoryBudgets(budgets, year, month) {
  return budgets.filter((budget) => budget.year === year && budget.month === month && budget.scope === 'category');
}

export function decorateBudget(budget, monthTransactions) {
  const spent =
    budget.scope === 'overall'
      ? totalByType(monthTransactions, 'expense')
      : spendForCategory(monthTransactions, budget.categoryId);
  return { ...budget, ...budgetUsage(spent, budget.limit) };
}

/**
 * The overall monthly budget is a single cap on every expense.
 * Category budgets are tracked separately and are not added into that cap.
 */
export function budgetSnapshot(budgets, transactions, year, month) {
  const monthTransactions = transactionsInMonth(transactions, year, month);
  const overall = overallBudget(budgets, year, month);
  const categories = categoryBudgets(budgets, year, month)
    .map((budget) => decorateBudget(budget, monthTransactions))
    .sort((a, b) => (b.percent || 0) - (a.percent || 0));
  return {
    overall: overall ? decorateBudget(overall, monthTransactions) : null,
    categories,
    allocated: sumAmounts(categories.map((budget) => budget.limit)),
    spentInBudgetedCategories: sumAmounts(categories.map((budget) => budget.spent)),
    monthExpense: totalByType(monthTransactions, 'expense'),
    monthIncome: totalByType(monthTransactions, 'income'),
  };
}

export function transactionsInRange(transactions, start, end) {
  return transactions.filter((transaction) => {
    if (start && transaction.date < start) return false;
    if (end && transaction.date > end) return false;
    return true;
  });
}

export function hasFinancialActivity(transactions) {
  return transactions.some((transaction) => transaction.type === 'income' || transaction.type === 'expense');
}
