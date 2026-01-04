import { useWorkouts } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  calculateStreak, 
  calculateTotalVolume,
  kgToTons,
  calculateTotalReps,
  calculateAverageWeight,
  getPersonalRecords,
  groupWorkoutsByDate
} from '../utils/calculations';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import BottomSheet from '../components/common/BottomSheet';
import { VolumeChart, FrequencyChart, PRProgressionChart } from '../components/charts/WorkoutCharts';
import { TrendingUp, Award, Flame, Dumbbell, Calendar, Target, Weight, Activity, Clock, ChevronRight } from 'lucide-react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns';

const Statistics = () => {
  const { workouts } = useWorkouts();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  // Calculate statistics
  const totalWorkouts = workouts.length;
  const currentStreak = calculateStreak(workouts);
  const personalRecords = getPersonalRecords(workouts);
  
  const totalVolume = workouts.reduce((sum, workout) => 
    sum + calculateTotalVolume(workout), 0
  );
  
  const totalVolumeInTons = kgToTons(totalVolume);

  const totalSets = workouts.reduce((sum, workout) => {
    return sum + (workout.exercises?.reduce((total, ex) => total + ex.sets.length, 0) || 0);
  }, 0);
  
  const totalReps = workouts.reduce((sum, workout) => {
    return sum + calculateTotalReps(workout);
  }, 0);
  
  const averageWeight = workouts.length > 0 
    ? (workouts.reduce((sum, workout) => sum + parseFloat(calculateAverageWeight(workout)), 0) / workouts.length).toFixed(1)
    : 0;

  const exerciseFrequency = {};
  workouts.forEach(workout => {
    workout.exercises?.forEach(exercise => {
      exerciseFrequency[exercise.name] = (exerciseFrequency[exercise.name] || 0) + 1;
    });
  });

  const topExercises = Object.entries(exerciseFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Get this week's data
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const workoutsByDate = groupWorkoutsByDate(workouts);
  const thisWeekWorkouts = daysOfWeek.map(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return {
      day: format(day, 'EEE'),
      count: workoutsByDate[dateKey]?.length || 0,
      date: day,
      dateKey,
      workouts: workoutsByDate[dateKey] || [],
    };
  });

  const handleDayClick = (day) => {
    if (day.count > 0) {
      setSelectedDay(day);
      setIsSheetOpen(true);
    }
  };

  const handleViewDetails = () => {
    setIsSheetOpen(false);
    navigate('/history');
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

      {/* This Week Activity */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">This Week's Activity</h2>
        <div className="grid grid-cols-7 gap-2">
          {thisWeekWorkouts.map((day, index) => {
            const isToday = isSameDay(day.date, now);
            const hasWorkouts = day.count > 0;
            return (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{day.day}</div>
                <div
                  onClick={() => handleDayClick(day)}
                  className={`h-20 rounded-lg flex items-center justify-center font-bold text-lg transition-all ${
                    hasWorkouts
                      ? 'bg-primary-500 text-white cursor-pointer hover:bg-primary-600 active:scale-95'
                      : isToday
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-primary-500'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {day.count > 0 ? day.count : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Progress Charts */}
      {workouts.length >= 3 && (
        <>
          {/* Volume Trend */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Volume Trend (Last 30 Days)</h2>
            <VolumeChart workouts={workouts} />
          </Card>

          {/* Workout Frequency */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Workout Frequency (Last 7 Days)</h2>
            <FrequencyChart workouts={workouts} />
          </Card>

          {/* PR Progression */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Personal Records Progression</h2>
            <PRProgressionChart workouts={workouts} />
          </Card>
        </>
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
                  <div key={exercise} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{exercise}</span>
                    <span className="text-lg font-bold text-primary-600">{weight} kg</span>
                  </div>
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
            <div className="space-y-3">
              {topExercises.map(([exercise, count], index) => (
                <div key={exercise} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                      #{index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{exercise}</span>
                  </div>
                  <span className="text-sm text-gray-600">{count} times</span>
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

      {/* Bottom Sheet for Day Details */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={selectedDay ? format(selectedDay.date, 'EEEE, MMM d') : ''}
      >
        {selectedDay && (
          <div className="space-y-4">
            {selectedDay.workouts.map((workout, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{workout.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(workout.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                  <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm font-semibold">
                    {workout.exercises?.length || 0} exercises
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                  {workout.duration > 0 && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{workout.duration} min</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Weight className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {kgToTons(calculateTotalVolume(workout))}T moved
                    </span>
                  </div>
                </div>

                {workout.notes && (
                  <p className="text-sm text-gray-600 italic pt-2 border-t border-gray-200">
                    {workout.notes}
                  </p>
                )}
              </div>
            ))}

            <Button
              variant="primary"
              size="lg"
              onClick={handleViewDetails}
              className="w-full flex items-center justify-center space-x-2 mt-4"
            >
              <span>View Full Details</span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default Statistics;
