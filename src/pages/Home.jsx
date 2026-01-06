import { Link } from 'react-router-dom';
import { useState } from 'react';

import { useWorkouts } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { calculateStreak } from '../utils/calculations';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import RestDayModal from '../components/common/RestDayModal';

import SkeletonCard from '../components/common/SkeletonCard';
import SkeletonStatCard from '../components/common/SkeletonStatCard';
import { TrendingUp, Calendar, Flame, ChevronRight, Dumbbell, Hotel, Plus, RotateCcw, Zap } from 'lucide-react';
import { formatDate } from '../utils/calculations';
import toast from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Home = () => {
  const { workouts, isLoading, addRestDay, cloneWorkout } = useWorkouts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRestDayModalOpen, setIsRestDayModalOpen] = useState(false);

  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');
  const totalWorkouts = regularWorkouts.length;
  const totalRestDays = workouts.filter(w => w.type === 'rest_day').length;
  const currentStreak = calculateStreak(workouts);
  const recentWorkouts = workouts.slice(0, 3);

  // Get last workout
  const lastWorkout = regularWorkouts[0];

  // Predict next workout based on patterns
  const getPredictedWorkout = () => {
    if (regularWorkouts.length < 2) return null;

    // Analyze workout patterns
    const workoutNames = regularWorkouts.slice(0, 10).map(w => w.name.toLowerCase());
    const uniqueNames = [...new Set(workoutNames)];

    // Find the most common rotation pattern
    if (uniqueNames.length <= 1) return null;

    // Check if there's a rotation (e.g., Push, Pull, Legs)
    const lastWorkoutName = regularWorkouts[0].name.toLowerCase();
    const rotation = uniqueNames.filter(name => name !== lastWorkoutName);

    if (rotation.length > 0) {
      // Find the next workout in rotation
      const nextInRotation = regularWorkouts.find(w =>
        rotation.includes(w.name.toLowerCase()) && w.id !== regularWorkouts[0].id
      );

      return nextInRotation || null;
    }

    return null;
  };

  const predictedWorkout = getPredictedWorkout();

  const handleRepeatLastWorkout = () => {
    if (!lastWorkout) {
      toast.error('No previous workout found');
      return;
    }

    cloneWorkout(lastWorkout);
    toast.success(`Repeating: ${lastWorkout.name}`, { duration: 2000 });
    navigate('/log');
  };

  const handleStartPredictedWorkout = () => {
    if (!predictedWorkout) return;

    cloneWorkout(predictedWorkout);
    toast.success(`Starting: ${predictedWorkout.name}`, { duration: 2000, icon: '⚡' });
    navigate('/log');
  };

  const handleSaveRestDay = (restDayData) => {
    addRestDay(restDayData);
    setIsRestDayModalOpen(false);
    toast.success('Rest day logged! 🛌');
  };

  // Calculate this week's workouts
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay()); // Start of week (Sunday)
  const thisWeekWorkouts = regularWorkouts.filter(w => new Date(w.date) >= thisWeekStart).length;

  const stats = [
    {
      label: 'This Week',
      value: thisWeekWorkouts,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 ',
    },
    {
      label: 'Current Streak',
      value: `${currentStreak} days`,
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 ',
    },
    {
      label: 'Rest Days',
      value: totalRestDays,
      icon: Hotel,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 ',
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
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-xs md:text-sm font-medium">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Predicted Workout Card - Show when there's a prediction */}
      {!isLoading && predictedWorkout && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lifted"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wide">Suggested Next</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">{predictedWorkout.name}</h3>
          <p className="text-white/80 text-sm mb-4">
            {predictedWorkout.exercises?.length || 0} exercises • Last done {formatDate(predictedWorkout.date)}
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStartPredictedWorkout}
            className="w-full bg-white text-blue-600 font-bold py-3 px-4 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center space-x-2"
          >
            <Zap className="w-5 h-5" />
            <span>Start This Workout</span>
          </motion.button>
        </motion.div>
      )}

      {/* Recent Workouts */}
      {isLoading ? (
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 ">Recent Activity</h2>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : recentWorkouts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 ">Recent Activity</h2>
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
                          <div className="bg-purple-100 rounded-xl p-2 flex-shrink-0">
                            <Hotel className="w-5 h-5 text-purple-600 " />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 ">Rest Day</h3>
                            <p className="text-gray-500 text-sm mt-1">{formatDate(workout.date)}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-xs ${i < workout.recoveryQuality ? 'text-yellow-400' : 'text-gray-300 '}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              {workout.activities?.length > 0 && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-xs text-gray-500 ">{workout.activities.length} activities</span>
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
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{workout.name}</h3>
                          <p className="text-gray-500 text-sm mt-1">{formatDate(workout.date)}</p>
                          <div className="flex items-center space-x-3 mt-2 text-sm text-gray-500 ">
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
              <h3 className="text-xl font-bold text-gray-900 ">No workouts yet</h3>
              <p className="text-gray-600 ">Start your fitness journey by tracking your progress</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {lastWorkout && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleRepeatLastWorkout}
              className="w-full flex items-center justify-center border-2 border-blue-500 text-blue-600 hover:bg-blue-50 "
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Repeat Last
            </Button>
          )}
          <Link to="/log" className={lastWorkout ? '' : 'sm:col-span-2'}>
            <Button variant="primary" size="lg" className="w-full flex items-center justify-center">
              <Plus className="w-5 h-5 mr-2" />
              Log Workout
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setIsRestDayModalOpen(true)}
            className="w-full flex items-center justify-center"
          >
            <Hotel className="w-5 h-5 mr-2" />
            Rest Day
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

