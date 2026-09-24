import { headlineRecord, lastDoneLabel, orderByUpNext, weekTotals } from './train';

const templates = [
  { id: 1, name: 'Back & Chest', position: 0 },
  { id: 2, name: 'Arms', position: 1 },
];

describe('up next', () => {
  it('puts never-done templates first, in template order', () => {
    expect(orderByUpNext(templates, []).map((x) => x.template.name)).toEqual(['Back & Chest', 'Arms']);
  });

  it('picks the template done least recently', () => {
    const finished = [
      { templateId: 1, name: 'Back & Chest', date: '2026-09-22', startedAt: 1 },
      { templateId: 2, name: 'Arms', date: '2026-09-20', startedAt: 2 },
    ];
    const order = orderByUpNext(templates, finished);
    expect(order.map((x) => x.template.name)).toEqual(['Arms', 'Back & Chest']);
    expect(order[0]!.lastDone).toBe('2026-09-20');
  });

  it('counts repeats of a template by name', () => {
    const finished = [
      { templateId: 1, name: 'Back & Chest', date: '2026-09-10', startedAt: 1 },
      { templateId: null, name: 'Back & Chest', date: '2026-09-23', startedAt: 3 },
      { templateId: 2, name: 'Arms', date: '2026-09-20', startedAt: 2 },
    ];
    expect(orderByUpNext(templates, finished).map((x) => [x.template.name, x.lastDone])).toEqual([
      ['Arms', '2026-09-20'],
      ['Back & Chest', '2026-09-23'],
    ]);
  });
});

describe('labels and totals', () => {
  it('describes when a template was last done', () => {
    expect(lastDoneLabel(null, '2026-09-24')).toBe('Not done yet');
    expect(lastDoneLabel('2026-09-24', '2026-09-24')).toBe('Last done today');
    expect(lastDoneLabel('2026-09-23', '2026-09-24')).toBe('Last done yesterday');
    expect(lastDoneLabel('2026-09-20', '2026-09-24')).toBe('Last done 4 days ago');
  });

  it('totals the current Monday-start week', () => {
    const rows = [
      { date: '2026-09-24', volume: 5000, setsCompleted: 15 },
      { date: '2026-09-21', volume: 7480, setsCompleted: 29 },
      { date: '2026-09-20', volume: 9999, setsCompleted: 30 }, // Sunday of last week
    ];
    expect(weekTotals(rows, '2026-09-24')).toEqual({ workouts: 2, volume: 12480, sets: 44 });
  });

  it('headlines the most meaningful record', () => {
    expect(headlineRecord(['reps', 'e1rm', 'heaviest'])).toBe('heaviest');
    expect(headlineRecord(['volume', 'reps'])).toBe('volume');
    expect(headlineRecord([])).toBeUndefined();
  });
});
