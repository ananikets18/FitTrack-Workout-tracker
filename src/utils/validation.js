/**
 * Validation and Sanitization Utilities
 * Protects against XSS and ensures data integrity
 */

// Sanitize string input
export const sanitizeString = (input, maxLength = 500) => {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

// Sanitize number input
export const sanitizeNumber = (input, min = 0, max = 99999) => {
  const num = Number(input);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, Math.floor(num)));
};

// Validate workout name
export const validateWorkoutName = (name) => {
  const sanitized = sanitizeString(name, 100);

  if (!sanitized || sanitized.length < 1) {
    return { isValid: false, error: 'Workout name is required', value: '' };
  }

  if (sanitized.length > 100) {
    return { isValid: false, error: 'Workout name must be less than 100 characters', value: sanitized.slice(0, 100) };
  }

  return { isValid: true, error: null, value: sanitized };
};

// Validate exercise name
export const validateExerciseName = (name) => {
  const sanitized = sanitizeString(name, 150);

  if (!sanitized || sanitized.length < 1) {
    return { isValid: false, error: 'Exercise name is required', value: '' };
  }

  return { isValid: true, error: null, value: sanitized };
};

// Validate set data
export const validateSet = (set) => {
  const reps = sanitizeNumber(set.reps, 0, 999);
  const weight = sanitizeNumber(set.weight, 0, 9999);
  const duration = set.duration !== undefined && set.duration !== null && set.duration !== ''
    ? sanitizeNumber(set.duration, 0, 999)
    : undefined;

  return {
    isValid: reps >= 0 && weight >= 0,
    value: {
      reps,
      weight,
      duration, // Include duration for cardio exercises
      completed: Boolean(set.completed)
    },
    error: null
  };
};

// Validate workout data structure
export const validateWorkout = (workout) => {
  const errors = [];

  // Validate name
  const nameValidation = validateWorkoutName(workout.name);
  if (!nameValidation.isValid) {
    errors.push(nameValidation.error);
  }

  // Validate exercises array
  if (!Array.isArray(workout.exercises)) {
    errors.push('Exercises must be an array');
  } else if (workout.exercises.length === 0) {
    errors.push('At least one exercise is required');
  }

  // Validate each exercise
  workout.exercises?.forEach((exercise, index) => {
    if (!exercise.name) {
      errors.push(`Exercise ${index + 1}: Name is required`);
    }

    if (!Array.isArray(exercise.sets) || exercise.sets.length === 0) {
      errors.push(`Exercise ${index + 1}: At least one set is required`);
    }
  });

  // Validate duration
  if (workout.duration !== undefined && workout.duration !== '') {
    const duration = sanitizeNumber(workout.duration, 0, 999);
    if (duration < 0 || duration > 999) {
      errors.push('Duration must be between 0 and 999 minutes');
    }
  }

  // Validate date
  if (workout.date) {
    const date = new Date(workout.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedWorkout: sanitizeWorkout(workout)
  };
};

// Sanitize entire workout object
export const sanitizeWorkout = (workout) => {
  return {
    id: workout.id || crypto.randomUUID(),
    name: sanitizeString(workout.name, 100),
    date: workout.date || new Date().toISOString(),
    duration: workout.duration ? sanitizeNumber(workout.duration, 0, 999) : '',
    notes: sanitizeString(workout.notes || '', 1000),
    exercises: Array.isArray(workout.exercises)
      ? workout.exercises.map(exercise => ({
        id: exercise.id || crypto.randomUUID(),
        name: sanitizeString(exercise.name, 150),
        category: sanitizeString(exercise.category, 50),
        notes: sanitizeString(exercise.notes || '', 500),
        sets: Array.isArray(exercise.sets)
          ? exercise.sets.map(set => validateSet(set).value)
          : []
      }))
      : [],
    createdAt: workout.createdAt || new Date().toISOString()
  };
};

// Validate imported data
export const validateImportedData = (data) => {
  const errors = [];
  const validWorkouts = [];

  if (!Array.isArray(data)) {
    return {
      isValid: false,
      errors: ['Imported data must be an array of workouts'],
      validWorkouts: []
    };
  }

  data.forEach((workout, index) => {
    const validation = validateWorkout(workout);

    if (validation.isValid) {
      validWorkouts.push(validation.sanitizedWorkout);
    } else {
      errors.push(`Workout ${index + 1}: ${validation.errors.join(', ')}`);
    }
  });

  return {
    isValid: validWorkouts.length > 0,
    errors,
    validWorkouts,
    totalProcessed: data.length,
    validCount: validWorkouts.length,
    invalidCount: data.length - validWorkouts.length
  };
};

// Validate localStorage data before parsing
export const validateStorageData = (data) => {
  try {
    const parsed = JSON.parse(data);

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, data: { workouts: [] } };
    }

    if (!Array.isArray(parsed.workouts)) {
      return { isValid: false, data: { workouts: [] } };
    }

    // Sanitize all workouts
    const sanitizedWorkouts = parsed.workouts
      .filter(w => w && typeof w === 'object')
      .map(w => sanitizeWorkout(w));

    return {
      isValid: true,
      data: { workouts: sanitizedWorkouts }
    };
  } catch {
    return { isValid: false, data: { workouts: [] } };
  }
};

// Check localStorage quota
export const checkStorageQuota = () => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return { available: true, error: null };
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      return { available: false, error: 'Storage quota exceeded. Please export and clear old data.' };
    }
    return { available: false, error: 'Storage is not available' };
  }
};

