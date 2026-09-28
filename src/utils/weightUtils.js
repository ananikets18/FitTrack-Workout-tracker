import { BARBELL_WEIGHT_KG } from '../constants';
import { isBarbellExercise } from '../data/exercises';

/**
 * Total-first barbell math.
 * Stored set.weight remains per-side plates (legacy), UI enters TOTAL.
 */
export const totalToPerSide = (total, exerciseName, barbellKg = BARBELL_WEIGHT_KG) => {
  const t = parseFloat(total) || 0;
  if (!isBarbellExercise(exerciseName)) return t;
  return Math.max(0, (t - barbellKg) / 2);
};

export const perSideToTotal = (perSide, exerciseName, barbellKg = BARBELL_WEIGHT_KG) => {
  const p = parseFloat(perSide) || 0;
  if (!isBarbellExercise(exerciseName)) return p;
  return p * 2 + barbellKg;
};

export const formatTotal = (perSide, exerciseName) => {
  const total = perSideToTotal(perSide, exerciseName);
  return Number.isInteger(total) ? `${total}` : total.toFixed(1);
};
