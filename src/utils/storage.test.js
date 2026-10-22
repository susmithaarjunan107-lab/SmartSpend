import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppDataProvider, useAppData } from '../context/AppDataContext.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { STORAGE_BACKUP_KEY, STORAGE_KEY } from './constants.js';
import { createEmptyState } from './dataOps.js';
import { buildDemoData } from './demoData.js';
import { loadAppData, saveAppData } from './storage.js';

describe('local storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when nothing has been saved', () => {
    const result = loadAppData();
    expect(result.data.transactions).toEqual([]);
    expect(result.data.preferences.currency).toBe('INR');
    expect(result.preserve).toBe(false);
  });

  it('keeps a copy of corrupted JSON and starts fresh', () => {
    localStorage.setItem(STORAGE_KEY, '{bad');
    const result = loadAppData();
    expect(result.data.transactions).toEqual([]);
    expect(result.warning).toMatch(/corrupted/i);
    expect(localStorage.getItem(STORAGE_BACKUP_KEY)).toBe('{bad');
  });

  it('does not overwrite data saved by a newer schema', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99, transactions: [{ id: 'keep' }] }));
    const result = loadAppData();
    expect(result.preserve).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).schemaVersion).toBe(99);
  });

  it('round-trips valid data', () => {
    const state = createEmptyState();
    state.transactions.push({
      id: 'txn_1',
      description: 'Coffee',
      amount: 80,
      type: 'expense',
      categoryId: 'exp_food',
      date: '2026-10-22',
      paymentMethod: 'Cash',
      notes: '',
      createdAt: '2026-10-22T00:00:00.000Z',
      updatedAt: '2026-10-22T00:00:00.000Z',
      isDemo: false,
    });
    expect(saveAppData(state).ok).toBe(true);
    const loaded = loadAppData();
    expect(loaded.data.transactions).toHaveLength(1);
    expect(loaded.data.transactions[0].description).toBe('Coffee');
  });

  it('persists a transaction through the provider and does not invent recurring payments on load', async () => {
    const demo = buildDemoData(new Date(2026, 9, 22));
    const seeded = {
      ...createEmptyState(),
      ...demo,
      meta: { ...createEmptyState().meta, ...demo.meta },
    };
    saveAppData(seeded);

    const { result, rerender } = renderHook(() => useAppData(), { wrapper: AppDataProvider });
    await waitFor(() => expect(result.current.ready).toBe(true));
    const initialCount = result.current.transactions.length;
    expect(initialCount).toBe(demo.transactions.length);

    rerender();
    expect(result.current.transactions.length).toBe(initialCount);

    let added;
    act(() => {
      added = result.current.addTransaction({
        description: 'Notebook',
        amount: '240',
        type: 'expense',
        categoryId: 'exp_shopping',
        date: '2026-10-22',
        paymentMethod: 'Cash',
        notes: 'Stationery',
      });
    });
    expect(added.ok).toBe(true);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      expect(stored.transactions.some((item) => item.description === 'Notebook')).toBe(true);
    });
    expect(result.current.transactions.length).toBe(initialCount + 1);
  });

  it('stores a single hook value', async () => {
    localStorage.setItem('smartspend.pref.test', JSON.stringify({ hello: 1 }));
    const { result } = renderHook(() => useLocalStorage('smartspend.pref.test', { hello: 0 }));
    await waitFor(() => expect(result.current[2].ready).toBe(true));
    expect(result.current[0]).toEqual({ hello: 1 });
  });

  it('reports unavailable storage without throwing', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const result = loadAppData();
    expect(result.unavailable).toBe(true);
    expect(result.preserve).toBe(true);
    getItem.mockRestore();
  });
});
