import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Trophy, TrendingUp, Award, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Personal Records Timeline - Visual PR history with milestones
 * Shows progression of PRs over time with interactive timeline
 */
const PRTimeline = ({ workouts }) => {
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [viewMode, setViewMode] = useState('all'); // 'all' or 'exercise'

    // Filter out rest days
    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

    // Calculate all PRs with timeline
    const calculatePRTimeline = () => {
        const exerciseMaxes = {};
        const prHistory = [];

        const sortedWorkouts = [...regularWorkouts].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        sortedWorkouts.forEach(workout => {
            workout.exercises?.forEach(exercise => {
                const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0), 0);

                if (maxWeight > 0) {
                    const exerciseName = exercise.name;

                    // Check if this is a new PR
                    if (!exerciseMaxes[exerciseName] || maxWeight > exerciseMaxes[exerciseName].weight) {
                        const previousMax = exerciseMaxes[exerciseName]?.weight || 0;
                        const improvement = maxWeight - previousMax;
                        const improvementPercent = previousMax > 0
                            ? ((improvement / previousMax) * 100).toFixed(1)
                            : 100;

                        const prRecord = {
                            exercise: exerciseName,
                            weight: maxWeight,
                            previousWeight: previousMax,
                            improvement,
                            improvementPercent,
                            date: new Date(workout.date),
                            dateStr: format(new Date(workout.date), 'MMM d, yyyy'),
                            isPR: exercise.isPR || false,
                            sets: exercise.sets.filter(s => s.weight === maxWeight),
                        };

                        exerciseMaxes[exerciseName] = { weight: maxWeight, date: workout.date };
                        prHistory.push(prRecord);
                    }
                }
            });
        });

        return prHistory.reverse(); // Most recent first
    };

    const prTimeline = calculatePRTimeline();

    // Get unique exercises with PR counts
    const exerciseStats = prTimeline.reduce((acc, pr) => {
        if (!acc[pr.exercise]) {
            acc[pr.exercise] = {
                name: pr.exercise,
                count: 0,
                currentMax: 0,
                firstMax: 0,
                totalImprovement: 0,
            };
        }
        acc[pr.exercise].count++;
        acc[pr.exercise].currentMax = Math.max(acc[pr.exercise].currentMax, pr.weight);
        if (acc[pr.exercise].firstMax === 0) {
            acc[pr.exercise].firstMax = pr.previousWeight || pr.weight;
        }
        acc[pr.exercise].totalImprovement = acc[pr.exercise].currentMax - acc[pr.exercise].firstMax;
        return acc;
    }, {});

    const topExercises = Object.values(exerciseStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Filter PRs by selected exercise
    const filteredPRs = selectedExercise
        ? prTimeline.filter(pr => pr.exercise === selectedExercise)
        : prTimeline.slice(0, 20); // Show last 20 PRs in 'all' mode

    // Calculate stats
    const totalPRs = prTimeline.length;
    const uniqueExercises = Object.keys(exerciseStats).length;
    const avgImprovement = totalPRs > 0
        ? (prTimeline.reduce((sum, pr) => sum + pr.improvement, 0) / totalPRs).toFixed(1)
        : 0;

    const recentPRs = prTimeline.filter(pr =>
        differenceInDays(new Date(), pr.date) <= 30
    ).length;

    if (prTimeline.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Trophy className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No PRs Yet</h3>
                <p className="text-sm">Start lifting to track your personal records!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs font-semibold text-yellow-700">Total PRs</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">{totalPRs}</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700">Exercises</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{uniqueExercises}</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">Avg Gain</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">{avgImprovement} kg</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-700">This Month</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">{recentPRs}</div>
                </div>
            </div>

            {/* Exercise Filter */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Exercise</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <button
                        onClick={() => setSelectedExercise(null)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${selectedExercise === null
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        All PRs
                    </button>
                    {topExercises.map((ex) => (
                        <button
                            key={ex.name}
                            onClick={() => setSelectedExercise(ex.name)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${selectedExercise === ex.name
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {ex.name} ({ex.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-400 to-primary-200" />

                {/* PR Cards */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredPRs.map((pr, index) => (
                            <motion.div
                                key={`${pr.exercise}-${pr.date.getTime()}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative pl-16"
                            >
                                {/* Timeline dot */}
                                <div className="absolute left-3.5 top-4 w-5 h-5 rounded-full bg-primary-600 border-4 border-white shadow-md z-10" />

                                {/* PR Card */}
                                <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:shadow-md transition-all p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* Exercise name */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <Award className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                                <h4 className="font-bold text-gray-900 truncate">
                                                    {pr.exercise}
                                                </h4>
                                            </div>

                                            {/* Weight info */}
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-3xl font-bold text-primary-600">
                                                    {pr.weight} kg
                                                </span>
                                                {pr.previousWeight > 0 && (
                                                    <span className="text-sm text-gray-500">
                                                        from {pr.previousWeight} kg
                                                    </span>
                                                )}
                                            </div>

                                            {/* Improvement badge */}
                                            {pr.improvement > 0 && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                                    <TrendingUp className="w-4 h-4" />
                                                    +{pr.improvement} kg ({pr.improvementPercent}%)
                                                </div>
                                            )}

                                            {/* Set details */}
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {pr.sets.map((set, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700"
                                                    >
                                                        {set.reps} reps @ {set.weight} kg
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-xs font-semibold text-gray-500 mb-1">
                                                {format(pr.date, 'MMM d')}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {format(pr.date, 'yyyy')}
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                                {differenceInDays(new Date(), pr.date)} days ago
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Show more indicator */}
                {!selectedExercise && prTimeline.length > 20 && (
                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-500">
                            Showing 20 most recent PRs. Select an exercise to see all records.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PRTimeline;
