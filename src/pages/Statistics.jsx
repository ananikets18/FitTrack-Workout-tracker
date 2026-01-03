import { useWorkouts } from '../context/WorkoutContext';
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
import { TrendingUp, Award, Flame, Dumbbell, Calendar, Target, Weight, Activity } from 'lucide-react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns';

const Statistics = () => {
  const { workouts } = useWorkouts();

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
    };
  });

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-gray-100">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-gray-600 font-medium">{stat.label}</div>
            {stat.subtitle && (
              <div className="text-xs text-gray-500 mt-1">{stat.subtitle}</div>
            )}
          </Card>
        ))}
      </div>

      {/* This Week Activity */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">This Week's Activity</h2>
        <div className="grid grid-cols-7 gap-2">
          {thisWeekWorkouts.map((day, index) => {
            const isToday = isSameDay(day.date, now);
            return (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-600 mb-2">{day.day}</div>
                <div
                  className={`h-20 rounded-lg flex items-center justify-center font-bold text-lg transition-all ${
                    day.count > 0
                      ? 'bg-primary-500 text-white'
                      : isToday
                      ? 'bg-gray-200 text-gray-600 border-2 border-primary-500'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {day.count > 0 ? day.count : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

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
    </div>
  );
};

export default Statistics;
