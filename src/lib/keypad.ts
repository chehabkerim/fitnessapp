// Keypad editing rules (the in-app number pad used while logging).

/** Applies a key to the current text. `fresh`: the first key replaces the value (like select-all). */
export function applyKey(text: string, key: string, fresh: boolean, decimal: boolean): string {
  if (key === 'back') return fresh ? '' : text.slice(0, -1);
  if (key === '.' && !decimal) return text;
  const base = fresh ? '' : text;
  if (key === '.' && base.includes('.')) return base;
  const next = key === '.' && base === '' ? '0.' : base === '0' && key !== '.' ? key : base + key;
  const [whole, frac] = next.split('.');
  if ((whole?.length ?? 0) > 4 || (frac?.length ?? 0) > 2) return base;
  return next;
}

/** Quick-adjust chips: never below zero; trims float noise ("22.5", not "22.500000001"). */
export function adjustText(text: string, delta: number): string {
  const n = Math.max(0, (Number(text) || 0) + delta);
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

/** Chip steps: weight ±2.5/±5 kg or ±5/±10 lb; reps ±1. */
export function chipsFor(field: 'weight' | 'reps' | 'duration', units: 'metric' | 'imperial'): number[] {
  if (field === 'weight') return units === 'imperial' ? [-10, -5, 5, 10] : [-5, -2.5, 2.5, 5];
  if (field === 'duration') return [-15, -5, 5, 15];
  return [-1, 1];
}
