// ============================================
// INTENSITY CLASSIFICATION & SYSTEMIC STRESS
// ============================================
// Classifies exercises by intensity (compound vs isolation)
// Calculates systemic (CNS) stress separate from local muscle fatigue

import { differenceInDays } from 'date-fns';

/**
 * Exercise intensity classifications
 */
export const INTENSITY_LEVELS = {
    HIGH_COMPOUND: 'high_compound',     // Heavy compounds (squat, deadlift, etc.)
    MODERATE_COMPOUND: 'moderate_compound', // Moderate compounds (dips, pull-ups, etc.)
    ISOLATION: 'isolation'               // Isolation exercises
};

/**
 * High compound exercises (highest CNS demand)
 */
const HIGH_COMPOUND_EXERCISES = [
    'squat', 'deadlift', 'bench press', 'overhead press',
    'military press', 'clean', 'snatch', 'front squat',
    'back squat', 'power clean'
];

/**
 * Moderate compound exercises
 */
const MODERATE_COMPOUND_EXERCISES = [
    'lunge', 'dip', 'pull up', 'chin up',
    'row', 'push up', 'bulgarian split squat',
    'leg press', 'hack squat'
];

/**
 * Isolation exercise keywords
 */
const ISOLATION_KEYWORDS = [
    'curl', 'extension', 'raise', 'fly',
    'cable', 'machine', 'pec deck', 'leg extension',
    'leg curl', 'calf raise'
];

/**
 * Intensity multipliers for fatigue calculation
 */
export const INTENSITY_MULTIPLIERS = {
    high_compound: 1.5,      // 50% more fatiguing
    moderate_compound: 1.2,  // 20% more fatiguing
    isolation: 1.0           // Baseline
};

/**
 * Classify exercise by intensity level
 * @param {string} exerciseName - Name of the exercise
 * @returns {string} Intensity level
 */
export function classifyExerciseIntensity(exerciseName) {
    const lowerName = exerciseName.toLowerCase();

    // Check high compounds first
    if (HIGH_COMPOUND_EXERCISES.some(keyword => lowerName.includes(keyword))) {
        return INTENSITY_LEVELS.HIGH_COMPOUND;
    }

    // Check moderate compounds
    if (MODERATE_COMPOUND_EXERCISES.some(keyword => lowerName.includes(keyword))) {
        return INTENSITY_LEVELS.MODERATE_COMPOUND;
    }

    // Check isolation keywords
    if (ISOLATION_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
        return INTENSITY_LEVELS.ISOLATION;
    }

    // Default to moderate compound if unclear
    return INTENSITY_LEVELS.MODERATE_COMPOUND;
}

/**
 * Get intensity multiplier for an exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {number} Multiplier (1.0 to 1.5)
 */
export function getIntensityMultiplier(exerciseName) {
    const intensityLevel = classifyExerciseIntensity(exerciseName);
    return INTENSITY_MULTIPLIERS[intensityLevel];
}

/**
 * Check if exercise is a high compound
 * @param {string} exerciseName - Name of the exercise
 * @returns {boolean} True if high compound
 */
export function isHighCompound(exerciseName) {
    return classifyExerciseIntensity(exerciseName) === INTENSITY_LEVELS.HIGH_COMPOUND;
}

/**
 * Calculate compound ratio for a workout
 * @param {Object} workout - Workout object
 * @returns {number} Ratio of compound sets to total sets (0.0 to 1.0)
 */
export function calculateCompoundRatio(workout) {
    if (!workout?.exercises || workout.exercises.length === 0) return 0;

    let compoundSets = 0;
    let totalSets = 0;

    workout.exercises.forEach(exercise => {
        const sets = exercise.sets?.length || 0;
        totalSets += sets;

        const intensity = classifyExerciseIntensity(exercise.name);
        if (intensity === INTENSITY_LEVELS.HIGH_COMPOUND ||
            intensity === INTENSITY_LEVELS.MODERATE_COMPOUND) {
            compoundSets += sets;
        }
    });

    return totalSets > 0 ? compoundSets / totalSets : 0;
}

/**
 * Calculate systemic (CNS) stress for a workout
 * Separate from local muscle fatigue
 * @param {Object} workout - Workout object
 * @returns {number} Systemic stress score (0-100)
 */
export function calculateSystemicStress(workout) {
    if (!workout?.exercises || workout.exercises.length === 0) return 0;

    let systemicStress = 0;

    // Factor 1: Compound exercise ratio
    const compoundRatio = calculateCompoundRatio(workout);

    // Factor 2: Total sets
    const totalSets = workout.exercises.reduce((sum, ex) =>
        sum + (ex.sets?.length || 0), 0
    );

    // Factor 3: Intensity (if RIR available, otherwise assume moderate)
    // For now, assume moderate intensity (multiplier = 1.0)
    // TODO: Update when RIR tracking is added
    const intensityMultiplier = 1.0;

    // Factor 4: Duration
    const duration = workout.duration || 60; // Default 60 min if not tracked
    const durationFactor = duration > 90 ? 1.3 : 1.0;

    // Factor 5: Volume
    const volumeFactor = totalSets > 25 ? 1.2 : 1.0;

    // Calculate systemic stress
    // Base: 2 points per set
    // Weighted by compound ratio (more compounds = more CNS stress)
    // Adjusted by other factors
    systemicStress = Math.min(100,
        totalSets * 2 *
        (0.5 + compoundRatio) * // 0.5-1.5x based on compound ratio
        intensityMultiplier *
        durationFactor *
        volumeFactor
    );

    return Math.round(systemicStress);
}

/**
 * Calculate average intensity for a workout
 * @param {Object} workout - Workout object
 * @returns {number} Average intensity multiplier
 */
export function calculateAvgIntensity(workout) {
    if (!workout?.exercises || workout.exercises.length === 0) return 1.0;

    let totalWeightedSets = 0;
    let totalSets = 0;

    workout.exercises.forEach(exercise => {
        const sets = exercise.sets?.length || 0;
        const multiplier = getIntensityMultiplier(exercise.name);

        totalWeightedSets += sets * multiplier;
        totalSets += sets;
    });

    return totalSets > 0 ? totalWeightedSets / totalSets : 1.0;
}

/**
 * Get systemic readiness based on recent workouts
 * @param {Array} workouts - Array of workout objects
 * @param {number} daysToConsider - Number of days to look back (default: 7)
 * @returns {number} Readiness score (0-100)
 */
export function getSystemicReadiness(workouts, daysToConsider = 7) {
    if (!workouts || workouts.length === 0) return 100;

    const today = new Date();

    // Get recent workouts
    const recentWorkouts = workouts.filter(w => {
        const daysSince = differenceInDays(today, new Date(w.date));
        return daysSince <= daysToConsider && w.type !== 'rest_day';
    });

    if (recentWorkouts.length === 0) return 100;

    // Calculate total systemic stress with decay
    let totalStress = 0;

    recentWorkouts.forEach(workout => {
        const daysSince = differenceInDays(today, new Date(workout.date));
        const workoutStress = calculateSystemicStress(workout);

        // Decay: 20% per day
        const decayFactor = Math.pow(0.8, daysSince);
        totalStress += workoutStress * decayFactor;
    });

    // Convert stress to readiness (inverse)
    // Max accumulated stress over 7 days: ~300 (very high)
    const readiness = Math.max(0, 100 - (totalStress / 3));

    return Math.round(readiness);
}

/**
 * Get workout intensity classification
 * @param {Object} workout - Workout object
 * @returns {Object} Classification with label and color
 */
export function getWorkoutIntensityClassification(workout) {
    const systemicStress = calculateSystemicStress(workout);

    if (systemicStress >= 70) {
        return { level: 'very_high', label: 'Very High', color: 'red', emoji: '🔥' };
    } else if (systemicStress >= 50) {
        return { level: 'high', label: 'High', color: 'orange', emoji: '💪' };
    } else if (systemicStress >= 30) {
        return { level: 'moderate', label: 'Moderate', color: 'yellow', emoji: '⚡' };
    } else {
        return { level: 'low', label: 'Low', color: 'green', emoji: '✅' };
    }
}
