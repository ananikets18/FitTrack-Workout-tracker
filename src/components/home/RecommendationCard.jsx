import { motion } from 'framer-motion';
import { Brain, Zap } from 'lucide-react';
import Button from '../common/Button';
import { MUSCLE_COLORS } from '../../constants';
import { formatDate } from '../../utils/calculations';

const RecommendationCard = ({ recommendation, onStart }) => {
  if (!recommendation || recommendation.shouldRest || !recommendation.workout) return null;
  const w = recommendation.workout;

  return (
    <motion.section
      aria-labelledby="ai-rec-title"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-soft p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1.5">
            <Brain className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          </div>
          <span className="text-[13px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Up next</span>
        </div>
        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-[13px] font-bold text-gray-600 dark:text-gray-300">
          {recommendation.confidence}% match
        </span>
      </div>

      <h2 id="ai-rec-title" className="mt-2.5 text-lg font-bold text-gray-900 dark:text-white">{w.name}</h2>
      <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
        {w.exercises?.length || 0} exercises • Last done {formatDate(w.date)}
      </p>

      {recommendation.muscleTargets?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recommendation.muscleTargets.map((m, i) => (
            <span key={i} className={`${MUSCLE_COLORS[m.toLowerCase()] || 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'} px-2.5 py-1 rounded-full text-[13px] font-semibold capitalize text-gray-700 dark:text-gray-200`}>
              {m}
            </span>
          ))}
        </div>
      )}

      {recommendation.reasoning?.[0] && (
        <p className="mt-3 text-[13px] text-gray-600 dark:text-gray-400">{recommendation.reasoning[0]}</p>
      )}

      <Button variant="secondary" size="md" onClick={onStart} className="w-full mt-3">
        <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
        Start this workout
      </Button>

      {recommendation.alternatives?.length > 0 && (
        <details className="mt-3">
          <summary className="text-[13px] text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer font-medium min-h-[44px] flex items-center">
            {recommendation.alternatives.length} alternative{recommendation.alternatives.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-2 space-y-1.5">
            {recommendation.alternatives.map((alt, i) => (
              <div key={i} className="text-[13px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                <span className="font-semibold text-gray-900 dark:text-white">{alt.workout.name}</span>
                <span> — {alt.reason}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </motion.section>
  );
};

export default RecommendationCard;
