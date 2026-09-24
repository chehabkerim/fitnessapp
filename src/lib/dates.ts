const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. */
export function toLocalDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight for a YYYY-MM-DD string. */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function addDays(s: string, days: number): string {
  const d = parseLocalDate(s);
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
}

/** Monday of the week containing the date. */
export function weekStart(s: string): string {
  const d = parseLocalDate(s);
  const offset = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  return addDays(s, -offset);
}

export interface WeekGroup<T> {
  weekStart: string;
  items: T[];
}

/** Groups items by Monday-start week, newest week first, keeping item order within a week. */
export function groupByWeek<T>(items: T[], dateOf: (item: T) => string): WeekGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = weekStart(dateOf(item));
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([weekStart, items]) => ({ weekStart, items }));
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseLocalDate(b).getTime() - parseLocalDate(a).getTime()) / 86_400_000);
}
