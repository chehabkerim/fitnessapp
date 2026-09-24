import type { Units } from './domain';

export const KG_PER_LB = 0.45359237;

export const unitLabel = (units: Units) => (units === 'imperial' ? 'lb' : 'kg');

/** Convert a value typed in the user's units to kg (full precision; rounding happens only for display). */
export function toKg(value: number, units: Units): number {
  return units === 'imperial' ? value * KG_PER_LB : value;
}

export function fromKg(kg: number, units: Units): number {
  return units === 'imperial' ? kg / KG_PER_LB : kg;
}

/** Display rounding: lb to 0.5, kg to 0.25. */
export function roundForDisplay(value: number, units: Units): number {
  const step = units === 'imperial' ? 0.5 : 0.25;
  return Math.round(value / step) * step;
}

/** Number shown for a stored kg value, e.g. "22.5", "135", "61.25". */
export function displayWeight(kg: number | null | undefined, units: Units): string {
  if (kg == null) return '';
  const v = roundForDisplay(fromKg(kg, units), units);
  return formatNumber(v);
}

export function formatNumber(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(2)));
}

/** "22.5 kg", "22.5 kg each", "+10 kg" (added). */
export function formatWeight(kg: number, units: Units, opts: { each?: boolean; added?: boolean } = {}): string {
  const n = displayWeight(kg, units);
  return `${opts.added ? '+' : ''}${n} ${unitLabel(units)}${opts.each ? ' each' : ''}`;
}

export const stepSize = (units: Units) => (units === 'imperial' ? 5 : 2.5);

/** Stepper: move to the next multiple of the step in display units, never below 0. */
export function stepWeight(kg: number | null, direction: 1 | -1, units: Units): number {
  const step = stepSize(units);
  const current = roundForDisplay(fromKg(kg ?? 0, units), units);
  const snapped = direction === 1 ? Math.floor(current / step + 1e-9) * step + step : Math.ceil(current / step - 1e-9) * step - step;
  return toKg(Math.max(0, snapped), units);
}

/** Parse user input; accepts "22,5". Returns null for empty or invalid. */
export function parseDecimal(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseInteger(text: string): number | null {
  const n = parseDecimal(text);
  return n == null ? null : Math.round(n);
}
