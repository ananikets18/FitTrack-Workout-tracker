// ============================================
// APPLICATION CONSTANTS
// ============================================

// Water Intake
export const WATER_INTAKE = {
    DAILY_GOAL_ML: 4000,
    SMALL_GLASS_ML: 300,
    LARGE_GLASS_ML: 480,
    BOTTLE_ML: 600,
    GYM_BOTTLE_ML: 750,
    UNDO_AMOUNT_ML: 300,
};

// Activity Points Multipliers
export const ACTIVITY_POINTS = {
    WEIGHT_TRAINING_MULTIPLIER: 1.0,
    CARDIO_DURATION_MULTIPLIER: 10,
    BODYWEIGHT_MULTIPLIER: 2,
};

// Validation Limits
export const VALIDATION = {
    WORKOUT_NAME_MAX_LENGTH: 100,
    DURATION_MIN: 0,
    DURATION_MAX: 999,
    TREADMILL_INCLINE_MIN: 0,
    TREADMILL_INCLINE_MAX: 15,
    TREADMILL_SPEED_MIN: 0,
    TREADMILL_SPEED_MAX: 25,
    REPS_MIN: 0,
    REPS_MAX: 999,
    WEIGHT_MIN: 0,
    WEIGHT_MAX: 9999,
    CARDIO_DURATION_MIN: 0,
    CARDIO_DURATION_MAX: 999,
};

// Rest Timer
export const REST_TIMER = {
    DEFAULT_DURATION_SECONDS: 90,
    MIN_DURATION_SECONDS: 30,
    MAX_DURATION_SECONDS: 300,
};

// Streak Calculation
export const STREAK = {
    MAX_REST_DAYS_ALLOWED: 1,
};

// Pagination
export const PAGINATION = {
    WORKOUTS_PER_PAGE: 20,
    EXERCISES_AUTOCOMPLETE_LIMIT: 8,
    RECENT_WORKOUTS_LIMIT: 3,
    AI_PREDICTIONS_LIMIT: 50,
};

// Toast Durations (milliseconds)
export const TOAST_DURATION = {
    SHORT: 1500,
    DEFAULT: 2000,
    LONG: 3000,
};

// Animation Delays (milliseconds)
export const ANIMATION = {
    STAGGER_DELAY: 100,
    CARD_DELAY: 100,
    TRANSITION_DURATION: 500,
};

// Recovery Quality Scale
export const RECOVERY = {
    MIN_QUALITY: 1,
    MAX_QUALITY: 5,
    DEFAULT_QUALITY: 3,
};

// Readiness Score
export const READINESS = {
    DAYS_TO_CONSIDER: 7,
};

// API Timeouts (milliseconds)
export const API = {
    DEFAULT_TIMEOUT: 30000,
    SHORT_TIMEOUT: 10000,
};

// Storage Quota
export const STORAGE = {
    WARNING_THRESHOLD_PERCENT: 80,
};

// Workout Types
export const WORKOUT_TYPES = {
    REGULAR: 'workout',
    REST_DAY: 'rest_day',
};

// Exercise Categories
export const EXERCISE_CATEGORIES = [
    'chest',
    'back',
    'shoulders',
    'legs',
    'arms',
    'core',
    'cardio',
    'other',
];

// Muscle Colors for UI
export const MUSCLE_COLORS = {
    chest: 'bg-red-500/30 border border-red-400/50',
    back: 'bg-blue-500/30 border border-blue-400/50',
    legs: 'bg-green-500/30 border border-green-400/50',
    shoulders: 'bg-yellow-500/30 border border-yellow-400/50',
    arms: 'bg-purple-500/30 border border-purple-400/50',
    core: 'bg-orange-500/30 border border-orange-400/50',
    cardio: 'bg-pink-500/30 border border-pink-400/50',
};

// Default Set Values
export const DEFAULT_SET = {
    REPS: 10,
    WEIGHT: 0,
    CARDIO_DURATION: 30,
    TREADMILL_INCLINE: 0,
    TREADMILL_SPEED: 0,
    COMPLETED: false,
};
