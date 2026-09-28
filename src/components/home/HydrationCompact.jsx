import { motion } from 'framer-motion';
import { Droplet, Minus, Undo2 } from 'lucide-react';
import Card from '../common/Card';
import { WATER_INTAKE } from '../../constants';

const QUICK = [
  { ml: WATER_INTAKE.SMALL_GLASS_ML, label: 'Glass' },
  { ml: WATER_INTAKE.LARGE_GLASS_ML, label: 'Large' },
  { ml: WATER_INTAKE.BOTTLE_ML, label: 'Bottle' },
  { ml: WATER_INTAKE.GYM_BOTTLE_ML, label: 'Gym' },
];

const HydrationCompact = ({ amount, onAdd, onUndo, goalReached, justStarted }) => {
  const pct = Math.min((amount / WATER_INTAKE.DAILY_GOAL_ML) * 100, 100);

  return (
    <Card className="!p-4" aria-labelledby="hydration-title">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-primary-600 rounded-xl p-2 shadow-soft flex-shrink-0">
            <Droplet className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="hydration-title" className="text-base font-bold text-gray-900 dark:text-white leading-none">Hydration</h2>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1" aria-live="polite">
              {(amount / 1000).toFixed(1)}L of {WATER_INTAKE.DAILY_GOAL_ML / 1000}L • {Math.round(pct)}%
            </p>
          </div>
        </div>
        <button
          onClick={onUndo}
          disabled={amount === 0}
          aria-label={`Undo ${WATER_INTAKE.UNDO_AMOUNT_ML} milliliters`}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          <Undo2 className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 h-2.5 bg-primary-100 dark:bg-primary-900/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full"
        />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {QUICK.map((q) => (
          <motion.button
            key={q.ml}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAdd(q.ml)}
            aria-label={`Add ${q.ml} milliliters water`}
            className="min-h-[48px] rounded-xl border border-primary-200 dark:border-primary-800 bg-white dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors px-1 py-2"
          >
            <Droplet className="w-4 h-4 text-primary-500 mx-auto" aria-hidden="true" />
            <div className="text-[13px] font-bold text-gray-900 dark:text-white mt-0.5">+{q.ml}</div>
            <div className="text-[13px] text-gray-500 dark:text-gray-400 leading-none">{q.label}</div>
          </motion.button>
        ))}
      </div>

      {goalReached && (
        <p role="status" className="mt-3 rounded-xl bg-success-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-center text-[13px] font-bold text-success-700 dark:text-emerald-300">
          Daily goal achieved
        </p>
      )}
      {justStarted && (
        <p role="status" className="mt-2 text-center text-[13px] text-warning-700 dark:text-amber-300">
          Keep drinking — you’re getting started
        </p>
      )}
      <p className="sr-only">
        <Minus aria-hidden="true" />
      </p>
    </Card>
  );
};

export default HydrationCompact;
