import { categoryName } from './categories.js';

export const DEFAULT_FILTERS = {
  search: '',
  type: 'all',
  categoryId: 'all',
  paymentMethod: 'all',
  startDate: '',
  endDate: '',
  sortBy: 'date',
  sortDir: 'desc',
};

export function hasActiveFilters(filters) {
  return Boolean(
    (filters.search && filters.search.trim()) ||
      (filters.type && filters.type !== 'all') ||
      (filters.categoryId && filters.categoryId !== 'all') ||
      (filters.paymentMethod && filters.paymentMethod !== 'all') ||
      filters.startDate ||
      filters.endDate ||
      (filters.sortBy && filters.sortBy !== 'date') ||
      (filters.sortDir && filters.sortDir !== 'desc'),
  );
}

export function filterTransactions(transactions, filters = {}, categories = []) {
  const search = String(filters.search || '').trim().toLowerCase();
  const type = filters.type || 'all';
  const categoryId = filters.categoryId || 'all';
  const paymentMethod = filters.paymentMethod || 'all';
  const startDate = filters.startDate || '';
  const endDate = filters.endDate || '';
  const sortBy = filters.sortBy || 'date';
  const sortDir = filters.sortDir === 'asc' ? 1 : -1;

  const result = transactions.filter((transaction) => {
    if (type !== 'all' && transaction.type !== type) return false;
    if (categoryId !== 'all' && transaction.categoryId !== categoryId) return false;
    if (paymentMethod !== 'all' && transaction.paymentMethod !== paymentMethod) return false;
    if (startDate && transaction.date < startDate) return false;
    if (endDate && transaction.date > endDate) return false;
    if (search) {
      const haystack = `${transaction.description || ''} ${transaction.notes || ''}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  result.sort((a, b) => {
    let compared = 0;
    if (sortBy === 'amount') compared = a.amount - b.amount;
    else if (sortBy === 'description') compared = a.description.localeCompare(b.description);
    else if (sortBy === 'category') {
      compared = categoryName(categories, a.categoryId).localeCompare(categoryName(categories, b.categoryId));
    } else {
      compared = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      if (compared === 0) compared = String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    }
    if (compared === 0) compared = String(a.id).localeCompare(String(b.id));
    return compared * sortDir;
  });

  return result;
}
