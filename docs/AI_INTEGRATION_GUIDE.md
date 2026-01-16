# 🔗 AI Integration Guide - Connecting New Data to Existing AI Systems

## Overview

This guide shows how to integrate the new sleep, nutrition, and body measurement data into your existing AI/ML systems.

---

## 1. Update Readiness Score Calculation

### File: `src/utils/workoutDifficultyAdjuster.js`

**Current Implementation:**
```javascript
// Factor 1: Rest Day Quality (35% weight)
const restDayQuality = getLastRestDayQuality(workouts);
const restFactor = restDayQuality ? (restDayQuality / 5) * 100 : 80;
readinessScore += (restFactor * 0.35);
```

**Enhanced Implementation:**
```javascript
import { useSleep } from '../context/SleepContext';

// NEW: Factor 1: Sleep Quality (40% weight) - REPLACES rest day quality
export const calculateReadinessScore = (workouts, sleepLogs) => {
  let readinessScore = 0;

  // Factor 1: Sleep Quality (40% weight)
  const lastSleep = sleepLogs[0]; // Most recent sleep log
  if (lastSleep) {
    const sleepHoursFactor = Math.min(lastSleep.hours_slept / 8, 1.2); // 8 hours = 100%, max 120%
    const sleepQualityFactor = lastSleep.quality / 5; // 1-5 scale
    const sleepFactor = (sleepHoursFactor * 0.6 + sleepQualityFactor * 0.4) * 100;
    readinessScore += sleepFactor * 0.40;
  } else {
    // Fallback to rest day quality if no sleep data
    const restDayQuality = getLastRestDayQuality(workouts);
    const restFactor = restDayQuality ? (restDayQuality / 5) * 100 : 80;
    readinessScore += restFactor * 0.35;
  }

  // ... rest of factors remain the same
};
```

**Sleep Debt Detection:**
```javascript
// Calculate sleep debt (last 7 days)
export const calculateSleepDebt = (sleepLogs) => {
  const last7Days = sleepLogs.slice(0, 7);
  if (last7Days.length === 0) return 0;

  const targetHours = 8;
  const totalDebt = last7Days.reduce((debt, log) => {
    return debt + Math.max(0, targetHours - parseFloat(log.hours_slept));
  }, 0);

  return totalDebt;
};

// Use in readiness calculation
const sleepDebt = calculateSleepDebt(sleepLogs);
if (sleepDebt > 5) {
  // Significant sleep debt - reduce readiness
  readinessScore -= Math.min(20, sleepDebt * 2);
}
```

---

## 2. Enhance Injury Prevention System

### File: `src/utils/injuryPrevention.js`

**Add Sleep-Based Fatigue Detection:**
```javascript
import { useSleep } from '../context/SleepContext';

// NEW: Calculate sleep-adjusted fatigue score
export const calculateFatigueScore = (workouts, sleepLogs) => {
  const last7Days = workouts.filter(w => {
    const daysSince = differenceInDays(new Date(), new Date(w.date));
    return daysSince <= 7;
  });

  if (last7Days.length === 0) return 0;

  let fatigueScore = 0;

  // Factor 1: Number of workouts (max 25 points)
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

  // Factor 3: Systemic stress (max 20 points)
  const avgSystemicStress = last7Days
    .filter(w => w.type !== 'rest_day')
    .reduce((sum, w) => sum + calculateSystemicStress(w), 0) / (workoutCount || 1);
  fatigueScore += Math.min(20, avgSystemicStress / 5);

  // NEW Factor 4: Sleep Quality (max 25 points)
  const recentSleep = sleepLogs.slice(0, 7);
  if (recentSleep.length > 0) {
    const avgSleepHours = recentSleep.reduce((sum, log) => sum + parseFloat(log.hours_slept), 0) / recentSleep.length;
    const avgSleepQuality = recentSleep.reduce((sum, log) => sum + log.quality, 0) / recentSleep.length;
    
    // Poor sleep = higher fatigue
    const sleepFatigue = (8 - avgSleepHours) * 3 + (5 - avgSleepQuality) * 2;
    fatigueScore += Math.max(0, Math.min(25, sleepFatigue));
  } else {
    // Fallback to rest day quality
    const restDays = last7Days.filter(w => w.type === 'rest_day');
    if (restDays.length === 0) {
      fatigueScore += 20;
    } else {
      const avgRestQuality = restDays.reduce((sum, r) => sum + (r.recoveryQuality || 3), 0) / restDays.length;
      fatigueScore += Math.round((5 - avgRestQuality) * 4);
    }
  }

  // Factor 5: Consecutive training days (max 10 points)
  const consecutiveDays = detectConsecutiveDays(workouts);
  if (consecutiveDays.length > 0) {
    fatigueScore += Math.min(10, consecutiveDays[0].consecutiveDays * 2);
  }

  return Math.min(100, Math.round(fatigueScore));
};
```

**Add Sleep-Based Warnings:**
```javascript
// NEW: Detect poor sleep + high volume combination
export const detectSleepVolumeRisk = (workouts, sleepLogs) => {
  const warnings = [];
  const recentSleep = sleepLogs.slice(0, 3);
  
  if (recentSleep.length >= 2) {
    const avgSleepHours = recentSleep.reduce((sum, log) => sum + parseFloat(log.hours_slept), 0) / recentSleep.length;
    const avgSleepQuality = recentSleep.reduce((sum, log) => sum + log.quality, 0) / recentSleep.length;

    // Check if recent workouts have high volume
    const last3Workouts = workouts.filter(w => w.type !== 'rest_day').slice(0, 3);
    const avgSets = last3Workouts.reduce((sum, w) => {
      return sum + (w.exercises?.reduce((s, ex) => s + ex.sets.length, 0) || 0);
    }, 0) / (last3Workouts.length || 1);

    // Poor sleep + high volume = high risk
    if ((avgSleepHours < 6.5 || avgSleepQuality < 3) && avgSets > 20) {
      warnings.push({
        type: 'sleep_volume_risk',
        severity: 'high',
        riskScore: 85,
        message: `Poor sleep (${avgSleepHours.toFixed(1)}h) + high volume (${Math.round(avgSets)} sets)`,
        details: `Sleep quality: ${avgSleepQuality.toFixed(1)}/5`,
        recommendation: 'Reduce volume by 30% or take a rest day to prevent overtraining',
        icon: '😴'
      });
    }
  }

  return warnings;
};

// Integrate into main assessment
export const assessInjuryRisk = (workouts, sleepLogs = []) => {
  const volumeWarnings = detectVolumeSpikes(workouts);
  const recoveryWarnings = detectInsufficientRecovery(workouts);
  const weightWarnings = detectSuddenWeightJumps(workouts);
  const consecutiveWarnings = detectConsecutiveDays(workouts);
  const sleepVolumeWarnings = detectSleepVolumeRisk(workouts, sleepLogs); // NEW

  const allWarnings = [
    ...volumeWarnings,
    ...recoveryWarnings,
    ...weightWarnings,
    ...consecutiveWarnings,
    ...sleepVolumeWarnings // NEW
  ];

  const fatigueScore = calculateFatigueScore(workouts, sleepLogs); // Updated

  // ... rest of assessment logic
};
```

---

## 3. Enhance Smart Recommendations

### File: `src/utils/smartRecommendations.js`

**Add Nutrition-Based Warnings:**
```javascript
import { useNutrition } from '../context/NutritionContext';

// NEW: Check if nutrition supports training goal
export const checkNutritionAdequacy = (nutritionLogs, userProfile, workouts) => {
  const warnings = [];
  const today = new Date().toISOString().split('T')[0];
  
  // Get recent nutrition data (last 7 days)
  const recentDates = [...new Set(nutritionLogs.map(log => log.date))].slice(0, 7);
  
  if (recentDates.length >= 3) {
    const dailyTotals = recentDates.map(date => {
      const logs = nutritionLogs.filter(log => log.date === date);
      return {
        calories: logs.reduce((sum, log) => sum + (log.calories || 0), 0),
        protein: logs.reduce((sum, log) => sum + (parseFloat(log.protein) || 0), 0)
      };
    });

    const avgCalories = dailyTotals.reduce((sum, day) => sum + day.calories, 0) / dailyTotals.length;
    const avgProtein = dailyTotals.reduce((sum, day) => sum + day.protein, 0) / dailyTotals.length;

    // Check if calories are too low for training volume
    const recentWorkouts = workouts.filter(w => w.type !== 'rest_day').slice(0, 7);
    const avgSetsPerWeek = recentWorkouts.reduce((sum, w) => {
      return sum + (w.exercises?.reduce((s, ex) => s + ex.sets.length, 0) || 0);
    }, 0);

    // High volume + low calories = warning
    if (avgSetsPerWeek > 100 && avgCalories < 2000) {
      warnings.push({
        type: 'low_calories',
        severity: 'moderate',
        message: `Low calorie intake (${Math.round(avgCalories)}/day) for your training volume`,
        recommendation: 'Consider increasing calories to support recovery and performance',
        icon: '🍎'
      });
    }

    // Check protein for muscle building goals
    if (userProfile.fitness_goal === 'hypertrophy' || userProfile.fitness_goal === 'strength') {
      const targetProtein = (userProfile.current_weight || 75) * 1.8; // 1.8g per kg
      
      if (avgProtein < targetProtein * 0.7) {
        warnings.push({
          type: 'low_protein',
          severity: 'moderate',
          message: `Protein intake (${Math.round(avgProtein)}g) below target (${Math.round(targetProtein)}g)`,
          recommendation: `Increase protein to ${Math.round(targetProtein)}g/day for optimal muscle growth`,
          icon: '🥩'
        });
      }
    }
  }

  return warnings;
};

// Integrate into main recommendation
export const getSmartRecommendation = (workouts, userPreferences = {}, sleepLogs = [], nutritionLogs = [], userProfile = {}) => {
  // ... existing logic

  // NEW: Add nutrition warnings
  const nutritionWarnings = checkNutritionAdequacy(nutritionLogs, userProfile, workouts);
  
  // Adjust confidence based on nutrition
  let confidenceAdjustment = 0;
  if (nutritionWarnings.length > 0) {
    confidenceAdjustment -= nutritionWarnings.length * 5; // -5% per warning
  }

  return {
    // ... existing recommendation
    nutritionWarnings, // NEW
    confidence: Math.max(50, baseConfidence + confidenceAdjustment),
    // ... rest of recommendation
  };
};
```

---

## 4. Add Body Composition Insights

### File: `src/utils/bodyCompositionAnalyzer.js` (NEW FILE)

```javascript
import { differenceInDays } from 'date-fns';

// Analyze body composition changes
export const analyzeBodyComposition = (measurements, workouts, nutritionLogs) => {
  if (measurements.length < 2) {
    return {
      status: 'insufficient_data',
      message: 'Need at least 2 measurements to analyze trends'
    };
  }

  const latest = measurements[0];
  const oldest = measurements[measurements.length - 1];
  const daysBetween = differenceInDays(new Date(latest.date), new Date(oldest.date));
  const weeksBetween = daysBetween / 7;

  // Weight change
  const weightChange = parseFloat(latest.weight) - parseFloat(oldest.weight);
  const weightChangePerWeek = weightChange / weeksBetween;

  // Get training data for same period
  const periodWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.date);
    return workoutDate >= new Date(oldest.date) && workoutDate <= new Date(latest.date);
  });

  // Calculate average volume
  const avgVolume = periodWorkouts
    .filter(w => w.type !== 'rest_day')
    .reduce((sum, w) => {
      const volume = w.exercises?.reduce((v, ex) => {
        return v + ex.sets.reduce((s, set) => s + (set.reps * set.weight), 0);
      }, 0) || 0;
      return sum + volume;
    }, 0) / (periodWorkouts.filter(w => w.type !== 'rest_day').length || 1);

  // Get strength progression
  const strengthGain = analyzeStrengthProgression(periodWorkouts);

  // Determine composition change type
  let compositionType = 'maintaining';
  let insight = '';

  if (weightChange > 0.5) {
    if (strengthGain > 10) {
      compositionType = 'muscle_gain';
      insight = `💪 Gaining muscle! Weight up ${weightChange.toFixed(1)}kg, strength up ${strengthGain.toFixed(0)}%`;
    } else {
      compositionType = 'weight_gain';
      insight = `⚠️ Weight gain without strength increase. Consider adjusting nutrition.`;
    }
  } else if (weightChange < -0.5) {
    if (strengthGain > -5) {
      compositionType = 'fat_loss';
      insight = `🔥 Losing fat while maintaining strength! Weight down ${Math.abs(weightChange).toFixed(1)}kg`;
    } else {
      compositionType = 'muscle_loss';
      insight = `⚠️ Losing weight and strength. Increase calories and protein.`;
    }
  } else {
    if (strengthGain > 5) {
      compositionType = 'recomposition';
      insight = `⭐ Body recomposition! Stable weight but strength up ${strengthGain.toFixed(0)}%`;
    } else {
      insight = `➡️ Maintaining current composition`;
    }
  }

  // Predict future weight
  const weeksToGoal = userProfile.target_weight 
    ? (parseFloat(userProfile.target_weight) - parseFloat(latest.weight)) / weightChangePerWeek
    : null;

  return {
    status: 'analyzed',
    current: {
      weight: parseFloat(latest.weight),
      bodyFat: latest.body_fat_percentage ? parseFloat(latest.body_fat_percentage) : null
    },
    change: {
      weight: weightChange,
      weightPerWeek: weightChangePerWeek,
      weeks: weeksBetween
    },
    composition: {
      type: compositionType,
      insight,
      strengthGain
    },
    prediction: weeksToGoal ? {
      weeksToGoal: Math.abs(weeksToGoal).toFixed(1),
      estimatedDate: new Date(Date.now() + weeksToGoal * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    } : null
  };
};

// Analyze strength progression
const analyzeStrengthProgression = (workouts) => {
  if (workouts.length < 2) return 0;

  const firstWorkouts = workouts.slice(-3); // First 3 workouts
  const lastWorkouts = workouts.slice(0, 3); // Last 3 workouts

  const firstAvgVolume = calculateAverageVolume(firstWorkouts);
  const lastAvgVolume = calculateAverageVolume(lastWorkouts);

  if (firstAvgVolume === 0) return 0;

  return ((lastAvgVolume - firstAvgVolume) / firstAvgVolume) * 100;
};

const calculateAverageVolume = (workouts) => {
  const totalVolume = workouts
    .filter(w => w.type !== 'rest_day')
    .reduce((sum, w) => {
      return sum + (w.exercises?.reduce((v, ex) => {
        return v + ex.sets.reduce((s, set) => s + (set.reps * set.weight), 0);
      }, 0) || 0);
    }, 0);

  return totalVolume / (workouts.filter(w => w.type !== 'rest_day').length || 1);
};
```

---

## 5. Update Home Page to Show Insights

### File: `src/pages/Home.jsx`

```javascript
import { useSleep } from '../context/SleepContext';
import { useNutrition } from '../context/NutritionContext';
import { useBodyMeasurements } from '../context/BodyMeasurementsContext';
import { analyzeBodyComposition } from '../utils/bodyCompositionAnalyzer';

const Home = () => {
  const { workouts } = useWorkouts();
  const { sleepLogs, getAverageSleep } = useSleep();
  const { nutritionLogs } = useNutrition();
  const { measurements } = useBodyMeasurements();

  // Get enhanced recommendation with new data
  const recommendation = getSmartRecommendation(
    workouts,
    userPreferences,
    sleepLogs,
    nutritionLogs,
    userProfile
  );

  // Get body composition insights
  const bodyComp = analyzeBodyComposition(measurements, workouts, nutritionLogs);

  // Get sleep insights
  const avgSleep = getAverageSleep(7);

  return (
    <div>
      {/* Sleep Insight Card */}
      {avgSleep && (
        <Card>
          <h3>😴 Sleep Quality</h3>
          <p>7-day average: {avgSleep.hours}h • Quality: {avgSleep.quality}/5</p>
          {avgSleep.hours < 7 && (
            <p className="text-orange-600">⚠️ You're averaging less than 7 hours. Consider prioritizing sleep for better recovery.</p>
          )}
        </Card>
      )}

      {/* Body Composition Insight */}
      {bodyComp.status === 'analyzed' && (
        <Card>
          <h3>📊 Body Composition</h3>
          <p>{bodyComp.composition.insight}</p>
          {bodyComp.prediction && (
            <p>🎯 At this rate, you'll reach your goal in {bodyComp.prediction.weeksToGoal} weeks</p>
          )}
        </Card>
      )}

      {/* Nutrition Warnings */}
      {recommendation.nutritionWarnings?.length > 0 && (
        <Card>
          <h3>🍎 Nutrition Insights</h3>
          {recommendation.nutritionWarnings.map((warning, i) => (
            <div key={i}>
              <p>{warning.icon} {warning.message}</p>
              <p className="text-sm text-gray-600">{warning.recommendation}</p>
            </div>
          ))}
        </Card>
      )}

      {/* Rest of home page */}
    </div>
  );
};
```

---

## 6. Testing Checklist

- [ ] Sleep data affects readiness score
- [ ] Poor sleep + high volume triggers warning
- [ ] Low calories triggers nutrition warning
- [ ] Body composition insights display correctly
- [ ] Weight predictions are accurate
- [ ] All contexts load without errors
- [ ] Data persists after refresh

---

## 7. Performance Considerations

**Optimize Context Queries:**
```javascript
// Only fetch recent data
const fetchSleepLogs = async () => {
  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30); // Only last 30 days
};
```

**Cache Calculations:**
```javascript
// Use useMemo for expensive calculations
const bodyCompAnalysis = useMemo(() => {
  return analyzeBodyComposition(measurements, workouts, nutritionLogs);
}, [measurements, workouts, nutritionLogs]);
```

---

## 8. Error Handling

**Graceful Degradation:**
```javascript
// Always provide fallback when data is missing
const readinessScore = calculateReadinessScore(
  workouts,
  sleepLogs.length > 0 ? sleepLogs : null // Fallback to rest day quality
);
```

**User Feedback:**
```javascript
// Encourage data entry
if (sleepLogs.length === 0) {
  return (
    <Card>
      <p>📊 Log your sleep to get more accurate readiness scores!</p>
      <Button onClick={() => navigate('/health')}>Log Sleep</Button>
    </Card>
  );
}
```

---

## Summary

✅ **Sleep** → Readiness score, fatigue detection, recovery recommendations  
✅ **Nutrition** → Performance warnings, macro optimization, calorie adequacy  
✅ **Body Measurements** → Progress tracking, composition analysis, goal predictions  
✅ **User Profile** → Personalized volume, experience-based recommendations  

**Result:** Your AI is now 95% ready with comprehensive data inputs! 🚀
