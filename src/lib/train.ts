import { daysBetween, weekStart } from './dates';
import type { PrMetric } from './prs';

export interface TemplateRef {
  id: number;
  name: string;
  position: number;
}

export interface FinishedRef {
  templateId: number | null;
  name: string | null;
  date: string; // YYYY-MM-DD
  startedAt: number;
}

export interface TemplateUsage<T extends TemplateRef> {
  template: T;
  lastDone: string | null;
}

/**
 * Orders templates for the Train screen: "Up next" first = the template done least recently
 * (never-done templates first, in template order), then the rest in the same order.
 * A finished workout counts for a template by its template id, or by name when it was a repeat.
 */
export function orderByUpNext<T extends TemplateRef>(templates: T[], finished: FinishedRef[]): TemplateUsage<T>[] {
  const lastDone = (t: T) =>
    finished
      .filter((w) => w.templateId === t.id || (w.templateId == null && w.name === t.name))
      .reduce<string | null>((max, w) => (max == null || w.date > max ? w.date : max), null);
  return templates
    .map((template) => ({ template, lastDone: lastDone(template) }))
    .sort((a, b) => {
      if (a.lastDone !== b.lastDone) {
        if (a.lastDone == null) return -1;
        if (b.lastDone == null) return 1;
        return a.lastDone < b.lastDone ? -1 : 1;
      }
      return a.template.position - b.template.position || a.template.id - b.template.id;
    });
}

/** "Last done today", "Last done yesterday", "Last done 4 days ago", "Not done yet". */
export function lastDoneLabel(lastDone: string | null, today: string): string {
  if (lastDone == null) return 'Not done yet';
  const days = Math.max(0, daysBetween(lastDone, today));
  if (days === 0) return 'Last done today';
  if (days === 1) return 'Last done yesterday';
  return `Last done ${days} days ago`;
}

export interface WeekTotals {
  workouts: number;
  volume: number;
  sets: number;
}

/** Totals for the Monday-start week containing `today`. */
export function weekTotals(rows: { date: string; volume: number; setsCompleted: number }[], today: string): WeekTotals {
  const start = weekStart(today);
  return rows
    .filter((r) => r.date >= start && r.date <= today)
    .reduce((t, r) => ({ workouts: t.workouts + 1, volume: t.volume + r.volume, sets: t.sets + r.setsCompleted }), { workouts: 0, volume: 0, sets: 0 });
}

const HEADLINE_ORDER: PrMetric[] = ['heaviest', 'e1rm', 'volume', 'reps', 'duration'];

/** The record to headline on the PLUS ULTRA banner when a set breaks several at once. */
export function headlineRecord(metrics: PrMetric[]): PrMetric | undefined {
  return HEADLINE_ORDER.find((m) => metrics.includes(m));
}
