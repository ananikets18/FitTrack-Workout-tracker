import { differenceInDays } from 'date-fns';
import { detectMuscleGroups } from './smartRecommendations';
import { checkOverloadReadiness } from './progressiveOverloadPredictor';

// ============================================
// WORKOUT PREDICTION ENGINE
// ============================================
// Analyzes workout history and predicts the next optimal workout

/**
 * Analyze last N days of workout data
 * @param {Array} workouts - All workout history
 * @param {number} days - Number of days to analyze (default: 10)
 * @returns {Object} Analysis of workout patterns
 */
export const analyzeWorkoutHistory = (workouts, days = 10) => {
    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

    // Get workouts from last N days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentWorkouts = regularWorkouts.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate >= cutoffDate;
    });

    if (recentWorkouts.length === 0) {
        return {
            status: 'insufficient_data',
            message: `No workouts found in the last ${days} days`,
            workouts: []
        };
    }

    // Analyze patterns
    const exerciseFrequency = {};
    const muscleGroupFrequency = {};
    const exerciseProgression = {};

    recentWorkouts.forEach(workout => {
        // Track muscle groups
        const muscles = detectMuscleGroups(workout);
        muscles.forEach(muscle => {
            muscleGroupFrequency[muscle] = (muscleGroupFrequency[muscle] || 0) + 1;
        });

        // Track exercises and their progression
        workout.exercises?.forEach(exercise => {
            const name = exercise.name;

            if (!exerciseFrequency[name]) {
                exerciseFrequency[name] = 0;
                exerciseProgression[name] = [];
            }

            exerciseFrequency[name]++;

            // Track sets, reps, and weights
            exercise.sets.forEach(set => {
                exerciseProgression[name].push({
                    date: workout.date,
                    reps: set.reps || 0,
                    weight: set.weight || 0,
                    duration: set.duration || null
                });
            });
        });
    });

    return {
        status: 'analyzed',
        totalWorkouts: recentWorkouts.length,
        workouts: recentWorkouts,
        exerciseFrequency,
        muscleGroupFrequency,
        exerciseProgression,
        daysCovered: days
    };
};

/**
 * Predict the next workout based on history
 * @param {Array} workouts - All workout history
 * @param {number} analyzeDays - Number of days to analyze
 * @returns {Object} Prediction with exercises, sets, reps, weights
 */
export const predictNextWorkout = (workouts, analyzeDays = 10) => {
    const analysis = analyzeWorkoutHistory(workouts, analyzeDays);

    if (analysis.status === 'insufficient_data') {
        return {
            success: false,
            reason: analysis.message,
            prediction: null
        };
    }

    const { workouts: recentWorkouts, muscleGroupFrequency, exerciseProgression } = analysis;

    // Determine which muscle groups need training
    const muscleRecoveryStatus = {};
    const today = new Date();

    Object.keys(muscleGroupFrequency).forEach(muscle => {
        // Find last time this muscle was trained
        let lastTrained = null;

        for (const workout of recentWorkouts) {
            const muscles = detectMuscleGroups(workout);
            if (muscles.includes(muscle)) {
                const workoutDate = new Date(workout.date);
                if (!lastTrained || workoutDate > lastTrained) {
                    lastTrained = workoutDate;
                }
            }
        }

        const daysSince = lastTrained ? differenceInDays(today, lastTrained) : 999;

        muscleRecoveryStatus[muscle] = {
            lastTrained,
            daysSince,
            frequency: muscleGroupFrequency[muscle],
            needsTraining: daysSince >= 2 // Standard recovery time
        };
    });

    // Find the most suitable past workout to base prediction on
    const workoutScores = recentWorkouts.map(workout => {
        const muscles = detectMuscleGroups(workout);
        let score = 0;

        muscles.forEach(muscle => {
            const status = muscleRecoveryStatus[muscle];
            if (status?.needsTraining) {
                score += status.daysSince * 10; // More days = higher priority
            }
        });

        return { workout, score, muscles };
    });

    workoutScores.sort((a, b) => b.score - a.score);
    const baseWorkout = workoutScores[0]?.workout;

    if (!baseWorkout) {
        return {
            success: false,
            reason: 'Could not find suitable workout pattern',
            prediction: null
        };
    }

    // Build predicted workout with progressive overload
    const predictedExercises = (baseWorkout.exercises || []).map(exercise => {
        const name = exercise.name;
        const progression = exerciseProgression[name] || [];

        // Get overload recommendation
        const overloadCheck = checkOverloadReadiness(name, workouts);

        // Calculate predicted sets/reps/weight
        const lastSets = exercise.sets || [];

        if (lastSets.length === 0) {
            // Skip exercises with no sets
            return null;
        }

        const predictedSets = lastSets.map((set) => {
            const recentSets = progression.slice(-3); // Last 3 instances

            if (recentSets.length === 0) {
                return { ...set };
            }

            // Calculate average from recent history
            const avgWeight = recentSets.reduce((sum, s) => sum + s.weight, 0) / recentSets.length;
            const avgReps = recentSets.reduce((sum, s) => sum + s.reps, 0) / recentSets.length;

            let predictedWeight = Math.round(avgWeight);
            let predictedReps = Math.round(avgReps);

            // Apply progressive overload if ready
            if (overloadCheck.ready && overloadCheck.suggestion) {
                const { action, newWeight, targetReps } = overloadCheck.suggestion;

                if (action === 'increase_weight') {
                    predictedWeight = newWeight;
                } else if (action === 'increase_reps') {
                    predictedReps = targetReps || predictedReps + 1;
                } else if (action === 'deload') {
                    predictedWeight = overloadCheck.suggestion.deloadWeight;
                }
            }

            return {
                reps: predictedReps,
                weight: predictedWeight,
                duration: set.duration || null,
                predicted: true
            };
        });

        return {
            name,
            category: exercise.category,
            sets: predictedSets,
            overloadRecommendation: overloadCheck.suggestion || null,
            confidence: overloadCheck.suggestion?.confidence || 70
        };
    }).filter(ex => ex !== null); // Remove null exercises

    return {
        success: true,
        prediction: {
            name: baseWorkout.name || 'Predicted Workout',
            exercises: predictedExercises,
            targetMuscles: workoutScores[0].muscles,
            basedOn: {
                workoutDate: baseWorkout.date,
                workoutName: baseWorkout.name
            }
        },
        analysis: {
            totalWorkoutsAnalyzed: analysis.totalWorkouts,
            daysCovered: analyzeDays,
            muscleRecoveryStatus
        }
    };
};

/**
 * Generate structured data for LLM explanation
 * @param {Object} prediction - Prediction result from predictNextWorkout
 * @param {Array} workouts - All workout history
 * @returns {Object} Structured data for LLM
 */
export const prepareLLMContext = (prediction, workouts) => {
    if (!prediction.success) {
        return {
            status: 'error',
            message: prediction.reason
        };
    }

    const { prediction: workout, analysis } = prediction;

    // Summarize last 10 days
    const last10Days = workouts
        .filter(w => w.type !== 'rest_day')
        .slice(0, 10)
        .map(w => ({
            date: new Date(w.date).toLocaleDateString(),
            name: w.name,
            exercises: w.exercises?.map(ex => {
                const setsCount = ex.sets?.length || 0;
                if (setsCount === 0) {
                    return {
                        name: ex.name,
                        sets: 0,
                        avgWeight: 0,
                        avgReps: 0
                    };
                }
                return {
                    name: ex.name,
                    sets: setsCount,
                    avgWeight: Math.round(ex.sets.reduce((sum, s) => sum + (s.weight || 0), 0) / setsCount),
                    avgReps: Math.round(ex.sets.reduce((sum, s) => sum + (s.reps || 0), 0) / setsCount)
                };
            })
        }));

    // Prepare prediction summary
    const predictionSummary = workout.exercises.map(ex => ({
        exercise: ex.name,
        sets: ex.sets.length,
        reps: ex.sets[0]?.reps || 0,
        weight: ex.sets[0]?.weight || 0,
        recommendation: ex.overloadRecommendation?.action || 'maintain',
        confidence: ex.confidence
    }));

    return {
        status: 'ready',
        context: {
            last10Days,
            predictionSummary,
            targetMuscles: workout.targetMuscles,
            muscleRecoveryStatus: analysis.muscleRecoveryStatus,
            totalWorkoutsAnalyzed: analysis.totalWorkoutsAnalyzed
        }
    };
};
