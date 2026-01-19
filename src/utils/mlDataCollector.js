// ============================================
// ML DATA COLLECTOR
// ============================================
// Collects and structures data for ML model training
// This runs in the background and stores training data

import { supabase } from '../lib/supabase';

/**
 * Collect workout completion data for ML training
 * This will be used to train a "Workout Success Predictor" model
 */
export const logWorkoutCompletionData = async (workoutData) => {
    try {
        const {
            // Features (inputs to ML model)
            sleepHours,
            sleepQuality,
            caloriesConsumed,
            proteinConsumed,
            fatigueScore,
            daysSinceLastRest,
            plannedVolume,
            readinessScore,
            injuryRiskScore,

            // Target (what we want to predict)
            workoutCompleted,      // Boolean: Did they complete the workout?
            completionPercentage,  // 0-100: How much did they complete?
            perceivedDifficulty,   // 1-10: How hard was it?

            // Metadata
            userId,
            workoutId,
            timestamp
        } = workoutData;

        // Store in ml_training_data table
        const { data, error } = await supabase
            .from('ml_training_data')
            .insert([{
                user_id: userId,
                workout_id: workoutId,

                // Features
                sleep_hours: sleepHours,
                sleep_quality: sleepQuality,
                calories: caloriesConsumed,
                protein: proteinConsumed,
                fatigue_score: fatigueScore,
                days_since_rest: daysSinceLastRest,
                planned_volume: plannedVolume,
                readiness_score: readinessScore,
                injury_risk_score: injuryRiskScore,

                // Targets
                workout_completed: workoutCompleted,
                completion_percentage: completionPercentage,
                perceived_difficulty: perceivedDifficulty,

                // Metadata
                timestamp: timestamp || new Date().toISOString(),
                data_version: '1.0'
            }]);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('ML Data Collection Error:', error);
        return { success: false, error };
    }
};

/**
 * Collect recovery time data for personalized recovery predictions
 */
export const logRecoveryData = async (recoveryData) => {
    try {
        const {
            userId,
            muscleGroup,
            workoutVolume,
            workoutIntensity,
            sleepQuality,
            nutritionQuality,
            actualRecoveryDays,
            perceivedRecovery,
            timestamp
        } = recoveryData;

        const { data, error } = await supabase
            .from('ml_recovery_data')
            .insert([{
                user_id: userId,
                muscle_group: muscleGroup,
                workout_volume: workoutVolume,
                workout_intensity: workoutIntensity,
                sleep_quality: sleepQuality,
                nutrition_quality: nutritionQuality,
                actual_recovery_days: actualRecoveryDays,
                perceived_recovery: perceivedRecovery,
                timestamp: timestamp || new Date().toISOString()
            }]);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Recovery Data Collection Error:', error);
        return { success: false, error };
    }
};

/**
 * Collect weight progression data for optimal increment predictions
 */
export const logProgressionData = async (progressionData) => {
    try {
        const {
            userId,
            exerciseName,
            previousWeight,
            newWeight,
            weightIncrease,
            repsAchieved,
            targetReps,
            successful,
            formQuality,
            timestamp
        } = progressionData;

        const { data, error } = await supabase
            .from('ml_progression_data')
            .insert([{
                user_id: userId,
                exercise_name: exerciseName,
                previous_weight: previousWeight,
                new_weight: newWeight,
                weight_increase: weightIncrease,
                reps_achieved: repsAchieved,
                target_reps: targetReps,
                successful: successful,
                form_quality: formQuality,
                timestamp: timestamp || new Date().toISOString()
            }]);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Progression Data Collection Error:', error);
        return { success: false, error };
    }
};

/**
 * Export training data for ML model training
 * This will be used by data scientists to train models
 */
export const exportTrainingData = async (dataType = 'workout_completion', limit = 10000) => {
    try {
        const tableName = {
            'workout_completion': 'ml_training_data',
            'recovery': 'ml_recovery_data',
            'progression': 'ml_progression_data'
        }[dataType];

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Convert to CSV format for easy ML processing
        return {
            success: true,
            data,
            csv: convertToCSV(data)
        };
    } catch (error) {
        console.error('Export Error:', error);
        return { success: false, error };
    }
};

/**
 * Helper: Convert data to CSV format
 */
const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(header => JSON.stringify(row[header] ?? '')).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
};

/**
 * Get ML training data statistics
 */
export const getMLDataStats = async () => {
    try {
        const stats = {};

        // Count records in each table
        const tables = ['ml_training_data', 'ml_recovery_data', 'ml_progression_data'];

        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (!error) {
                stats[table] = count;
            }
        }

        // Calculate if we have enough data for ML training
        const minRecordsNeeded = 1000; // Minimum for basic ML
        const optimalRecordsNeeded = 10000; // Optimal for good accuracy

        stats.readyForTraining = stats.ml_training_data >= minRecordsNeeded;
        stats.optimalDataReached = stats.ml_training_data >= optimalRecordsNeeded;
        stats.progress = Math.min(100, (stats.ml_training_data / optimalRecordsNeeded) * 100);

        return { success: true, stats };
    } catch (error) {
        console.error('Stats Error:', error);
        return { success: false, error };
    }
};
