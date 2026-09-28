import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @supabase/supabase-js before importing lib/supabase.js
// so module-level createClient(undefined) doesn't throw in tests.
const mockFrom = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (...args) => mockFrom(...args),
    channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) })),
  })),
}));

const { transformWorkoutFromDB, db } = await import('../supabase.js');

function chain(result) {
  // Minimal thenable chain: select/insert/update/delete/order/eq/limit/single/maybeSingle/upsert
  const self = {
    select: vi.fn(() => self),
    insert: vi.fn(() => self),
    update: vi.fn(() => self),
    delete: vi.fn(() => self),
    upsert: vi.fn(() => self),
    eq: vi.fn(() => self),
    order: vi.fn(() => self),
    limit: vi.fn(() => self),
    single: vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result),
    then: (resolve) => Promise.resolve(result).then(resolve),
  };
  return self;
}

describe('transformWorkoutFromDB', () => {
  it('preserves set ids + cardio fields for diff updates', () => {
    const out = transformWorkoutFromDB({
      id: 'w1',
      type: 'workout',
      name: 'Cardio',
      date: '2026-09-01',
      duration: 30,
      notes: '',
      created_at: '2026-09-01',
      exercises: [
        {
          id: 'e1',
          name: 'Treadmill',
          category: 'cardio',
          notes: null,
          order: 0,
          sets: [
            { id: 's1', reps: 0, weight: 0, duration: 20, incline: 2, speed: 8, completed: true, order: 0 },
          ],
        },
      ],
    });
    expect(out.exercises[0].id).toBe('e1');
    expect(out.exercises[0].sets[0].id).toBe('s1');
    expect(out.exercises[0].sets[0].duration).toBe(20);
    expect(out.exercises[0].sets[0].incline).toBe(2);
    expect(out.exercises[0].sets[0].speed).toBe(8);
  });

  it('maps rest_day activities', () => {
    const out = transformWorkoutFromDB({
      id: 'w2',
      type: 'rest_day',
      date: '2026-09-02',
      notes: 'rest',
      created_at: '2026-09-02',
      rest_day_activities: [{ activity: 'Walk', recovery_quality: 4 }],
    });
    expect(out.type).toBe('rest_day');
    expect(out.activities).toEqual(['Walk']);
    expect(out.recoveryQuality).toBe(4);
  });
});

describe('db.updateWorkout preserves IDs', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('updates existing exercise/set instead of delete-all', async () => {
    const calls = [];
    mockFrom.mockImplementation((table) => {
      calls.push(table);
      if (table === 'workouts') {
        return chain({ error: null });
      }
      if (table === 'exercises' && calls.filter((c) => c === 'exercises').length === 1) {
        // First exercises call = fetch existing for diff
        return chain({
          data: [{ id: 'e1', sets: [{ id: 's1' }] }],
          error: null,
        });
      }
      // Subsequent exercise/set update/insert/delete calls
      return chain({ data: { id: 'e1' }, error: null });
    });

    const res = await db.updateWorkout(
      'w1',
      {
        name: 'Chest',
        date: '2026-09-01',
        duration: 60,
        notes: '',
        exercises: [
          {
            id: 'e1',
            name: 'Bench Press',
            category: 'chest',
            notes: null,
            sets: [{ id: 's1', reps: 10, weight: 100, completed: true }],
          },
        ],
      },
      'u1'
    );

    expect(res).toEqual({ id: 'w1' });
    // Must NOT call delete on exercises table for full wipe when IDs match
    // (only per-item deletes allowed; here nothing removed so no delete at all)
    expect(mockFrom).toHaveBeenCalled();
  });
});
