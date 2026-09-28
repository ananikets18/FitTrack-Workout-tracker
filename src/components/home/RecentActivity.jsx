import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Hotel, Star } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import SkeletonCard from '../common/SkeletonCard';
import { formatDate } from '../../utils/calculations';

const INITIAL_COUNT = 3;
const EXPANDED_COUNT = 7;

const RecentActivity = ({ isLoading, workouts, showMore, onToggleMore }) => {
  if (isLoading) {
    return (
      <section aria-label="Recent activity" className="space-y-3">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Recent activity</h2>
        <SkeletonCard />
        <SkeletonCard />
      </section>
    );
  }
  if (!workouts || workouts.length === 0) return null;
  const visible = workouts.slice(0, showMore ? EXPANDED_COUNT : INITIAL_COUNT);
  const hasMore = workouts.length > INITIAL_COUNT;

  return (
    <section aria-labelledby="recent-title" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="recent-title" className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Recent activity</h2>
        <Link to="/history">
          <Button variant="ghost" size="sm" className="text-primary-600 dark:text-primary-300 font-semibold">
            <span>View all</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </Link>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {visible.map((workout, index) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, delay: index >= INITIAL_COUNT ? (index - INITIAL_COUNT) * 0.05 : 0 }}
            >
              <Link to="/history" aria-label={`${workout.type === 'rest_day' ? 'Rest day' : workout.name}, ${formatDate(workout.date)}`}>
                <Card hover className="!p-4">
                  {workout.type === 'rest_day' ? (
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-2 flex-shrink-0">
                        <Hotel className="w-5 h-5 text-purple-600 dark:text-purple-300" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white">Rest day</p>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400">{formatDate(workout.date)}</p>
                      </div>
                      <div className="flex items-center" role="img" aria-label={`Recovery ${workout.recoveryQuality || 0} of 5`}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < (workout.recoveryQuality || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} aria-hidden="true" />
                        ))}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{workout.name}</p>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatDate(workout.date)} • {workout.exercises?.length || 0} exercises{workout.duration ? ` • ${workout.duration} min` : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    </div>
                  )}
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <motion.button
          onClick={onToggleMore}
          whileTap={{ scale: 0.97 }}
          aria-expanded={showMore}
          className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[48px] rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-primary-300 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
        >
          <motion.span animate={{ rotate: showMore ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </motion.span>
          {showMore ? 'Show less' : `Show ${Math.min(EXPANDED_COUNT, workouts.length) - INITIAL_COUNT} more`}
        </motion.button>
      )}
    </section>
  );
};

export default RecentActivity;
