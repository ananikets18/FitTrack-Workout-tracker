import { motion } from 'framer-motion';
import { Dumbbell, FileText, History, Plus } from 'lucide-react';
import Card from '../common/Card';

const TemplateGallery = ({ templates, lastWorkout, recentNames, onUseTemplate, onAppendTemplate, onBlank, onQuickAdd }) => {
  return (
    <Card className="text-center !py-8" aria-labelledby="tpl-title">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 mb-3">
        <Dumbbell className="w-7 h-7 text-primary-600 dark:text-primary-300" aria-hidden="true" />
      </div>
      <h3 id="tpl-title" className="text-lg font-bold text-gray-900 dark:text-white">Start from a template</h3>
      <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">Pick a plan or start blank — add exercises as you go.</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="list" aria-label="Templates">
        <button
          onClick={onBlank}
          role="listitem"
          className="min-w-[150px] flex-1 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-3 text-left hover:border-primary-400 transition-colors min-h-[96px]"
        >
          <Plus className="w-5 h-5 text-primary-600 dark:text-primary-300" aria-hidden="true" />
          <p className="mt-1.5 text-sm font-bold text-gray-900 dark:text-white">Blank</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">Build as you train</p>
        </button>

        {lastWorkout && (
          <button
            onClick={() => onAppendTemplate({ name: lastWorkout.name, exercises: lastWorkout.exercises, duration: lastWorkout.duration })}
            role="listitem"
            className="min-w-[170px] flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-left hover:border-primary-400 transition-colors min-h-[96px]"
          >
            <History className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            <p className="mt-1.5 text-sm font-bold text-gray-900 dark:text-white truncate">Last: {lastWorkout.name}</p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">{lastWorkout.exercises?.length || 0} exercises</p>
          </button>
        )}

        {templates.slice(0, 6).map((t) => (
          <motion.div key={t.id} role="listitem" whileTap={{ scale: 0.97 }} className="min-w-[170px] flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-left min-h-[96px] flex flex-col">
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-300" aria-hidden="true" />
            <p className="mt-1.5 text-sm font-bold text-gray-900 dark:text-white truncate">{t.name}</p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">{t.exercises?.length || 0} ex{t.duration ? ` • ${t.duration}m` : ''}</p>
            <div className="mt-auto pt-2 grid grid-cols-2 gap-1.5">
              <button onClick={() => onAppendTemplate(t)} className="min-h-[40px] rounded-lg bg-gray-100 dark:bg-gray-800 text-[13px] font-bold text-gray-700 dark:text-gray-200">Add</button>
              <button onClick={() => onUseTemplate(t)} className="min-h-[40px] rounded-lg bg-purple-600 text-[13px] font-bold text-white">Use</button>
            </div>
          </motion.div>
        ))}
      </div>

      {recentNames?.length > 0 && (
        <div className="mt-4 text-left">
          <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Recent exercises — tap to add</p>
          <div className="flex flex-wrap gap-1.5">
            {recentNames.slice(0, 8).map((n) => (
              <button
                key={n}
                onClick={() => onQuickAdd(n)}
                className="min-h-[40px] px-3 rounded-full bg-gray-100 dark:bg-gray-800 text-[13px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
              >
                + {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default TemplateGallery;
