import { differenceInDays } from 'date-fns';

// ============================================
// BODY COMPOSITION ANALYZER
// ============================================
// Analyzes body composition changes over time
// Correlates with training and nutrition data
// Provides predictions and insights

/**
 * Analyze body composition changes
 * @param {Array} measurements - Body measurement logs
 * @param {Array} workouts - Workout history
 * @param {Array} nutritionLogs - Nutrition logs (optional)
 * @param {Object} userProfile - User profile data (optional)
 * @returns {Object} Analysis with insights and predictions
 */
export const analyzeBodyComposition = (measurements, workouts, nutritionLogs = [], userProfile = {}) => {
    if (!measurements || measurements.length < 2) {
        return {
            status: 'insufficient_data',
            message: 'Need at least 2 measurements to analyze trends',
            recommendation: 'Log your weight regularly to track progress'
        };
    }

    // Sort measurements by date (newest first)
    const sortedMeasurements = [...measurements].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    const latest = sortedMeasurements[0];
    const oldest = sortedMeasurements[sortedMeasurements.length - 1];
    const daysBetween = differenceInDays(new Date(latest.date), new Date(oldest.date));
    const weeksBetween = daysBetween / 7;

    // Weight change analysis
    const weightChange = parseFloat(latest.weight) - parseFloat(oldest.weight);
    const weightChangePerWeek = weeksBetween > 0 ? weightChange / weeksBetween : 0;

    // Get training data for same period
    const periodWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate >= new Date(oldest.date) && workoutDate <= new Date(latest.date);
    });

    // Calculate average volume
    const trainingWorkouts = periodWorkouts.filter(w => w.type !== 'rest_day');
    const avgVolume = trainingWorkouts.length > 0 
        ? trainingWorkouts.reduce((sum, w) => {
            const volume = w.exercises?.reduce((v, ex) => {
                return v + ex.sets.reduce((s, set) => s + (set.reps * set.weight), 0);
            }, 0) || 0;
            return sum + volume;
        }, 0) / trainingWorkouts.length
        : 0;

    // Get strength progression
    const strengthGain = analyzeStrengthProgression(periodWorkouts);

    // Determine composition change type
    let compositionType = 'maintaining';
    let insight = '';
    let emoji = '➡️';

    if (weightChange > 0.5) {
        if (strengthGain > 10) {
            compositionType = 'muscle_gain';
            emoji = '💪';
            insight = `Gaining muscle! Weight up ${weightChange.toFixed(1)}kg, strength up ${strengthGain.toFixed(0)}%`;
        } else if (strengthGain > 0) {
            compositionType = 'weight_gain';
            emoji = '📈';
            insight = `Weight gain with modest strength increase. Continue training consistently.`;
        } else {
            compositionType = 'weight_gain';
            emoji = '⚠️';
            insight = `Weight gain without strength increase. Consider adjusting nutrition or training intensity.`;
        }
    } else if (weightChange < -0.5) {
        if (strengthGain > -5) {
            compositionType = 'fat_loss';
            emoji = '🔥';
            insight = `Losing fat while maintaining strength! Weight down ${Math.abs(weightChange).toFixed(1)}kg`;
        } else {
            compositionType = 'muscle_loss';
            emoji = '⚠️';
            insight = `Losing weight and strength. Increase calories and protein to preserve muscle.`;
        }
    } else {
        if (strengthGain > 5) {
            compositionType = 'recomposition';
            emoji = '⭐';
            insight = `Body recomposition! Stable weight but strength up ${strengthGain.toFixed(0)}%`;
        } else {
            emoji = '➡️';
            insight = `Maintaining current composition`;
        }
    }

    // Predict future weight
    let prediction = null;
    if (userProfile.target_weight && weeksBetween > 2) {
        const targetWeight = parseFloat(userProfile.target_weight);
        const currentWeight = parseFloat(latest.weight);
        const weightToGo = targetWeight - currentWeight;
        
        if (Math.abs(weightChangePerWeek) > 0.1) {
            const weeksToGoal = weightToGo / weightChangePerWeek;
            const estimatedDate = new Date(Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000);
            
            prediction = {
                weeksToGoal: Math.abs(weeksToGoal).toFixed(1),
                estimatedDate: estimatedDate.toISOString().split('T')[0],
                onTrack: (weightChange > 0 && weightToGo > 0) || (weightChange < 0 && weightToGo < 0),
                message: Math.abs(weeksToGoal) < 52 
                    ? `At this rate, you'll reach ${targetWeight}kg in ${Math.abs(weeksToGoal).toFixed(0)} weeks`
                    : `Current rate is very slow. Consider adjusting your approach.`
            };
        }
    }

    // Body fat percentage change (if available)
    let bodyFatChange = null;
    if (latest.body_fat_percentage && oldest.body_fat_percentage) {
        const bfChange = parseFloat(latest.body_fat_percentage) - parseFloat(oldest.body_fat_percentage);
        bodyFatChange = {
            change: bfChange,
            changePerWeek: weeksBetween > 0 ? bfChange / weeksBetween : 0,
            current: parseFloat(latest.body_fat_percentage),
            previous: parseFloat(oldest.body_fat_percentage)
        };
    }

    return {
        status: 'analyzed',
        current: {
            weight: parseFloat(latest.weight),
            bodyFat: latest.body_fat_percentage ? parseFloat(latest.body_fat_percentage) : null,
            date: latest.date
        },
        change: {
            weight: weightChange,
            weightPerWeek: weightChangePerWeek,
            weeks: weeksBetween,
            days: daysBetween
        },
        composition: {
            type: compositionType,
            insight,
            emoji,
            strengthGain,
            avgVolume: avgVolume.toFixed(0)
        },
        prediction,
        bodyFatChange,
        trainingStats: {
            totalWorkouts: trainingWorkouts.length,
            avgWorkoutsPerWeek: weeksBetween > 0 ? (trainingWorkouts.length / weeksBetween).toFixed(1) : 0
        }
    };
};

/**
 * Analyze strength progression over a period
 * @param {Array} workouts - Workouts to analyze
 * @returns {Number} Percentage strength gain
 */
const analyzeStrengthProgression = (workouts) => {
    if (workouts.length < 2) return 0;

    const trainingWorkouts = workouts.filter(w => w.type !== 'rest_day');
    if (trainingWorkouts.length < 2) return 0;

    // Compare first 3 and last 3 workouts
    const firstWorkouts = trainingWorkouts.slice(-3);
    const lastWorkouts = trainingWorkouts.slice(0, 3);

    const firstAvgVolume = calculateAverageVolume(firstWorkouts);
    const lastAvgVolume = calculateAverageVolume(lastWorkouts);

    if (firstAvgVolume === 0) return 0;

    return ((lastAvgVolume - firstAvgVolume) / firstAvgVolume) * 100;
};

/**
 * Calculate average volume across workouts
 * @param {Array} workouts - Workouts to analyze
 * @returns {Number} Average volume
 */
const calculateAverageVolume = (workouts) => {
    const totalVolume = workouts.reduce((sum, w) => {
        return sum + (w.exercises?.reduce((v, ex) => {
            return v + ex.sets.reduce((s, set) => s + (set.reps * set.weight), 0);
        }, 0) || 0);
    }, 0);

    return workouts.length > 0 ? totalVolume / workouts.length : 0;
};

/**
 * Get weight trend over specified period
 * @param {Array} measurements - Body measurements
 * @param {Number} days - Number of days to analyze
 * @returns {Object} Trend analysis
 */
export const getWeightTrend = (measurements, days = 30) => {
    if (!measurements || measurements.length < 2) {
        return { trend: 'unknown', message: 'Not enough data' };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentMeasurements = measurements
        .filter(m => new Date(m.date) >= cutoffDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (recentMeasurements.length < 2) {
        return { trend: 'unknown', message: 'Not enough recent data' };
    }

    const first = recentMeasurements[0];
    const last = recentMeasurements[recentMeasurements.length - 1];
    const change = parseFloat(last.weight) - parseFloat(first.weight);
    const percentage = (change / parseFloat(first.weight)) * 100;

    let trend = 'stable';
    let emoji = '➡️';
    let message = 'Weight is stable';

    if (change > 0.5) {
        trend = 'gaining';
        emoji = '📈';
        message = `Gaining ${change.toFixed(1)}kg (${percentage.toFixed(1)}%)`;
    } else if (change < -0.5) {
        trend = 'losing';
        emoji = '📉';
        message = `Losing ${Math.abs(change).toFixed(1)}kg (${Math.abs(percentage).toFixed(1)}%)`;
    }

    return {
        trend,
        emoji,
        message,
        change: change.toFixed(1),
        percentage: percentage.toFixed(1),
        period: days
    };
};

/**
 * Calculate BMI from weight and height
 * @param {Number} weight - Weight in kg
 * @param {Number} height - Height in cm
 * @returns {Object} BMI and category
 */
export const calculateBMI = (weight, height) => {
    if (!weight || !height || height === 0) {
        return { bmi: null, category: 'Unknown', message: 'Missing data' };
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    let category = '';
    let emoji = '';
    let message = '';

    if (bmi < 18.5) {
        category = 'Underweight';
        emoji = '⚠️';
        message = 'Consider increasing calorie intake';
    } else if (bmi < 25) {
        category = 'Normal';
        emoji = '✅';
        message = 'Healthy weight range';
    } else if (bmi < 30) {
        category = 'Overweight';
        emoji = '⚡';
        message = 'Consider a balanced diet and exercise';
    } else {
        category = 'Obese';
        emoji = '⚠️';
        message = 'Consult a healthcare professional';
    }

    return {
        bmi: bmi.toFixed(1),
        category,
        emoji,
        message
    };
};

/**
 * Predict weight change rate
 * @param {Array} measurements - Body measurements
 * @param {Number} weeks - Number of weeks to predict
 * @returns {Object} Prediction
 */
export const predictWeightChangeRate = (measurements, weeks = 4) => {
    if (!measurements || measurements.length < 2) {
        return { 
            status: 'insufficient_data',
            message: 'Need at least 2 measurements to predict' 
        };
    }

    const sorted = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    const daysBetween = differenceInDays(new Date(last.date), new Date(first.date));
    const weeksBetween = daysBetween / 7;

    if (weeksBetween < 1) {
        return {
            status: 'insufficient_time',
            message: 'Need at least 1 week of data'
        };
    }

    const weightChange = parseFloat(last.weight) - parseFloat(first.weight);
    const changePerWeek = weightChange / weeksBetween;
    const predictedChange = changePerWeek * weeks;
    const predictedWeight = parseFloat(last.weight) + predictedChange;

    return {
        status: 'predicted',
        changePerWeek: changePerWeek.toFixed(2),
        totalChange: predictedChange.toFixed(1),
        weeks: weeks.toString(),
        predictedWeight: predictedWeight.toFixed(1),
        currentWeight: parseFloat(last.weight).toFixed(1),
        message: `At current rate: ${changePerWeek > 0 ? '+' : ''}${changePerWeek.toFixed(2)}kg/week`
    };
};
