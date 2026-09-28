/**
 * Structural equality for query results: plain objects, arrays, Dates, Maps and Sets of plain values.
 * Live queries use it to keep the previous result when a write didn't change their data,
 * so components that read it don't re-render.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Date) return a.getTime() === (b as Date).getTime();
  if (Array.isArray(a)) {
    const y = b as unknown[];
    return a.length === y.length && a.every((v, i) => deepEqual(v, y[i]));
  }
  if (a instanceof Map) {
    const y = b as Map<unknown, unknown>;
    if (a.size !== y.size) return false;
    for (const [k, v] of a) if (!y.has(k) || !deepEqual(v, y.get(k))) return false;
    return true;
  }
  if (a instanceof Set) {
    const y = b as Set<unknown>;
    if (a.size !== y.size) return false;
    for (const v of a) if (!y.has(v)) return false;
    return true;
  }
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const keys = Object.keys(x);
  if (keys.length !== Object.keys(y).length) return false;
  return keys.every((k) => Object.prototype.hasOwnProperty.call(y, k) && deepEqual(x[k], y[k]));
}
