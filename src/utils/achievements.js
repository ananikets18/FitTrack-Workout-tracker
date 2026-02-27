import { calculateStreak, calculateTotalVolume, kgToTons, calculateTotalReps, getActivityBreakdown } from './calculations';

// Achievement definitions
export const ACHIEVEMENTS = {
    // ─── Streak Achievements ────────────────────────────────────────────────
    STREAK_3: {
        id: 'streak_3',
        name: 'Habit Forming',
        description: 'Complete a 3-day workout streak',
        icon: '🌱',
        category: 'streak',
        requirement: 3,
        color: 'from-green-400 to-teal-400'
    },
    STREAK_7: {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Complete a 7-day workout streak',
        icon: '🔥',
        category: 'streak',
        requirement: 7,
        color: 'from-orange-500 to-red-500'
    },
    STREAK_14: {
        id: 'streak_14',
        name: 'Two-Week Titan',
        description: 'Complete a 14-day workout streak',
        icon: '💥',
        category: 'streak',
        requirement: 14,
        color: 'from-red-500 to-pink-500'
    },
    STREAK_30: {
        id: 'streak_30',
        name: 'Month Master',
        description: 'Complete a 30-day workout streak',
        icon: '⚡',
        category: 'streak',
        requirement: 30,
        color: 'from-yellow-500 to-orange-500'
    },
    STREAK_60: {
        id: 'streak_60',
        name: 'Iron Will',
        description: 'Complete a 60-day workout streak',
        icon: '🛡️',
        category: 'streak',
        requirement: 60,
        color: 'from-cyan-500 to-blue-500'
    },
    STREAK_100: {
        id: 'streak_100',
        name: 'Century Champion',
        description: 'Complete a 100-day workout streak',
        icon: '👑',
        category: 'streak',
        requirement: 100,
        color: 'from-purple-500 to-pink-500'
    },

    // ─── Volume Achievements ─────────────────────────────────────────────────
    VOLUME_1: {
        id: 'volume_1',
        name: 'First Lift',
        description: 'Lift a total of 1 ton',
        icon: '🏗️',
        category: 'volume',
        requirement: 1,
        color: 'from-sky-400 to-cyan-400'
    },
    VOLUME_10: {
        id: 'volume_10',
        name: 'Iron Starter',
        description: 'Lift a total of 10 tons',
        icon: '💪',
        category: 'volume',
        requirement: 10,
        color: 'from-blue-500 to-cyan-500'
    },
    VOLUME_50: {
        id: 'volume_50',
        name: 'Steel Lifter',
        description: 'Lift a total of 50 tons',
        icon: '🏋️',
        category: 'volume',
        requirement: 50,
        color: 'from-indigo-500 to-blue-500'
    },
    VOLUME_100: {
        id: 'volume_100',
        name: 'Titan of Iron',
        description: 'Lift a total of 100 tons',
        icon: '🦾',
        category: 'volume',
        requirement: 100,
        color: 'from-purple-600 to-indigo-600'
    },
    VOLUME_250: {
        id: 'volume_250',
        name: 'Iron God',
        description: 'Lift a total of 250 tons',
        icon: '⚙️',
        category: 'volume',
        requirement: 250,
        color: 'from-yellow-600 to-red-600'
    },
    VOLUME_500: {
        id: 'volume_500',
        name: 'Half Kiloton',
        description: 'Lift a total of 500 tons',
        icon: '🌋',
        category: 'volume',
        requirement: 500,
        color: 'from-red-700 to-rose-700'
    },

    // ─── PR Achievements ──────────────────────────────────────────────────────
    PR_FIRST: {
        id: 'pr_first',
        name: 'First Victory',
        description: 'Set your first personal record',
        icon: '🎯',
        category: 'pr',
        requirement: 1,
        color: 'from-green-500 to-emerald-500'
    },
    PR_5: {
        id: 'pr_5',
        name: 'Rising Star',
        description: 'Set 5 personal records',
        icon: '⭐',
        category: 'pr',
        requirement: 5,
        color: 'from-lime-500 to-green-500'
    },
    PR_10: {
        id: 'pr_10',
        name: 'Record Breaker',
        description: 'Set 10 personal records',
        icon: '🏆',
        category: 'pr',
        requirement: 10,
        color: 'from-yellow-500 to-amber-500'
    },
    PR_25: {
        id: 'pr_25',
        name: 'PR Collector',
        description: 'Set 25 personal records',
        icon: '🥇',
        category: 'pr',
        requirement: 25,
        color: 'from-amber-500 to-orange-500'
    },
    PR_50: {
        id: 'pr_50',
        name: 'PR Machine',
        description: 'Set 50 personal records',
        icon: '🌟',
        category: 'pr',
        requirement: 50,
        color: 'from-orange-500 to-red-500'
    },
    PR_100: {
        id: 'pr_100',
        name: 'Legendary Lifter',
        description: 'Set 100 personal records',
        icon: '🔱',
        category: 'pr',
        requirement: 100,
        color: 'from-violet-600 to-purple-600'
    },

    // ─── Workout Count Achievements ───────────────────────────────────────────
    WORKOUTS_1: {
        id: 'workouts_1',
        name: 'First Step',
        description: 'Complete your first workout',
        icon: '👟',
        category: 'workouts',
        requirement: 1,
        color: 'from-emerald-400 to-green-400'
    },
    WORKOUTS_10: {
        id: 'workouts_10',
        name: 'Getting Started',
        description: 'Complete 10 workouts',
        icon: '🎖️',
        category: 'workouts',
        requirement: 10,
        color: 'from-teal-500 to-cyan-500'
    },
    WORKOUTS_25: {
        id: 'workouts_25',
        name: 'Building Momentum',
        description: 'Complete 25 workouts',
        icon: '🚀',
        category: 'workouts',
        requirement: 25,
        color: 'from-sky-500 to-blue-500'
    },
    WORKOUTS_50: {
        id: 'workouts_50',
        name: 'Dedicated Athlete',
        description: 'Complete 50 workouts',
        icon: '🥇',
        category: 'workouts',
        requirement: 50,
        color: 'from-blue-600 to-indigo-600'
    },
    WORKOUTS_100: {
        id: 'workouts_100',
        name: 'Fitness Legend',
        description: 'Complete 100 workouts',
        icon: '💎',
        category: 'workouts',
        requirement: 100,
        color: 'from-violet-600 to-purple-600'
    },
    WORKOUTS_250: {
        id: 'workouts_250',
        name: 'Unstoppable',
        description: 'Complete 250 workouts',
        icon: '🌠',
        category: 'workouts',
        requirement: 250,
        color: 'from-fuchsia-600 to-pink-600'
    },
    WORKOUTS_500: {
        id: 'workouts_500',
        name: 'Hall of Fame',
        description: 'Complete 500 workouts',
        icon: '🏛️',
        category: 'workouts',
        requirement: 500,
        color: 'from-yellow-500 to-amber-600'
    },

    // ─── Reps Achievements ────────────────────────────────────────────────────
    REPS_1000: {
        id: 'reps_1000',
        name: 'Rep Rookie',
        description: 'Complete 1,000 total reps',
        icon: '🔄',
        category: 'reps',
        requirement: 1000,
        color: 'from-sky-400 to-cyan-500'
    },
    REPS_5000: {
        id: 'reps_5000',
        name: 'Rep Grinder',
        description: 'Complete 5,000 total reps',
        icon: '⚙️',
        category: 'reps',
        requirement: 5000,
        color: 'from-blue-500 to-indigo-500'
    },
    REPS_10000: {
        id: 'reps_10000',
        name: 'Rep Machine',
        description: 'Complete 10,000 total reps',
        icon: '🤖',
        category: 'reps',
        requirement: 10000,
        color: 'from-indigo-600 to-purple-600'
    },
    REPS_50000: {
        id: 'reps_50000',
        name: 'Rep Immortal',
        description: 'Complete 50,000 total reps',
        icon: '♾️',
        category: 'reps',
        requirement: 50000,
        color: 'from-purple-600 to-fuchsia-600'
    },

    // ─── Rest Day Achievements ────────────────────────────────────────────────
    REST_FIRST: {
        id: 'rest_first',
        name: 'Smart Recovery',
        description: 'Log your first rest day',
        icon: '😴',
        category: 'rest',
        requirement: 1,
        color: 'from-slate-400 to-slate-500'
    },
    REST_10: {
        id: 'rest_10',
        name: 'Recovery Pro',
        description: 'Log 10 rest days',
        icon: '🛌',
        category: 'rest',
        requirement: 10,
        color: 'from-blue-400 to-slate-500'
    },

    // ─── Variety Achievements ─────────────────────────────────────────────────
    VARIETY_3: {
        id: 'variety_3',
        name: 'Well Rounded',
        description: 'Train 3 different muscle groups',
        icon: '🔀',
        category: 'variety',
        requirement: 3,
        color: 'from-pink-500 to-rose-500'
    },
    VARIETY_6: {
        id: 'variety_6',
        name: 'Complete Athlete',
        description: 'Train all 6 muscle groups (chest, back, legs, shoulders, arms, core)',
        icon: '🧩',
        category: 'variety',
        requirement: 6,
        color: 'from-fuchsia-500 to-pink-500'
    },

    // ─── Cardio Achievements ──────────────────────────────────────────────────
    CARDIO_60: {
        id: 'cardio_60',
        name: 'Cardio Curious',
        description: 'Complete 60 minutes of cardio total',
        icon: '🏃',
        category: 'cardio',
        requirement: 60,
        color: 'from-rose-400 to-red-500'
    },
    CARDIO_300: {
        id: 'cardio_300',
        name: 'Cardio Warrior',
        description: 'Complete 300 minutes of cardio total',
        icon: '🚴',
        category: 'cardio',
        requirement: 300,
        color: 'from-orange-500 to-red-500'
    },
    CARDIO_1000: {
        id: 'cardio_1000',
        name: 'Endurance King',
        description: 'Complete 1,000 minutes of cardio total',
        icon: '🏅',
        category: 'cardio',
        requirement: 1000,
        color: 'from-yellow-500 to-orange-600'
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calculateTotalPRs = (workouts) => {
    let prCount = 0;
    workouts.forEach(workout => {
        workout.exercises?.forEach(exercise => {
            if (exercise.isPR) prCount++;
        });
    });
    return prCount;
};

const calculateLifetimeVolume = (workouts) => {
    const totalKg = workouts.reduce((sum, workout) => {
        return sum + calculateTotalVolume(workout);
    }, 0);
    return parseFloat(kgToTons(totalKg));
};

const calculateLifetimeReps = (workouts) => {
    return workouts
        .filter(w => w.type !== 'rest_day')
        .reduce((sum, workout) => sum + calculateTotalReps(workout), 0);
};

const calculateRestDays = (workouts) => {
    return workouts.filter(w => w.type === 'rest_day').length;
};

const calculateUniqueMuscleGroups = (workouts) => {
    const groups = new Set();
    const categoryMap = {
        chest: 'chest',
        back: 'back',
        legs: 'legs',
        shoulders: 'shoulders',
        arms: 'arms',
        core: 'core',
    };
    workouts
        .filter(w => w.type !== 'rest_day')
        .forEach(workout => {
            workout.exercises?.forEach(exercise => {
                const cat = exercise.category?.toLowerCase();
                if (cat && categoryMap[cat]) groups.add(categoryMap[cat]);
            });
        });
    return groups.size;
};

const calculateCardioMinutes = (workouts) => {
    const breakdown = getActivityBreakdown(workouts);
    return breakdown.cardioMinutes || 0;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const getUnlockedAchievements = (workouts) => {
    if (!workouts || workouts.length === 0) return [];

    const currentStreak = calculateStreak(workouts);
    const totalVolume = calculateLifetimeVolume(workouts);
    const totalPRs = calculateTotalPRs(workouts);
    const totalWorkouts = workouts.length;
    const totalReps = calculateLifetimeReps(workouts);
    const totalRestDays = calculateRestDays(workouts);
    const uniqueMuscleGroups = calculateUniqueMuscleGroups(workouts);
    const cardioMinutes = calculateCardioMinutes(workouts);

    const getMetric = (category) => {
        switch (category) {
            case 'streak': return currentStreak;
            case 'volume': return totalVolume;
            case 'pr': return totalPRs;
            case 'workouts': return totalWorkouts;
            case 'reps': return totalReps;
            case 'rest': return totalRestDays;
            case 'variety': return uniqueMuscleGroups;
            case 'cardio': return cardioMinutes;
            default: return 0;
        }
    };

    return Object.values(ACHIEVEMENTS)
        .filter(achievement => getMetric(achievement.category) >= achievement.requirement)
        .map(achievement => ({
            ...achievement,
            unlockedAt: new Date().toISOString()
        }));
};

export const getAchievementProgress = (workouts) => {
    const zero = (next) => ({ current: 0, next, progress: 0 });

    if (!workouts || workouts.length === 0) {
        return {
            streak: zero(ACHIEVEMENTS.STREAK_3),
            volume: zero(ACHIEVEMENTS.VOLUME_1),
            pr: zero(ACHIEVEMENTS.PR_FIRST),
            workouts: zero(ACHIEVEMENTS.WORKOUTS_1),
            reps: zero(ACHIEVEMENTS.REPS_1000),
            rest: zero(ACHIEVEMENTS.REST_FIRST),
            variety: zero(ACHIEVEMENTS.VARIETY_3),
            cardio: zero(ACHIEVEMENTS.CARDIO_60),
        };
    }

    const currentStreak = calculateStreak(workouts);
    const totalVolume = calculateLifetimeVolume(workouts);
    const totalPRs = calculateTotalPRs(workouts);
    const totalWorkouts = workouts.length;
    const totalReps = calculateLifetimeReps(workouts);
    const totalRestDays = calculateRestDays(workouts);
    const uniqueMuscleGroups = calculateUniqueMuscleGroups(workouts);
    const cardioMinutes = calculateCardioMinutes(workouts);

    const findNext = (category, currentValue) => {
        return Object.values(ACHIEVEMENTS)
            .filter(a => a.category === category)
            .sort((a, b) => a.requirement - b.requirement)
            .find(a => currentValue < a.requirement) || null;
    };

    return {
        streak: { current: currentStreak, next: findNext('streak', currentStreak), progress: currentStreak },
        volume: { current: totalVolume, next: findNext('volume', totalVolume), progress: totalVolume },
        pr: { current: totalPRs, next: findNext('pr', totalPRs), progress: totalPRs },
        workouts: { current: totalWorkouts, next: findNext('workouts', totalWorkouts), progress: totalWorkouts },
        reps: { current: totalReps, next: findNext('reps', totalReps), progress: totalReps },
        rest: { current: totalRestDays, next: findNext('rest', totalRestDays), progress: totalRestDays },
        variety: { current: uniqueMuscleGroups, next: findNext('variety', uniqueMuscleGroups), progress: uniqueMuscleGroups },
        cardio: { current: cardioMinutes, next: findNext('cardio', cardioMinutes), progress: cardioMinutes },
    };
};

export const getNewlyUnlockedAchievements = (currentWorkouts, previousWorkouts) => {
    const currentUnlocked = getUnlockedAchievements(currentWorkouts);
    const previousUnlocked = getUnlockedAchievements(previousWorkouts);
    const previousIds = new Set(previousUnlocked.map(a => a.id));
    return currentUnlocked.filter(a => !previousIds.has(a.id));
};
