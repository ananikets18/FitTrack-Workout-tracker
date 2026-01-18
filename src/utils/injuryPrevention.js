import { differenceInDays, subWeeks } from 'date-fns';
import { calculateMuscleSets } from './smartRecommendations';
import {
    calculateSystemicStress,
    getIntensityMultiplier
} from './intensityClassification';

// ============================================
// INJURY PREVENTION SYSTEM
// ============================================
// Detects injury risk factors and provides warnings

// Risk thresholds
const RISK_THRESHOLDS = {
    volumeSpike: 0.30,        // 30% increase in volume is risky
    consecutiveDays: 5,        // 5+ consecutive days without rest
    insufficientRecovery: 1.5, // Less than 1.5 days between same muscle group
    suddenWeightJump: 0.15,    // 15% weight increase in single session
    highFatigueScore: 80       // Fatigue score above 80/100
};

// Injury risk levels
const RISK_LEVELS = {
    low: { color: 'green', label: 'Low Risk', score: 0 - 30 },
    moderate: { color: 'yellow', label: 'Moderate Risk', score: 31 - 60 },
    high: { color: 'orange', label: 'High Risk', score: 61 - 80 },
    critical: { color: 'red', label: 'Critical Risk', score: 81 - 100 }
};

// Calculate weekly volume for a muscle group
const getWeeklyMuscleVolume = (workouts, muscleGroup, weeksAgo = 0) => {
    const targetDate = subWeeks(new Date(), weeksAgo);
    const weekStart = subWeeks(targetDate, 1);

    const weekWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate >= weekStart && workoutDate <= targetDate && w.type !== 'rest_day';
    });

    let totalSets = 0;
    weekWorkouts.forEach(workout => {
        const muscleSets = calculateMuscleSets(workout);
        totalSets += muscleSets[muscleGroup] || 0;
    });

    return totalSets;
};

// Detect volume spikes (sudden increases)
export const detectVolumeSpikes = (workouts) => {
    const warnings = [];
    const muscleGroups = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];

    muscleGroups.forEach(muscle => {
        const thisWeek = getWeeklyMuscleVolume(workouts, muscle, 0);
        const lastWeek = getWeeklyMuscleVolume(workouts, muscle, 1);

        if (lastWeek === 0) return; // No baseline

        const increase = (thisWeek - lastWeek) / lastWeek;

        if (increase >= RISK_THRESHOLDS.volumeSpike) {
            const riskScore = Math.min(100, Math.round(increase * 100));

            warnings.push({
                type: 'volume_spike',
                muscle,
                severity: increase >= 0.5 ? 'critical' : 'high',
                riskScore,
                message: `${muscle.charAt(0).toUpperCase() + muscle.slice(1)} volume increased ${Math.round(increase * 100)}% this week`,
                details: `Last week: ${lastWeek} sets → This week: ${thisWeek} sets`,
                recommendation: 'Reduce volume by 20-30% to prevent overuse injury',
                icon: '⚠️'
            });
        }
    });

    return warnings;
};

// Detect insufficient recovery between sessions
export const detectInsufficientRecovery = (workouts) => {
    const warnings = [];
    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

    // Track last trained date for each muscle
    const muscleLastTrained = {};

    regularWorkouts.forEach(workout => {
        const workoutDate = new Date(workout.date);
        const muscleSets = calculateMuscleSets(workout);

        Object.keys(muscleSets).forEach(muscle => {
            if (muscleLastTrained[muscle]) {
                const daysBetween = differenceInDays(workoutDate, muscleLastTrained[muscle]);

                // Minimum recovery times
                const minRecovery = muscle === 'legs' ? 2 : muscle === 'core' ? 1 : 1.5;

                if (daysBetween < minRecovery) {
                    warnings.push({
                        type: 'insufficient_recovery',
                        muscle,
                        severity: daysBetween < 1 ? 'critical' : 'high',
                        riskScore: Math.round((1 - daysBetween / minRecovery) * 100),
                        message: `${muscle.charAt(0).toUpperCase() + muscle.slice(1)} trained again after only ${daysBetween} day(s)`,
                        details: `Recommended recovery: ${minRecovery} days`,
                        recommendation: `Allow at least ${Math.ceil(minRecovery)} days between ${muscle} sessions`,
                        icon: '🚨'
                    });
                }
            }

            muscleLastTrained[muscle] = workoutDate;
        });
    });

    return warnings;
};

// Detect sudden weight jumps
export const detectSuddenWeightJumps = (workouts) => {
    const warnings = [];
    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

    // Track exercise weights
    const exerciseWeights = {};

    regularWorkouts.forEach(workout => {
        workout.exercises?.forEach(exercise => {
            const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));

            if (maxWeight === 0) return; // Skip bodyweight exercises

            if (exerciseWeights[exercise.name]) {
                const lastWeight = exerciseWeights[exercise.name];
                const increase = (maxWeight - lastWeight) / lastWeight;

                if (increase >= RISK_THRESHOLDS.suddenWeightJump) {
                    warnings.push({
                        type: 'sudden_weight_jump',
                        exercise: exercise.name,
                        severity: increase >= 0.25 ? 'critical' : 'high',
                        riskScore: Math.min(100, Math.round(increase * 200)),
                        message: `${exercise.name}: Weight jumped ${Math.round(increase * 100)}% in one session`,
                        details: `${lastWeight}kg → ${maxWeight}kg`,
                        recommendation: 'Increase weight gradually (2.5-5kg increments)',
                        icon: '⚡'
                    });
                }
            }

            exerciseWeights[exercise.name] = maxWeight;
        });
    });

    return warnings;
};

// Detect consecutive training days without rest
export const detectConsecutiveDays = (workouts) => {
    const warnings = [];
    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

    if (regularWorkouts.length < 2) return warnings;

    // Sort by date (most recent first)
    const sorted = [...regularWorkouts].sort((a, b) => new Date(b.date) - new Date(a.date));

    let consecutiveDays = 1;
    let currentDate = new Date(sorted[0].date);

    for (let i = 1; i < sorted.length; i++) {
        const prevDate = new Date(sorted[i].date);
        const daysDiff = differenceInDays(currentDate, prevDate);

        if (daysDiff === 1) {
            consecutiveDays++;
            currentDate = prevDate;
        } else {
            break;
        }
    }

    if (consecutiveDays >= RISK_THRESHOLDS.consecutiveDays) {
        warnings.push({
            type: 'consecutive_days',
            severity: consecutiveDays >= 7 ? 'critical' : 'high',
            riskScore: Math.min(100, consecutiveDays * 15),
            message: `${consecutiveDays} consecutive workout days without rest`,
            details: 'Overtraining risk increases significantly after 5+ days',
            recommendation: 'Take a rest day immediately to prevent burnout',
            icon: '😴'
        });
    }

    return warnings;
};

// Calculate overall fatigue score (ENHANCED - uses systemic stress and sleep data)
export const calculateFatigueScore = (workouts, sleepLogs = []) => {
    const last7Days = workouts.filter(w => {
        const daysSince = differenceInDays(new Date(), new Date(w.date));
        return daysSince <= 7;
    });

    if (last7Days.length === 0) return 0;

    let fatigueScore = 0;

    // Factor 1: Number of workouts (max 25 points - reduced to make room for sleep)
    const workoutCount = last7Days.filter(w => w.type !== 'rest_day').length;
    fatigueScore += Math.min(25, workoutCount * 5);

    // Factor 2: Average sets per workout (max 20 points)
    const avgSets = last7Days
        .filter(w => w.type !== 'rest_day')
        .reduce((sum, w) => {
            const totalSets = w.exercises?.reduce((s, ex) => s + ex.sets.length, 0) || 0;
            return sum + totalSets;
        }, 0) / (workoutCount || 1);

    fatigueScore += Math.min(20, avgSets * 1.0);

    // Factor 3: Systemic (CNS) Stress (max 20 points)
    const avgSystemicStress = last7Days
        .filter(w => w.type !== 'rest_day')
        .reduce((sum, w) => sum + calculateSystemicStress(w), 0) / (workoutCount || 1);

    fatigueScore += Math.min(20, avgSystemicStress / 5);

    // Factor 4: Sleep Quality (NEW - max 25 points)
    // Poor sleep = higher fatigue
    if (sleepLogs && sleepLogs.length > 0) {
        const recentSleep = sleepLogs.slice(0, 7);
        const avgSleepHours = recentSleep.reduce((sum, log) => sum + parseFloat(log.hours_slept), 0) / recentSleep.length;
        const avgSleepQuality = recentSleep.reduce((sum, log) => sum + log.quality, 0) / recentSleep.length;

        // Poor sleep increases fatigue
        const sleepFatigue = (8 - avgSleepHours) * 3 + (5 - avgSleepQuality) * 2;
        fatigueScore += Math.max(0, Math.min(25, sleepFatigue));
    } else {
        // Fallback to rest day quality (max 20 points)
        const restDays = last7Days.filter(w => w.type === 'rest_day');
        if (restDays.length === 0) {
            fatigueScore += 20; // No rest = high fatigue
        } else {
            const avgRestQuality = restDays.reduce((sum, r) => sum + (r.recoveryQuality || 3), 0) / restDays.length;
            fatigueScore += Math.round((5 - avgRestQuality) * 4); // Lower quality = higher fatigue
        }
    }

    // Factor 5: Consecutive training days (max 10 points)
    const consecutiveDays = detectConsecutiveDays(workouts);
    if (consecutiveDays.length > 0) {
        fatigueScore += Math.min(10, consecutiveDays[0].consecutiveDays * 2);
    }

    return Math.min(100, Math.round(fatigueScore));
};

// Comprehensive injury risk assessment
export const assessInjuryRisk = (workouts) => {
    const volumeWarnings = detectVolumeSpikes(workouts);
    const recoveryWarnings = detectInsufficientRecovery(workouts);
    const weightWarnings = detectSuddenWeightJumps(workouts);
    const consecutiveWarnings = detectConsecutiveDays(workouts);

    const allWarnings = [
        ...volumeWarnings,
        ...recoveryWarnings,
        ...weightWarnings,
        ...consecutiveWarnings
    ];

    const fatigueScore = calculateFatigueScore(workouts);

    // NEW: Weight risk score by exercise intensity
    const intensityAdjustedRisk = allWarnings.map(warning => {
        if (warning.exercise) {
            const intensityMultiplier = getIntensityMultiplier(warning.exercise);
            return {
                ...warning,
                riskScore: Math.round(warning.riskScore * intensityMultiplier)
            };
        }
        return warning;
    });

    const maxRiskScore = intensityAdjustedRisk.length > 0
        ? Math.max(...intensityAdjustedRisk.map(w => w.riskScore))
        : 0;

    const overallRisk = Math.round((maxRiskScore * 0.7) + (fatigueScore * 0.3));

    // Determine risk level
    let riskLevel = 'low';
    if (overallRisk >= 81) riskLevel = 'critical';
    else if (overallRisk >= 61) riskLevel = 'high';
    else if (overallRisk >= 31) riskLevel = 'moderate';

    // Critical warnings (severity: critical)
    const criticalWarnings = allWarnings.filter(w => w.severity === 'critical');

    // High priority warnings
    const highWarnings = allWarnings.filter(w => w.severity === 'high');

    return {
        overallRisk,
        riskLevel,
        riskLevelData: RISK_LEVELS[riskLevel],
        fatigueScore,
        totalWarnings: allWarnings.length,
        criticalWarnings: criticalWarnings.length,
        highWarnings: highWarnings.length,
        warnings: allWarnings.sort((a, b) => b.riskScore - a.riskScore), // Highest risk first
        recommendations: generateRecommendations(allWarnings, riskLevel, fatigueScore)
    };
};

// Generate actionable recommendations
const generateRecommendations = (warnings, riskLevel, fatigueScore) => {
    const recommendations = [];

    if (riskLevel === 'critical') {
        recommendations.push({
            priority: 'critical',
            action: 'Take immediate rest day',
            reason: 'Multiple high-risk factors detected',
            icon: '🚨'
        });
    }

    if (fatigueScore >= RISK_THRESHOLDS.highFatigueScore) {
        recommendations.push({
            priority: 'high',
            action: 'Schedule deload week',
            reason: `Fatigue score: ${fatigueScore}/100`,
            icon: '😴'
        });
    }

    // Specific recommendations based on warning types
    const volumeSpikeWarnings = warnings.filter(w => w.type === 'volume_spike');
    if (volumeSpikeWarnings.length > 0) {
        recommendations.push({
            priority: 'high',
            action: 'Reduce training volume',
            reason: `${volumeSpikeWarnings.length} muscle group(s) with volume spikes`,
            icon: '📉'
        });
    }

    const recoveryWarnings = warnings.filter(w => w.type === 'insufficient_recovery');
    if (recoveryWarnings.length > 0) {
        recommendations.push({
            priority: 'high',
            action: 'Increase rest between sessions',
            reason: 'Muscles not fully recovering',
            icon: '⏰'
        });
    }

    if (recommendations.length === 0 && riskLevel === 'low') {
        recommendations.push({
            priority: 'low',
            action: 'Continue current training',
            reason: 'No injury risk detected',
            icon: '✅'
        });
    }

    return recommendations;
};

// Suggest mobility/recovery work
export const suggestRecoveryWork = (warnings) => {
    const suggestions = [];

    warnings.forEach(warning => {
        if (warning.muscle) {
            const muscle = warning.muscle;

            const mobilityWork = {
                chest: ['Doorway chest stretch', 'Foam roll pecs', 'Band pull-aparts'],
                back: ['Cat-cow stretch', 'Foam roll lats', 'Dead hangs'],
                shoulders: ['Shoulder dislocations', 'Wall slides', 'Band external rotations'],
                legs: ['Foam roll quads/hamstrings', 'Pigeon pose', 'Calf stretches'],
                arms: ['Wrist circles', 'Tricep stretches', 'Forearm stretches'],
                core: ['Child\'s pose', 'Cat-cow', 'Spinal twists']
            };

            if (mobilityWork[muscle]) {
                suggestions.push({
                    muscle,
                    exercises: mobilityWork[muscle],
                    duration: '10-15 minutes',
                    frequency: 'Daily until recovered'
                });
            }
        }
    });

    return suggestions;
};
