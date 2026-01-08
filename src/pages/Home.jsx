import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { useWorkouts } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useNavigate } from 'react-router-dom';
import { calculateStreak } from '../utils/calculations';
import { getSmartRecommendation } from '../utils/smartRecommendations';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import RestDayModal from '../components/common/RestDayModal';
import AchievementsAccordion from '../components/common/AchievementsAccordion';
import SetupWizard from '../components/SetupWizard';

import SkeletonCard from '../components/common/SkeletonCard';
import SkeletonStatCard from '../components/common/SkeletonStatCard';
import { TrendingUp, Calendar, Flame, ChevronRight, Dumbbell, Hotel, Plus, RotateCcw, Zap, Brain, AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/calculations';
import toast from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Home = () => {
  const { workouts, isLoading, addRestDay, cloneWorkout } = useWorkouts();
  const { user } = useAuth();
  const { preferences, updatePreferences, completeSetup, isLoading: preferencesLoading } = usePreferences();
  const navigate = useNavigate();
  const [isRestDayModalOpen, setIsRestDayModalOpen] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');
  const totalWorkouts = regularWorkouts.length;
  const totalRestDays = workouts.filter(w => w.type === 'rest_day').length;
  const currentStreak = calculateStreak(workouts);
  const recentWorkouts = workouts.slice(0, 3);

  // Get last workout
  const lastWorkout = regularWorkouts[0];

  // Show setup wizard for users with workouts who haven't completed setup
  useEffect(() => {
    console.log('🔍 Setup wizard check:', {
      isLoading,
      preferencesLoading,
      workoutsCount: workouts.length,
      hasCompletedSetup: preferences.hasCompletedSetup,
      shouldShow: !isLoading && !preferencesLoading && workouts.length >= 2 && !preferences.hasCompletedSetup
    });

    if (!isLoading && !preferencesLoading && workouts.length >= 2 && !preferences.hasCompletedSetup) {
      console.log('🎯 Showing setup wizard');
      setShowSetupWizard(true);
    } else {
      console.log('✅ Setup wizard hidden');
      setShowSetupWizard(false);
    }
  }, [isLoading, preferencesLoading, workouts.length, preferences.hasCompletedSetup]);

  // Get intelligent recommendation
  const recommendation = getSmartRecommendation(workouts, preferences);

  const handleRepeatLastWorkout = () => {
    if (!lastWorkout) {
      toast.error('No previous workout found');
      return;
    }

    cloneWorkout(lastWorkout);
    toast.success(`Repeating: ${lastWorkout.name}`, { duration: 2000 });
    navigate('/log');
  };

  const handleStartRecommendedWorkout = () => {
    if (!recommendation.workout) return;

    cloneWorkout(recommendation.workout);
    toast.success(`Starting: ${recommendation.workout.name}`, { duration: 2000, icon: '⚡' });
    navigate('/log');
  };

  const handleSetupComplete = (setupPreferences) => {
    updatePreferences(setupPreferences);
    completeSetup();
    setShowSetupWizard(false);
    toast.success('Setup complete! 🎉 Smart recommendations enabled', { duration: 3000 });
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
      label: 'Total Workouts',
      value: totalWorkouts,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Rest Days',
      value: totalRestDays,
      icon: Hotel,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-8 pb-safe">

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:gap-4">
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

      {/* Achievements Accordion */}
      {!isLoading && workouts.length > 0 && <AchievementsAccordion />}

      {/* Intelligent Recommendation Card */}
      {!isLoading && recommendation && (
        <>
          {/* Rest Day Recommendation */}
          {recommendation.shouldRest && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lifted"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                    <Hotel className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wide">Smart Recommendation</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                  <span className="text-xs font-bold">{recommendation.confidence}% Confident</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Take a Rest Day</h3>
              <div className="space-y-1 mb-4">
                {recommendation.reasoning.map((reason, idx) => (
                  <p key={idx} className="text-white/90 text-sm">{reason}</p>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsRestDayModalOpen(true)}
                className="w-full bg-white text-purple-600 font-bold py-3 px-4 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center space-x-2"
              >
                <Hotel className="w-5 h-5" />
                <span>Log Rest Day</span>
              </motion.button>
            </motion.div>
          )}

          {/* Workout Recommendation */}
          {!recommendation.shouldRest && recommendation.workout && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-5 text-white shadow-lifted"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                    <Brain className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wide">AI Recommendation</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                  <span className="text-xs font-bold">{recommendation.confidence}% Match</span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2">{recommendation.workout.name}</h3>

              <p className="text-white/80 text-sm mb-3">
                {recommendation.workout.exercises?.length || 0} exercises • Last done {formatDate(recommendation.workout.date)}
              </p>

              {/* Muscle Targets */}
              {recommendation.muscleTargets && recommendation.muscleTargets.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {recommendation.muscleTargets.map((muscle, idx) => {
                    // Color mapping for different muscle groups
                    const muscleColors = {
                      chest: 'bg-red-500/30 border border-red-400/50',
                      back: 'bg-blue-500/30 border border-blue-400/50',
                      legs: 'bg-green-500/30 border border-green-400/50',
                      shoulders: 'bg-yellow-500/30 border border-yellow-400/50',
                      arms: 'bg-purple-500/30 border border-purple-400/50',
                      core: 'bg-orange-500/30 border border-orange-400/50',
                      cardio: 'bg-pink-500/30 border border-pink-400/50',
                    };
                    const colorClass = muscleColors[muscle.toLowerCase()] || 'bg-white/20';

                    return (
                      <span
                        key={idx}
                        className={`${colorClass} backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold capitalize`}
                      >
                        {muscle}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Reasoning - Simplified */}
              {recommendation.reasoning && recommendation.reasoning.length > 0 && (
                <p className="text-white/80 text-xs mb-4">
                  {recommendation.reasoning[0]}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStartRecommendedWorkout}
                className="w-full bg-white text-blue-600 font-bold py-3 px-4 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center space-x-2 shadow-md"
              >
                <Zap className="w-5 h-5" />
                <span>Start This Workout</span>
              </motion.button>

              {/* Alternatives */}
              {recommendation.alternatives && recommendation.alternatives.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-white/70 cursor-pointer hover:text-white transition-colors font-medium">
                    View {recommendation.alternatives.length} alternative{recommendation.alternatives.length > 1 ? 's' : ''}
                  </summary>
                  <div className="mt-2 space-y-1">
                    {recommendation.alternatives.map((alt, idx) => (
                      <div key={idx} className="text-xs text-white/80 bg-white/5 rounded-lg p-2">
                        <span className="font-semibold">{alt.workout.name}</span>
                        <span className="text-white/60"> - {alt.reason}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </motion.div>
          )}
        </>
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
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recent Activity</h2>
            <Link to="/history">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-semibold">
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
                            <h3 className="text-lg font-semibold text-gray-900">Rest Day</h3>
                            <p className="text-gray-500 text-sm mt-1">{formatDate(workout.date)}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-sm ${i < workout.recoveryQuality ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              {workout.activities?.length > 0 && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-sm text-gray-500">{workout.activities.length} activities</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/log" className="sm:col-span-2">
            <Button variant="primary" size="lg" className="w-full flex items-center justify-center shadow-md">
              <Plus className="w-5 h-5 mr-2" />
              Log New Workout
            </Button>
          </Link>
          {lastWorkout && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleRepeatLastWorkout}
              className="w-full flex items-center justify-center border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Repeat Last
            </Button>
          )}
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setIsRestDayModalOpen(true)}
            className="w-full flex items-center justify-center"
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

      {/* Setup Wizard */}
      <SetupWizard
        isOpen={showSetupWizard}
        onClose={() => setShowSetupWizard(false)}
        onComplete={handleSetupComplete}
      />

    </div>
  );
};

export default Home;

