import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  addMonths,
  differenceInCalendarDays,
  format,
  startOfDay,
} from 'date-fns';
import {
  calculateTotalVolume,
  calculateTotalReps,
  calculateTotalSets,
  kgToTons,
} from './calculations';
import { getEffectiveWeight } from '../data/exercises';

// Monday-start weeks keep the Recap consistent (Home uses Sunday-start; Recap standardises on ISO Mon).
export const getWeekRange = (anchor = new Date()) => {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  start.setHours(0, 0, 0, 0);
  const end = endOfWeek(anchor, { weekStartsOn: 1 });
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const getMonthRange = (anchor = new Date()) => {
  const start = startOfMonth(anchor);
  start.setHours(0, 0, 0, 0);
  const end = endOfMonth(anchor);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const getRangeForMode = (mode, anchor = new Date()) =>
  mode === 'month' ? getMonthRange(anchor) : getWeekRange(anchor);

export const shiftAnchor = (anchor, mode, direction) => {
  const dir = direction >= 0 ? 1 : -1;
  return mode === 'month' ? addMonths(anchor, dir) : addWeeks(anchor, dir);
};

export const formatRangeLabel = (mode, range) => {
  if (mode === 'month') return format(range.start, 'MMMM yyyy');
  const sameMonth = format(range.start, 'MMM') === format(range.end, 'MMM');
  if (sameMonth) return `${format(range.start, 'MMM d')} – ${format(range.end, 'd, yyyy')}`;
  return `${format(range.start, 'MMM d')} – ${format(range.end, 'MMM d, yyyy')}`;
};

export const filterWorkoutsByRange = (workouts, range) => {
  if (!range) return [];
  const { start, end } = range;
  return (workouts || []).filter((w) => {
    const d = new Date(w.date);
    return d >= start && d <= end;
  });
};

const uniqueDays = (workouts) => {
  const set = new Set(
    (workouts || []).map((w) => format(startOfDay(new Date(w.date)), 'yyyy-MM-dd'))
  );
  return set.size;
};

const maxWeightForExercise = (workouts, exerciseName) => {
  let max = 0;
  workouts.forEach((w) => {
    w.exercises?.forEach((ex) => {
      if (ex.name !== exerciseName) return;
      ex.sets?.forEach((s) => {
        const eff = getEffectiveWeight(s.weight, exerciseName);
        if (eff > max) max = eff;
      });
    });
  });
  return max;
};

export const getTonsFunFact = (totalVolume) => {
  if (totalVolume >= 50000) return "That's like lifting a truck!";
  if (totalVolume >= 20000) return "That's like lifting a car!";
  if (totalVolume >= 10000) return "That's like lifting an elephant!";
  if (totalVolume >= 5000) return "That's like lifting a horse!";
  if (totalVolume >= 1000) return 'Over a ton of iron moved!';
  if (totalVolume > 0) return 'Every rep counts - keep stacking!';
  return null;
};

const getPersonality = ({ totalWorkouts, consistency, totalVolume, cardioMinutes, prsCount, morningShare }) => {
  if (totalWorkouts === 0) return { title: 'Rest & Reset', emoji: '🌙', line: 'Recovery is training too.' };
  if (consistency >= 85 && totalWorkouts >= 5)
    return { title: 'Unstoppable Engine', emoji: '🚂', line: 'You barely missed a day.' };
  if (prsCount >= 3) return { title: 'PR Hunter', emoji: '🏆', line: 'Records keep falling.' };
  if (totalVolume >= 20000) return { title: 'Volume Monster', emoji: '🦍', line: 'You move serious iron.' };
  if (cardioMinutes >= 150) return { title: 'Cardio Lover', emoji: '❤️', line: 'Your heart is thriving.' };
  if (morningShare >= 0.6) return { title: 'Early Beast', emoji: '🌅', line: 'Mornings belong to you.' };
  if (totalWorkouts >= 4) return { title: 'Consistent Grinder', emoji: '⚙️', line: 'Showing up is the skill.' };
  if (totalWorkouts >= 2) return { title: 'Steady Builder', emoji: '🧱', line: 'Brick by brick.' };
  return { title: 'Comeback Spark', emoji: '✨', line: 'The fire is lit — feed it.' };
};

/**
 * Core recap computation. Pure + memo-friendly.
 * @param {Array} allWorkouts - full history (for PR baseline)
 * @param {Object} range - {start, end}
 */
export const computeRecap = (allWorkouts = [], range) => {
  const inRange = filterWorkoutsByRange(allWorkouts, range);
  const regular = inRange.filter((w) => w.type !== 'rest_day');
  const restDays = inRange.filter((w) => w.type === 'rest_day').length;

  const totalWorkouts = regular.length;
  const totalVolume = regular.reduce((s, w) => s + calculateTotalVolume(w), 0);
  const totalSets = regular.reduce((s, w) => s + calculateTotalSets(w), 0);
  const totalReps = regular.reduce((s, w) => s + calculateTotalReps(w), 0);
  const totalMinutes = regular.reduce((s, w) => s + (w.duration || 0), 0);

  const totalDays = range ? differenceInCalendarDays(range.end, range.start) + 1 : 0;
  const activeDays = uniqueDays(inRange);
  const consistency = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;

  // Top exercises by session frequency
  const freq = {};
  regular.forEach((w) => {
    const seen = new Set();
    w.exercises?.forEach((ex) => {
      if (!seen.has(ex.name)) {
        freq[ex.name] = (freq[ex.name] || 0) + 1;
        seen.add(ex.name);
      }
    });
  });
  const topExercises = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  // Muscle split by sets per category
  const muscleSplit = {};
  regular.forEach((w) => {
    w.exercises?.forEach((ex) => {
      const cat = ex.category || 'other';
      muscleSplit[cat] = (muscleSplit[cat] || 0) + (ex.sets?.length || 0);
    });
  });
  const totalSplitSets = Object.values(muscleSplit).reduce((a, b) => a + b, 0) || 1;
  const muscleSplitPct = Object.entries(muscleSplit)
    .map(([name, sets]) => ({ name, sets, pct: Math.round((sets / totalSplitSets) * 100) }))
    .sort((a, b) => b.sets - a.sets)
    .slice(0, 5);

  // Cardio minutes + morning share
  let cardioMinutes = 0;
  let morningCount = 0;
  regular.forEach((w) => {
    const h = new Date(w.date).getHours();
    if (h < 10) morningCount++;
    w.exercises?.forEach((ex) => {
      if (ex.category === 'cardio') {
        cardioMinutes += ex.sets?.reduce((s, set) => s + (set.duration || 0), 0) || 0;
      }
    });
  });
  const morningShare = totalWorkouts > 0 ? morningCount / totalWorkouts : 0;

  // PRs set inside this period (period max beats pre-period max)
  const before = (allWorkouts || []).filter((w) => new Date(w.date) < range.start);
  const prs = [];
  const seenExercises = new Set();
  regular.forEach((w) => {
    w.exercises?.forEach((ex) => {
      if (seenExercises.has(ex.name)) return;
      seenExercises.add(ex.name);
      const periodMax = maxWeightForExercise(regular, ex.name);
      const beforeMax = maxWeightForExercise(before, ex.name);
      if (periodMax > 0 && periodMax > beforeMax) {
        prs.push({ exercise: ex.name, weight: periodMax, isFirstTime: beforeMax === 0 });
      }
    });
  });
  prs.sort((a, b) => b.weight - a.weight);

  const personality = getPersonality({
    totalWorkouts,
    consistency,
    totalVolume,
    cardioMinutes,
    prsCount: prs.length,
    morningShare,
  });

  return {
    totalWorkouts,
    restDays,
    totalVolume,
    tons: kgToTons(totalVolume),
    totalSets,
    totalReps,
    totalMinutes,
    activeDays,
    totalDays,
    consistency,
    topExercises,
    muscleSplit: muscleSplitPct,
    cardioMinutes,
    morningShare,
    prs,
    personality,
    funFact: getTonsFunFact(totalVolume),
    isEmpty: totalWorkouts === 0,
  };
};

export const computeDelta = (current, previous) => {
  if (!previous || previous.totalWorkouts === 0) return null;
  const workoutDelta = current.totalWorkouts - previous.totalWorkouts;
  const volumeBase = previous.totalVolume || 1;
  const volumeDeltaPct = Math.round(((current.totalVolume - previous.totalVolume) / volumeBase) * 100);
  return { workoutDelta, volumeDeltaPct };
};

export const buildShareText = (recap, periodLabel) => {
  if (recap.isEmpty) return `My ${periodLabel} gym recap: rest & reset 🌙 — via FitTrack`;
  const lines = [
    `💪 My ${periodLabel} gym recap (FitTrack)`,
    `${recap.personality.emoji} ${recap.personality.title}`,
    `🏋️ ${recap.totalWorkouts} workouts · ${recap.totalSets} sets · ${recap.totalReps} reps`,
    `⚖️ ${Math.round(recap.totalVolume).toLocaleString()} kg (${recap.tons}T) · ⏱️ ${recap.totalMinutes} min`,
    recap.topExercises[0] ? `🔥 Top move: ${recap.topExercises[0].name} x${recap.topExercises[0].count}` : null,
    recap.prs.length ? `🏆 ${recap.prs.length} PR${recap.prs.length > 1 ? 's' : ''}: ${recap.prs.slice(0, 2).map((p) => `${p.exercise} ${p.weight}kg`).join(', ')}` : null,
  ].filter(Boolean);
  return lines.join('\n');
};
