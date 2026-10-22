/**
 * Stable unique ids. Prefer crypto.randomUUID when the browser provides it.
 */
export function createId(prefix = 'id') {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}_${random}`;
}
