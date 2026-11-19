import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import Modal from '../common/Modal';
import { searchExercises } from '../../data/exercises';
import { PLAN_SECTIONS, createPlanExercise, parseExerciseList } from '../../utils/workoutPlanner';

const fieldClass = 'mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500';

export default function AddPlanExercises({ onClose, onAdd }) {
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [section, setSection] = useState('Strength');
  const [added, setAdded] = useState(0);
  const results = query.trim() ? searchExercises(query).slice(0, 10) : [];
  const parsed = parseExerciseList(text, section);
  const add = (name) => { onAdd([createPlanExercise(name, section)]); setAdded(added + 1); setQuery(''); };
  return <Modal isOpen onClose={onClose} title="Add exercises" footer={<button type="button" onClick={onClose} className="min-h-12 w-full rounded-xl bg-primary-600 px-4 font-semibold text-white">Done{added > 0 ? ` · ${added} added` : ''}</button>}>
    <div className="space-y-4">
      <div className="flex gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">{[['search', 'Search or custom'], ['paste', 'Paste a list']].map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} aria-pressed={tab === value} className={`min-h-11 flex-1 rounded-lg text-sm font-semibold ${tab === value ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>{label}</button>)}</div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Add to section<select aria-label="Add to section" value={section} onChange={(event) => setSection(event.target.value)} className={fieldClass}>{PLAN_SECTIONS.map((value) => <option key={value}>{value}</option>)}</select></label>
      {tab === 'search' ? <>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300"><span className="flex items-center gap-2"><Search className="h-4 w-4" />Exercise name</span><input autoFocus value={query} maxLength={150} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && query.trim()) { event.preventDefault(); add(query.trim()); } }} placeholder="Search exercises or enter your own…" className={fieldClass} /></label>
        <div className="space-y-1">{results.map((name) => <button key={name} type="button" onClick={() => add(name)} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl p-3 text-left text-sm text-gray-700 hover:bg-primary-50 dark:text-gray-200 dark:hover:bg-gray-800"><span>{name}</span><Plus className="h-4 w-4 flex-shrink-0" /></button>)}</div>
        {query.trim() && !results.some((name) => name.toLowerCase() === query.trim().toLowerCase()) && <button type="button" onClick={() => add(query.trim())} className="min-h-12 w-full rounded-xl bg-primary-50 p-3 text-left text-sm font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">+ Add “{query.trim()}”</button>}
        {!query.trim() && <p className="text-sm text-gray-500">Add exercises in the order you want to do them. You can add the same exercise more than once.</p>}
      </> : <>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">One exercise per line<textarea autoFocus rows={9} maxLength={15000} value={text} onChange={(event) => setText(event.target.value)} placeholder={'Standing Dumbbell Bicep Curl\nIncline Dumbbell Curl\n\nSuperset\nRope Hammer Curl\nRope Triceps Pushdown\n\nCool-down\nBiceps Stretch\nSlow Walking'} className={`${fieldClass} resize-y`} /></label>
        <p className="text-xs text-gray-500">Use Warm-up, Strength, Superset, Cardio, or Cool-down on a separate line to create sections.</p>
        <button type="button" disabled={!parsed.length} onClick={() => { onAdd(parsed); setAdded(added + parsed.length); setText(''); }} className="min-h-12 w-full rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white disabled:opacity-40">Add {parsed.length || ''} exercise{parsed.length === 1 ? '' : 's'}</button>
      </>}
      <p role="status" className="text-sm font-medium text-success-700 dark:text-emerald-300">{added ? `${added} exercise${added === 1 ? '' : 's'} added to your workout` : ''}</p>
    </div>
  </Modal>;
}
