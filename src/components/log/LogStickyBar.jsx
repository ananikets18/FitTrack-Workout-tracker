import { Save } from 'lucide-react';

const LogStickyBar = ({ exerciseCount, setCount, volumeKg, hasUnsaved, disabled, saving, isEditMode, onSave }) => {
  return (
    <div className="sticky bottom-20 md:bottom-6 z-30 mt-4">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 p-3 shadow-lifted backdrop-blur">
        <div className="flex-1 min-w-0 text-[13px] text-gray-600 dark:text-gray-300" aria-live="polite">
          <span className="font-bold text-gray-900 dark:text-white">{exerciseCount}</span> ex •{' '}
          <span className="font-bold text-gray-900 dark:text-white">{setCount}</span> sets
          {volumeKg > 0 && (
            <> • <span className="font-bold text-gray-900 dark:text-white">{volumeKg >= 1000 ? `${(volumeKg / 1000).toFixed(1)}t` : `${Math.round(volumeKg)}kg`}</span></>
          )}
          {hasUnsaved && <span className="ml-2 text-warning-600 dark:text-amber-400 font-semibold">• unsaved</span>}
        </div>
        <button
          onClick={onSave}
          disabled={disabled || saving}
          className="flex items-center space-x-2 px-6 py-3 min-h-[48px] bg-primary-600 text-white font-semibold rounded-xl shadow-lg active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" aria-hidden="true" />
          <span>{saving ? 'Saving…' : isEditMode ? 'Update' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
};

export default LogStickyBar;
