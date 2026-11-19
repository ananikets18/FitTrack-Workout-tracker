import { useState } from 'react';
import { ChevronDown, Plus, Trash2, ArrowUp, ArrowDown, Timer } from 'lucide-react';
import { exerciseLibrary, isBarbellExercise } from '../../data/exercises';
import { perSideToTotal, totalToPerSide } from '../../utils/weightUtils';
import { blankPlanSet, PLAN_SECTIONS } from '../../utils/workoutPlanner';

const fieldClass = 'w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500';

function SetInput({ label, value, onChange, max = 999, step = 1, min = 0 }) {
  const [draft, setDraft] = useState(null);
  return <label className="min-w-0 text-xs font-medium text-gray-500 dark:text-gray-400">
    {label}<input aria-label={label} type="number" inputMode="decimal" min={min} max={max} step={step} value={draft ?? value} placeholder="—" onFocus={() => setDraft(String(value))} onBlur={() => setDraft(null)} onChange={(event) => { setDraft(event.target.value); onChange(event.target.value === '' ? '' : Math.min(max, Math.max(min, Number(event.target.value)))); }} className={`${fieldClass} mt-1`} />
  </label>;
}

export default function PlannerExercise({ exercise, index, total, onChange, onRemove, onMove, onRest, previous }) {
  const [expanded, setExpanded] = useState(false);
  const { mode, name, sets } = exercise;
  const isBarbell = mode === 'strength' && isBarbellExercise(name);
  const updateSet = (id, changes) => onChange({ sets: sets.map((set) => set.id === id ? { ...set, ...changes } : set) });
  const detailsId = `plan-exercise-${exercise.id}`;

  return <div className={`overflow-hidden rounded-2xl border transition-colors ${exercise.completed ? 'border-success-100 bg-success-50/50 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'}`}>
    <div className="flex items-center gap-2 p-2.5 sm:p-3">
      <label className="flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center">
        <input type="checkbox" checked={exercise.completed} onChange={(event) => onChange({ completed: event.target.checked })} aria-label={`Complete ${name}`} className="h-6 w-6 rounded-lg accent-primary-600" />
      </label>
      <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls={detailsId} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left">
        <span className="min-w-0 flex-1">
          <span className={`block break-words text-sm font-semibold sm:text-base ${exercise.completed ? 'text-success-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`}>{name}</span>
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{sets.length ? `${sets.length} ${mode === 'cardio' ? 'interval' : 'set'}${sets.length === 1 ? '' : 's'} entered` : 'Tap to add details'}{exercise.completed ? ' · Done' : ''}</span>
        </span>
        <ChevronDown aria-hidden="true" className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
    {expanded && <div id={detailsId} className="space-y-4 border-t border-gray-100 p-3 sm:p-4 dark:border-gray-800">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Exercise name<input aria-label="Exercise name" value={name} maxLength={150} onChange={(event) => onChange({ name: event.target.value })} onBlur={() => { if (!name.trim()) onChange({ name: 'Untitled exercise' }); }} className={`${fieldClass} mt-1`} /></label>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Section<select aria-label={`Section for ${name}`} value={exercise.section} onChange={(event) => onChange({ section: event.target.value })} className={`${fieldClass} mt-1`}>{PLAN_SECTIONS.map((section) => <option key={section}>{section}</option>)}</select></label>
      </div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Track as<select aria-label={`Tracking type for ${name}`} value={mode} onChange={(event) => onChange({ mode: event.target.value, sets: [] })} className={`${fieldClass} mt-1`}>
        <option value="strength">Strength · reps & weight</option><option value="cardio">Cardio · minutes</option><option value="timed">Stretch / hold · seconds</option>
      </select><span className="mt-1 block font-normal">Changing type clears this exercise’s set details.</span></label>
      {mode === 'strength' && <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Muscle group<select aria-label={`Muscle group for ${name}`} value={exercise.category} onChange={(event) => onChange({ category: event.target.value })} className={`${fieldClass} mt-1`}>{[...Object.keys(exerciseLibrary).filter((category) => category !== 'cardio'), 'other'].filter((value, i, all) => all.indexOf(value) === i).map((category) => <option key={category} value={category}>{category}</option>)}</select></label>}
      {previous && <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        <span className="font-semibold">Last time · {new Date(previous.date).toLocaleDateString()}</span>
        <p className="mt-1">{previous.exercise.sets.map((set) => previous.exercise.category === 'cardio' ? `${set.duration || 0} min` : previous.exercise.category === 'mobility' ? `${set.duration || 0} sec` : `${set.reps || 0} × ${perSideToTotal(set.weight, name)} kg`).join(' · ') || 'No sets recorded'}</p>
      </div>}
      {isBarbell && <p className="text-xs text-primary-700 dark:text-primary-300">Enter total weight including the 20 kg bar. FitTrack uses the same weight convention as your workout log.</p>}
      {sets.map((set, setIndex) => <fieldset key={set.id} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
        <legend className="px-1 text-xs font-bold text-gray-600 dark:text-gray-300">{mode === 'cardio' ? 'Interval' : 'Set'} {setIndex + 1}</legend>
        <div className="flex items-end gap-2">
          <div className={`grid min-w-0 flex-1 gap-2 ${mode === 'strength' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {mode === 'strength' ? <>
              <SetInput label="Reps" value={set.reps} onChange={(reps) => updateSet(set.id, { reps: reps === '' ? '' : Math.floor(reps) })} />
              <SetInput label={isBarbell ? 'Total kg' : 'Weight (kg)'} value={set.weight === '' ? '' : perSideToTotal(set.weight, name)} min={isBarbell ? 20 : 0} max={9999} step={0.5} onChange={(value) => updateSet(set.id, { weight: value === '' ? '' : totalToPerSide(value, name) })} />
            </> : <SetInput label={mode === 'timed' ? 'Duration (sec)' : 'Duration (min)'} max={mode === 'timed' ? 59940 : 999} value={set.duration} onChange={(duration) => updateSet(set.id, { duration: duration === '' ? '' : Math.round(duration) })} />}
          </div>
          <button type="button" onClick={() => onChange({ sets: sets.filter((item) => item.id !== set.id) })} aria-label={`Remove set ${setIndex + 1} from ${name}`} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-danger-600"><Trash2 className="h-4 w-4" /></button>
        </div>
        {mode === 'cardio' && /treadmill/i.test(name) && <div className="mt-3 grid grid-cols-2 gap-2">
          <SetInput label="Speed (km/h)" value={set.speed} max={25} step={0.1} onChange={(speed) => updateSet(set.id, { speed })} />
          <SetInput label="Incline (%)" value={set.incline} max={15} step={0.5} onChange={(incline) => updateSet(set.id, { incline })} />
        </div>}
      </fieldset>)}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange({ sets: [...sets, { ...(sets.at(-1) || blankPlanSet()), id: crypto.randomUUID() }] })} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-50 px-3 text-sm font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"><Plus className="h-4 w-4" />Add {mode === 'cardio' ? 'interval' : 'set'}</button>
        <button type="button" onClick={onRest} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"><Timer className="h-4 w-4" />Rest timer</button>
      </div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Notes (optional)<textarea aria-label={`Notes for ${name}`} rows={2} maxLength={500} value={exercise.notes} onChange={(event) => onChange({ notes: event.target.value })} placeholder="Form cues, how it felt…" className={`${fieldClass} mt-1 resize-y`} /></label>
      <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
        <div className="flex gap-1"><button type="button" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move ${name} up`} className="rounded-lg p-3 text-gray-500 disabled:opacity-25"><ArrowUp className="h-4 w-4" /></button><button type="button" disabled={index === total - 1} onClick={() => onMove(1)} aria-label={`Move ${name} down`} className="rounded-lg p-3 text-gray-500 disabled:opacity-25"><ArrowDown className="h-4 w-4" /></button></div>
        <button type="button" onClick={onRemove} className="min-h-11 rounded-xl px-3 text-sm font-medium text-danger-600 dark:text-red-400">Remove exercise</button>
      </div>
    </div>}
  </div>;
}
