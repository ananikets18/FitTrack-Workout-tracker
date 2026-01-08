import { differenceInDays } from 'date-fns';
import { calculateFatigueScore } from './injuryPrevention';

// ============================================
// WORKOUT DIFFICULTY ADJUSTER
// ============================================
// Dynamically adjusts workout difficulty based on recovery, fatigue, and performance

// Readiness factors
const READINESS_FACTORS = {
    restQuality: {
        weight: 0.35,
        scale: {
            1: 0.5,  // Poor sleep = 50% readiness
            2: 0.65,
            3: 0.80,
            4: 0.95,
            5: 1.10  // Excellent sleep = 110% readiness
        }
    },
    fatigue: {
        weight: 0.30,
        // Fatigue score 0-100 mapped to readiness multiplier
        calculate: (score) => Math.max(0.5, 1 - (score / 150))
    },
    recentPerformance: {
        weight: 0.20
    },
    timeSinceRest: {
        weight: 0.15
    }
};

// Difficulty adjustment levels
const DIFFICULTY_LEVELS = {
    deload: {
        label: 'Deload',
        weightMultiplier: 0.70,  // 70% of normal weight
        setsMultiplier: 0.75,     // 75% of normal sets
        repsMultiplier: 0.85,     // 85% of normal reps
        color: 'purple',
        icon: '🔽'
    },
    light: {
        label: 'Light',
        weightMultiplier: 0.85,
        setsMultiplier: 0.90,
        repsMultiplier: 0.95,
        color: 'blue',
        icon: '⬇️'
    },
    normal: {
        label: 'Normal',
        weightMultiplier: 1.00,
        setsMultiplier: 1.00,
        repsMultiplier: 1.00,
        color: 'green',
        icon: '➡️'
    },
    intense: {
        label: 'Intense',
        weightMultiplier: 1.05,
        setsMultiplier: 1.10,
        repsMultiplier: 1.05,
        color: 'orange',
        icon: '⬆️'
    },
    peak: {
        label: 'Peak Performance',
        weightMultiplier: 1.10,
        setsMultiplier: 1.15,
        repsMultiplier: 1.10,
        color: 'red',
        icon: '🔥'
    }
};

// Calculate readiness score (0-100)
export const calculateReadinessScore = (workouts) => {
    if (!workouts || workouts.length === 0) return 75; // Default moderate readiness

    let readinessScore = 0;

    // Factor 1: Rest Day Quality (35% weight)
    const lastRestDay = workouts.find(w => w.type === 'rest_day');
    if (lastRestDay) {
        const restQuality = lastRestDay.recoveryQuality || 3;
        const daysSinceRest = differenceInDays(new Date(), new Date(lastRestDay.date));

        // Recent rest day (within 2 days) has more impact
        const recencyMultiplier = daysSinceRest <= 2 ? 1.0 : 0.7;
        const restScore = READINESS_FACTORS.restQuality.scale[restQuality] * 100 * recencyMultiplier;
        readinessScore += restScore * READINESS_FACTORS.restQuality.weight;
    } else {
        // No rest day found = moderate readiness
        readinessScore += 75 * READINESS_FACTORS.restQuality.weight;
    }

    // Factor 2: Fatigue Level (30% weight)
    const fatigueScore = calculateFatigueScore(workouts);
    const fatigueReadiness = READINESS_FACTORS.fatigue.calculate(fatigueScore) * 100;
    readinessScore += fatigueReadiness * READINESS_FACTORS.fatigue.weight;

    // Factor 3: Recent Performance (20% weight)
    const recentWorkouts = workouts.filter(w => {
        const daysSince = differenceInDays(new Date(), new Date(w.date));
        return daysSince <= 7 && w.type !== 'rest_day';
    });

    if (recentWorkouts.length > 0) {
        // Check if recent workouts were completed (has exercises and sets)
        const completedWorkouts = recentWorkouts.filter(w =>
            w.exercises && w.exercises.length > 0 && w.exercises.some(ex => ex.sets.length > 0)
        );

        const completionRate = completedWorkouts.length / recentWorkouts.length;
        const performanceScore = completionRate * 100;
        readinessScore += performanceScore * READINESS_FACTORS.recentPerformance.weight;
    } else {
        readinessScore += 80 * READINESS_FACTORS.recentPerformance.weight;
    }

    // Factor 4: Time Since Last Rest (15% weight)
    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');
    if (regularWorkouts.length > 0 && lastRestDay) {
        const daysSinceRest = differenceInDays(new Date(), new Date(lastRestDay.date));

        // Optimal: 1-2 days since rest
        let restTimingScore = 100;
        if (daysSinceRest === 0) restTimingScore = 110; // Just rested
        else if (daysSinceRest === 1) restTimingScore = 105;
        else if (daysSinceRest === 2) restTimingScore = 100;
        else if (daysSinceRest <= 4) restTimingScore = 85;
        else if (daysSinceRest <= 6) restTimingScore = 70;
        else restTimingScore = 60; // 7+ days without rest

        readinessScore += restTimingScore * READINESS_FACTORS.timeSinceRest.weight;
    } else {
        readinessScore += 75 * READINESS_FACTORS.timeSinceRest.weight;
    }

    return Math.round(Math.max(0, Math.min(100, readinessScore)));
};

// Determine difficulty level based on readiness
export const determineDifficultyLevel = (readinessScore) => {
    if (readinessScore >= 95) return 'peak';
    if (readinessScore >= 80) return 'intense';
    if (readinessScore >= 60) return 'normal';
    if (readinessScore >= 40) return 'light';
    return 'deload';
};

// Adjust workout based on difficulty level
export const adjustWorkout = (workout, difficultyLevel) => {
    if (!workout || !workout.exercises) return workout;

    const adjustment = DIFFICULTY_LEVELS[difficultyLevel];

    const adjustedWorkout = {
        ...workout,
        difficultyLevel,
        difficultyAdjustment: adjustment,
        exercises: workout.exercises.map(exercise => ({
            ...exercise,
            sets: exercise.sets.map(set => {
                const adjustedWeight = Math.round(set.weight * adjustment.weightMultiplier);
                const adjustedReps = Math.round(set.reps * adjustment.repsMultiplier);

                return {
                    ...set,
                    weight: adjustedWeight,
                    reps: adjustedReps,
                    originalWeight: set.weight,
                    originalReps: set.reps
                };
            }),
            // Adjust number of sets
            originalSetCount: exercise.sets.length
        }))
    };

    // Adjust set count if needed
    if (adjustment.setsMultiplier !== 1.00) {
        adjustedWorkout.exercises = adjustedWorkout.exercises.map(exercise => {
            const targetSets = Math.round(exercise.sets.length * adjustment.setsMultiplier);

            if (targetSets < exercise.sets.length) {
                // Remove sets
                return {
                    ...exercise,
                    sets: exercise.sets.slice(0, targetSets)
                };
            } else if (targetSets > exercise.sets.length) {
                // Add sets (clone last set)
                const additionalSets = targetSets - exercise.sets.length;
                const lastSet = exercise.sets[exercise.sets.length - 1];
                const newSets = Array(additionalSets).fill(null).map(() => ({ ...lastSet }));

                return {
                    ...exercise,
                    sets: [...exercise.sets, ...newSets]
                };
            }

            return exercise;
        });
    }

    return adjustedWorkout;
};

// Get workout adjustment recommendation
export const getWorkoutAdjustment = (workout, workouts) => {
    const readinessScore = calculateReadinessScore(workouts);
    const difficultyLevel = determineDifficultyLevel(readinessScore);
    const adjustment = DIFFICULTY_LEVELS[difficultyLevel];

    const adjustedWorkout = adjustWorkout(workout, difficultyLevel);

    // Generate explanation
    const explanation = generateAdjustmentExplanation(readinessScore, difficultyLevel, workouts);

    return {
        readinessScore,
        difficultyLevel,
        adjustment,
        adjustedWorkout,
        explanation,
        shouldAdjust: difficultyLevel !== 'normal'
    };
};

// Generate human-readable explanation
const generateAdjustmentExplanation = (readinessScore, difficultyLevel, workouts) => {
    const explanation = {
        summary: '',
        factors: [],
        recommendation: ''
    };

    // Summary
    if (readinessScore >= 95) {
        explanation.summary = '🔥 You\'re at peak performance! Perfect conditions for a PR attempt.';
    } else if (readinessScore >= 80) {
        explanation.summary = '💪 High readiness - great day for an intense session!';
    } else if (readinessScore >= 60) {
        explanation.summary = '✅ Normal readiness - stick to your planned workout.';
    } else if (readinessScore >= 40) {
        explanation.summary = '😌 Lower readiness - go lighter today to avoid burnout.';
    } else {
        explanation.summary = '😴 Very low readiness - deload recommended for recovery.';
    }

    // Contributing factors
    const lastRestDay = workouts.find(w => w.type === 'rest_day');
    if (lastRestDay) {
        const quality = lastRestDay.recoveryQuality || 3;
        const daysSince = differenceInDays(new Date(), new Date(lastRestDay.date));

        if (quality >= 4) {
            explanation.factors.push(`✨ Excellent rest quality (${quality}⭐)`);
        } else if (quality <= 2) {
            explanation.factors.push(`😴 Poor rest quality (${quality}⭐)`);
        }

        if (daysSince === 0) {
            explanation.factors.push('🛌 Just took a rest day');
        } else if (daysSince >= 5) {
            explanation.factors.push(`⏰ ${daysSince} days since last rest`);
        }
    }

    const fatigueScore = calculateFatigueScore(workouts);
    if (fatigueScore >= 70) {
        explanation.factors.push(`⚠️ High fatigue (${fatigueScore}/100)`);
    } else if (fatigueScore <= 30) {
        explanation.factors.push(`✅ Low fatigue (${fatigueScore}/100)`);
    }

    // Recommendation
    const adj = DIFFICULTY_LEVELS[difficultyLevel];
    if (difficultyLevel === 'deload') {
        explanation.recommendation = `Reduce weights to ${Math.round(adj.weightMultiplier * 100)}% and sets to ${Math.round(adj.setsMultiplier * 100)}% of normal`;
    } else if (difficultyLevel === 'light') {
        explanation.recommendation = `Use ${Math.round(adj.weightMultiplier * 100)}% of your normal weights`;
    } else if (difficultyLevel === 'intense') {
        explanation.recommendation = `Push for ${Math.round(adj.setsMultiplier * 100)}% of normal volume`;
    } else if (difficultyLevel === 'peak') {
        explanation.recommendation = 'Perfect day to attempt PRs and push your limits!';
    } else {
        explanation.recommendation = 'Proceed with your planned workout as normal';
    }

    return explanation;
};

// Auto-adjust workout based on real-time performance
export const autoAdjustDuringWorkout = (currentSet, previousSets, targetReps) => {
    if (!previousSets || previousSets.length === 0) {
        return {
            shouldAdjust: false,
            suggestion: null
        };
    }

    // Check if struggling (not hitting target reps)
    const recentSets = previousSets.slice(-2);
    const strugglingRecently = recentSets.every(set => set.reps < targetReps);

    if (strugglingRecently) {
        const avgReps = recentSets.reduce((sum, s) => sum + s.reps, 0) / recentSets.length;
        const deficit = targetReps - avgReps;

        if (deficit >= 2) {
            // Significant struggle - suggest weight reduction
            const currentWeight = currentSet.weight;
            const suggestedWeight = Math.round(currentWeight * 0.90); // 10% reduction

            return {
                shouldAdjust: true,
                suggestion: {
                    type: 'reduce_weight',
                    currentWeight,
                    suggestedWeight,
                    reason: `Struggling to hit ${targetReps} reps - reduce weight to maintain form`,
                    confidence: 85
                }
            };
        }
    }

    // Check if crushing it (exceeding target reps consistently)
    const crushingIt = previousSets.length >= 2 && previousSets.every(set => set.reps >= targetReps + 2);

    if (crushingIt) {
        const currentWeight = currentSet.weight;
        const suggestedWeight = Math.round(currentWeight * 1.05); // 5% increase

        return {
            shouldAdjust: true,
            suggestion: {
                type: 'increase_weight',
                currentWeight,
                suggestedWeight,
                reason: `Consistently exceeding ${targetReps} reps - ready for more weight!`,
                confidence: 90
            }
        };
    }

    return {
        shouldAdjust: false,
        suggestion: null
    };
};
