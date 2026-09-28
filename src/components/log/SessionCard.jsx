import { useState } from 'react';
import { Calendar, Timer, StickyNote, Pencil } from 'lucide-react';
import Card from '../common/Card';
import { getLocalDateInputValue } from '../../utils/date';

const SessionCard = ({ name, onName, date, onDate, duration, onDuration, notes, onNotes, isEditMode }) => {
  const [open, setOpen] = useState(false);
  const chips = [
    { key: 'date', icon: Calendar, label: date || getLocalDateInputValue() },
    ...(duration ? [{ key: 'dur', icon: Timer, label: `${duration}m` }] : []),
    ...(notes?.trim() ? [{ key: 'notes', icon: StickyNote, label: 'Notes' }] : []),
  ];

  return (
    <Card className="!p-4 md:!p-5" aria-labelledby="session-title">
      {isEditMode && (
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-100 dark:bg-primary-900/40 px-2.5 py-1 text-[13px] font-semibold text-primary-700 dark:text-primary-300">
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          Editing workout
        </p>
      )}
      <h2 id="session-title" className="sr-only">Workout session</h2>
      <label htmlFor="log-session-name" className="sr-only">Workout name</label>
      <input
        id="log-session-name"
        value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder="Name this session — e.g. Chest & Triceps"
        autoComplete="off"
        className="w-full bg-transparent text-xl md:text-2xl font-bold placeholder:text-gray-400 placeholder:font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg px-1 py-1 min-h-[48px]"
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {chips.map((c) => (
          <span key={c.key} className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-[13px] font-medium text-gray-600 dark:text-gray-300">
            <c.icon className="w-3.5 h-3.5" aria-hidden="true" />
            {c.label}
          </span>
        ))}
        <button
          onClick={() => setOpen((p) => !p)}
          aria-expanded={open}
          className="min-h-[44px] px-3 rounded-full text-[13px] font-semibold text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
        >
          {open ? 'Hide details' : 'Date, duration & notes'}
        </button>
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="log-session-date" className="text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Date</label>
            <input
              id="log-session-date"
              type="date"
              value={date}
              onChange={(e) => onDate(e.target.value)}
              max={getLocalDateInputValue()}
              className="w-full px-3 py-2.5 min-h-[48px] border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="log-session-duration" className="text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Duration (min)</label>
            <input
              id="log-session-duration"
              type="number"
              value={duration}
              onChange={(e) => onDuration(e.target.value)}
              placeholder="60"
              min="0"
              inputMode="numeric"
              className="w-full px-3 py-2.5 min-h-[48px] border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="log-session-notes" className="text-[13px] font-semibold text-gray-600 dark:text-gray-300 mb-1 block">Notes</label>
            <input
              id="log-session-notes"
              value={notes}
              onChange={(e) => onNotes(e.target.value)}
              placeholder="RPE, sleep, tweaks…"
              maxLength={1000}
              className="w-full px-3 py-2.5 min-h-[48px] border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default SessionCard;
