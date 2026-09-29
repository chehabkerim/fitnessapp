// Badges: definitions, evaluation and display helpers. Pure; the repository persists what's earned.
import { fromKg, unitLabel } from '../units';
import type { Units } from '../domain';
import { BADGES, BADGE_BY_ID, TIERS, type BadgeDef } from './definitions';
import { replayBadgeStats, type BadgeStats, type BadgeWorkout } from './stats';

export * from './definitions';
export * from './stats';

export interface EarnedAt {
  workoutId: number;
  at: number;
}

/**
 * Which badges the workout history earns, and the workout that first earned each one (replayed in order).
 * Idempotent: the same history always gives the same result.
 */
export function evaluateBadges(workouts: BadgeWorkout[], templateIds: number[], today: string): { earned: Map<string, EarnedAt>; stats: BadgeStats } {
  const earned = new Map<string, EarnedAt>();
  const stats = replayBadgeStats(workouts, templateIds, today, (w, s) => {
    for (const b of BADGES) if (!earned.has(b.id) && isEarned(b, s)) earned.set(b.id, { workoutId: w.id, at: w.endedAt });
  });
  return { earned, stats };
}

export const isEarned = (b: BadgeDef, s: BadgeStats) => (b.earned ? b.earned(s) : b.progress(s) >= b.target);

export interface BadgeStatus {
  badge: BadgeDef;
  earned: boolean;
  /** Progress, capped at the target. */
  value: number;
  fraction: number;
}

/** Status of every badge: earned ones come from storage (kept even if the history changes later). */
export function badgeStatuses(stats: BadgeStats, earnedIds: Set<string>): BadgeStatus[] {
  return BADGES.map((badge) => {
    const earned = earnedIds.has(badge.id);
    const value = earned ? badge.target : Math.min(badge.target, Math.max(0, badge.progress(stats)));
    return { badge, earned, value, fraction: badge.target ? value / badge.target : 0 };
  });
}

/** The unearned badge you're closest to (largest fraction; ties go to the lower tier, then list order). */
export function nextBadge(statuses: BadgeStatus[]): BadgeStatus | undefined {
  return statuses.filter((s) => !s.earned).reduce<BadgeStatus | undefined>((best, s) => (!best || s.fraction > best.fraction || (s.fraction === best.fraction && s.badge.tier < best.badge.tier) ? s : best), undefined);
}

/** The next badge up in the same category ladder (the badge after `id`), if any. */
export function nextInCategory(id: string): BadgeDef | undefined {
  const b = BADGE_BY_ID.get(id);
  if (!b) return undefined;
  const ladder = BADGES.filter((x) => x.category === b.category);
  return ladder[ladder.indexOf(b) + 1];
}

export const tierLabel = (b: BadgeDef) => `${TIERS[b.tier].name} · Tier ${TIERS[b.tier].numeral}`;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
/** Whole kg (or lb in imperial), grouped: "12,300" / "12,300 kg". */
const mass = (kg: number, units: Units, withUnit = false) => `${Math.floor(fromKg(kg, units)).toLocaleString('en-GB')}${withUnit ? ` ${unitLabel(units)}` : ''}`;
const count = (n: number) => Math.floor(n).toLocaleString('en-GB');

/** "37 / 50", "6,240 / 10,000 kg" (lb in imperial), or "Not yet" / "Done" for one-off badges. */
export function progressText(b: BadgeDef, value: number, units: Units): string {
  if (b.unit === 'once') return value >= 1 ? 'Done' : 'Not yet';
  if (b.unit === 'kg') return `${mass(value, units)} / ${mass(b.target, units, true)}`;
  return `${count(value)} / ${count(b.target)}`;
}

/** "25 more workouts to Half Hundred". */
export function remainingText(next: BadgeDef, value: number, units: Units): string {
  const left = Math.max(0, next.target - value);
  switch (next.unit) {
    case 'workouts':
      return `${count(left)} more ${plural(left, 'workout', 'workouts')} to ${next.name}`;
    case 'weeks':
      return `${count(left)} more ${plural(left, 'week', 'weeks')} in a row to ${next.name}`;
    case 'records':
      return `${count(left)} more ${plural(left, 'record', 'records')} to ${next.name}`;
    case 'kg':
      return `${mass(left, units, true)} more to ${next.name}`;
    case 'once':
      return next.description;
  }
}

/** What the progress means, for the detail screen: "25 workouts finished", "3 weeks in a row", "12,300 kg lifted". */
export function valueSentence(b: BadgeDef, value: number, units: Units): string {
  const n = Math.floor(value);
  switch (b.unit) {
    case 'workouts': {
      const when = b.id === 'early_riser' ? ' before 8:00' : b.id === 'night_shift' ? ' after 21:00' : '';
      return `${count(n)} ${plural(n, 'workout', 'workouts')} finished${when}`;
    }
    case 'weeks':
      return `${count(n)} ${plural(n, 'week', 'weeks')} in a row`;
    case 'records':
      return `${count(n)} personal ${plural(n, 'record', 'records')}`;
    case 'kg':
      return `${mass(value, units, true)} lifted`;
    case 'once':
      return b.description;
  }
}

/** Accessible name for an emblem, e.g. "Centurion badge, gold, locked, 37 of 100 workouts". */
export function badgeA11yLabel(b: BadgeDef, earned: boolean, value: number, units: Units): string {
  const tier = TIERS[b.tier].name.toLowerCase();
  if (earned) return `${b.name} badge, ${tier}, earned`;
  const progress =
    b.unit === 'once'
      ? 'not yet earned'
      : b.unit === 'kg'
        ? `${mass(value, units)} of ${mass(b.target, units, true)}`
        : `${count(value)} of ${count(b.target)} ${b.unit}`;
  return `${b.name} badge, ${tier}, locked, ${progress}`;
}

/** Earned-badge counts for the case header ("12 / 26 EARNED"). */
export const BADGE_COUNT = BADGES.length;
