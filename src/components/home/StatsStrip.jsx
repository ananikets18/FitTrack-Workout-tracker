import { motion } from 'framer-motion';
import { Calendar, Flame, TrendingUp, Hotel } from 'lucide-react';
import Card from '../common/Card';
import SkeletonStatCard from '../common/SkeletonStatCard';

const StatsStrip = ({ isLoading, thisWeekWorkouts, currentStreak, totalWorkouts, totalRestDays }) => {
  const stats = [
    {
      label: 'This Week',
      value: thisWeekWorkouts,
      icon: Calendar,
      color: 'text-primary-600 dark:text-primary-300',
      bgColor: 'bg-primary-100 dark:bg-primary-900/40',
    },
    {
      label: 'Streak',
      value: `${currentStreak}d`,
      icon: Flame,
      color: 'text-warning-600 dark:text-amber-400',
      bgColor: 'bg-warning-100 dark:bg-amber-900/30',
    },
    {
      label: 'Workouts',
      value: totalWorkouts,
      icon: TrendingUp,
      color: 'text-success-600 dark:text-emerald-400',
      bgColor: 'bg-success-100 dark:bg-emerald-900/30',
    },
    {
      label: 'Rest',
      value: totalRestDays,
      icon: Hotel,
      color: 'text-purple-600 dark:text-purple-300',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Loading stats">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5" role="list" aria-label="Workout stats">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          role="listitem"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04, duration: 0.2 }}
        >
          <Card className="flex items-center gap-2.5 !p-3">
            <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${stat.bgColor} flex-shrink-0`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold text-gray-900 dark:text-white leading-none">{stat.value}</div>
              <div className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{stat.label}</div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsStrip;
