import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getAllCategories } from '../utils/categories.js';
import { formatCurrency } from '../utils/currency.js';
import * as ops from '../utils/dataOps.js';
import { buildBackup } from '../utils/dataValidation.js';
import { currentYearMonth, formatDisplayDate } from '../utils/dateUtils.js';
import { createId } from '../utils/ids.js';
import { loadAppData, saveAppData } from '../utils/storage.js';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [warning, setWarning] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [view, setViewState] = useState(null);
  const dataRef = useRef(null);
  const preserveRef = useRef(false);
  const viewReady = useRef(false);
  const payLock = useRef(new Set());

  useEffect(() => {
    const result = loadAppData();
    preserveRef.current = Boolean(result.preserve);
    dataRef.current = result.data;
    setData(result.data);
    setWarning(result.warning || null);
    if (result.unavailable || result.preserve) setStorageError(result.warning);
  }, []);

  useEffect(() => {
    if (!data || preserveRef.current) return;
    const saved = saveAppData(data);
    if (!saved.ok) setStorageError(saved.error);
  }, [data]);

  useEffect(() => {
    if (!data) return;
    document.documentElement.dataset.theme = data.preferences.theme === 'dark' ? 'dark' : 'light';
  }, [data]);

  useEffect(() => {
    if (!data || viewReady.current) return;
    viewReady.current = true;
    const now = currentYearMonth();
    const remembered = data.meta?.lastViewedMonth;
    const valid =
      remembered &&
      remembered.month >= 1 &&
      remembered.month <= 12 &&
      remembered.year >= 2000 &&
      remembered.year <= 2100;
    setViewState(data.preferences.dashboardMonth === 'remember' && valid ? remembered : now);
  }, [data]);

  const notify = useCallback((message, type = 'success') => {
    const id = createId('toast');
    setToasts((current) => [...current.slice(-4), { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const commit = useCallback((result) => {
    if (preserveRef.current) {
      return {
        ok: false,
        error: 'Saved data belongs to a newer version of SmartSpend, so changes are blocked to avoid overwriting it.',
      };
    }
    if (!result.ok) return result;
    dataRef.current = result.state;
    setData(result.state);
    return result;
  }, []);

  const run = useCallback(
    (producer) => {
      if (!dataRef.current) return { ok: false, error: 'SmartSpend is still loading.' };
      return commit(producer(dataRef.current));
    },
    [commit],
  );

  const setView = useCallback((year, month) => {
    const next = { year: Number(year), month: Number(month) };
    setViewState(next);
    if (!dataRef.current || preserveRef.current) return;
    const updated = {
      ...dataRef.current,
      meta: { ...dataRef.current.meta, lastViewedMonth: next },
    };
    dataRef.current = updated;
    setData(updated);
  }, []);

  const markRecurringPaid = useCallback(
    (id) => {
      if (payLock.current.has(id)) {
        return { ok: false, error: 'This payment is already being recorded.' };
      }
      payLock.current.add(id);
      const result = run((state) => ops.markRecurringPaid(state, id));
      window.setTimeout(() => payLock.current.delete(id), 600);
      return result;
    },
    [run],
  );

  const value = useMemo(() => {
    const categories = getAllCategories(data?.customCategories || []);
    const currency = data?.preferences?.currency || 'INR';
    const dateFormat = data?.preferences?.dateFormat || 'dd MMM yyyy';
    return {
      ready: Boolean(data && view),
      storageError,
      storageWarning: warning,
      readOnly: preserveRef.current,
      transactions: data?.transactions || [],
      budgets: data?.budgets || [],
      recurringExpenses: data?.recurringExpenses || [],
      customCategories: data?.customCategories || [],
      categories,
      preferences: data?.preferences || ops.createEmptyState().preferences,
      meta: data?.meta || ops.createEmptyState().meta,
      view,
      setView,
      toasts,
      notify,
      dismissToast,
      formatMoney: (amount) => formatCurrency(amount, currency),
      formatDate: (iso) => formatDisplayDate(iso, dateFormat),
      addTransaction: (input) => run((state) => ops.addTransaction(state, input)),
      updateTransaction: (id, input) => run((state) => ops.updateTransaction(state, id, input)),
      deleteTransaction: (id) => run((state) => ops.deleteTransaction(state, id)),
      addBudget: (input) => run((state) => ops.addBudget(state, input)),
      updateBudget: (id, input) => run((state) => ops.updateBudget(state, id, input)),
      deleteBudget: (id) => run((state) => ops.deleteBudget(state, id)),
      addRecurring: (input) => run((state) => ops.addRecurring(state, input)),
      updateRecurring: (id, input) => run((state) => ops.updateRecurring(state, id, input)),
      deleteRecurring: (id) => run((state) => ops.deleteRecurring(state, id)),
      setRecurringStatus: (id, status) => run((state) => ops.setRecurringStatus(state, id, status)),
      markRecurringPaid,
      addCategory: (input) => run((state) => ops.addCategory(state, input)),
      updateCategory: (id, input) => run((state) => ops.updateCategory(state, id, input)),
      deleteCategory: (id, replacementId) => run((state) => ops.deleteCategory(state, id, replacementId)),
      updatePreferences: (patch) => run((state) => ops.updatePreferences(state, patch)),
      importBackup: (payload) => run(() => ops.importBackup(payload)),
      resetAllData: () => run(() => ops.resetAllData()),
      loadDemoData: () => run((state) => ops.applyDemoLoad(state)),
      clearDemoData: () => run((state) => ops.applyDemoClear(state)),
      dismissDemoPrompt: () => run((state) => ops.dismissDemoPrompt(state)),
      buildBackup: () => (dataRef.current ? buildBackup(dataRef.current) : null),
      hasDemoData: Boolean(
        data?.transactions?.some((item) => item.isDemo) ||
          data?.budgets?.some((item) => item.isDemo) ||
          data?.recurringExpenses?.some((item) => item.isDemo) ||
          data?.customCategories?.some((item) => item.isDemo),
      ),
    };
  }, [data, dismissToast, markRecurringPaid, notify, run, setView, storageError, toasts, view, warning]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
}
