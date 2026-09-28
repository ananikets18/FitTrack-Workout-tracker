import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, RotateCcw, Zap, Hotel } from 'lucide-react';
import Button from '../common/Button';

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

        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          {primary.to ? (
            <Link to={primary.to} className="flex-1">
              <Button variant="primary" size="lg" className="w-full">
                <PrimaryIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                {primary.label}
              </Button>
            </Link>
          ) : (
            <motion.div whileTap={{ scale: 0.98 }} className="flex-1">
              <Button variant="primary" size="lg" onClick={primary.onClick} className="w-full">
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
