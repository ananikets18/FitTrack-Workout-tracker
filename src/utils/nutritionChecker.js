// ============================================
// NUTRITION CHECKER
// ============================================
// Checks if nutrition supports training goals
// Provides warnings and recommendations

/**
 * Check if nutrition is adequate for training goals
 * @param {Array} nutritionLogs - Nutrition logs
 * @param {Object} userProfile - User profile with goals
 * @param {Array} workouts - Recent workouts for context
 * @returns {Array} Array of nutrition warnings
 */
export const checkNutritionAdequacy = (nutritionLogs, userProfile = {}, workouts = []) => {
    const warnings = [];

    if (!nutritionLogs || nutritionLogs.length === 0) {
        return warnings; // No data, no warnings
    }

    // Get recent nutrition data (last 7 days)
    const recentDates = [...new Set(nutritionLogs.map(log => log.date))].slice(0, 7);

    if (recentDates.length < 3) {
        // Not enough data for meaningful analysis
        return warnings;
    }

    // Calculate daily totals for each date
    const dailyTotals = recentDates.map(date => {
        const logs = nutritionLogs.filter(log => log.date === date);
        return {
            date,
            calories: logs.reduce((sum, log) => sum + (log.calories || 0), 0),
            protein: logs.reduce((sum, log) => sum + (parseFloat(log.protein) || 0), 0),
            carbs: logs.reduce((sum, log) => sum + (parseFloat(log.carbs) || 0), 0),
            fats: logs.reduce((sum, log) => sum + (parseFloat(log.fats) || 0), 0)
        };
    });

    // Calculate averages
    const avgCalories = dailyTotals.reduce((sum, day) => sum + day.calories, 0) / dailyTotals.length;
    const avgProtein = dailyTotals.reduce((sum, day) => sum + day.protein, 0) / dailyTotals.length;
    const avgCarbs = dailyTotals.reduce((sum, day) => sum + day.carbs, 0) / dailyTotals.length;
    const avgFats = dailyTotals.reduce((sum, day) => sum + day.fats, 0) / dailyTotals.length;

    // Get recent training volume
    const recentWorkouts = workouts.filter(w => w.type !== 'rest_day').slice(0, 7);
    const avgSetsPerWeek = recentWorkouts.reduce((sum, w) => {
        return sum + (w.exercises?.reduce((s, ex) => s + ex.sets.length, 0) || 0);
    }, 0);

    // Check 1: Calories vs Training Volume
    // High volume + low calories = warning
    if (avgSetsPerWeek > 100 && avgCalories < 2000) {
        warnings.push({
            type: 'low_calories',
            severity: 'moderate',
            message: `Low calorie intake (${Math.round(avgCalories)}/day) for your training volume`,
            details: `You're averaging ${avgSetsPerWeek} sets/week`,
            recommendation: 'Consider increasing calories to support recovery and performance',
            icon: '🍎'
        });
    }

    // Check 2: Protein for Muscle Building Goals
    if (userProfile.fitness_goal === 'hypertrophy' || userProfile.fitness_goal === 'strength') {
        const currentWeight = userProfile.current_weight || 75; // Default 75kg
        const targetProtein = currentWeight * 1.8; // 1.8g per kg for muscle building

        if (avgProtein < targetProtein * 0.7) {
            warnings.push({
                type: 'low_protein',
                severity: 'moderate',
                message: `Protein intake (${Math.round(avgProtein)}g) below target (${Math.round(targetProtein)}g)`,
                details: `Target: ${Math.round(targetProtein)}g/day (1.8g per kg body weight)`,
                recommendation: `Increase protein to ${Math.round(targetProtein)}g/day for optimal muscle growth`,
                icon: '🥩'
            });
        }
    }

    // Check 3: Very Low Calories (potential undereating)
    if (avgCalories < 1500) {
        warnings.push({
            type: 'very_low_calories',
            severity: 'high',
            message: `Very low calorie intake (${Math.round(avgCalories)}/day)`,
            details: 'This may affect recovery and performance',
            recommendation: 'Ensure adequate nutrition to support training and health',
            icon: '⚠️'
        });
    }

    // Check 4: Protein for Weight Loss Goals
    if (userProfile.fitness_goal === 'weight_loss' || userProfile.fitness_goal === 'fat_loss') {
        const currentWeight = userProfile.current_weight || 75;
        const targetProtein = currentWeight * 2.0; // Higher protein during cut

        if (avgProtein < targetProtein * 0.7) {
            warnings.push({
                type: 'low_protein_cutting',
                severity: 'moderate',
                message: `Protein too low for fat loss (${Math.round(avgProtein)}g)`,
                details: 'Higher protein helps preserve muscle during calorie deficit',
                recommendation: `Aim for ${Math.round(targetProtein)}g/day to maintain muscle mass`,
                icon: '🥩'
            });
        }
    }

    // Check 5: Carbs for High Volume Training
    if (avgSetsPerWeek > 120 && avgCarbs < 150) {
        warnings.push({
            type: 'low_carbs',
            severity: 'low',
            message: `Low carb intake (${Math.round(avgCarbs)}g) for high training volume`,
            details: 'Carbs fuel intense workouts',
            recommendation: 'Consider increasing carbs on training days for better performance',
            icon: '🍚'
        });
    }

    // Check 6: Calorie Deficit Detection
    const estimatedMaintenance = calculateEstimatedMaintenance(userProfile, avgSetsPerWeek);
    if (estimatedMaintenance && avgCalories < estimatedMaintenance - 500) {
        const deficit = estimatedMaintenance - avgCalories;

        if (userProfile.fitness_goal !== 'weight_loss' && userProfile.fitness_goal !== 'fat_loss') {
            warnings.push({
                type: 'unintended_deficit',
                severity: 'moderate',
                message: `Large calorie deficit (${Math.round(deficit)} cal/day)`,
                details: `Eating ${Math.round(avgCalories)} vs estimated ${Math.round(estimatedMaintenance)} maintenance`,
                recommendation: 'Increase calories if not intentionally cutting weight',
                icon: '📉'
            });
        }
    }

    return warnings;
};

/**
 * Calculate estimated maintenance calories
 * @param {Object} userProfile - User profile
 * @param {Number} avgSetsPerWeek - Average sets per week
 * @returns {Number|null} Estimated maintenance calories
 */
const calculateEstimatedMaintenance = (userProfile, avgSetsPerWeek) => {
    if (!userProfile.current_weight || !userProfile.height || !userProfile.age) {
        return null;
    }

    const weight = userProfile.current_weight;
    const height = userProfile.height;
    const age = userProfile.age;
    const gender = userProfile.gender || 'male';

    // Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Activity multiplier based on training volume
    let activityMultiplier = 1.2; // Sedentary baseline
    if (avgSetsPerWeek > 150) {
        activityMultiplier = 1.725; // Very active
    } else if (avgSetsPerWeek > 100) {
        activityMultiplier = 1.55; // Moderately active
    } else if (avgSetsPerWeek > 50) {
        activityMultiplier = 1.375; // Lightly active
    }

    return bmr * activityMultiplier;
};

/**
 * Get daily nutrition totals for a specific date
 * @param {Array} nutritionLogs - All nutrition logs
 * @param {String} date - Date to calculate for (YYYY-MM-DD)
 * @returns {Object} Daily totals
 */
export const getDailyTotals = (nutritionLogs, date) => {
    const logsForDate = nutritionLogs.filter(log => log.date === date);

    return {
        calories: logsForDate.reduce((sum, log) => sum + (log.calories || 0), 0),
        protein: logsForDate.reduce((sum, log) => sum + (parseFloat(log.protein) || 0), 0),
        carbs: logsForDate.reduce((sum, log) => sum + (parseFloat(log.carbs) || 0), 0),
        fats: logsForDate.reduce((sum, log) => sum + (parseFloat(log.fats) || 0), 0),
        meals: logsForDate.length
    };
};

/**
 * Get average nutrition over specified days
 * @param {Array} nutritionLogs - All nutrition logs
 * @param {Number} days - Number of days to average
 * @returns {Object} Average nutrition
 */
export const getAverageNutrition = (nutritionLogs, days = 7) => {
    const recentDates = [...new Set(nutritionLogs.map(log => log.date))].slice(0, 7);

    if (recentDates.length === 0) {
        return {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            daysTracked: 0
        };
    }

    const dailyTotals = recentDates.map(date => getDailyTotals(nutritionLogs, date));

    return {
        calories: Math.round(dailyTotals.reduce((sum, day) => sum + day.calories, 0) / dailyTotals.length),
        protein: Math.round(dailyTotals.reduce((sum, day) => sum + day.protein, 0) / dailyTotals.length),
        carbs: Math.round(dailyTotals.reduce((sum, day) => sum + day.carbs, 0) / dailyTotals.length),
        fats: Math.round(dailyTotals.reduce((sum, day) => sum + day.fats, 0) / dailyTotals.length),
        daysTracked: dailyTotals.length
    };
};
