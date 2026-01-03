import { format, differenceInDays, startOfDay } from 'date-fns';

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

// Compare workout volume with previous workout
export const getVolumeComparison = (currentWorkout, previousWorkouts) => {
  if (!currentWorkout || !previousWorkouts || previousWorkouts.length === 0) {
    return { percentage: 0, trend: 'neutral' };
  }
  
  const currentVolume = calculateTotalVolume(currentWorkout);
  const lastWorkout = previousWorkouts[0];
  const lastVolume = calculateTotalVolume(lastWorkout);
  
  if (lastVolume === 0) return { percentage: 0, trend: 'neutral' };
  
  const percentage = ((currentVolume - lastVolume) / lastVolume * 100).toFixed(1);
  const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
  
  return { percentage: Math.abs(percentage), trend };
};

// Get progressive overload for an exercise
export const getProgressiveOverload = (exerciseName, currentWorkout, workoutHistory) => {
  const currentExercise = currentWorkout?.exercises?.find(ex => ex.name === exerciseName);
  if (!currentExercise) return null;
  
  // Find the same exercise in previous workouts
  let previousExercise = null;
  for (const workout of workoutHistory) {
    if (workout.id === currentWorkout.id) continue;
    const found = workout.exercises?.find(ex => ex.name === exerciseName);
    if (found) {
      previousExercise = found;
      break;
    }
  }
  
  if (!previousExercise) return { status: 'new', message: 'First time!' };
  
  const currentMaxWeight = Math.max(...currentExercise.sets.map(s => s.weight || 0));
  const previousMaxWeight = Math.max(...previousExercise.sets.map(s => s.weight || 0));
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
};

export const calculateTotalSets = (workout) => {
  if (!workout?.exercises) return 0;
  
  return workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.length;
  }, 0);
};

export const getPersonalRecords = (workouts) => {
  const records = {};
  
  workouts.forEach(workout => {
    workout.exercises?.forEach(exercise => {
      const maxWeight = Math.max(...exercise.sets.map(set => set.weight || 0));
      
      if (!records[exercise.name] || maxWeight > records[exercise.name]) {
        records[exercise.name] = maxWeight;
      }
    });
  });
  
  return records;
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
