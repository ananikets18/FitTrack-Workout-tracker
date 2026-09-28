import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkouts } from '../context/WorkoutContext';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { calculateStreak } from '../utils/calculations';
import { getSmartRecommendation } from '../utils/smartRecommendations';
import { WATER_INTAKE, TOAST_DURATION } from '../constants';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import RestDayModal from '../components/common/RestDayModal';
import SetupWizard from '../components/SetupWizard';
import HomeHero from '../components/home/HomeHero';
import StatsStrip from '../components/home/StatsStrip';
import HydrationCompact from '../components/home/HydrationCompact';
import RecommendationCard from '../components/home/RecommendationCard';
import RecentActivity from '../components/home/RecentActivity';

import { Dumbbell, Plus, Hotel } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Home = () => {
  const {
    workouts,
    isLoading,
    addRestDay,
    addBulkRestDays,
    cloneWorkout,
    waterIntake,
    addWaterIntake,
    isWaterLoading,
  } = useWorkouts();
  const { preferences, updatePreferences, completeSetup, isLoading: preferencesLoading } = usePreferences();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRestDayModalOpen, setIsRestDayModalOpen] = useState(false);
  const [showMoreActivity, setShowMoreActivity] = useState(false);

  const showSetupWizard = useMemo(() => {
    return !isLoading && !preferencesLoading && workouts.length >= 2 && !preferences.hasCompletedSetup;
  }, [isLoading, preferencesLoading, workouts.length, preferences.hasCompletedSetup]);

  const regularWorkouts = useMemo(() => workouts.filter((w) => w.type !== 'rest_day'), [workouts]);
  const totalWorkouts = regularWorkouts.length;
  const totalRestDays = useMemo(() => workouts.filter((w) => w.type === 'rest_day').length, [workouts]);
  const currentStreak = useMemo(() => calculateStreak(workouts), [workouts]);

  const thisWeekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const thisWeekWorkouts = useMemo(
    () => regularWorkouts.filter((w) => new Date(w.date) >= thisWeekStart).length,
    [regularWorkouts, thisWeekStart]
  );

  const lastWorkout = regularWorkouts[0];
  const recommendation = useMemo(() => getSmartRecommendation(workouts, preferences), [workouts, preferences]);
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  const handleRepeatLastWorkout = () => {
    if (!lastWorkout) {
      toast.error('No previous workout found');
      return;
    }
    cloneWorkout(lastWorkout);
    toast.success(`Repeating: ${lastWorkout.name}`, { duration: TOAST_DURATION.DEFAULT });
    navigate('/log');
  };

  const handleStartRecommendedWorkout = () => {
    if (!recommendation?.workout) return;
    cloneWorkout(recommendation.workout);
    toast.success(`Starting: ${recommendation.workout.name}`, { duration: TOAST_DURATION.DEFAULT });
    navigate('/log');
  };

  const handleSetupComplete = (setupPreferences) => {
    updatePreferences(setupPreferences);
    completeSetup();
    toast.success('Setup complete! Smart recommendations enabled', { duration: TOAST_DURATION.LONG });
  };

  const handleSaveRestDay = async (restDayData) => {
    await addRestDay(restDayData);
    setIsRestDayModalOpen(false);
  };

  const handleSaveBulkRestDays = async (bulkData) => {
    await addBulkRestDays(bulkData);
    setIsRestDayModalOpen(false);
  };

  return (
    <div className="space-y-4 md:space-y-5 pb-safe">
      <HomeHero
        userName={userName}
        lastWorkout={lastWorkout}
        recommendation={recommendation}
        onRepeatLast={handleRepeatLastWorkout}
        onStartRecommended={handleStartRecommendedWorkout}
        onLogRestDay={() => setIsRestDayModalOpen(true)}
      />

      <StatsStrip
        isLoading={isLoading}
        thisWeekWorkouts={thisWeekWorkouts}
        currentStreak={currentStreak}
        totalWorkouts={totalWorkouts}
        totalRestDays={totalRestDays}
      />

      {/* Bento grid: main + rail. Mobile order: hydration right after stats, then recent, then up-next. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 items-start">
        {/* Hydration first on mobile (order-1), rail on desktop */}
        <div className="order-1 lg:order-2 lg:col-span-1 min-w-0" aria-label="Today sidebar">
          {isWaterLoading ? (
            <Card className="animate-pulse">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-3" />
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                ))}
              </div>
            </Card>
          ) : (
            <HydrationCompact
              amount={waterIntake.amount}
              onAdd={(ml) => addWaterIntake(ml)}
              onUndo={() => addWaterIntake(-WATER_INTAKE.UNDO_AMOUNT_ML)}
              goalReached={waterIntake.amount >= WATER_INTAKE.DAILY_GOAL_ML}
              justStarted={waterIntake.amount < 1000 && waterIntake.amount > 0}
            />
          )}
        </div>

        <div className="order-2 lg:order-1 lg:col-span-2 space-y-4 md:space-y-5 min-w-0">
          <RecentActivity
            isLoading={isLoading}
            workouts={workouts}
            showMore={showMoreActivity}
            onToggleMore={() => setShowMoreActivity((p) => !p)}
          />
          <RecommendationCard recommendation={recommendation} onStart={handleStartRecommendedWorkout} />

          {!isLoading && workouts.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="text-center !py-10">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-1">
                    <Dumbbell className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">No workouts yet</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Start your fitness journey by tracking your progress</p>
                  <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                    <Link to="/log">
                      <Button variant="primary" size="lg" className="w-full sm:w-auto">
                        <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
                        Log Workout
                      </Button>
                    </Link>
                    <Button variant="secondary" size="lg" onClick={() => setIsRestDayModalOpen(true)} className="w-full sm:w-auto">
                      <Hotel className="w-5 h-5 mr-2" aria-hidden="true" />
                      Log Rest Day
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      <RestDayModal
        isOpen={isRestDayModalOpen}
        onClose={() => setIsRestDayModalOpen(false)}
        onSave={handleSaveRestDay}
        onSaveBulk={handleSaveBulkRestDays}
      />

      <SetupWizard isOpen={showSetupWizard} onComplete={handleSetupComplete} />
    </div>
  );
};

export default Home;
