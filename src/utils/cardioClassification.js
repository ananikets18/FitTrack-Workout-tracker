// ============================================
// CARDIO CLASSIFICATION SYSTEM
// ============================================
// Classifies cardio exercises by intensity type (LISS/MISS/HIIT)
// and applies appropriate stress multipliers

/**
 * Cardio intensity types
 */
export const CARDIO_TYPES = {
    LISS: 'LISS', // Low Intensity Steady State
    MISS: 'MISS', // Moderate Intensity Steady State
    HIIT: 'HIIT'  // High Intensity Interval Training
};

/**
 * Cardio exercise classification by type
 */
const CARDIO_CLASSIFICATION = {
    // LISS - Low intensity, long duration
    LISS: [
        'walk', 'walking', 'light jog', 'slow jog',
        'bike', 'cycling', 'stationary bike',
        'elliptical', 'swim', 'swimming',
        'yoga', 'stretching', 'mobility'
    ],

    // MISS - Moderate intensity
    MISS: [
        'jog', 'jogging', 'run', 'running',
        'rowing', 'rower', 'stair climber',
        'moderate cycling', 'moderate swim'
    ],

    // HIIT - High intensity intervals
    HIIT: [
        'sprint', 'sprinting', 'interval',
        'hiit', 'tabata', 'burpee',
        'jump rope', 'battle rope',
        'sled push', 'prowler'
    ]
};

/**
 * Stress multipliers for each cardio type
 * Lower multiplier = less systemic fatigue
 */
export const CARDIO_STRESS_MULTIPLIERS = {
    LISS: 0.3,  // Very low stress
    MISS: 0.6,  // Moderate stress
    HIIT: 1.0   // High stress (same as strength training)
};

/**
 * Detect cardio type from exercise name
 * @param {string} exerciseName - Name of the cardio exercise
 * @returns {string} Cardio type (LISS, MISS, or HIIT)
 */
export function detectCardioType(exerciseName) {
    const lowerName = exerciseName.toLowerCase();

    // Check HIIT first (most specific)
    if (CARDIO_CLASSIFICATION.HIIT.some(keyword => lowerName.includes(keyword))) {
        return CARDIO_TYPES.HIIT;
    }

    // Check MISS
    if (CARDIO_CLASSIFICATION.MISS.some(keyword => lowerName.includes(keyword))) {
        return CARDIO_TYPES.MISS;
    }

    // Check LISS
    if (CARDIO_CLASSIFICATION.LISS.some(keyword => lowerName.includes(keyword))) {
        return CARDIO_TYPES.LISS;
    }

    // Default to MISS if categorized as cardio but type unclear
    return CARDIO_TYPES.MISS;
}

/**
 * Check if exercise is cardio
 * @param {Object} exercise - Exercise object
 * @returns {boolean} True if cardio exercise
 */
export function isCardioExercise(exercise) {
    if (exercise.category === 'cardio') return true;

    const lowerName = exercise.name.toLowerCase();
    const allCardioKeywords = [
        ...CARDIO_CLASSIFICATION.LISS,
        ...CARDIO_CLASSIFICATION.MISS,
        ...CARDIO_CLASSIFICATION.HIIT
    ];

    return allCardioKeywords.some(keyword => lowerName.includes(keyword));
}

/**
 * Get stress multiplier for a cardio exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {number} Stress multiplier (0.3 to 1.0)
 */
export function getCardioStressMultiplier(exerciseName) {
    const cardioType = detectCardioType(exerciseName);
    return CARDIO_STRESS_MULTIPLIERS[cardioType];
}

/**
 * Calculate cardio stress score
 * Uses duration and type multiplier
 * For treadmill: also accounts for incline and speed
 * @param {Object} exercise - Cardio exercise object
 * @returns {number} Stress score
 */
export function calculateCardioStress(exercise) {
    if (!isCardioExercise(exercise)) return 0;

    // Check if this is a treadmill exercise
    const isTreadmill = exercise.name.toLowerCase().includes('treadmill');

    if (isTreadmill) {
        // For treadmill, use duration field and apply incline/speed multipliers
        let totalStress = 0;

        exercise.sets?.forEach(set => {
            const duration = set.duration || 0;
            const incline = set.incline || 0;
            const speed = set.speed || 0;

            // Base stress from duration
            let setStress = duration;

            // Apply incline multiplier (each 2% incline adds 10% difficulty)
            // Example: 0% = 1.0x, 4% = 1.2x, 8% = 1.4x, 12% = 1.6x
            const inclineMultiplier = 1 + (incline * 0.05);

            // Apply speed multiplier (higher speed = more intensity)
            // Walking (3-5 km/h) = 0.8x, Jogging (6-8 km/h) = 1.0x, Running (9+ km/h) = 1.2x+
            let speedMultiplier = 1.0;
            if (speed < 5) {
                speedMultiplier = 0.8; // Walking
            } else if (speed >= 5 && speed < 9) {
                speedMultiplier = 1.0; // Jogging
            } else if (speed >= 9) {
                speedMultiplier = 1.0 + ((speed - 9) * 0.05); // Running, increases with speed
            }

            setStress = setStress * inclineMultiplier * speedMultiplier;
            totalStress += setStress;
        });

        return totalStress;
    } else {
        // For regular cardio, use duration field if available, otherwise fall back to reps
        const duration = exercise.sets?.reduce((sum, set) => sum + (set.duration || set.reps || 0), 0) || 0;
        const typeMultiplier = getCardioStressMultiplier(exercise.name);

        // Base stress: 1 point per minute
        // Adjusted by type multiplier
        return duration * typeMultiplier;
    }
}

/**
 * Get cardio type label with emoji
 * @param {string} cardioType - LISS, MISS, or HIIT
 * @returns {string} Formatted label
 */
export function getCardioTypeLabel(cardioType) {
    const labels = {
        LISS: '🚶 LISS (Low Intensity)',
        MISS: '🏃 MISS (Moderate)',
        HIIT: '⚡ HIIT (High Intensity)'
    };
    return labels[cardioType] || cardioType;
}

/**
 * Classify all cardio exercises in a workout
 * @param {Object} workout - Workout object
 * @returns {Object} Cardio breakdown { LISS: count, MISS: count, HIIT: count }
 */
export function classifyWorkoutCardio(workout) {
    const breakdown = {
        LISS: 0,
        MISS: 0,
        HIIT: 0,
        totalDuration: 0,
        totalStress: 0
    };

    if (!workout?.exercises) return breakdown;

    workout.exercises.forEach(exercise => {
        if (isCardioExercise(exercise)) {
            const cardioType = detectCardioType(exercise.name);
            // Use duration field if available, otherwise fall back to reps (for backward compatibility)
            const duration = exercise.sets?.reduce((sum, set) => sum + (set.duration || set.reps || 0), 0) || 0;
            const stress = calculateCardioStress(exercise);

            breakdown[cardioType]++;
            breakdown.totalDuration += duration;
            breakdown.totalStress += stress;
        }
    });

    return breakdown;
}

/**
 * Check if workout is cardio-dominant
 * @param {Object} workout - Workout object
 * @returns {boolean} True if >50% of exercises are cardio
 */
export function isCardioDominant(workout) {
    if (!workout?.exercises || workout.exercises.length === 0) return false;

    const cardioCount = workout.exercises.filter(ex => isCardioExercise(ex)).length;
    const totalCount = workout.exercises.length;

    return (cardioCount / totalCount) > 0.5;
}
