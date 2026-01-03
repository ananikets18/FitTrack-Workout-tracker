import { Link } from 'react-router-dom';
import { useWorkouts } from '../context/WorkoutContext';
import { calculateStreak } from '../utils/calculations';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SkeletonCard from '../components/common/SkeletonCard';
import SkeletonStatCard from '../components/common/SkeletonStatCard';
import { TrendingUp, Calendar, Flame, ChevronRight, Dumbbell } from 'lucide-react';
import { formatDate } from '../utils/calculations';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Home = () => {
  const { workouts, isLoading } = useWorkouts();

  const totalWorkouts = workouts.length;
  const currentStreak = calculateStreak(workouts);
  const recentWorkouts = workouts.slice(0, 3);

  const stats = [
    {
      label: 'Total Workouts',
      value: totalWorkouts,
      icon: TrendingUp,
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
      label: 'This Week',
      value: workouts.filter(w => {
        const date = new Date(w.date);
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }).length,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6 pb-safe">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome to FitTrack</h1>
        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">Track your workouts, monitor progress, and achieve your fitness goals.</p>
      </motion.div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center border border-gray-100">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${stat.bgColor} mb-3`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Workouts */}
      {isLoading ? (
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recent Workouts</h2>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : recentWorkouts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Workouts</h2>
            <Link to="/history">
              <Button variant="outline" size="sm" className="flex items-center space-x-1 text-sm">
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentWorkouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to="/history">
                  <Card hover className="active:scale-98 border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{workout.name}</h3>
                        <p className="text-gray-500 text-sm mt-1">{formatDate(workout.date)}</p>
                        <div className="flex items-center space-x-3 mt-2 text-sm text-gray-500">
                          <span className="font-medium">{workout.exercises?.length || 0} exercises</span>
                          {workout.duration && <><span>•</span><span>{workout.duration} min</span></>}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && workouts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="text-center py-12 border border-gray-100">
            <div className="max-w-md mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 mb-2">
                <Dumbbell className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No workouts yet</h3>
              <p className="text-gray-600">Start your fitness journey by tracking your progress</p>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Home;
