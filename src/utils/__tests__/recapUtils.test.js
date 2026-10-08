import { describe, it, expect } from 'vitest';
import {
  isSundayDate,
  getWeekRange,
  getMonthRange,
  shiftAnchor,
  filterWorkoutsByRange,
  computeRecap,
  computeDelta,
  buildShareText,
} from '../recapUtils';

const mkWorkout = (iso, exercises = [], extra = {}) => ({
  id: Math.random().toString(36).slice(2),
  name: 'Session',
  date: new Date(iso).toISOString(),
  duration: 60,
  exercises,
  ...extra,
});

const strengthEx = (name, weight, reps = 8, category = 'chest') => ({
  name,
  category,
  sets: [{ weight, reps }],
});

describe('recapUtils', () => {
  it('identifies Sunday in local time and returns false for Monday through Saturday', () => {
    expect(isSundayDate(new Date(2026, 9, 5, 10, 0, 0))).toBe(false);  // Monday
    expect(isSundayDate(new Date(2026, 9, 6, 10, 0, 0))).toBe(false);  // Tuesday
    expect(isSundayDate(new Date(2026, 9, 7, 10, 0, 0))).toBe(false);  // Wednesday
    expect(isSundayDate(new Date(2026, 9, 8, 10, 0, 0))).toBe(false);  // Thursday
    expect(isSundayDate(new Date(2026, 9, 9, 10, 0, 0))).toBe(false);  // Friday
    expect(isSundayDate(new Date(2026, 9, 10, 10, 0, 0))).toBe(false); // Saturday
    expect(isSundayDate(new Date(2026, 9, 11, 10, 0, 0))).toBe(true);  // Sunday
  });

  it('builds a Monday-start week range of 7 days', () => {
    const { start, end } = getWeekRange(new Date('2026-09-30T12:00:00')); // Wednesday
    expect(start.getDay()).toBe(1); // Monday
    expect(end.getDay()).toBe(0); // Sunday
    expect((end - start) / 86400000).toBeGreaterThan(6.9);
  });

  it('builds a full month range', () => {
    const { start, end } = getMonthRange(new Date('2026-09-15T12:00:00'));
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(8); // September
  });

  it('shifts anchors forward/back for week and month', () => {
    const base = new Date('2026-09-30T12:00:00');
    const nextWeek = shiftAnchor(base, 'week', 1);
    expect(Math.round((nextWeek - base) / 86400000)).toBe(7);
    const nextMonth = shiftAnchor(base, 'month', 1);
    expect(nextMonth.getMonth()).toBe(9); // October
    const prevMonth = shiftAnchor(base, 'month', -1);
    expect(prevMonth.getMonth()).toBe(7); // August
  });

  it('filters workouts inclusively by range', () => {
    const range = getWeekRange(new Date('2026-09-30T12:00:00'));
    const inside = mkWorkout(range.start.toISOString(), [strengthEx('Bench Press', 60)]);
    const outside = mkWorkout('2020-01-01T10:00:00', [strengthEx('Squat', 80)]);
    expect(filterWorkoutsByRange([inside, outside], range)).toHaveLength(1);
  });

  it('computes recap totals and excludes rest days from volume', () => {
    const range = getWeekRange(new Date('2026-09-30T12:00:00'));
    const d = range.start.toISOString();
    const workouts = [
      mkWorkout(d, [strengthEx('Bench Press', 60)]),
      mkWorkout(d, [], { type: 'rest_day' }),
    ];
    const recap = computeRecap(workouts, range);
    expect(recap.totalWorkouts).toBe(1);
    expect(recap.restDays).toBe(1);
    expect(recap.totalVolume).toBeGreaterThan(0);
    expect(recap.consistency).toBeGreaterThan(0);
    expect(recap.topExercises[0].name).toBe('Bench Press');
  });

  it('detects a PR when period max beats history', () => {
    const range = getWeekRange(new Date('2026-09-30T12:00:00'));
    const before = [mkWorkout('2026-01-05T10:00:00', [strengthEx('Squat', 80, 5, 'legs')])];
    const current = [mkWorkout(range.start.toISOString(), [strengthEx('Squat', 100, 5, 'legs')])];
    const recap = computeRecap([...current, ...before], range);
    expect(recap.prs.length).toBe(1);
    expect(recap.prs[0].exercise).toBe('Squat');
  });

  it('marks empty periods and computes deltas', () => {
    const range = getWeekRange(new Date('2026-09-30T12:00:00'));
    const empty = computeRecap([], range);
    expect(empty.isEmpty).toBe(true);
    expect(computeDelta({ totalWorkouts: 3, totalVolume: 3000 }, { totalWorkouts: 2, totalVolume: 2000 }).volumeDeltaPct).toBe(50);
    expect(computeDelta({ totalWorkouts: 1, totalVolume: 100 }, { totalWorkouts: 0, totalVolume: 0 })).toBeNull();
  });

  it('builds share text with personality + top lift', () => {
    const range = getWeekRange(new Date('2026-09-30T12:00:00'));
    const recap = computeRecap(
      [mkWorkout(range.start.toISOString(), [strengthEx('Deadlift', 120, 5, 'back')])],
      range
    );
    const text = buildShareText(recap, 'Sep 28 – Oct 4');
    expect(text).toContain('Deadlift');
    expect(text).toContain('FitTrack');
  });
});

