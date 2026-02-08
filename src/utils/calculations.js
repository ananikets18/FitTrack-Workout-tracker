import { format, differenceInDays, startOfDay } from 'date-fns';
import {
  detectCardioType,
  calculateCardioStress,
  classifyWorkoutCardio,
  getCardioTypeLabel,
  CARDIO_TYPES
} from './cardioClassification';
import {
  getExerciseMuscleDistribution,
  calculateWeightedMuscleSets
} from './exerciseMuscleMapping';
import {
  calculateSystemicStress,
  getSystemicReadiness,
  getWorkoutIntensityClassification,
  classifyExerciseIntensity
} from './intensityClassification';

export const calculateTotalVolume = (workout) => {
  if (!workout?.exercises) return 0;

  return workout.exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets.reduce((sum, set) => {
      return sum + (set.reps * set.weight);
    }, 0);
    return total + exerciseVolume;
  }, 0);
};

// Convert kg to tons
export const kgToTons = (kg) => {
  return (kg / 1000).toFixed(1);
};

// Calculate total reps across all exercises
export const calculateTotalReps = (workout) => {
  if (!workout?.exercises) return 0;

  return workout.exercises.reduce((total, exercise) => {
    const exerciseReps = exercise.sets.reduce((sum, set) => sum + (set.reps || 0), 0);
    return total + exerciseReps;
  }, 0);
};

// Calculate average weight per set
export const calculateAverageWeight = (workout) => {
  if (!workout?.exercises) return 0;

  let totalWeight = 0;
  let totalSets = 0;

  workout.exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      totalWeight += set.weight || 0;
      totalSets++;
    });
  });

  return totalSets > 0 ? (totalWeight / totalSets).toFixed(1) : 0;
};

// Calculate volume per exercise
export const calculateExerciseVolume = (exercise) => {
  if (!exercise?.sets) return 0;

  return exercise.sets.reduce((sum, set) => {
    return sum + (set.reps * set.weight);
  }, 0);
};

// ============================================
// ACTIVITY POINTS SYSTEM - Unified Metric
// ============================================
// This system provides a single metric that works across all exercise types:
// - Weight Training: reps × weight × 1.0
// - Cardio: duration (mins) × 10
// - Bodyweight: reps × 2

// Calculate activity points for a single exercise
export const calculateActivityPoints = (exercise) => {
  if (!exercise?.sets) return 0;

  const isCardio = exercise.category === 'cardio';
  const weights = exercise.sets.map(s => s.weight || 0).filter(w => w > 0);
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
  const isBodyweight = maxWeight === 0 && !isCardio;

  if (isCardio) {
    // Use advanced cardio stress calculation (accounts for LISS/MISS/HIIT)
    return calculateCardioStress(exercise) * 10; // Scale to match activity points
  }

  return exercise.sets.reduce((sum, set) => {
    if (isBodyweight) {
      // Bodyweight exercises: reps × 2
      return sum + ((set.reps || 0) * 2);
    } else {
      // Weighted exercises: reps × weight
      return sum + ((set.reps || 0) * (set.weight || 0));
    }
  }, 0);
};

// Calculate total activity points for a workout
export const calculateTotalActivity = (workout) => {
  if (!workout?.exercises) return 0;

  return workout.exercises.reduce((total, exercise) => {
    return total + calculateActivityPoints(exercise);
  }, 0);
};

// Get activity breakdown by type (for insights)
export const getActivityBreakdown = (workouts) => {
  const breakdown = {
    weighted: 0,
    cardio: 0,
    bodyweight: 0,
    cardioMinutes: 0,
    cardioSessions: 0,
    // Cardio type breakdown
    cardioTypes: {
      LISS: 0,
      MISS: 0,
      HIIT: 0
    }
  };

  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

  regularWorkouts.forEach(workout => {
    workout.exercises?.forEach(exercise => {
      const isCardio = exercise.category === 'cardio';
      const weights = exercise.sets.map(s => s.weight || 0).filter(w => w > 0);
      const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
      const isBodyweight = maxWeight === 0 && !isCardio;

      const points = calculateActivityPoints(exercise);

      if (isCardio) {
        breakdown.cardio += points;
        breakdown.cardioMinutes += exercise.sets.reduce((sum, set) => sum + (set.duration || 0), 0);
        breakdown.cardioSessions += 1;

        // Track cardio type
        const cardioType = detectCardioType(exercise.name);
        breakdown.cardioTypes[cardioType]++;
      } else if (isBodyweight) {
        breakdown.bodyweight += points;
      } else {
        breakdown.weighted += points;
      }
    });
  });

  return breakdown;
};

// Compare workout volume with previous workout
export const getVolumeComparison = (currentWorkout, previousWorkouts) => {
  if (!currentWorkout || !previousWorkouts || previousWorkouts.length === 0) {
    return { percentage: 0, trend: 'neutral' };
  }

  const currentVolume = calculateTotalVolume(currentWorkout);
  // Filter out rest days
  const regularWorkouts = previousWorkouts.filter(w => w.type !== 'rest_day');
  if (regularWorkouts.length === 0) return { percentage: 0, trend: 'neutral' };
  const lastWorkout = regularWorkouts[0];
  const lastVolume = calculateTotalVolume(lastWorkout);

  if (lastVolume === 0) return { percentage: 0, trend: 'neutral' };

  const percentage = ((currentVolume - lastVolume) / lastVolume * 100).toFixed(1);
  const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';

  return { percentage: Math.abs(percentage), trend };
};

// Get progressive overload for an exercise (Enhanced for Cardio)
export const getProgressiveOverload = (exerciseName, currentWorkout, workoutHistory) => {
  const currentExercise = currentWorkout?.exercises?.find(ex => ex.name === exerciseName);
  if (!currentExercise) return null;

  // Find the same exercise in previous workouts (filter out rest days)
  let previousExercise = null;
  for (const workout of workoutHistory) {
    if (workout.id === currentWorkout.id || workout.type === 'rest_day') continue;
    const found = workout.exercises?.find(ex => ex.name === exerciseName);
    if (found) {
      previousExercise = found;
      break;
    }
  }

  if (!previousExercise) return { status: 'new', message: 'First time!' };

  // Check if this is a cardio exercise
  const isCardio = currentExercise.category === 'cardio';

  if (isCardio) {
    // For cardio: compare duration (use duration field if available, fall back to reps for backward compatibility)
    const currentDuration = currentExercise.sets.reduce((sum, s) => sum + (s.duration || s.reps || 0), 0);
    const previousDuration = previousExercise.sets.reduce((sum, s) => sum + (s.duration || s.reps || 0), 0);

    if (currentDuration > previousDuration) {
      return {
        status: 'improved',
        message: `+${currentDuration - previousDuration} mins duration`,
        color: 'green'
      };
    } else if (currentDuration < previousDuration) {
      return {
        status: 'declined',
        message: `-${previousDuration - currentDuration} mins duration`,
        color: 'red'
      };
    } else {
      return { status: 'maintained', message: 'Same duration', color: 'gray' };
    }
  } else {
    // For weight training: compare weight and reps
    const currentWeights = currentExercise.sets.map(s => s.weight || 0).filter(w => w > 0);
    const currentMaxWeight = currentWeights.length > 0 ? Math.max(...currentWeights) : 0;
    const previousWeights = previousExercise.sets.map(s => s.weight || 0).filter(w => w > 0);
    const previousMaxWeight = previousWeights.length > 0 ? Math.max(...previousWeights) : 0;
    const currentTotalReps = currentExercise.sets.reduce((sum, s) => sum + (s.reps || 0), 0);
    const previousTotalReps = previousExercise.sets.reduce((sum, s) => sum + (s.reps || 0), 0);

    if (currentMaxWeight > previousMaxWeight) {
      return { status: 'improved', message: `+${currentMaxWeight - previousMaxWeight}kg weight`, color: 'green' };
    } else if (currentTotalReps > previousTotalReps && currentMaxWeight === previousMaxWeight) {
      return { status: 'improved', message: `+${currentTotalReps - previousTotalReps} reps`, color: 'green' };
    } else if (currentMaxWeight < previousMaxWeight) {
      return { status: 'declined', message: `-${previousMaxWeight - currentMaxWeight}kg weight`, color: 'red' };
    }

    return { status: 'maintained', message: 'Same as last time', color: 'gray' };
  }
};

export const calculateTotalSets = (workout) => {
  if (!workout?.exercises) return 0;

  return workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.length;
  }, 0);
};

export const getPersonalRecords = (workouts) => {
  const records = {};

  // Filter out rest days
  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

  regularWorkouts.forEach(workout => {
    workout.exercises?.forEach(exercise => {
      const weights = exercise.sets.map(set => set.weight || 0).filter(w => w > 0);
      const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;

      if (maxWeight > 0 && (!records[exercise.name] || maxWeight > records[exercise.name])) {
        records[exercise.name] = maxWeight;
      }
    });
  });

  return records;
};

// ============================================
// ADVANCED WORKOUT INTELLIGENCE
// ============================================

// Calculate systemic (CNS) stress for a workout
export const getWorkoutSystemicStress = (workout) => {
  return calculateSystemicStress(workout);
};

// Get workout intensity classification with label and color
export const getWorkoutIntensity = (workout) => {
  return getWorkoutIntensityClassification(workout);
};

// Get weighted muscle distribution for a workout
export const getWorkoutMuscleDistribution = (workout) => {
  return calculateWeightedMuscleSets(workout);
};

// Get cardio breakdown for a workout
export const getWorkoutCardioBreakdown = (workout) => {
  return classifyWorkoutCardio(workout);
};

// Calculate systemic readiness score
export const getUserReadinessScore = (workouts, daysToConsider = 7) => {
  return getSystemicReadiness(workouts, daysToConsider);
};

export const calculateStreak = (workouts) => {
  if (!workouts || workouts.length === 0) return 0;

  const sortedDates = workouts
    .map(w => startOfDay(new Date(w.date)))
    .sort((a, b) => b - a);

  let streak = 0;
  let currentDate = startOfDay(new Date());

  for (const workoutDate of sortedDates) {
    const daysDiff = differenceInDays(currentDate, workoutDate);

    if (daysDiff === 0 || daysDiff === 1) {
      streak++;
      currentDate = workoutDate;
    } else {
      break;
    }
  }

  return streak;
};

export const formatDate = (date) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatTime = (date) => {
  return format(new Date(date), 'h:mm a');
};

export const groupWorkoutsByDate = (workouts) => {
  const grouped = {};

  workouts.forEach(workout => {
    const dateKey = format(new Date(workout.date), 'yyyy-MM-dd');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(workout);
  });

  return grouped;
};

// Generate personalized insights
export const generateInsights = (workouts) => {
  const insights = [];

  if (!workouts || workouts.length === 0) return insights;

  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');
  const restDays = workouts.filter(w => w.type === 'rest_day');

  // 1. Streak Insight
  const streak = calculateStreak(workouts);
  if (streak >= 7) {
    insights.push({
      icon: '🔥',
      title: `${streak}-Day Streak!`,
      message: 'You\'re on fire! Keep the momentum going.',
      color: 'orange',
    });
  } else if (streak >= 3) {
    insights.push({
      icon: '💪',
      title: `${streak}-Day Streak`,
      message: 'Great consistency! Keep it up.',
      color: 'blue',
    });
  }

  // 2. Total Volume Insight
  const totalVolume = regularWorkouts.reduce((sum, w) => sum + calculateTotalVolume(w), 0);
  if (totalVolume > 0) {
    const tons = kgToTons(totalVolume);
    let comparison = '';
    if (totalVolume >= 50000) comparison = ' - That\'s like lifting a truck!';
    else if (totalVolume >= 20000) comparison = ' - That\'s like lifting a car!';
    else if (totalVolume >= 10000) comparison = ' - That\'s like lifting an elephant!';
    else if (totalVolume >= 5000) comparison = ' - That\'s like lifting a horse!';

    insights.push({
      icon: '🏋️',
      title: `${tons} Tons Lifted`,
      message: `You've moved ${Math.round(totalVolume).toLocaleString()}kg total${comparison}`,
      color: 'green',
    });
  }

  // 3. Most Improved Exercise (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentWorkouts = regularWorkouts.filter(w => new Date(w.date) >= thirtyDaysAgo);

  if (recentWorkouts.length >= 2) {
    const exerciseProgress = {};

    recentWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const weights = exercise.sets.map(s => s.weight || 0).filter(w => w > 0);
        const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
        if (!exerciseProgress[exercise.name]) {
          exerciseProgress[exercise.name] = { first: maxWeight, last: maxWeight, count: 0 };
        }
        exerciseProgress[exercise.name].last = maxWeight;
        exerciseProgress[exercise.name].count++;
      });
    });

    let bestImprovement = null;
    let bestExercise = null;

    Object.entries(exerciseProgress).forEach(([name, data]) => {
      if (data.count >= 2) {
        const improvement = data.last - data.first;
        const percent = (improvement / data.first) * 100;
        if (improvement > 0 && (!bestImprovement || percent > bestImprovement)) {
          bestImprovement = percent;
          bestExercise = { name, improvement, percent };
        }
      }
    });

    if (bestExercise && bestExercise.percent >= 5) {
      insights.push({
        icon: '📈',
        title: 'Most Improved',
        message: `Your ${bestExercise.name} is up ${bestExercise.improvement}kg (${bestExercise.percent.toFixed(0)}%) this month!`,
        color: 'purple',
      });
    }
  }

  // 4. Workout Frequency Insight
  if (regularWorkouts.length >= 4) {
    const workoutDays = {};
    regularWorkouts.forEach(w => {
      const day = format(new Date(w.date), 'EEEE');
      workoutDays[day] = (workoutDays[day] || 0) + 1;
    });

    const mostCommonDay = Object.entries(workoutDays)
      .sort((a, b) => b[1] - a[1])[0];

    if (mostCommonDay && mostCommonDay[1] >= 3) {
      insights.push({
        icon: '📅',
        title: 'Favorite Day',
        message: `You love ${mostCommonDay[0]}s! You've worked out ${mostCommonDay[1]} times on this day.`,
        color: 'indigo',
      });
    }
  }

  // 5. Rest Day Balance
  const workoutToRestRatio = regularWorkouts.length / (restDays.length || 1);
  if (restDays.length > 0 && workoutToRestRatio >= 2 && workoutToRestRatio <= 4) {
    insights.push({
      icon: '⚖️',
      title: 'Great Balance',
      message: `Perfect workout-to-rest ratio! ${regularWorkouts.length} workouts, ${restDays.length} rest days.`,
      color: 'teal',
    });
  }

  // 6. Average Workout Duration
  const workoutsWithDuration = regularWorkouts.filter(w => w.duration > 0);
  if (workoutsWithDuration.length >= 3) {
    const avgDuration = Math.round(
      workoutsWithDuration.reduce((sum, w) => sum + w.duration, 0) / workoutsWithDuration.length
    );
    insights.push({
      icon: '⏱️',
      title: 'Average Duration',
      message: `Your workouts average ${avgDuration} minutes - efficient and effective!`,
      color: 'cyan',
    });
  }

  // 7. Cardio Achievement (NEW - Activity Points System)
  const activityBreakdown = getActivityBreakdown(workouts);
  if (activityBreakdown.cardioMinutes >= 150) {
    insights.push({
      icon: '🏃',
      title: 'Cardio Champion',
      message: `${activityBreakdown.cardioMinutes} mins of cardio - heart healthy!`,
      color: 'blue',
    });
  } else if (activityBreakdown.cardioMinutes >= 60) {
    insights.push({
      icon: '❤️',
      title: 'Cardio Warrior',
      message: `${activityBreakdown.cardioMinutes} mins of cardio this period. Keep it up!`,
      color: 'pink',
    });
  }

  // 8. Systemic Readiness Insight (NEW - CNS Stress Tracking)
  const readinessScore = getUserReadinessScore(workouts, 7);
  if (readinessScore < 50) {
    insights.push({
      icon: '⚠️',
      title: 'Recovery Needed',
      message: `Your readiness score is ${readinessScore}/100. Consider a rest day or light activity.`,
      color: 'red',
    });
  } else if (readinessScore >= 80) {
    insights.push({
      icon: '💯',
      title: 'Fully Recovered',
      message: `Readiness score: ${readinessScore}/100. You're ready for intense training!`,
      color: 'green',
    });
  }

  // 9. Cardio Type Insight (NEW - LISS/MISS/HIIT Breakdown)
  if (activityBreakdown.cardioTypes) {
    const { LISS, MISS, HIIT } = activityBreakdown.cardioTypes;
    const totalCardioSessions = LISS + MISS + HIIT;

    if (totalCardioSessions >= 3) {
      if (HIIT >= 2) {
        insights.push({
          icon: '⚡',
          title: 'High Intensity Focus',
          message: `${HIIT} HIIT sessions this period. Great for fat loss and conditioning!`,
          color: 'orange',
        });
      } else if (LISS >= 3) {
        insights.push({
          icon: '🚶',
          title: 'Active Recovery',
          message: `${LISS} LISS sessions. Perfect for recovery and heart health!`,
          color: 'teal',
        });
      }
    }
  }

  // Return top 8 insights (increased to accommodate new intelligence)
  return insights.slice(0, 8);
};
