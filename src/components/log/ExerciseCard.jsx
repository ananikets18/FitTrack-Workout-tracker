import { GripVertical, Copy, Plus, Trash2, ChevronDown } from 'lucide-react';
import Card from '../common/Card';
import SetRow from './SetRow';

const ExerciseCard = ({ exercise, collapsed, onToggleCollapse, onUpdateSet, onToggleSet, onEditSet, onDeleteSet, onAddSet, onCopySet, onRemove }) => {
  const done = exercise.sets.filter((s) => s.completed).length;
  const total = exercise.sets.length;

  return (
    <Card id={`exercise-${exercise.id}`} className="!p-3 md:!p-4 scroll-mt-32">
      <div className="flex items-start gap-2">
        <GripVertical className="w-5 h-5 text-gray-300 mt-2.5 flex-shrink-0" aria-hidden="true" />
        <button
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${exercise.name}, ${done} of ${total} sets done`}
          className="flex-1 min-w-0 text-left rounded-lg min-h-[48px] flex items-center gap-2"
        >
          <span className="flex-1 min-w-0">
            <span className="block text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">{exercise.name}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400">
              <span className="px-2 py-px font-semibold text-primary-600 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/40 rounded-full capitalize">{exercise.category}</span>
              <span aria-live="polite">{done}/{total} done</span>
            </span>
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${collapsed ? '' : 'rotate-180'}`} aria-hidden="true" />
        </button>
        <button onClick={() => onCopySet?.(exercise.id)} aria-label={`Duplicate ${exercise.name}`} title="Duplicate exercise" className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30">
          <Copy className="w-5 h-5" aria-hidden="true" />
        </button>
        <button onClick={() => onRemove(exercise.id)} aria-label={`Remove ${exercise.name}`} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-red-900/30">
          <Trash2 className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {!collapsed && (
      <div className="mt-2.5 space-y-2">
        {exercise.sets.map((set, i) => (
          <SetRow
            key={set.id || `${exercise.id}-${i}`}
            exerciseName={exercise.name}
            category={exercise.category}
            set={set}
            index={i}
            onChange={(patch) => onUpdateSet(exercise.id, i, patch)}
            onToggle={() => onToggleSet(exercise.id, i)}
            onEdit={() => onEditSet(exercise.id, i)}
            onDelete={() => onDeleteSet(exercise.id, i)}
          />
        ))}
        <button
          onClick={() => onAddSet(exercise.id)}
          className="w-full min-h-[48px] py-2.5 px-4 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 text-primary-600 dark:text-primary-300 font-semibold rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-800 flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          Add set
        </button>
      </div>
      )}

      {exercise.notes && !collapsed && (
        <div className="mt-3 p-2.5 bg-warning-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-[13px] text-amber-900 dark:text-amber-200">{exercise.notes}</p>
        </div>
      )}
    </Card>
  );
};

export default ExerciseCard;
