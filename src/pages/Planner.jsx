import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, addDays, parseISO, isValid } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, ClipboardList, Copy, Trash2, Check, Cloud, CloudOff, ArrowRight, Save, BookmarkPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkoutPlanner } from '../context/WorkoutPlannerContext';
import { useWorkouts } from '../context/WorkoutContext';
import { useTemplates } from '../context/TemplateContext';
import { useGymSession } from '../hooks/useGymSession';
import { getLocalDateInputValue } from '../utils/date';
import { createWorkoutPlan, copyWorkoutPlan, planFromWorkout, getPlanProgress } from '../utils/workoutPlanner';
import PlannerExercise from '../components/planner/PlannerExercise';
import AddPlanExercises from '../components/planner/AddPlanExercises';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import RestTimer from '../components/workout/RestTimer';

const inputClass = 'mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500';
const primaryClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40';
const quietClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800';

function NewPlanModal({ date, sources, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [planDate, setPlanDate] = useState(date);
  const [source, setSource] = useState('');
  return <Modal isOpen onClose={onClose} title="Plan a workout">
    <form onSubmit={(event) => {
      event.preventDefault();
      if (!title.trim() || !planDate) return;
      const selected = sources.find((item) => item.key === source);
      const plan = selected ? planFromWorkout(selected.workout, planDate) : createWorkoutPlan(title, planDate);
      onCreate({ ...plan, title: title.trim() });
    }} className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Workout title<input autoFocus required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Arms Day" className={inputClass} /></label>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date<input required type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} className={inputClass} /></label>
      {sources.length > 0 && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start from<select value={source} onChange={(event) => { setSource(event.target.value); const selected = sources.find((item) => item.key === event.target.value); if (selected) setTitle(selected.workout.name); }} className={inputClass}><option value="">Empty checklist</option>{sources.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select><span className="mt-2 block text-xs font-normal text-gray-500">Existing sets become editable targets. All exercise checkboxes start unchecked.</span></label>}
      <button type="submit" disabled={!title.trim() || !planDate} className={`${primaryClass} w-full`}><Plus className="h-4 w-4" />Create checklist</button>
    </form>
  </Modal>;
}

export default function Planner() {
  const [params, setParams] = useSearchParams();
  const today = getLocalDateInputValue();
  const requestedDate = params.get('date');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '') && isValid(parseISO(requestedDate)) ? requestedDate : today;
  const { plans, syncStatus, storageError, putPlan, updatePlan, deletePlan, finishPlan, retrySync } = useWorkoutPlanner();
  const { workouts, refreshWorkouts } = useWorkouts();
  const { templates, saveTemplate } = useTemplates();
  const gym = useGymSession();
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyDate, setCopyDate] = useState(today);
  const [removing, setRemoving] = useState(null);
  const [timerOpen, setTimerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const dayPlans = plans.filter((plan) => plan.date === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const active = dayPlans.find((plan) => plan.id === selectedId) || dayPlans[0];
  const dayTotal = dayPlans.reduce((sum, plan) => sum + plan.exercises.length, 0);
  const dayDone = dayPlans.reduce((sum, plan) => sum + getPlanProgress(plan).done, 0);
  const progress = active ? getPlanProgress(active) : null;
  const isSaved = active?.loggedAt && active.savedRevision === active.revision && workouts.some((workout) => workout.id === active.id);
  const sources = [
    ...templates.map((workout) => ({ key: `template-${workout.id}`, label: `Template · ${workout.name}`, workout })),
    ...workouts.filter((workout) => workout.type !== 'rest_day').slice(0, 12).map((workout) => ({ key: `history-${workout.id}`, label: `History · ${workout.name} · ${format(parseISO(workout.date), 'd MMM')}`, workout })),
  ];
  const selectDate = (value) => { if (value) setParams({ date: value }); };
  const changeExercise = (id, changes) => updatePlan(active.id, { exercises: active.exercises.map((exercise) => exercise.id === id ? { ...exercise, ...changes } : exercise) });
  const moveExercise = (index, direction) => {
    const list = [...active.exercises];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    updatePlan(active.id, { exercises: list });
  };
  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (date === today && active.duration === '' && (gym.isActive || gym.isCompleted)) {
        updatePlan(active.id, { duration: gym.sessionDurationMinutes ?? Math.round(gym.elapsedSeconds / 60) });
      }
      await finishPlan(active.id);
      if (date === today) {
        if (gym.isActive) gym.endSession();
        gym.markSessionWorkoutLogged();
      }
      await refreshWorkouts();
      toast.success('Workout saved to History');
    } catch (error) { toast.error(error.message || 'Could not save workout. Your checklist is still here.'); }
    finally { setSaving(false); }
  };
  const syncLabel = storageError ? 'Device storage full · keep this screen open' : ({ loading: 'Loading saved plans…', saving: 'Syncing…', synced: 'Saved to cloud & device', setup: 'Saved on this device · cloud setup needed', offline: 'Saved on this device · sync pending', pending: 'Saved on this device · sync pending' })[syncStatus];

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-300">One exercise at a time</p><h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl"><ClipboardList className="h-7 w-7 text-primary-600" />Daily Planner</h1><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Build your session. Log the details. Check it off.</p></div>
      <button onClick={() => setCreating(true)} className={primaryClass}><Plus className="h-4 w-4" />Plan workout</button>
    </div>
    <div role="status" className={`flex flex-wrap items-center gap-2 text-xs ${storageError ? 'text-danger-600' : 'text-gray-500 dark:text-gray-400'}`}>
      {syncStatus === 'synced' ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}<span>{syncLabel}</span>
      {['offline', 'setup'].includes(syncStatus) && <button onClick={retrySync} className="min-h-8 rounded-lg px-2 font-semibold text-primary-600 dark:text-primary-300">Retry sync</button>}
    </div>
    {syncStatus === 'setup' && <p className="rounded-xl border border-warning-100 bg-warning-50 p-3 text-sm text-warning-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">Your checklist works on this device. Apply the workout planner database migration to enable cloud sync and saving to History.</p>}
    <section aria-label="Select planner date" className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold text-gray-900 dark:text-white">{date === today ? 'Today' : format(parseISO(date), 'EEEE')}<span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">{format(parseISO(date), 'd MMM yyyy')}</span></h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{dayDone} / {dayTotal} exercises completed · {dayPlans.length} workout{dayPlans.length === 1 ? '' : 's'}</p></div>
        <div className="flex items-center gap-1">
          <button aria-label="Previous day" onClick={() => selectDate(format(addDays(parseISO(date), -1), 'yyyy-MM-dd'))} className="rounded-xl p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeft className="h-5 w-5" /></button>
          <input aria-label="Planner date" type="date" value={date} onChange={(event) => selectDate(event.target.value)} className="min-h-11 min-w-0 rounded-xl border border-gray-200 bg-transparent px-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200" />
          <button aria-label="Next day" onClick={() => selectDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd'))} className="rounded-xl p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 border-t border-gray-100 pt-3 dark:border-gray-800">{Array.from({ length: 7 }, (_, i) => {
        const day = addDays(parseISO(date), i - 3);
        const ymd = format(day, 'yyyy-MM-dd');
        const count = plans.filter((plan) => plan.date === ymd).length;
        return <button key={ymd} aria-label={format(day, 'EEEE, d MMMM')} aria-pressed={ymd === date} onClick={() => selectDate(ymd)} className={`flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-xl ${ymd === date ? 'bg-primary-600 text-white shadow-soft' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}><span className="text-[11px] font-medium">{format(day, 'EEE')}</span><span className="text-base font-bold">{format(day, 'd')}</span><span className={`h-1 w-1 rounded-full ${count ? ymd === date ? 'bg-white' : 'bg-primary-500' : 'bg-transparent'}`} /></button>;
      })}</div>
      {date !== today && <button onClick={() => selectDate(today)} className="mt-2 min-h-9 text-xs font-semibold text-primary-600 dark:text-primary-300">Back to today</button>}
    </section>

    {!active ? <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-14 text-center dark:border-gray-700"><CalendarDays className="mx-auto mb-4 h-10 w-10 text-primary-400" /><h2 className="text-xl font-bold text-gray-900 dark:text-white">A fresh page for your training</h2><p className="mx-auto mb-6 mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">Plan Arms Day, a warm-up, or a little cardio. Add your exercises and work through them at your pace.</p><button onClick={() => setCreating(true)} className={primaryClass}><Plus className="h-4 w-4" />Plan your first workout</button></div> : <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside aria-label="Workouts for this day" className="space-y-2">{dayPlans.map((plan) => {
        const summary = getPlanProgress(plan);
        return <button key={plan.id} onClick={() => setSelectedId(plan.id)} aria-pressed={active.id === plan.id} className={`w-full rounded-2xl border p-4 text-left transition-colors ${active.id === plan.id ? 'border-primary-300 bg-primary-50 dark:border-primary-800 dark:bg-primary-950/40' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'}`}><span className="flex items-center justify-between gap-2"><span className="truncate font-bold text-gray-900 dark:text-white">{plan.title || 'Untitled workout'}</span>{summary.status === 'Completed' && <Check className="h-4 w-4 flex-shrink-0 text-success-600" />}</span><span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{summary.done} / {summary.total} exercises · {summary.status}</span></button>;
      })}<button onClick={() => setCreating(true)} className={`${quietClass} w-full border-dashed`}><Plus className="h-4 w-4" />Another workout</button></aside>
      <fieldset disabled={saving} className="min-w-0 space-y-4 disabled:opacity-70">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${progress.status === 'Completed' ? 'bg-success-50 text-success-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'}`}>{progress.status}</span><span className="text-xs text-gray-500 dark:text-gray-400">{progress.done} of {progress.total} done</span></div>
          <label className="mt-3 block"><span className="sr-only">Workout title</span><input aria-label="Workout title" maxLength={100} value={active.title} onChange={(event) => updatePlan(active.id, { title: event.target.value })} onBlur={() => { if (!active.title.trim()) updatePlan(active.id, { title: 'Untitled workout' }); }} className="w-full rounded-lg bg-transparent py-1 text-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white sm:text-2xl" /></label>
          <div role="progressbar" aria-label="Workout completion" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div style={{ width: `${progress.percent}%` }} className="h-full rounded-full bg-primary-500 transition-all" /></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px]">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Session notes (optional)<textarea aria-label="Session notes" rows={2} maxLength={1000} value={active.notes} onChange={(event) => updatePlan(active.id, { notes: event.target.value })} placeholder="What’s the focus today?" className={`${inputClass} resize-y`} /></label>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration (min)<input aria-label="Workout duration in minutes" type="number" min={0} max={999} step={1} value={active.duration} onChange={(event) => updatePlan(active.id, { duration: event.target.value === '' ? '' : Math.min(999, Math.max(0, Math.round(Number(event.target.value)))) })} placeholder="Optional" className={inputClass} /></label>
          </div>
          <label className="mt-3 block text-xs font-medium text-gray-500 dark:text-gray-400">Scheduled date<input aria-label="Workout scheduled date" type="date" value={active.date} onChange={(event) => { if (event.target.value) { updatePlan(active.id, { date: event.target.value }); selectDate(event.target.value); } }} className={inputClass} /></label>
          <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => { setCopyDate(format(addDays(parseISO(date), 1), 'yyyy-MM-dd')); setCopying(true); }} className={quietClass}><Copy className="h-4 w-4" />Copy to date</button><button disabled={!active.exercises.length} onClick={async () => {
            try { await saveTemplate({ name: active.title, duration: active.duration || null, exercises: active.exercises.map(({ name, category, notes, sets, mode, section }) => ({ name, category: mode === 'cardio' ? 'cardio' : mode === 'timed' ? 'mobility' : category, notes, mode, section, sets: sets.map((set) => ({ ...set, completed: false })) })) }); toast.success('Template saved'); }
            catch { toast.error('Could not save template'); }
          }} className={quietClass}><BookmarkPlus className="h-4 w-4" />Save template</button><button onClick={() => setRemoving({ type: 'plan', id: active.id })} aria-label="Delete workout plan" className="ml-auto rounded-xl p-3 text-gray-400 hover:bg-red-50 hover:text-danger-600"><Trash2 className="h-4 w-4" /></button></div>
        </div>
        <div className="space-y-3">{active.exercises.map((exercise, index) => {
          const previousWorkout = workouts.find((workout) => workout.id !== active.id && workout.exercises?.some((item) => item.name.toLowerCase() === exercise.name.toLowerCase()));
          return <div key={exercise.id}>{(index === 0 || active.exercises[index - 1].section !== exercise.section) && <h3 className="mb-2 mt-4 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{exercise.section}{exercise.section === 'Superset' && <span className="font-normal normal-case tracking-normal">Alternate exercises each round</span>}</h3>}<PlannerExercise exercise={exercise} index={index} total={active.exercises.length} onChange={(changes) => changeExercise(exercise.id, changes)} onMove={(direction) => moveExercise(index, direction)} onRemove={() => setRemoving({ type: 'exercise', id: exercise.id })} onRest={() => setTimerOpen(true)} previous={previousWorkout ? { date: previousWorkout.date, exercise: previousWorkout.exercises.find((item) => item.name.toLowerCase() === exercise.name.toLowerCase()) } : null} /></div>;
        })}</div>
        {!active.exercises.length && <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">Your checklist is ready. Search for exercises or paste your whole routine.</div>}
        <button onClick={() => setAdding(true)} className={`${quietClass} w-full border-dashed`}><Plus className="h-4 w-4" />Add exercises</button>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">Your checklist saves automatically. Finish & save sends checked exercises and their recorded sets to History. Unchecked exercises stay in your plan. Later saves update the same history entry.</p>
          <div className="flex flex-wrap items-center justify-between gap-3"><button onClick={finish} disabled={saving || !progress.done || !active.title.trim() || date > today || isSaved} className={primaryClass}><Save className="h-4 w-4" />{saving ? 'Saving…' : isSaved ? 'Saved to History' : active.loggedAt ? 'Update History' : 'Finish & save'}</button>{active.loggedAt && <Link to="/history" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">View History<ArrowRight className="h-4 w-4" /></Link>}</div>
          {date > today && <p className="mt-2 text-xs text-gray-500">Future plans can be saved to History on their scheduled date.</p>}
        </div>
      </fieldset>
    </div>}
    {creating && <NewPlanModal date={date} sources={sources} onClose={() => setCreating(false)} onCreate={(plan) => { putPlan(plan); selectDate(plan.date); setSelectedId(plan.id); setCreating(false); setAdding(true); }} />}
    {adding && active && <AddPlanExercises key={active.id} onClose={() => setAdding(false)} onAdd={(exercises) => updatePlan(active.id, { exercises: [...active.exercises, ...exercises] })} />}
    {copying && active && <Modal isOpen onClose={() => setCopying(false)} title="Copy workout to a date"><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const copy = copyWorkoutPlan(active, copyDate); putPlan(copy); selectDate(copyDate); setSelectedId(copy.id); setCopying(false); toast.success('Workout copied with fresh checkboxes'); }}><label className="block text-sm text-gray-700 dark:text-gray-300">Date<input required type="date" value={copyDate} onChange={(event) => setCopyDate(event.target.value)} className={inputClass} /></label><p className="text-sm text-gray-500">Exercises and set targets are copied. Completion and session notes start fresh.</p><button type="submit" className={`${primaryClass} w-full`}>Copy workout</button></form></Modal>}
    <ConfirmDialog isOpen={!!removing} onClose={() => setRemoving(null)} title={removing?.type === 'plan' ? 'Delete workout plan?' : 'Remove exercise?'} message={removing?.type === 'plan' ? 'This removes the checklist. A workout already saved in History is kept.' : 'This removes the exercise and its set details from this checklist.'} confirmText="Delete" onConfirm={() => { if (removing.type === 'plan') deletePlan(removing.id); else updatePlan(active.id, { exercises: active.exercises.filter((exercise) => exercise.id !== removing.id) }); }} />
    <RestTimer isOpen={timerOpen} onClose={() => setTimerOpen(false)} />
  </div>;
}
