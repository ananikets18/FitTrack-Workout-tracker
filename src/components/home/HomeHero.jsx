import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, RotateCcw, Zap, Hotel, Flame, Timer, Square, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import { useGymSession } from '../../hooks/useGymSession';

const greetingFor = (date = new Date()) => {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const HomeHero = ({
  userName,
  lastWorkout,
  recommendation,
  onRepeatLast,
  onStartRecommended,
  onLogRestDay,
}) => {
  const navigate = useNavigate();
  const {
    status,
    isActive,
    isCompleted,
    workoutLogged,
    formattedRemaining,
    formattedElapsed,
    formattedStartTime,
    formattedEndTime,
    formattedTargetEndTime,
    sessionDurationMinutes,
    startSession,
    endSession,
  } = useGymSession();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const hasRecommendation = recommendation && !recommendation.shouldRest && recommendation.workout;
  const primary = hasRecommendation
    ? {
        label: `Start ${recommendation.workout.name}`,
        hint: `${recommendation.workout.exercises?.length || 0} exercises • ${recommendation.confidence}% match`,
        onClick: onStartRecommended,
        icon: Zap,
      }
    : lastWorkout
      ? {
          label: `Repeat ${lastWorkout.name}`,
          hint: `${lastWorkout.exercises?.length || 0} exercises • last session`,
          onClick: onRepeatLast,
          icon: RotateCcw,
        }
      : {
          label: 'Log your first workout',
          hint: 'Start your fitness journey',
          to: '/log',
          icon: Plus,
        };

  const PrimaryIcon = primary.icon;

  return (
    <section aria-labelledby="home-hero-title" className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-soft">
      <div className="p-5 md:p-7">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{today}</p>
        <h1 id="home-hero-title" className="mt-1 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {greetingFor()}{userName ? `, ${userName}` : ''}
        </h1>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{primary.hint}</p>

        {/* Live or Completed Gym Session Strip */}
        {isActive && (
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Timer className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200">
                  Gym Session Live • {formattedStartTime} → {formattedTargetEndTime}
                </p>
                <p className="text-base sm:text-lg font-black tabular-nums">
                  {formattedRemaining} remaining{' '}
                  <span className="text-xs font-semibold text-white/80">
                    ({formattedElapsed} elapsed of 1h 45m)
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                endSession();
                navigate('/log');
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current text-red-600" />
              <span>End &amp; Log Workouts</span>
            </button>
          </div>
        )}

        {isCompleted && !workoutLogged && (
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 text-white p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200">
                  Gym Session Complete • {formattedStartTime} – {formattedEndTime}
                </p>
                <p className="text-sm sm:text-base font-bold">
                  {sessionDurationMinutes} mins auto-captured — ready to log exercises!
                </p>
              </div>
            </div>
            <Link
              to="/log"
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Log Workouts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          {status === 'idle' && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={startSession}
              className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Flame className="w-5 h-5 fill-current" aria-hidden="true" />
              <span>At Gym? Start 1h 45m Timer</span>
            </motion.button>
          )}

          {primary.to ? (
            <Link to={primary.to} className="flex-1">
              <Button variant={status === 'idle' ? 'secondary' : 'primary'} size="lg" className="w-full">
                <PrimaryIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                {primary.label}
              </Button>
            </Link>
          ) : (
            <motion.div whileTap={{ scale: 0.98 }} className="flex-1">
              <Button variant={status === 'idle' ? 'secondary' : 'primary'} size="lg" onClick={primary.onClick} className="w-full">
                <PrimaryIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                {primary.label}
              </Button>
            </motion.div>
          )}
          <Button variant="ghost" size="lg" onClick={onLogRestDay} className="sm:w-auto border border-gray-200 dark:border-gray-700">
            <Hotel className="w-5 h-5 mr-2" aria-hidden="true" />
            Rest day
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
