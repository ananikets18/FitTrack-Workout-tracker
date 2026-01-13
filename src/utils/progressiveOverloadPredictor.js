import { differenceInDays } from 'date-fns';
import { getSystemicReadiness } from './intensityClassification';

// ============================================
// PROGRESSIVE OVERLOAD PREDICTOR
// ============================================
// Analyzes workout history to predict when and how to increase weights/reps

// Standard weight increments (in kg)
const WEIGHT_INCREMENTS = {
    small: 1.25,  // For isolation exercises, upper body accessories
    medium: 2.5,  // For most exercises
    large: 5.0    // For compound lower body exercises
};

// Exercise categories for increment selection
const EXERCISE_CATEGORIES = {
    smallIncrement: ['curl', 'lateral raise', 'front raise', 'tricep extension', 'cable fly', 'face pull'],
    largeIncrement: ['squat', 'deadlift', 'leg press', 'hack squat'],
    // Everything else uses medium increment
};

// Determine appropriate weight increment for an exercise
const getWeightIncrement = (exerciseName) => {
    const lowerName = exerciseName.toLowerCase();

    if (EXERCISE_CATEGORIES.smallIncrement.some(keyword => lowerName.includes(keyword))) {
        return WEIGHT_INCREMENTS.small;
    }

    if (EXERCISE_CATEGORIES.largeIncrement.some(keyword => lowerName.includes(keyword))) {
        return WEIGHT_INCREMENTS.large;
    }

    return WEIGHT_INCREMENTS.medium;
};

// Analyze exercise progression history
export const analyzeExerciseProgression = (exerciseName, workouts) => {
    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

    // Find all instances of this exercise
    const exerciseHistory = [];

    regularWorkouts.forEach(workout => {
        const exercise = workout.exercises?.find(ex => ex.name === exerciseName);
        if (exercise) {
            const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
            const totalReps = exercise.sets.reduce((sum, s) => sum + (s.reps || 0), 0);
            const avgReps = totalReps / exercise.sets.length;
            const totalSets = exercise.sets.length;

            exerciseHistory.push({
                date: new Date(workout.date),
                maxWeight,
                totalReps,
                avgReps,
                totalSets,
                sets: exercise.sets
            });
        }
    });

    // Sort by date (oldest first)
    exerciseHistory.sort((a, b) => a.date - b.date);

    if (exerciseHistory.length < 2) {
        return {
            status: 'insufficient_data',
            message: 'Need at least 2 sessions to analyze progression',
            history: exerciseHistory
        };
    }

    return {
        status: 'analyzed',
        history: exerciseHistory,
        totalSessions: exerciseHistory.length
    };
};

// Check if user is ready for progressive overload (ENHANCED - considers systemic readiness)
export const checkOverloadReadiness = (exerciseName, workouts) => {
    const analysis = analyzeExerciseProgression(exerciseName, workouts);

    if (analysis.status === 'insufficient_data') {
        return {
            ready: false,
            reason: analysis.message,
            suggestion: null
        };
    }

    // NEW: Check systemic readiness before recommending increases
    const systemicReadiness = getSystemicReadiness(workouts, 7);

    const { history } = analysis;
    const recent = history.slice(-3); // Last 3 sessions

    if (recent.length < 2) {
        return {
            ready: false,
            reason: 'Need at least 2 recent sessions',
            suggestion: null
        };
    }

    // Check if weight has been consistent
    const currentWeight = recent[recent.length - 1].maxWeight;
    const consistentWeight = recent.every(session => session.maxWeight === currentWeight);

    if (!consistentWeight) {
        return {
            ready: false,
            reason: 'Weight is still fluctuating - maintain current weight',
            suggestion: {
                action: 'maintain',
                currentWeight,
                message: 'Focus on consistency before increasing weight'
            }
        };
    }

    // Check if reps are consistently high
    const avgRepsRecent = recent.reduce((sum, s) => sum + s.avgReps, 0) / recent.length;
    const targetReps = 8; // Standard hypertrophy range lower bound
    const upperReps = 12; // Upper bound

    // Check if all sets are being completed successfully
    const allSetsCompleted = recent.every(session => {
        return session.sets.every(set => set.reps >= targetReps);
    });

    // Calculate days since last session
    const daysSinceLastSession = differenceInDays(new Date(), recent[recent.length - 1].date);

    // READY FOR WEIGHT INCREASE (with systemic readiness check)
    if (allSetsCompleted && avgRepsRecent >= upperReps) {
        const increment = getWeightIncrement(exerciseName);
        const newWeight = currentWeight + increment;

        // NEW: Adjust confidence based on systemic readiness
        let confidence = 95;
        let message = `Increase to ${newWeight}kg (${currentWeight}kg + ${increment}kg)`;

        if (systemicReadiness < 50) {
            confidence = 60;
            message += ` - Consider waiting for better recovery (readiness: ${systemicReadiness}/100)`;
        } else if (systemicReadiness < 70) {
            confidence = 80;
            message += ` - Moderate readiness (${systemicReadiness}/100)`;
        } else {
            message += ` - Excellent readiness (${systemicReadiness}/100)`;
        }

        return {
            ready: systemicReadiness >= 50, // Only recommend if readiness is decent
            reason: `Consistently completing ${Math.round(avgRepsRecent)} reps - ready to progress!`,
            suggestion: {
                action: 'increase_weight',
                currentWeight,
                newWeight,
                increment,
                message,
                confidence,
                systemicReadiness
            }
        };
    }

    // READY FOR REP INCREASE
    if (allSetsCompleted && avgRepsRecent >= targetReps && avgRepsRecent < upperReps) {
        return {
            ready: true,
            reason: 'All sets completed - add more reps before increasing weight',
            suggestion: {
                action: 'increase_reps',
                currentWeight,
                currentReps: Math.round(avgRepsRecent),
                targetReps: upperReps,
                message: `Aim for ${upperReps} reps per set at ${currentWeight}kg`,
                confidence: 85,
                systemicReadiness
            }
        };
    }

    // STRUGGLING - CONSIDER DELOAD (enhanced with readiness check)
    const strugglingRecently = recent.slice(-2).some(session => {
        return session.sets.some(set => set.reps < targetReps);
    });

    if (strugglingRecently && daysSinceLastSession <= 7) {
        const deloadWeight = Math.round(currentWeight * 0.9); // 10% reduction

        // If low readiness, strongly recommend deload
        const confidence = systemicReadiness < 60 ? 90 : 75;
        const message = systemicReadiness < 60
            ? `Deload to ${deloadWeight}kg (90% of current) - Low readiness (${systemicReadiness}/100) suggests recovery needed`
            : `Deload to ${deloadWeight}kg (90% of current) for 1-2 weeks`;

        return {
            ready: false,
            reason: 'Struggling with current weight - consider deload',
            suggestion: {
                action: 'deload',
                currentWeight,
                deloadWeight,
                message,
                confidence,
                systemicReadiness
            }
        };
    }

    // MAINTAIN CURRENT WEIGHT
    return {
        ready: false,
        reason: 'Keep working at current weight',
        suggestion: {
            action: 'maintain',
            currentWeight,
            message: `Continue with ${currentWeight}kg - focus on form and consistency`,
            confidence: 70,
            systemicReadiness
        }
    };
};

// Get progressive overload recommendations for entire workout
export const getWorkoutOverloadRecommendations = (workout, workoutHistory) => {
    if (!workout?.exercises) return [];

    const recommendations = [];

    workout.exercises.forEach(exercise => {
        const readiness = checkOverloadReadiness(exercise.name, workoutHistory);

        if (readiness.suggestion) {
            recommendations.push({
                exerciseName: exercise.name,
                ...readiness
            });
        }
    });

    // Sort by confidence (highest first)
    recommendations.sort((a, b) => {
        const confA = a.suggestion?.confidence || 0;
        const confB = b.suggestion?.confidence || 0;
        return confB - confA;
    });

    return recommendations;
};

// Predict 1RM (One Rep Max) using Epley formula
export const predict1RM = (weight, reps) => {
    if (reps === 1) return weight;
    if (reps > 12) return null; // Formula less accurate above 12 reps

    // Epley Formula: 1RM = weight × (1 + reps/30)
    return Math.round(weight * (1 + reps / 30));
};

// Get exercise strength level based on 1RM
export const getStrengthLevel = (exerciseName, estimated1RM, bodyWeight = 75) => {
    const lowerName = exerciseName.toLowerCase();

    // Strength standards (ratio to bodyweight)
    const standards = {
        'bench press': { beginner: 0.5, intermediate: 1.0, advanced: 1.5, elite: 2.0 },
        'squat': { beginner: 0.75, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
        'deadlift': { beginner: 1.0, intermediate: 1.75, advanced: 2.5, elite: 3.0 },
        'overhead press': { beginner: 0.35, intermediate: 0.75, advanced: 1.0, elite: 1.5 }
    };

    // Find matching standard
    let standard = null;
    for (const [exercise, levels] of Object.entries(standards)) {
        if (lowerName.includes(exercise)) {
            standard = levels;
            break;
        }
    }

    if (!standard) return null;

    const ratio = estimated1RM / bodyWeight;

    if (ratio >= standard.elite) return { level: 'Elite', ratio, color: 'purple' };
    if (ratio >= standard.advanced) return { level: 'Advanced', ratio, color: 'blue' };
    if (ratio >= standard.intermediate) return { level: 'Intermediate', ratio, color: 'green' };
    if (ratio >= standard.beginner) return { level: 'Beginner', ratio, color: 'yellow' };
    return { level: 'Novice', ratio, color: 'gray' };
};

// Track deload cycles
export const shouldDeload = (exerciseName, workouts) => {
    const analysis = analyzeExerciseProgression(exerciseName, workouts);

    if (analysis.status === 'insufficient_data') return false;

    const { history } = analysis;

    // Check if stuck at same weight for 4+ sessions
    const recent = history.slice(-4);
    if (recent.length < 4) return false;

    const sameWeight = recent.every(s => s.maxWeight === recent[0].maxWeight);
    const notProgressing = recent.every(s => s.avgReps <= recent[0].avgReps);

    if (sameWeight && notProgressing) {
        return {
            shouldDeload: true,
            reason: 'Plateau detected - no progress in last 4 sessions',
            recommendation: 'Take a deload week (reduce weight by 10-20%)'
        };
    }

    // Check for consistent volume over 6+ weeks (42 days)
    const oldestSession = history[0];
    const daysSinceStart = differenceInDays(new Date(), oldestSession.date);

    if (daysSinceStart >= 42 && history.length >= 8) {
        return {
            shouldDeload: true,
            reason: '6+ weeks of training - scheduled deload recommended',
            recommendation: 'Deload week to prevent overtraining and promote recovery'
        };
    }

    return { shouldDeload: false };
};
