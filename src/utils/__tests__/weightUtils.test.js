import { describe, it, expect } from 'vitest';
import { totalToPerSide, perSideToTotal } from '../weightUtils';
import { isBarbellExercise } from '../../data/exercises';

describe('total-first barbell math', () => {
  it('detects bench + deadlift families, excludes dumbbell/machine', () => {
    expect(isBarbellExercise('Bench Press')).toBe(true);
    expect(isBarbellExercise('Incline Bench Press')).toBe(true);
    expect(isBarbellExercise('Deadlift')).toBe(true);
    expect(isBarbellExercise('Romanian Deadlift')).toBe(true);
    expect(isBarbellExercise('Dumbbell Bench Press')).toBe(false);
    expect(isBarbellExercise('Squat')).toBe(false);
  });

  it('converts total <-> per-side with 20kg bar', () => {
    expect(perSideToTotal(40, 'Bench Press')).toBe(100);
    expect(totalToPerSide(100, 'Bench Press')).toBe(40);
    expect(totalToPerSide(10, 'Bench Press')).toBe(0); // clamp, bar heavier than total
  });

  it('passes through non-barbell weights', () => {
    expect(perSideToTotal(50, 'Squat')).toBe(50);
    expect(totalToPerSide(50, 'Squat')).toBe(50);
  });
});
