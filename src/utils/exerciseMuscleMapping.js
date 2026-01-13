// ============================================
// EXERCISE → MUSCLE MAPPING (Weighted Distribution)
// ============================================
// Maps exercises to multiple muscle groups with contribution weights
// This replaces binary muscle assignment with realistic distribution

/**
 * Exercise muscle distribution map
 * Each exercise maps to muscle groups with contribution weights (0.0 to 1.0)
 * Weights should sum to ~1.0 for each exercise
 */
export const EXERCISE_MUSCLE_MAP = {
    // ============================================
    // CHEST EXERCISES
    // ============================================
    "Bench Press": { chest: 0.65, shoulders: 0.20, triceps: 0.15 },
    "Incline Bench Press": { chest: 0.60, shoulders: 0.25, triceps: 0.15 },
    "Decline Bench Press": { chest: 0.70, shoulders: 0.15, triceps: 0.15 },
    "Dumbbell Press": { chest: 0.65, shoulders: 0.20, triceps: 0.15 },
    "Incline Dumbbell Press": { chest: 0.60, shoulders: 0.25, triceps: 0.15 },
    "Chest Fly": { chest: 0.85, shoulders: 0.15 },
    "Cable Fly": { chest: 0.85, shoulders: 0.15 },
    "Pec Deck": { chest: 0.90, shoulders: 0.10 },
    "Push Up": { chest: 0.60, shoulders: 0.20, triceps: 0.15, core: 0.05 },
    "Dips": { chest: 0.50, triceps: 0.40, shoulders: 0.10 },

    // ============================================
    // BACK EXERCISES
    // ============================================
    "Deadlift": { back: 0.40, legs: 0.35, core: 0.15, arms: 0.10 },
    "Romanian Deadlift": { back: 0.35, legs: 0.45, core: 0.20 },
    "Pull Up": { back: 0.70, arms: 0.25, shoulders: 0.05 },
    "Chin Up": { back: 0.60, arms: 0.35, shoulders: 0.05 },
    "Lat Pulldown": { back: 0.75, arms: 0.20, shoulders: 0.05 },
    "Barbell Row": { back: 0.70, arms: 0.20, core: 0.10 },
    "Dumbbell Row": { back: 0.70, arms: 0.20, core: 0.10 },
    "T-Bar Row": { back: 0.70, arms: 0.20, core: 0.10 },
    "Cable Row": { back: 0.75, arms: 0.20, shoulders: 0.05 },
    "Face Pull": { back: 0.50, shoulders: 0.50 },
    "Shrug": { back: 0.90, shoulders: 0.10 },
    "Back Extension": { back: 0.60, core: 0.30, legs: 0.10 },

    // ============================================
    // SHOULDER EXERCISES
    // ============================================
    "Overhead Press": { shoulders: 0.70, triceps: 0.20, core: 0.10 },
    "Military Press": { shoulders: 0.70, triceps: 0.20, core: 0.10 },
    "Shoulder Press": { shoulders: 0.70, triceps: 0.20, core: 0.10 },
    "Arnold Press": { shoulders: 0.75, triceps: 0.15, core: 0.10 },
    "Lateral Raise": { shoulders: 0.95, back: 0.05 },
    "Front Raise": { shoulders: 0.90, chest: 0.10 },
    "Rear Delt Fly": { shoulders: 0.80, back: 0.20 },
    "Upright Row": { shoulders: 0.70, back: 0.20, arms: 0.10 },

    // ============================================
    // LEG EXERCISES
    // ============================================
    "Squat": { legs: 0.70, core: 0.20, back: 0.10 },
    "Front Squat": { legs: 0.65, core: 0.25, back: 0.10 },
    "Back Squat": { legs: 0.70, core: 0.20, back: 0.10 },
    "Hack Squat": { legs: 0.85, core: 0.15 },
    "Leg Press": { legs: 0.95, core: 0.05 },
    "Lunge": { legs: 0.85, core: 0.15 },
    "Bulgarian Split Squat": { legs: 0.85, core: 0.15 },
    "Leg Extension": { legs: 1.0 },
    "Leg Curl": { legs: 1.0 },
    "Hamstring Curl": { legs: 1.0 },
    "Calf Raise": { legs: 1.0 },
    "Standing Calf Raise": { legs: 1.0 },
    "Seated Calf Raise": { legs: 1.0 },

    // ============================================
    // ARM EXERCISES
    // ============================================
    "Bicep Curl": { arms: 1.0 },
    "Barbell Curl": { arms: 1.0 },
    "Dumbbell Curl": { arms: 1.0 },
    "Hammer Curl": { arms: 1.0 },
    "Preacher Curl": { arms: 1.0 },
    "Concentration Curl": { arms: 1.0 },
    "Cable Curl": { arms: 1.0 },
    "Tricep Extension": { arms: 1.0 },
    "Skull Crusher": { arms: 1.0 },
    "Tricep Pushdown": { arms: 1.0 },
    "Overhead Tricep Extension": { arms: 0.95, shoulders: 0.05 },
    "Close Grip Bench Press": { triceps: 0.60, chest: 0.30, shoulders: 0.10 },

    // ============================================
    // CORE EXERCISES
    // ============================================
    "Plank": { core: 0.90, shoulders: 0.10 },
    "Side Plank": { core: 1.0 },
    "Crunch": { core: 1.0 },
    "Sit Up": { core: 0.90, legs: 0.10 },
    "Russian Twist": { core: 1.0 },
    "Leg Raise": { core: 0.90, legs: 0.10 },
    "Hanging Leg Raise": { core: 0.85, arms: 0.15 },
    "Mountain Climber": { core: 0.70, shoulders: 0.15, legs: 0.15 },
    "Ab Wheel": { core: 0.80, shoulders: 0.20 },
    "Cable Crunch": { core: 1.0 },
    "Oblique Crunch": { core: 1.0 },
};

/**
 * Fallback muscle detection based on exercise name keywords
 * Used when exercise is not in the main map
 */
const MUSCLE_KEYWORDS = {
    chest: ['bench', 'chest', 'pec', 'fly', 'press'],
    back: ['pull', 'row', 'lat', 'deadlift', 'shrug'],
    shoulders: ['shoulder', 'press', 'raise', 'delt'],
    legs: ['squat', 'leg', 'lunge', 'calf'],
    arms: ['curl', 'tricep', 'bicep'],
    core: ['plank', 'crunch', 'ab', 'core'],
    cardio: ['run', 'walk', 'bike', 'swim', 'treadmill', 'elliptical']
};

/**
 * Get muscle distribution for an exercise
 * @param {string} exerciseName - Name of the exercise
 * @param {string} category - Exercise category (fallback)
 * @returns {Object} Muscle distribution { muscle: weight }
 */
export function getExerciseMuscleDistribution(exerciseName, category = null) {
    // Try exact match first
    if (EXERCISE_MUSCLE_MAP[exerciseName]) {
        return EXERCISE_MUSCLE_MAP[exerciseName];
    }

    // Try case-insensitive match
    const lowerName = exerciseName.toLowerCase();
    for (const [exercise, distribution] of Object.entries(EXERCISE_MUSCLE_MAP)) {
        if (exercise.toLowerCase() === lowerName) {
            return distribution;
        }
    }

    // Try partial match (e.g., "Barbell Bench Press" matches "Bench Press")
    for (const [exercise, distribution] of Object.entries(EXERCISE_MUSCLE_MAP)) {
        if (lowerName.includes(exercise.toLowerCase())) {
            return distribution;
        }
    }

    // Fallback to keyword detection
    for (const [muscle, keywords] of Object.entries(MUSCLE_KEYWORDS)) {
        if (keywords.some(keyword => lowerName.includes(keyword))) {
            return { [muscle]: 1.0 };
        }
    }

    // Last resort: use category
    if (category) {
        return { [category]: 1.0 };
    }

    // Unknown exercise
    return { other: 1.0 };
}

/**
 * Calculate weighted muscle sets for a workout
 * Replaces binary muscle assignment with realistic distribution
 * @param {Object} workout - Workout object with exercises
 * @returns {Object} Muscle sets { muscle: weightedSets }
 */
export function calculateWeightedMuscleSets(workout) {
    const muscleSets = {};

    if (!workout?.exercises) return muscleSets;

    workout.exercises.forEach(exercise => {
        const distribution = getExerciseMuscleDistribution(
            exercise.name,
            exercise.category
        );

        const totalSets = exercise.sets?.length || 0;

        // Distribute sets across muscles based on weights
        Object.entries(distribution).forEach(([muscle, weight]) => {
            muscleSets[muscle] = (muscleSets[muscle] || 0) + (totalSets * weight);
        });
    });

    return muscleSets;
}

/**
 * Detect all muscle groups involved in a workout
 * @param {Object} workout - Workout object
 * @returns {Array<string>} List of muscle groups
 */
export function detectMuscleGroupsWeighted(workout) {
    const muscleSets = calculateWeightedMuscleSets(workout);

    // Only include muscles with significant contribution (>0.5 sets)
    return Object.entries(muscleSets)
        .filter(([_, sets]) => sets >= 0.5)
        .map(([muscle, _]) => muscle);
}
