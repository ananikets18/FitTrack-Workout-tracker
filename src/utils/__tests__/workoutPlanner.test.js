import { describe, it, expect, beforeEach } from 'vitest';
import { createWorkoutPlan, parseExerciseList, createPlanExercise, blankPlanSet, planToWorkout, copyWorkoutPlan, getPlanProgress, mergeRemotePlans, emptyPlannerStore, readPlannerStore, clearAppStorage, PLANNER_STORAGE_PREFIX } from '../workoutPlanner';
import { totalToPerSide } from '../weightUtils';
import { validateImportedData } from '../validation';
import { analyzeExerciseProgression } from '../progressiveOverloadPredictor';

describe('daily workout planner', () => {
  beforeEach(() => localStorage.clear());

  it('imports section headings and keeps repeated exercises independent', () => {
    const exercises = parseExerciseList('Rope Hammer Curl\\\n\nSuperset\nRope Hammer Curl\nRope Triceps Pushdown\nCool-down\nWrist Flexor Stretch\nSlow Walking');
    expect(exercises).toHaveLength(5);
    expect(exercises[0].section).toBe('Strength');
    expect(exercises[1].section).toBe('Superset');
    expect(exercises[0].name).toBe(exercises[1].name);
    expect(exercises[0].id).not.toBe(exercises[1].id);
    expect(exercises[3].mode).toBe('timed');
    expect(exercises[4].mode).toBe('cardio');
    expect(exercises.every((exercise) => !exercise.completed)).toBe(true);
  });

  it('logs only checked exercises and genuine recorded sets, with correct units and weights', () => {
    const bench = { ...createPlanExercise('Flat Bench Press'), completed: true, sets: [blankPlanSet(), { ...blankPlanSet(), reps: 8, weight: totalToPerSide(60, 'Flat Bench Press') }] };
    const cardio = { ...createPlanExercise('Treadmill', 'Warm-up'), completed: true, sets: [{ ...blankPlanSet(), duration: 10, speed: 5, incline: 2 }] };
    const stretch = { ...createPlanExercise('Biceps Stretch', 'Cool-down'), completed: true, sets: [{ ...blankPlanSet(), duration: 30 }] };
    const checkOnly = { ...createPlanExercise('Wrist Flexor Stretch'), completed: true };
    const pending = { ...createPlanExercise('Incline Dumbbell Curl'), sets: [{ ...blankPlanSet(), reps: 10, weight: 15 }] };
    const plan = createWorkoutPlan('Arms Day', '2026-11-19', [bench, cardio, stretch, checkOnly, pending]);
    const workout = planToWorkout(plan);
    expect(workout.exercises).toHaveLength(4);
    expect(workout.exercises[0].sets).toHaveLength(1);
    expect(workout.exercises[0].sets[0]).toMatchObject({ reps: 8, weight: 20, completed: true });
    expect(workout.exercises[1]).toMatchObject({ category: 'cardio', notes: '[Warm-up]', sets: [{ duration: 10, speed: 5, incline: 2, reps: 0, weight: 0, completed: true }] });
    expect(workout.exercises[2]).toMatchObject({ category: 'mobility', sets: [{ duration: 30, reps: 0, weight: 0, completed: true, speed: null, incline: null }] });
    expect(workout.exercises[3].sets).toEqual([]);
    expect(new Date(workout.date).getDate()).toBe(19);
    expect(getPlanProgress(plan)).toMatchObject({ done: 4, total: 5, status: 'In progress' });
  });

  it('copies targets to a fresh date with fresh IDs, no completion, and no history link', () => {
    const plan = createWorkoutPlan('Arms Day', '2026-11-19', [{ ...createPlanExercise('Curl'), completed: true, sets: [{ ...blankPlanSet(), reps: 12, weight: 10 }] }]);
    plan.loggedAt = '2026-11-19T12:00:00Z';
    const copy = copyWorkoutPlan(plan, '2026-11-20');
    expect(copy.id).not.toBe(plan.id);
    expect(copy.exercises[0].id).not.toBe(plan.exercises[0].id);
    expect(copy.exercises[0].sets[0].id).not.toBe(plan.exercises[0].sets[0].id);
    expect(copy.exercises[0].sets[0]).toMatchObject({ reps: 12, weight: 10 });
    expect(copy.loggedAt).toBeNull();
    expect(getPlanProgress(copy)).toMatchObject({ done: 0, status: 'Planned' });
  });

  it('keeps offline edits and deletions when merging cloud data', () => {
    const local = createWorkoutPlan('Edited locally');
    const deleted = createWorkoutPlan('Deleted locally');
    const remoteOnly = createWorkoutPlan('Another device');
    const merged = mergeRemotePlans({ plans: [local], pending: { [local.id]: local.revision }, deleted: { [deleted.id]: true } }, [{ ...local, title: 'Stale remote' }, deleted, remoteOnly]);
    expect(merged.plans).toHaveLength(2);
    expect(merged.plans.find((plan) => plan.id === local.id).title).toBe('Edited locally');
    expect(merged.plans.some((plan) => plan.id === deleted.id)).toBe(false);
  });

  it('preserves drafts on logout and isolates accounts', () => {
    const store = { ...emptyPlannerStore(), plans: [createWorkoutPlan('Private plan')] };
    localStorage.setItem(`${PLANNER_STORAGE_PREFIX}user-a`, JSON.stringify(store));
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('fittrack-auth', 'session');
    clearAppStorage();
    expect(readPlannerStore('user-a').plans).toHaveLength(1);
    expect(readPlannerStore('user-b').plans).toHaveLength(0);
    expect(localStorage.getItem('fittrack-auth')).toBeNull();
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('allows checklist-only logs to be imported and excludes them from strength progression', () => {
    const plan = createWorkoutPlan('Checklist', '2026-11-19', [{ ...createPlanExercise('Flat Bench Press'), completed: true }]);
    const workout = planToWorkout(plan);
    expect(validateImportedData([workout]).validCount).toBe(1);
    expect(analyzeExerciseProgression('Flat Bench Press', [workout]).history).toEqual([]);
  });
});
