import { addDays, daysBetween, groupByWeek, parseLocalDate, toLocalDate, weekStart } from './dates';
import { formatClock, formatDay, formatDuration, formatWeekLabel, restTitle } from './format';

describe('dates', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toLocalDate(new Date(2026, 8, 4, 23, 59))).toBe('2026-09-04');
    expect(toLocalDate(parseLocalDate('2026-01-31'))).toBe('2026-01-31');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-09-01', '2026-09-24')).toBe(23);
  });

  it('uses Monday as the week start', () => {
    expect(weekStart('2026-09-24')).toBe('2026-09-21'); // Thursday
    expect(weekStart('2026-09-21')).toBe('2026-09-21'); // Monday
    expect(weekStart('2026-09-27')).toBe('2026-09-21'); // Sunday
  });

  it('groups items by week, newest first', () => {
    const groups = groupByWeek(['2026-09-24', '2026-09-22', '2026-09-15', '2026-09-27'], (d) => d);
    expect(groups.map((g) => g.weekStart)).toEqual(['2026-09-21', '2026-09-14']);
    expect(groups[0]!.items).toEqual(['2026-09-24', '2026-09-22', '2026-09-27']);
  });
});

describe('format', () => {
  it('formats clocks and durations', () => {
    expect(formatClock(45)).toBe('0:45');
    expect(formatClock(24 * 60 + 13)).toBe('24:13');
    expect(formatClock(3723)).toBe('1:02:03');
    expect(formatDuration(48 * 60_000)).toBe('48 min');
    expect(formatDuration(72 * 60_000)).toBe('1 h 12 min');
    expect(restTitle(44.2)).toBe('0:45 · Rest');
  });

  it('labels days and weeks', () => {
    expect(formatDay('2026-09-24')).toBe('Thu 24 Sep');
    expect(formatWeekLabel('2026-09-21', '2026-09-24')).toBe('This week');
    expect(formatWeekLabel('2026-09-14', '2026-09-24')).toBe('Last week');
    expect(formatWeekLabel('2026-09-07', '2026-09-24')).toBe('7–13 Sep');
    expect(formatWeekLabel('2026-09-28', '2026-10-20')).toBe('28 Sep – 4 Oct');
  });
});
