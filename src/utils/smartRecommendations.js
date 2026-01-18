import { differenceInDays, startOfWeek, endOfWeek } from 'date-fns';
import { getWorkoutOverloadRecommendations } from './progressiveOverloadPredictor';
import { assessInjuryRisk, suggestRecoveryWork } from './injuryPrevention';
import { calculateReadinessScore, determineDifficultyLevel, getWorkoutAdjustment } from './workoutDifficultyAdjuster';
import {
    calculateWeightedMuscleSets,
    detectMuscleGroupsWeighted
} from './exerciseMuscleMapping';
import {
    getSystemicReadiness,
    calculateSystemicStress
} from './intensityClassification';
import { checkNutritionAdequacy } from './nutritionChecker';
import { analyzeBodyComposition } from './bodyCompositionAnalyzer';

// ============================================
// INTELLIGENT WORKOUT RECOMMENDATION SYSTEM
// ============================================

// Default science-based volume targets (sets per muscle group per week)
export const DEFAULT_VOLUME_TARGETS = {
    chest: { min: 12, max: 20 },
    back: { min: 12, max: 20 },
    shoulders: { min: 12, max: 18 },
    legs: { min: 12, max: 20 },
    arms: { min: 10, max: 16 },
    core: { min: 8, max: 15 },
    cardio: { min: 2, max: 5 } // sessions per week
};

// Muscle group recovery times (in days)
const RECOVERY_TIMES = {
    chest: 2,
    back: 2,
    shoulders: 2,
    legs: 3, // Legs need more recovery
    arms: 1.5,
    core: 1,
    cardio: 1
};

// Training split configurations
export const TRAINING_SPLITS = {
    ppl: {
        name: 'Push/Pull/Legs',
        description: '3-day rotation focusing on movement patterns',
        frequency: 6,
        groups: {
            push: ['chest', 'shoulders', 'triceps'],
            pull: ['back', 'biceps'],
            legs: ['legs']
        }
    },
    upperLower: {
        name: 'Upper/Lower',
        description: '2-day rotation alternating upper and lower body',
        frequency: 4,
        groups: {
            upper: ['chest', 'back', 'shoulders', 'arms'],
            lower: ['legs']
        }
    },
    broSplit: {
        name: 'Bro Split',
        description: 'One muscle group per day',
        frequency: 5,
        groups: {
            chest: ['chest'],
            back: ['back'],
            shoulders: ['shoulders'],
            arms: ['arms'],
            legs: ['legs']
        }
    },
    fullBody: {
        name: 'Full Body',
        description: 'Train all major muscle groups each session',
        frequency: 3,
        groups: {
            fullBody: ['chest', 'back', 'shoulders', 'legs', 'arms']
        }
    },
    custom: {
        name: 'Custom',
        description: 'Your own training schedule',
        frequency: null,
        groups: {}
    }
};

// Map exercise categories to muscle groups
const CATEGORY_TO_MUSCLE = {
    chest: 'chest',
    back: 'back',
    shoulders: 'shoulders',
    legs: 'legs',
    arms: 'arms',
    core: 'core',
    cardio: 'cardio',
    other: 'other'
};

// Muscle group keywords for detection
const MUSCLE_KEYWORDS = {
    chest: ['bench press', 'chest press', 'push up', 'dumbbell press', 'incline press', 'decline press', 'chest fly', 'cable fly', 'pec deck', 'dips'],
    back: ['pull up', 'lat pulldown', 'row', 'deadlift', 'back extension', 't-bar row', 'cable row', 'chin up', 'face pull', 'shrug'],
    legs: ['squat', 'leg press', 'lunge', 'leg curl', 'leg extension', 'calf raise', 'hack squat', 'bulgarian', 'romanian deadlift'],
    shoulders: ['shoulder press', 'lateral raise', 'front raise', 'rear delt', 'overhead press', 'arnold press', 'military press', 'upright row'],
    arms: ['curl', 'tricep', 'bicep', 'hammer curl', 'preacher curl', 'skull crusher', 'tricep extension', 'tricep pushdown'],
    core: ['crunch', 'plank', 'ab', 'sit up', 'russian twist', 'leg raise', 'mountain climber', 'oblique']
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Detect muscle groups in a workout (ENHANCED - uses weighted detection)
export const detectMuscleGroups = (workout) => {
    // Use new weighted muscle detection system
    return detectMuscleGroupsWeighted(workout);
};

// Calculate sets per muscle group in a workout (ENHANCED - uses weighted distribution)
export const calculateMuscleSets = (workout) => {
    // Use new weighted muscle sets calculation
    // This accounts for exercises that work multiple muscle groups
    return calculateWeightedMuscleSets(workout);
};

// Get muscle recovery status
export const getMuscleRecoveryStatus = (workouts) => {
    const muscleStatus = {};
    const today = new Date();

    // Initialize all muscle groups as recovered
    Object.keys(MUSCLE_KEYWORDS).forEach(muscle => {
        muscleStatus[muscle] = {
            lastTrained: null,
            daysSince: Infinity,
            isRecovered: true,
            recoveryPercentage: 100
        };
    });

    // Find last trained date for each muscle
    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

    regularWorkouts.forEach(workout => {
        const muscles = detectMuscleGroups(workout);
        const workoutDate = new Date(workout.date);

        muscles.forEach(muscle => {
            // Safety check: ensure muscle exists in muscleStatus
            if (!muscleStatus[muscle]) {
                muscleStatus[muscle] = {
                    lastTrained: null,
                    daysSince: Infinity,
                    isRecovered: true,
                    recoveryPercentage: 100
                };
            }

            if (!muscleStatus[muscle].lastTrained || workoutDate > muscleStatus[muscle].lastTrained) {
                muscleStatus[muscle].lastTrained = workoutDate;
            }
        });
    });

    // Calculate recovery status
    Object.keys(muscleStatus).forEach(muscle => {
        if (muscleStatus[muscle].lastTrained) {
            const daysSince = differenceInDays(today, muscleStatus[muscle].lastTrained);
            const recoveryTime = RECOVERY_TIMES[muscle] || 2;

            muscleStatus[muscle].daysSince = daysSince;
            muscleStatus[muscle].isRecovered = daysSince >= recoveryTime;
            muscleStatus[muscle].recoveryPercentage = Math.min(100, (daysSince / recoveryTime) * 100);
        }
    });

    return muscleStatus;
};

// Calculate weekly volume per muscle group
export const getWeeklyVolume = (workouts) => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

    const weeklyVolume = {};

    // Initialize
    Object.keys(MUSCLE_KEYWORDS).forEach(muscle => {
        weeklyVolume[muscle] = 0;
    });

    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

    regularWorkouts.forEach(workout => {
        const workoutDate = new Date(workout.date);

        if (workoutDate >= weekStart && workoutDate <= weekEnd) {
            const muscleSets = calculateMuscleSets(workout);

            Object.entries(muscleSets).forEach(([muscle, sets]) => {
                weeklyVolume[muscle] = (weeklyVolume[muscle] || 0) + sets;
            });
        }
    });

    return weeklyVolume;
};

// Detect fatigue level (ENHANCED - uses systemic stress)
export const getFatigueLevel = (workouts) => {
    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');
    if (regularWorkouts.length === 0) return { level: 'low', consecutiveDays: 0, recommendation: 'ready', systemicStress: 0 };

    // Get last 7 days
    const last7Days = regularWorkouts.filter(w => {
        const daysSince = differenceInDays(new Date(), new Date(w.date));
        return daysSince <= 7;
    });

    // Count consecutive workout days
    let consecutiveDays = 0;
    const sortedDates = regularWorkouts
        .map(w => new Date(w.date))
        .sort((a, b) => b - a);

    let currentDate = new Date();
    for (const workoutDate of sortedDates) {
        const daysDiff = differenceInDays(currentDate, workoutDate);
        if (daysDiff <= 1) {
            consecutiveDays++;
            currentDate = workoutDate;
        } else {
            break;
        }
    }

    // Calculate average intensity (sets per workout)
    const avgSetsPerWorkout = last7Days.reduce((sum, w) => {
        const totalSets = w.exercises?.reduce((s, ex) => s + ex.sets.length, 0) || 0;
        return sum + totalSets;
    }, 0) / (last7Days.length || 1);

    // NEW: Calculate systemic stress (CNS fatigue)
    const avgSystemicStress = last7Days.reduce((sum, w) => {
        return sum + calculateSystemicStress(w);
    }, 0) / (last7Days.length || 1);

    let level = 'low';
    let recommendation = 'ready';

    // Enhanced fatigue detection using systemic stress
    if (consecutiveDays >= 5 || avgSetsPerWorkout > 30 || avgSystemicStress > 70) {
        level = 'high';
        recommendation = 'rest';
    } else if (consecutiveDays >= 3 || avgSetsPerWorkout > 20 || avgSystemicStress > 50) {
        level = 'moderate';
        recommendation = 'light';
    }

    return { level, consecutiveDays, avgSetsPerWorkout, systemicStress: avgSystemicStress, recommendation };
};

// Get last rest day quality
export const getLastRestDayQuality = (workouts) => {
    const restDays = workouts.filter(w => w.type === 'rest_day');
    if (restDays.length === 0) return null;

    const lastRestDay = restDays[0];
    return {
        quality: lastRestDay.recoveryQuality || 3,
        date: lastRestDay.date,
        daysSince: differenceInDays(new Date(), new Date(lastRestDay.date))
    };
};

// ============================================
// MAIN RECOMMENDATION ENGINE
// ============================================

export const getSmartRecommendation = (workouts, userPreferences = {}, sleepLogs = [], nutritionLogs = [], measurements = [], userProfile = {}) => {
    if (!workouts || workouts.length < 2) {
        return {
            workout: null,
            confidence: 0,
            reasoning: ['Need at least 2 workouts to make recommendations'],
            alternatives: [],
            injuryRisk: null,
            readinessScore: null,
            progressiveOverload: null,
            nutritionWarnings: [],
            bodyComposition: null
        };
    }

    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

    // ============================================
    // ADVANCED INTELLIGENCE ANALYSIS
    // ============================================

    // 1. INJURY RISK ASSESSMENT (ENHANCED with sleep data)
    const injuryRisk = assessInjuryRisk(workouts, sleepLogs);

    // 2. READINESS & DIFFICULTY CALCULATION (ENHANCED with sleep data)
    const readinessScore = calculateReadinessScore(workouts, sleepLogs);
    const difficultyLevel = determineDifficultyLevel(readinessScore);

    // 3. NUTRITION ANALYSIS (NEW)
    const nutritionWarnings = checkNutritionAdequacy(nutritionLogs, userProfile, workouts);

    // 4. BODY COMPOSITION ANALYSIS (NEW)
    const bodyComposition = analyzeBodyComposition(measurements, workouts, nutritionLogs, userProfile);

    // Get all analysis data
    const muscleRecovery = getMuscleRecoveryStatus(workouts);
    const weeklyVolume = getWeeklyVolume(workouts);
    const fatigue = getFatigueLevel(workouts);
    const lastRestDay = getLastRestDayQuality(workouts);

    // User preferences with defaults
    const preferences = {
        split: userPreferences.split || 'custom',
        weeklyFrequency: userPreferences.weeklyFrequency || 4,
        volumeTargets: userPreferences.volumeTargets || DEFAULT_VOLUME_TARGETS
    };

    const reasoning = [];
    const warnings = [];

    // ============================================
    // CRITICAL CHECKS (HIGHEST PRIORITY)
    // ============================================

    // CHECK 1: CRITICAL INJURY RISK
    if (injuryRisk.riskLevel === 'critical') {
        reasoning.push(`🚨 CRITICAL: ${injuryRisk.criticalWarnings} high-risk factor(s) detected`);
        injuryRisk.warnings.slice(0, 2).forEach(warning => {
            reasoning.push(`${warning.icon} ${warning.message}`);
        });

        return {
            workout: null,
            confidence: 100,
            reasoning: [...reasoning, '💤 Mandatory rest day for injury prevention'],
            shouldRest: true,
            alternatives: [],
            injuryRisk,
            readinessScore,
            difficultyLevel: 'deload',
            recoveryWork: suggestRecoveryWork(injuryRisk.warnings)
        };
    }

    // CHECK 2: HIGH FATIGUE
    if (fatigue.recommendation === 'rest') {
        reasoning.push(`⚠️ High fatigue detected (${fatigue.consecutiveDays} consecutive days)`);

        if (injuryRisk.riskLevel === 'high') {
            reasoning.push(`🚨 Injury risk: ${injuryRisk.riskLevel.toUpperCase()}`);
        }

        return {
            workout: null,
            confidence: 95,
            reasoning: [...reasoning, '💤 Recommendation: Take a rest day to recover'],
            shouldRest: true,
            alternatives: [],
            injuryRisk,
            readinessScore,
            difficultyLevel: 'deload'
        };
    }

    // ============================================
    // WORKOUT SELECTION & SCORING
    // ============================================

    // CHECK REST DAY QUALITY
    let intensityModifier = 1.0;
    if (lastRestDay) {
        if (lastRestDay.quality <= 2 && lastRestDay.daysSince <= 2) {
            intensityModifier = 0.7;
            reasoning.push(`😴 Recent rest day had low quality (${lastRestDay.quality}⭐) - suggesting lighter workout`);
        } else if (lastRestDay.quality >= 4 && lastRestDay.daysSince <= 1) {
            intensityModifier = 1.2;
            reasoning.push(`💪 Well-rested (${lastRestDay.quality}⭐) - ready for intense session`);
        }
    }

    // ANALYZE MUSCLE RECOVERY & VOLUME NEEDS
    const muscleScores = {};

    Object.keys(MUSCLE_KEYWORDS).forEach(muscle => {
        const recovery = muscleRecovery[muscle];
        const currentVolume = weeklyVolume[muscle] || 0;
        const target = preferences.volumeTargets[muscle] || DEFAULT_VOLUME_TARGETS[muscle] || { min: 10, max: 20 };

        let score = 0;

        // Recovery score (0-50 points)
        if (recovery.isRecovered) {
            score += Math.min(50, recovery.recoveryPercentage / 2);
        } else {
            score -= 30; // Penalty for not recovered
        }

        // Volume deficit score (0-50 points)
        const volumeDeficit = target.min - currentVolume;
        if (volumeDeficit > 0) {
            score += Math.min(50, volumeDeficit * 5); // More deficit = higher priority
        } else if (currentVolume >= target.max) {
            score -= 20; // Already hit max volume
        }

        muscleScores[muscle] = {
            score,
            recovery: recovery.recoveryPercentage,
            currentVolume,
            targetVolume: target,
            needsWork: volumeDeficit > 0
        };
    });

    // FIND BEST MATCHING WORKOUT
    const workoutScores = regularWorkouts.map(workout => {
        const muscles = detectMuscleGroups(workout);
        const muscleSets = calculateMuscleSets(workout);

        let workoutScore = 0;
        let matchedMuscles = [];
        let recoveredMuscles = [];
        let needsVolumeMuscles = [];

        muscles.forEach(muscle => {
            const muscleData = muscleScores[muscle];
            if (!muscleData) return;

            workoutScore += muscleData.score;
            matchedMuscles.push(muscle);

            if (muscleData.recovery >= 100) {
                recoveredMuscles.push(muscle);
            }

            if (muscleData.needsWork) {
                needsVolumeMuscles.push(muscle);
            }
        });

        // Bonus for variety (training multiple muscle groups)
        if (matchedMuscles.length >= 2) {
            workoutScore += 20;
        }

        // Apply intensity modifier
        workoutScore *= intensityModifier;

        return {
            workout,
            score: workoutScore,
            matchedMuscles,
            recoveredMuscles,
            needsVolumeMuscles,
            muscleSets
        };
    });

    // Sort by score
    workoutScores.sort((a, b) => b.score - a.score);

    const topRecommendation = workoutScores[0];

    if (!topRecommendation || topRecommendation.score < 0) {
        return {
            workout: null,
            confidence: 0,
            reasoning: ['No suitable workout found based on current recovery status'],
            alternatives: [],
            injuryRisk,
            readinessScore,
            difficultyLevel
        };
    }

    // ============================================
    // ADVANCED ENHANCEMENTS
    // ============================================

    // 3. PROGRESSIVE OVERLOAD RECOMMENDATIONS
    const overloadRecommendations = getWorkoutOverloadRecommendations(
        topRecommendation.workout,
        workouts
    );

    // 4. WORKOUT DIFFICULTY ADJUSTMENT
    const workoutAdjustment = getWorkoutAdjustment(topRecommendation.workout, workouts);

    // Build reasoning
    if (topRecommendation.recoveredMuscles.length > 0) {
        reasoning.push(`✅ Recovered: ${topRecommendation.recoveredMuscles.join(', ')}`);
    }

    if (topRecommendation.needsVolumeMuscles.length > 0) {
        reasoning.push(`📊 Needs volume: ${topRecommendation.needsVolumeMuscles.join(', ')}`);
    }

    // Add readiness info
    if (readinessScore >= 90) {
        reasoning.push(`🔥 Peak readiness (${readinessScore}/100) - perfect for PRs!`);
    } else if (readinessScore <= 50) {
        reasoning.push(`😌 Lower readiness (${readinessScore}/100) - ${difficultyLevel} workout suggested`);
    }

    // Add injury warnings if present
    if (injuryRisk.riskLevel === 'high') {
        warnings.push(`⚠️ High injury risk - ${injuryRisk.totalWarnings} warning(s)`);
    } else if (injuryRisk.riskLevel === 'moderate') {
        warnings.push(`⚡ Moderate injury risk - be cautious`);
    }

    // Calculate confidence (0-100)
    const maxPossibleScore = 100 * topRecommendation.matchedMuscles.length;
    let confidence = Math.min(100, Math.round((topRecommendation.score / maxPossibleScore) * 100));

    // Adjust confidence based on injury risk
    if (injuryRisk.riskLevel === 'high') confidence = Math.min(confidence, 70);
    else if (injuryRisk.riskLevel === 'moderate') confidence = Math.min(confidence, 85);

    // Get alternatives (top 3)
    const alternatives = workoutScores.slice(1, 4).map(ws => ({
        workout: ws.workout,
        reason: `Targets: ${ws.matchedMuscles.join(', ')}`
    }));

    return {
        workout: topRecommendation.workout,
        confidence,
        reasoning,
        warnings,
        muscleTargets: topRecommendation.matchedMuscles,
        alternatives,
        shouldRest: false,
        fatigueLevel: fatigue.level,

        // Advanced intelligence data
        injuryRisk,
        readinessScore,
        difficultyLevel,
        workoutAdjustment,
        progressiveOverload: overloadRecommendations.slice(0, 3), // Top 3 exercises
        recoveryWork: injuryRisk.warnings.length > 0 ? suggestRecoveryWork(injuryRisk.warnings) : null,

        // NEW: Nutrition & Body Composition
        nutritionWarnings,
        bodyComposition
    };
};

