import { useEffect, useState } from 'react';

/**
 * Persist one JSON value. The provider uses storage.js for the full SmartSpend
 * document so invalid records can be skipped; this hook covers a single key.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw));
      setError(null);
    } catch {
      setError('Browser storage is unavailable or unreadable.');
    } finally {
      setReady(true);
    }
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      setError(null);
    } catch {
      setError('Browser storage is unavailable. Changes could not be saved.');
    }
  }, [key, value, ready]);

  return [value, setValue, { ready, error }];
}
