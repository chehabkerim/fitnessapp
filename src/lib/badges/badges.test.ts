import {
  BADGES,
  BADGE_BY_ID,
  BADGE_COUNT,
  badgeA11yLabel,
  badgeStatuses,
  bestRun,
  currentRun,
  evaluateBadges,
  nextBadge,
  nextInCategory,
  progressText,
  remainingText,
  replayBadgeStats,
  tierLabel,
  valueSentence,
  type BadgeWorkout,
  type BadgeWorkoutEntry,
} from '.';
import type { ExerciseKind, SetValues } from '../domain';

const LIFT: ExerciseKind = { logType: 'weight_reps', loadMode: 'total' };
const DB_EACH: ExerciseKind = { logType: 'weight_reps', loadMode: 'per_dumbbell' };
const HOLD: ExerciseKind = { logType: 'duration', loadMode: 'total' };

let nextId = 1;
const set = (weightKg: number | null, reps: number | null, opts: Partial<SetValues> = {}): SetValues => ({ id: nextId++, weightKg, reps, durationSec: null, isWarmup: false, completedAt: 1, ...opts });
const entry = (exerciseId: number, sets: SetValues[], exercise = LIFT, plannedSets: number | null = null): BadgeWorkoutEntry => ({ exerciseId, exercise, sets, plannedSets });

/** A workout on a local date (YYYY-MM-DD), finished at `hour`:00 local time. */
function workout(id: number, date: string, entries: BadgeWorkoutEntry[], opts: { hour?: number; templateId?: number | null; plannedSets?: number | null } = {}): BadgeWorkout {
  const [y, m, d] = date.split('-').map(Number);
  const endedAt = new Date(y!, m! - 1, d!, opts.hour ?? 18).getTime();
  return { id, date, startedAt: endedAt - 3_600_000, endedAt, templateId: opts.templateId ?? null, plannedSets: opts.plannedSets ?? null, entries };
}
const simple = (id: number, date: string, opts = {}) => workout(id, date, [entry(1, [set(20, 10)])], opts);

const earnedIds = (ws: BadgeWorkout[], today: string, templates: number[] = []) => [...evaluateBadges(ws, templates, today).earned.keys()];

describe('definitions', () => {
  it('has unique ids, tiers 1–4 and a positive target for every badge', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    expect(BADGE_COUNT).toBe(26);
    for (const b of BADGES) {
      expect([1, 2, 3, 4]).toContain(b.tier);
      expect(b.target).toBeGreaterThan(0);
    }
  });

  it('uses "Plus Ultra" only in the PR category', () => {
    for (const b of BADGES) if (b.category !== 'plus_ultra') expect(`${b.name} ${b.description}`).not.toMatch(/plus ultra/i);
  });

  it('labels tiers and ladders', () => {
    expect(tierLabel(BADGE_BY_ID.get('iron_regular')!)).toBe('Diamond · Tier IV');
    expect(nextInCategory('quarter_century')?.id).toBe('half_hundred');
    expect(nextInCategory('iron_regular')).toBeUndefined();
  });
});

describe('milestones', () => {
  it('counts finished workouts', () => {
    const ws = Array.from({ length: 10 }, (_, i) => simple(i + 1, `2026-01-${String(i + 1).padStart(2, '0')}`));
    const ids = earnedIds(ws, '2026-01-31');
    expect(ids).toContain('first_rep');
    expect(ids).toContain('ten_down');
    expect(ids).not.toContain('quarter_century');
  });

  it('records the workout that first earned each badge', () => {
    const ws = [simple(7, '2026-01-01'), simple(8, '2026-01-02')];
    expect(evaluateBadges(ws, [], '2026-01-02').earned.get('first_rep')).toEqual({ workoutId: 7, at: ws[0]!.endedAt });
  });

  it('with no workouts, earns nothing and First Rep is the closest goal', () => {
    const { earned, stats } = evaluateBadges([], [], '2026-01-01');
    expect(earned.size).toBe(0);
    expect(nextBadge(badgeStatuses(stats, new Set()))?.badge.id).toBe('first_rep');
  });
});

describe('consistency (weeks with 2+ workouts)', () => {
  // 2026-01-05 is a Monday.
  it('counts consecutive Monday-start weeks and splits at Sunday/Monday', () => {
    const ws = [simple(1, '2026-01-05'), simple(2, '2026-01-11'), simple(3, '2026-01-12'), simple(4, '2026-01-18')];
    const s = replayBadgeStats(ws, [], '2026-01-18');
    expect(s.bestWeekRun).toBe(2);
    expect(earnedIds(ws, '2026-01-18')).toContain('two_week_run');
  });

  it('does not count a Sunday + Monday pair as one week', () => {
    const ws = [simple(1, '2026-01-11'), simple(2, '2026-01-12')];
    expect(replayBadgeStats(ws, [], '2026-01-12').bestWeekRun).toBe(0);
  });

  it('a gap week breaks the run; the best run is kept', () => {
    const weeks = ['2026-01-05', '2026-01-12', '2026-01-19', /* gap */ '2026-02-02'];
    const ws = weeks.flatMap((w, i) => [simple(i * 2 + 1, w), simple(i * 2 + 2, w)]);
    const s = replayBadgeStats(ws, [], '2026-02-03');
    expect(s.bestWeekRun).toBe(3);
    expect(s.currentWeekRun).toBe(1);
  });

  it('the current week counts once it reaches 2; until then the run ending last week is still alive', () => {
    const ws = [simple(1, '2026-01-05'), simple(2, '2026-01-06'), simple(3, '2026-01-12'), simple(4, '2026-01-13'), simple(5, '2026-01-19')];
    expect(replayBadgeStats(ws, [], '2026-01-20').currentWeekRun).toBe(2); // this week has 1: not yet counted, not broken
    const more = [...ws, simple(6, '2026-01-21')];
    expect(replayBadgeStats(more, [], '2026-01-21').currentWeekRun).toBe(3);
    expect(replayBadgeStats(ws, [], '2026-02-02').currentWeekRun).toBe(0); // a whole week without training ends it
  });

  it('helpers', () => {
    expect(bestRun(new Set())).toBe(0);
    expect(bestRun(new Set(['2026-01-05', '2026-01-12', '2026-01-26']))).toBe(2);
    expect(currentRun(new Set(['2026-01-05', '2026-01-12']), '2026-01-18')).toBe(2);
    expect(currentRun(new Set(['2026-01-05', '2026-01-12']), '2026-01-19')).toBe(2);
    expect(currentRun(new Set(['2026-01-05', '2026-01-12']), '2026-01-26')).toBe(0);
  });

  it('crosses a year boundary', () => {
    const ws = [simple(1, '2025-12-29'), simple(2, '2025-12-31'), simple(3, '2026-01-05'), simple(4, '2026-01-06')];
    expect(replayBadgeStats(ws, [], '2026-01-06').bestWeekRun).toBe(2);
  });
});

describe('Plus Ultra (records)', () => {
  it('the first session is the baseline; beating it is one record per exercise per workout', () => {
    const ws = [
      workout(1, '2026-01-05', [entry(1, [set(20, 10)]), entry(2, [set(30, 8)])]),
      workout(2, '2026-01-07', [entry(1, [set(25, 10)]), entry(2, [set(30, 8)])]), // heaviest + e1rm + volume on ex 1: one record
    ];
    const s = replayBadgeStats(ws, [], '2026-01-07');
    expect(s.records).toBe(1);
    expect(earnedIds(ws, '2026-01-07')).toContain('plus_ultra');
  });

  it('warm-ups and incomplete sets never count', () => {
    const ws = [
      workout(1, '2026-01-05', [entry(1, [set(20, 10)])]),
      workout(2, '2026-01-07', [entry(1, [set(50, 10, { isWarmup: true }), set(60, 10, { completedAt: null }), set(20, 10)])]),
    ];
    expect(replayBadgeStats(ws, [], '2026-01-07').records).toBe(0);
  });

  it('holds (duration) do not count as badge records', () => {
    const hold = (id: number, date: string, sec: number) => workout(id, date, [entry(9, [{ ...set(null, null), durationSec: sec }], HOLD)]);
    expect(replayBadgeStats([hold(1, '2026-01-05', 30), hold(2, '2026-01-07', 60)], [], '2026-01-07').records).toBe(0);
  });

  it('Clean Sweep: a record on every trained exercise, at least 3', () => {
    const base = workout(1, '2026-01-05', [entry(1, [set(20, 10)]), entry(2, [set(20, 10)]), entry(3, [set(20, 10)])]);
    const sweep = workout(2, '2026-01-07', [entry(1, [set(22, 10)]), entry(2, [set(20, 11)]), entry(3, [set(21, 10)])]);
    const almost = workout(2, '2026-01-07', [entry(1, [set(22, 10)]), entry(2, [set(20, 10)]), entry(3, [set(21, 10)])]);
    const two = [workout(1, '2026-01-05', [entry(1, [set(20, 10)]), entry(2, [set(20, 10)])]), workout(2, '2026-01-07', [entry(1, [set(22, 10)]), entry(2, [set(22, 10)])])];
    expect(earnedIds([base, sweep], '2026-01-07')).toContain('clean_sweep');
    expect(earnedIds([base, almost], '2026-01-07')).not.toContain('clean_sweep');
    expect(earnedIds(two, '2026-01-07')).not.toContain('clean_sweep');
  });

  it('counts records against the history before each workout, in start order', () => {
    const ws = [simple(2, '2026-01-07'), workout(1, '2026-01-05', [entry(1, [set(10, 10)])])];
    expect(replayBadgeStats(ws, [], '2026-01-07').records).toBe(1); // replayed as 10 kg, then 20 kg
  });
});

describe('volume', () => {
  it('uses the volume rules (per-dumbbell counts twice; warm-ups excluded)', () => {
    const ws = [workout(1, '2026-01-05', [entry(1, [set(25, 10, { isWarmup: true }), set(25, 10)], DB_EACH), entry(2, [set(100, 10)])])];
    expect(replayBadgeStats(ws, [], '2026-01-05').volumeKg).toBe(25 * 2 * 10 + 1000);
  });

  it('awards 10 tonnes at 10,000 kg', () => {
    const w = (id: number) => workout(id, `2026-01-${String(id).padStart(2, '0')}`, [entry(1, [set(100, 10), set(100, 10), set(100, 10), set(100, 10), set(100, 10)])]);
    expect(earnedIds([w(1)], '2026-01-01')).not.toContain('tonnes_10');
    expect(earnedIds([w(1), w(2)], '2026-01-02')).toContain('tonnes_10');
  });

  it('describes weights in lb in imperial', () => {
    const b = BADGE_BY_ID.get('tonnes_10')!;
    expect(progressText(b, 4535.9237, 'imperial')).toBe('10,000 / 22,046 lb');
    expect(progressText(b, 6240, 'metric')).toBe('6,240 / 10,000 kg');
    expect(remainingText(b, 6240, 'metric')).toBe('3,760 kg more to 10 Tonnes');
  });
});

describe('habits', () => {
  it('Early Riser (before 08:00) and Night Shift (21:00 or later) count finish times', () => {
    const early = Array.from({ length: 5 }, (_, i) => simple(i + 1, `2026-01-0${i + 1}`, { hour: 7 }));
    const notEarly = Array.from({ length: 5 }, (_, i) => simple(i + 1, `2026-01-0${i + 1}`, { hour: 8 }));
    const late = Array.from({ length: 5 }, (_, i) => simple(i + 1, `2026-01-0${i + 1}`, { hour: 21 }));
    expect(earnedIds(early, '2026-01-09')).toContain('early_riser');
    expect(earnedIds(notEarly, '2026-01-09')).not.toContain('early_riser');
    expect(earnedIds(late, '2026-01-09')).toContain('night_shift');
    expect(replayBadgeStats(early.slice(0, 3), [], '2026-01-09').earlyWorkouts).toBe(3);
  });

  it('Comeback after 14+ days away, never on the first workout', () => {
    expect(earnedIds([simple(1, '2026-01-01')], '2026-03-01')).not.toContain('comeback');
    expect(earnedIds([simple(1, '2026-01-01'), simple(2, '2026-01-14')], '2026-01-14')).not.toContain('comeback');
    expect(earnedIds([simple(1, '2026-01-01'), simple(2, '2026-01-15')], '2026-01-15')).toContain('comeback');
  });

  it('No Set Left Behind: every planned set of a template workout completed', () => {
    const planned = (sets: SetValues[], opts: { plannedSets?: number | null; templateId?: number | null } = {}) =>
      workout(1, '2026-01-05', [entry(1, sets, LIFT, 3)], { templateId: 1, plannedSets: 3, ...opts });
    const three = () => [set(20, 10), set(20, 10), set(20, 10)];
    expect(earnedIds([planned(three())], '2026-01-05')).toContain('no_set_left_behind');
    expect(earnedIds([planned([set(20, 10), set(20, 10)])], '2026-01-05')).not.toContain('no_set_left_behind');
    expect(earnedIds([planned([set(20, 10), set(20, 10), set(20, 10, { isWarmup: true })])], '2026-01-05')).not.toContain('no_set_left_behind');
    expect(earnedIds([planned(three(), { templateId: null })], '2026-01-05')).not.toContain('no_set_left_behind');
    expect(earnedIds([planned(three(), { plannedSets: null })], '2026-01-05')).not.toContain('no_set_left_behind');
    // An exercise removed mid-workout: its planned sets are missing from the total
    const removed = workout(1, '2026-01-05', [entry(1, three(), LIFT, 3)], { templateId: 1, plannedSets: 6 });
    expect(earnedIds([removed], '2026-01-05')).not.toContain('no_set_left_behind');
  });

  it('Full Rotation: every template in one Monday-start week, with 2+ templates', () => {
    const t = (id: number, date: string, templateId: number) => simple(id, date, { templateId });
    expect(earnedIds([t(1, '2026-01-05', 1), t(2, '2026-01-07', 2)], '2026-01-07', [1, 2])).toContain('full_rotation');
    expect(earnedIds([t(1, '2026-01-11', 1), t(2, '2026-01-12', 2)], '2026-01-12', [1, 2])).not.toContain('full_rotation'); // Sun, then Mon
    expect(earnedIds([t(1, '2026-01-05', 1)], '2026-01-05', [1])).not.toContain('full_rotation'); // needs 2 templates
    expect(earnedIds([t(1, '2026-01-05', 1), t(2, '2026-01-06', 2)], '2026-01-06', [1, 2, 3])).not.toContain('full_rotation');
  });
});

describe('evaluation and display', () => {
  it('is idempotent: the same history gives the same result', () => {
    const ws = Array.from({ length: 12 }, (_, i) => simple(i + 1, `2026-01-${String(i + 1).padStart(2, '0')}`));
    const a = evaluateBadges(ws, [], '2026-01-31');
    const b = evaluateBadges([...ws].reverse(), [], '2026-01-31');
    expect([...b.earned.entries()]).toEqual([...a.earned.entries()]);
  });

  it('earned badges come from storage, so they stay earned when the history shrinks', () => {
    const { stats } = evaluateBadges([], [], '2026-01-01');
    const statuses = badgeStatuses(stats, new Set(['ten_down']));
    const ten = statuses.find((s) => s.badge.id === 'ten_down')!;
    expect(ten.earned).toBe(true);
    expect(ten.fraction).toBe(1);
  });

  it('picks the closest unearned badge', () => {
    const ws = Array.from({ length: 9 }, (_, i) => simple(i + 1, `2026-01-${String(i + 1).padStart(2, '0')}`));
    const { stats, earned } = evaluateBadges(ws, [], '2026-01-09');
    expect(nextBadge(badgeStatuses(stats, new Set(earned.keys())))?.badge.id).toBe('ten_down');
  });

  it('writes accessible labels and progress text', () => {
    const centurion = BADGE_BY_ID.get('centurion')!;
    expect(badgeA11yLabel(centurion, false, 37, 'metric')).toBe('Centurion badge, gold, locked, 37 of 100 workouts');
    expect(badgeA11yLabel(centurion, true, 100, 'metric')).toBe('Centurion badge, gold, earned');
    expect(progressText(BADGE_BY_ID.get('half_hundred')!, 37, 'metric')).toBe('37 / 50');
    expect(remainingText(BADGE_BY_ID.get('half_hundred')!, 25, 'metric')).toBe('25 more workouts to Half Hundred');
    expect(remainingText(BADGE_BY_ID.get('month_strong')!, 3, 'metric')).toBe('1 more week in a row to Month Strong');
    expect(progressText(BADGE_BY_ID.get('comeback')!, 0, 'metric')).toBe('Not yet');
    expect(valueSentence(BADGE_BY_ID.get('quarter_century')!, 25, 'metric')).toBe('25 workouts finished');
    expect(valueSentence(BADGE_BY_ID.get('early_riser')!, 1, 'metric')).toBe('1 workout finished before 8:00');
    expect(valueSentence(BADGE_BY_ID.get('month_strong')!, 3, 'metric')).toBe('3 weeks in a row');
    expect(valueSentence(BADGE_BY_ID.get('beyond_10')!, 12, 'metric')).toBe('12 personal records');
    expect(valueSentence(BADGE_BY_ID.get('tonnes_10')!, 12345.6, 'metric')).toBe('12,345 kg lifted');
  });
});
