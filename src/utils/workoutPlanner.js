import { getCategoryForExercise, isIsometricExercise } from '../data/exercises';
import { getLocalDateInputValue } from './date';

export const PLAN_SECTIONS = ['Warm-up', 'Strength', 'Superset', 'Cardio', 'Cool-down'];
export const PLANNER_STORAGE_PREFIX = 'fittrack_planner_v1:';
const uuid = () => crypto.randomUUID();

export const blankPlanSet = () => ({ id: uuid(), reps: '', weight: '', duration: '', speed: '', incline: '' });

export const createPlanExercise = (name, section = 'Strength') => {
  const category = getCategoryForExercise(name) || (/walk|running|cycling|treadmill|rowing/i.test(name) ? 'cardio' : 'other');
  const mode = category === 'cardio' ? 'cardio' : /stretch/i.test(name) || isIsometricExercise(name) ? 'timed' : 'strength';
  return { id: uuid(), name: name.trim().slice(0, 150), category, section, mode, completed: false, notes: '', sets: [] };
};

// Section headings are optional. Never deduplicate: the same exercise can occur in a superset.
export const parseExerciseList = (text, defaultSection = 'Strength') => {
  let section = defaultSection;
  return text.split(/\r?\n/).flatMap((line) => {
    const name = line.trim().replace(/^[•*\-☐☑]\s*/, '').replace(/\\$/, '').trim();
    if (!name) return [];
    const heading = PLAN_SECTIONS.find((value) => value.toLowerCase().replace(/-/g, '') === name.replace(/:$/, '').toLowerCase().replace(/-/g, ''));
    if (heading) { section = heading; return []; }
    return [createPlanExercise(name, section)];
  });
};

export const createWorkoutPlan = (title, date = getLocalDateInputValue(), exercises = []) => ({
  id: uuid(), title: title.trim().slice(0, 100), date, notes: '', duration: '', exercises,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revision: uuid(), savedRevision: null, loggedAt: null,
});

export const revisePlan = (plan, changes) => ({ ...plan, ...changes, updatedAt: new Date().toISOString(), revision: uuid() });

export const copyWorkoutPlan = (plan, date) => createWorkoutPlan(plan.title, date, plan.exercises.map((exercise) => ({
  ...exercise, id: uuid(), completed: false, notes: '',
  sets: exercise.sets.map((set) => ({ ...set, id: uuid() })),
})));

export const planFromWorkout = (workout, date) => createWorkoutPlan(workout.name, date, (workout.exercises || []).map((exercise) => {
  const section = exercise.section || PLAN_SECTIONS.find((value) => (exercise.notes || '').startsWith(`[${value}]`)) || 'Strength';
  const entry = createPlanExercise(exercise.name, section);
  return {
    ...entry, category: exercise.category || entry.category, notes: exercise.notes || '',
    mode: exercise.mode || (exercise.category === 'mobility' ? 'timed' : exercise.category === 'cardio' ? 'cardio' : entry.mode),
    sets: (exercise.sets || []).map((set) => ({ ...blankPlanSet(), ...set, id: uuid(), completed: false })),
  };
}));

export const getPlanProgress = (plan) => {
  const total = plan.exercises.length;
  const done = plan.exercises.filter((exercise) => exercise.completed).length;
  return { total, done, percent: total ? Math.round(done / total * 100) : 0, status: total > 0 && done === total ? 'Completed' : done > 0 ? 'In progress' : 'Planned' };
};

const number = (value, max) => Math.min(max, Math.max(0, Number(value) || 0));

export const planToWorkout = (plan) => ({
  name: plan.title.trim(),
  // Local noon avoids UTC date shifts and DST midnight boundaries for a date-only plan.
  date: new Date(`${plan.date}T12:00:00`).toISOString(),
  duration: plan.duration === '' ? null : number(plan.duration, 999),
  notes: plan.notes,
  exercises: plan.exercises.filter((exercise) => exercise.completed).map((exercise) => ({
    name: exercise.name, category: exercise.mode === 'cardio' ? 'cardio' : exercise.mode === 'timed' ? 'mobility' : exercise.category,
    notes: [exercise.section !== 'Strength' ? `[${exercise.section}]` : '', exercise.notes].filter(Boolean).join(' '),
    // Empty target rows must not create fabricated sets or barbell volume.
    sets: exercise.sets.filter((set) => Number(exercise.mode === 'strength' ? set.reps : set.duration) > 0).map((set) => ({
      reps: exercise.mode === 'strength' ? Math.floor(number(set.reps, 999)) : 0,
      weight: exercise.mode === 'strength' ? number(set.weight, 9999) : 0,
      // Cardio uses minutes; mobility holds/stretches use seconds.
      duration: exercise.mode === 'strength' ? null : Math.round(number(set.duration, exercise.mode === 'timed' ? 59940 : 999)),
      speed: exercise.mode === 'cardio' ? number(set.speed, 25) : null,
      incline: exercise.mode === 'cardio' ? number(set.incline, 15) : null,
      completed: true,
    })),
  })),
});

export const emptyPlannerStore = () => ({ plans: [], pending: {}, deleted: {} });

export const readPlannerStore = (userId) => {
  try {
    const value = JSON.parse(localStorage.getItem(`${PLANNER_STORAGE_PREFIX}${userId}`));
    if (Array.isArray(value?.plans) && value.pending && value.deleted) return value;
  } catch { /* A storage error is reported by the provider on the next save. */ }
  return emptyPlannerStore();
};

export const mergeRemotePlans = (store, remote) => ({ ...store, plans: [
  ...remote.filter((plan) => !store.deleted[plan.id] && !store.pending[plan.id]),
  ...store.plans.filter((plan) => store.pending[plan.id] && !store.deleted[plan.id]),
] });

// Drafts must survive logout; user-scoped keys keep another account from loading them.
export const clearAppStorage = () => {
  Object.keys(localStorage).filter((key) => !key.startsWith(PLANNER_STORAGE_PREFIX)).forEach((key) => localStorage.removeItem(key));
};
