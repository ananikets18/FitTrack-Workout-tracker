import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useWorkouts } from '../context/WorkoutContext';
import { calculateStreak } from '../utils/calculations';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import RestDayModal from '../components/common/RestDayModal';
import SkeletonCard from '../components/common/SkeletonCard';
import SkeletonStatCard from '../components/common/SkeletonStatCard';
import { TrendingUp, Calendar, Flame, ChevronRight, Dumbbell, Hotel, Plus } from 'lucide-react';
import { formatDate } from '../utils/calculations';
import toast from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Home = () => {
  const { workouts, isLoading, addRestDay } = useWorkouts();
  const [isRestDayModalOpen, setIsRestDayModalOpen] = useState(false);

  const totalWorkouts = workouts.filter(w => w.type !== 'rest_day').length;
  const totalRestDays = workouts.filter(w => w.type === 'rest_day').length;
  const currentStreak = calculateStreak(workouts);
  const recentWorkouts = workouts.slice(0, 3);

  const handleSaveRestDay = (restDayData) => {
    addRestDay(restDayData);
    setIsRestDayModalOpen(false);
    toast.success('Rest day logged! 🛌');
  };

  const stats = [
    {
      label: 'Total Workouts',
      value: totalWorkouts,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Current Streak',
      value: `${currentStreak} days`,
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'Rest Days',
      value: totalRestDays,
      icon: Hotel,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="space-y-6 pb-safe">
      {/* Mobile Logo Header */}
      <div className="md:hidden flex items-center justify-between pt-safe mb-2">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-primary rounded-xl p-2.5 shadow-soft">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FitTrack</h1>
            <p className="text-xs text-gray-500">Your Workout Companion</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card elevated className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl ${stat.bgColor} mb-2 md:mb-3 shadow-soft`}>
                  <stat.icon className={`w-6 h-6 md:w-8 md:h-8 ${stat.color}`} />
                </div>
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Workouts */}
      {isLoading ? (
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : recentWorkouts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
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
                  <Card hover elevated className="active:scale-98">
                    {workout.type === 'rest_day' ? (
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-2 flex-shrink-0">
                            <Hotel className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rest Day</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{formatDate(workout.date)}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-xs ${i < workout.recoveryQuality ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              {workout.activities?.length > 0 && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{workout.activities.length} activities</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{workout.name}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{formatDate(workout.date)}</p>
                          <div className="flex items-center space-x-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium">{workout.exercises?.length || 0} exercises</span>
                            {workout.duration && <><span>•</span><span>{workout.duration} min</span></>}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                      </div>
                    )}
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
          <Card elevated className="text-center py-12">
            <div className="max-w-md mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-lifted mb-2">
                <Dumbbell className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No workouts yet</h3>
              <p className="text-gray-600 dark:text-gray-400">Start your fitness journey by tracking your progress</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Link to="/log">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    <Plus className="w-5 h-5 mr-2" />
                    Log Workout
                  </Button>
                </Link>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  onClick={() => setIsRestDayModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Hotel className="w-5 h-5 mr-2" />
                  Log Rest Day
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Action Buttons - When there are workouts */}
      {!isLoading && workouts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link to="/log" className="flex-1">
            <Button variant="primary" size="lg" className="w-full flex items-center justify-center">
              <Plus className="w-5 h-5 mr-2" />
              Log Workout
            </Button>
          </Link>
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={() => setIsRestDayModalOpen(true)}
            className="flex-1 flex items-center justify-center"
          >
            <Hotel className="w-5 h-5 mr-2" />
            Log Rest Day
          </Button>
        </div>
      )}

      {/* Rest Day Modal */}
      <RestDayModal
        isOpen={isRestDayModalOpen}
        onClose={() => setIsRestDayModalOpen(false)}
        onSave={handleSaveRestDay}
      />
    </div>
  );
};

export default Home;
