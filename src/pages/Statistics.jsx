import { useWorkouts } from '../context/WorkoutContext';
import { useState } from 'react';
import {
  calculateStreak,
  calculateTotalVolume,
  kgToTons,
  calculateTotalReps,
  calculateAverageWeight,
  getPersonalRecords,
  calculateTotalActivity,
} from '../utils/calculations';
import Card from '../components/common/Card';
import ExerciseHistoryModal from '../components/common/ExerciseHistoryModal';
import { VolumeChart, TrainingIntelligenceChart, PRProgressionChart, WeeklyMonthlyActivityChart, TreadmillProgressChart } from '../components/charts/WorkoutCharts';
import { TrendingUp, Award, Flame, Dumbbell, Target, Weight, Activity, ChevronDown } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const Statistics = () => {
  const { workouts } = useWorkouts();
  const [isExerciseHistoryOpen, setIsExerciseHistoryOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isTreadmillOpen, setIsTreadmillOpen] = useState(false);
  const [isActivityTrendsOpen, setIsActivityTrendsOpen] = useState(false);

  // Filter out rest days for workout statistics
  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

  // Calculate statistics (only for regular workouts)
  const totalWorkouts = regularWorkouts.length;
  const currentStreak = calculateStreak(workouts); // Includes rest days for streak
  const personalRecords = getPersonalRecords(workouts);

  const totalVolume = regularWorkouts.reduce((sum, workout) =>
    sum + calculateTotalVolume(workout), 0
  );

  const totalVolumeInTons = kgToTons(totalVolume);

  const totalSets = regularWorkouts.reduce((sum, workout) => {
    return sum + (workout.exercises?.reduce((total, ex) => total + ex.sets.length, 0) || 0);
  }, 0);

  const totalReps = regularWorkouts.reduce((sum, workout) => {
    return sum + calculateTotalReps(workout);
  }, 0);

  const averageWeight = regularWorkouts.length > 0
    ? (regularWorkouts.reduce((sum, workout) => sum + parseFloat(calculateAverageWeight(workout)), 0) / regularWorkouts.length).toFixed(1)
    : 0;

  // Calculate total activity points (NEW - Activity Points System)
  const totalActivity = regularWorkouts.reduce((sum, workout) =>
    sum + calculateTotalActivity(workout), 0
  );

  const exerciseFrequency = {};
  regularWorkouts.forEach(workout => {
    workout.exercises?.forEach(exercise => {
      exerciseFrequency[exercise.name] = (exerciseFrequency[exercise.name] || 0) + 1;
    });
  });

  const topExercises = Object.entries(exerciseFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const handleExerciseClick = (exerciseName) => {
    setSelectedExercise(exerciseName);
    setIsExerciseHistoryOpen(true);
  };

  const stats = [
    {
      label: 'Total Workouts',
      value: totalWorkouts,
      icon: Dumbbell,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Current Streak',
      value: `${currentStreak} days`,
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Activity Score',
      value: Math.round(totalActivity).toLocaleString(),
      subtitle: 'All workouts combined',
      icon: Activity,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      label: 'Weight Moved',
      value: `${totalVolumeInTons}T`,
      subtitle: `${Math.round(totalVolume).toLocaleString()} kg total`,
      icon: Weight,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Total Sets',
      value: totalSets,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Total Reps',
      value: totalReps.toLocaleString(),
      icon: Activity,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      label: 'Avg Weight/Set',
      value: `${averageWeight} kg`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
        <p className="text-gray-600 mt-2">Track your progress and achievements</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {stats.map((stat, index) => (
          <Card key={index} elevated className="text-center">
            <div className={`inline-flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-2xl ${stat.bgColor} mb-2 md:mb-3 shadow-soft`}>
              <stat.icon className={`w-5 h-5 md:w-7 md:h-7 ${stat.color}`} />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-gray-600 text-xs md:text-sm font-medium">{stat.label}</div>
            {stat.subtitle && (
              <div className="text-xs text-gray-500 mt-1 hidden md:block">{stat.subtitle}</div>
            )}
          </Card>
        ))}
      </div>



      {/* Progress Charts */}
      {workouts.length >= 3 && (
        <>
          {/* Volume Trend */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Volume Trend (Last 30 Days)</h2>
            <VolumeChart workouts={workouts} />
          </Card>

          {/* Training Intelligence Dashboard */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Training Intelligence (Last 7 Days)</h2>
            <TrainingIntelligenceChart workouts={workouts} />
          </Card>

          {/* Weekly/Monthly Activity Trends (NEW) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100"
          >
            {/* Accordion Header */}
            <button
              onClick={() => setIsActivityTrendsOpen(!isActivityTrendsOpen)}
              className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-sm">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Activity Trends</h2>
                  <p className="text-xs md:text-sm text-gray-600">
                    Weekly and monthly activity analysis
                  </p>
                  {!isActivityTrendsOpen && (
                    <p className="text-xs text-gray-400 mt-0.5">Tap to expand</p>
                  )}
                </div>
              </div>

              <motion.div
                animate={{ rotate: isActivityTrendsOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-600" />
              </motion.div>
            </button>

            {/* Accordion Content */}
            <AnimatePresence>
              {isActivityTrendsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 md:px-6 pb-6 border-t border-gray-100">
                    <div className="pt-6">
                      <WeeklyMonthlyActivityChart workouts={workouts} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* PR Progression */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Records Progression</h2>
            <PRProgressionChart workouts={workouts} />
          </Card>
        </>
      )}

      {/* Treadmill Progress (Conditional) */}
      {workouts.some(w => 
        w.exercises?.some(ex => ex.name.toLowerCase().includes('treadmill'))
      ) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100"
        >
          {/* Accordion Header */}
          <button
            onClick={() => setIsTreadmillOpen(!isTreadmillOpen)}
            className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-sm">
                <span className="text-xl">🏃‍♂️</span>
              </div>
              <div className="text-left">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Treadmill Progress</h2>
                <p className="text-xs md:text-sm text-gray-600">
                  Track your cardio performance
                </p>
                {!isTreadmillOpen && (
                  <p className="text-xs text-gray-400 mt-0.5">Tap to expand</p>
                )}
              </div>
            </div>

            <motion.div
              animate={{ rotate: isTreadmillOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-600" />
            </motion.div>
          </button>

          {/* Accordion Content */}
          <AnimatePresence>
            {isTreadmillOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 md:px-6 pb-6 border-t border-gray-100">
                  <div className="pt-6">
                    <TreadmillProgressChart workouts={workouts} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Records */}
        <Card>
          <div className="flex items-center space-x-2 mb-6">
            <Award className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">Personal Records</h2>
          </div>
          {Object.keys(personalRecords).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No personal records yet</p>
              <p className="text-sm mt-1">Complete workouts to track your PRs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(personalRecords)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([exercise, weight]) => (
                  <button
                    key={exercise}
                    onClick={() => handleExerciseClick(exercise)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer active:scale-98"
                  >
                    <span className="font-medium text-gray-900 truncate mr-3" title={exercise}>{exercise}</span>
                    <span className="text-lg font-bold text-primary-600 flex-shrink-0">{weight} kg</span>
                  </button>
                ))}
            </div>
          )}
        </Card>

        {/* Most Frequent Exercises */}
        <Card>
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Top Exercises</h2>
          </div>
          {topExercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No exercises logged yet</p>
              <p className="text-sm mt-1">Start tracking to see your favorites</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
              {topExercises.map(([exercise, count], index) => (
                <div key={exercise} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      #{index + 1}
                    </div>
                    <span className="font-medium text-gray-900 truncate" title={exercise}>{exercise}</span>
                  </div>
                  <span className="text-sm text-gray-600 flex-shrink-0 ml-3">{count} times</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Empty State */}
      {workouts.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No statistics yet</h3>
          <p className="text-gray-600">Start logging workouts to see your progress and stats!</p>
        </Card>
      )}

      {/* Exercise History Modal */}
      <ExerciseHistoryModal
        isOpen={isExerciseHistoryOpen}
        onClose={() => setIsExerciseHistoryOpen(false)}
        exerciseName={selectedExercise}
        workouts={workouts}
      />
    </div>
  );
};

export default Statistics;

