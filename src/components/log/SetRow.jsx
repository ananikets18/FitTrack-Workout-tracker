import { Check, Pencil, Trash2 } from 'lucide-react';
import NumberPicker from '../common/NumberPicker';
import { isBarbellExercise } from '../../data/exercises';
import { perSideToTotal, totalToPerSide } from '../../utils/weightUtils';

const SetRow = ({ exerciseName, category, set, index, onChange, onToggle, onEdit, onDelete }) => {
  const isCardio = category === 'cardio';
  const isTreadmill = isCardio && exerciseName.toLowerCase().includes('treadmill');
  const isBarbell = isBarbellExercise(exerciseName);
  const total = isBarbell ? perSideToTotal(set.weight, exerciseName) : (set.weight || 0);

  return (
    <div className={`rounded-xl border p-2.5 transition-colors ${set.completed ? 'bg-success-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-[13px] font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
          {isCardio ? (
            <NumberPicker label={isTreadmill ? 'Min' : 'Duration'} value={set.duration || 0} onChange={(v) => onChange({ duration: v })} min={0} max={999} />
          ) : (
            <NumberPicker label="Reps" value={set.reps || 0} onChange={(v) => onChange({ reps: v })} min={0} max={999} />
          )}
          {!isCardio || isTreadmill ? (
            <NumberPicker
              label={isBarbell ? 'Total kg' : isTreadmill ? 'Speed' : 'Weight'}
              value={isBarbell ? total : (isTreadmill ? set.speed || 0 : set.weight || 0)}
              onChange={(v) => {
                if (isBarbell) onChange({ weight: totalToPerSide(v, exerciseName) });
                else if (isTreadmill) onChange({ speed: v });
                else onChange({ weight: v });
              }}
              min={0}
              max={999}
              step={isBarbell ? 2.5 : 1}
              unit={isTreadmill ? '' : 'kg'}
            />
          ) : <span className="text-[13px] text-gray-400 self-center">bodyweight</span>}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={onToggle}
            aria-label={set.completed ? `Mark set ${index + 1} not done` : `Mark set ${index + 1} done`}
            aria-pressed={!!set.completed}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${set.completed ? 'bg-success-600' : 'bg-gray-200 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/40'}`}
          >
            {set.completed ? <Check className="w-5 h-5 text-white" aria-hidden="true" /> : <span className="w-4 h-4 border-2 border-gray-400 rounded-full" aria-hidden="true" />}
          </button>
          <div className="flex gap-1">
            <button onClick={onEdit} aria-label={`Edit set ${index + 1}`} className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30">
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={onDelete} aria-label={`Delete set ${index + 1}`} className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-red-900/30">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      {isBarbell && (
        <p className="mt-1 text-right text-[13px] text-gray-400">{(parseFloat(set.weight) || 0).toFixed(1)}/side + 20 bar</p>
      )}
    </div>
  );
};

export default SetRow;
