import { calculateStreak, calculateTotalVolume, kgToTons } from './calculations';

// Achievement definitions
export const ACHIEVEMENTS = {
    // Streak Achievements
    STREAK_7: {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Complete a 7-day workout streak',
        icon: '🔥',
        category: 'streak',
        requirement: 7,
        color: 'from-orange-500 to-red-500'
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
    STREAK_100: {
        id: 'streak_100',
        name: 'Century Champion',
        description: 'Complete a 100-day workout streak',
        icon: '👑',
        category: 'streak',
        requirement: 100,
        color: 'from-purple-500 to-pink-500'
    },

    // Volume Achievements
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

    // PR Achievements
    PR_FIRST: {
        id: 'pr_first',
        name: 'First Victory',
        description: 'Set your first personal record',
        icon: '🎯',
        category: 'pr',
        requirement: 1,
        color: 'from-green-500 to-emerald-500'
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
    PR_50: {
        id: 'pr_50',
        name: 'PR Machine',
        description: 'Set 50 personal records',
        icon: '🌟',
        category: 'pr',
        requirement: 50,
        color: 'from-amber-500 to-orange-500'
    },

    // Workout Count Achievements
    WORKOUTS_10: {
        id: 'workouts_10',
        name: 'Getting Started',
        description: 'Complete 10 workouts',
        icon: '🎖️',
        category: 'workouts',
        requirement: 10,
        color: 'from-teal-500 to-cyan-500'
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
};

// Calculate total PRs from workouts
const calculateTotalPRs = (workouts) => {
    let prCount = 0;
    workouts.forEach(workout => {
        workout.exercises?.forEach(exercise => {
            if (exercise.isPR) prCount++;
        });
    });
    return prCount;
};

// Calculate total volume in tons
const calculateLifetimeVolume = (workouts) => {
    const totalKg = workouts.reduce((sum, workout) => {
        return sum + calculateTotalVolume(workout);
    }, 0);
    return kgToTons(totalKg);
};

// Check which achievements are unlocked
export const getUnlockedAchievements = (workouts) => {
    if (!workouts || workouts.length === 0) return [];

    const currentStreak = calculateStreak(workouts);
    const totalVolume = calculateLifetimeVolume(workouts);
    const totalPRs = calculateTotalPRs(workouts);
    const totalWorkouts = workouts.length;

    const unlocked = [];

    Object.values(ACHIEVEMENTS).forEach(achievement => {
        let isUnlocked = false;

        switch (achievement.category) {
            case 'streak':
                isUnlocked = currentStreak >= achievement.requirement;
                break;
            case 'volume':
                isUnlocked = totalVolume >= achievement.requirement;
                break;
            case 'pr':
                isUnlocked = totalPRs >= achievement.requirement;
                break;
            case 'workouts':
                isUnlocked = totalWorkouts >= achievement.requirement;
                break;
            default:
                break;
        }

        if (isUnlocked) {
            unlocked.push({
                ...achievement,
                unlockedAt: new Date().toISOString() // In production, track actual unlock date
            });
        }
    });

    return unlocked;
};

// Get progress towards next achievement in each category
export const getAchievementProgress = (workouts) => {
    if (!workouts || workouts.length === 0) {
        return {
            streak: { current: 0, next: ACHIEVEMENTS.STREAK_7, progress: 0 },
            volume: { current: 0, next: ACHIEVEMENTS.VOLUME_10, progress: 0 },
            pr: { current: 0, next: ACHIEVEMENTS.PR_FIRST, progress: 0 },
            workouts: { current: 0, next: ACHIEVEMENTS.WORKOUTS_10, progress: 0 },
        };
    }

    const currentStreak = calculateStreak(workouts);
    const totalVolume = calculateLifetimeVolume(workouts);
    const totalPRs = calculateTotalPRs(workouts);
    const totalWorkouts = workouts.length;

    const findNextAchievement = (category, currentValue) => {
        const categoryAchievements = Object.values(ACHIEVEMENTS)
            .filter(a => a.category === category)
            .sort((a, b) => a.requirement - b.requirement);

        for (let achievement of categoryAchievements) {
            if (currentValue < achievement.requirement) {
                return achievement;
            }
        }
        return null; // All achievements unlocked
    };

    return {
        streak: {
            current: currentStreak,
            next: findNextAchievement('streak', currentStreak),
            progress: currentStreak
        },
        volume: {
            current: totalVolume,
            next: findNextAchievement('volume', totalVolume),
            progress: totalVolume
        },
        pr: {
            current: totalPRs,
            next: findNextAchievement('pr', totalPRs),
            progress: totalPRs
        },
        workouts: {
            current: totalWorkouts,
            next: findNextAchievement('workouts', totalWorkouts),
            progress: totalWorkouts
        },
    };
};

// Get newly unlocked achievements (compare with previous state)
export const getNewlyUnlockedAchievements = (currentWorkouts, previousWorkouts) => {
    const currentUnlocked = getUnlockedAchievements(currentWorkouts);
    const previousUnlocked = getUnlockedAchievements(previousWorkouts);

    const previousIds = new Set(previousUnlocked.map(a => a.id));
    return currentUnlocked.filter(a => !previousIds.has(a.id));
};
