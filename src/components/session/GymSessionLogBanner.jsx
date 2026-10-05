import { motion } from 'framer-motion';
import {
  Flame,
  Clock,
  Square,
  Unlock,
  CheckCircle2,
  Timer,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useGymSession } from '../../hooks/useGymSession';

const GymSessionLogBanner = ({ isEditMode }) => {
  const {
    status,
    isActive,
    isCompleted,
    manualOverride,
    formattedStartTime,
    formattedEndTime,
    formattedTargetEndTime,
    formattedElapsed,
    formattedRemaining,
    sessionDurationMinutes,
    progressPercent,
    startSession,
    endSession,
    enableManualLoggingOverride,
    resetSession,
    openCompleteModal,
  } = useGymSession();

  if (isEditMode) return null;

  // 1. IDLE & NOT OVERRIDDEN: Prompt to start gym timer first
  if (status === 'idle' && !manualOverride) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 border border-white/10 shadow-xl space-y-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
            <Timer className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
              Strict 1 hr 45 min Gym Goal
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold">
              Are you at the gym right now?
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Start your gym session first to capture your check-in time, get <strong>30m / 15m / 5m</strong> alerts, and automatically record your ending time before logging workouts one by one.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={startSession}
            className="flex-1 min-h-[48px] px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>Yes, Clock In &amp; Start 1h 45m Timer</span>
          </button>
          <button
            type="button"
            onClick={enableManualLoggingOverride}
            className="min-h-[48px] px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Unlock className="w-4 h-4" />
            <span>Log Manually Without Timer</span>
          </button>
        </div>
      </motion.div>
    );
  }

  // 2. ACTIVE GYM SESSION: Show live countdown & option to finish session (or unlock live logging)
  if (isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-4 sm:p-5 border border-emerald-500/30 shadow-xl space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
              Gym Session In Progress • 1h 45m Target
            </span>
          </div>
          <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full">
            Clocked in at {formattedStartTime} → Target {formattedTargetEndTime}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
              Time Left
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums mt-0.5">
              {formattedRemaining}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
              Elapsed
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-white tabular-nums mt-0.5">
              {formattedElapsed}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
              Session Progress
            </p>
            <div className="mt-2 h-2 w-full bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs font-bold text-emerald-300 mt-1">{progressPercent}% of 1h 45m</p>
          </div>
        </div>

        {!manualOverride ? (
          <div className="rounded-xl bg-black/30 border border-white/10 p-3.5 space-y-3">
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
              🔒 <strong>Finish your gym session first</strong> to automatically stamp your ending gym time and total duration — then log your exercises one by one!
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={endSession}
                className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-white text-gray-950 hover:bg-gray-100 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <Square className="w-4 h-4 fill-current text-red-600" />
                <span>End Gym Session Now &amp; Unlock Logging</span>
              </button>
              <button
                type="button"
                onClick={enableManualLoggingOverride}
                className="min-h-[46px] px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Log sets while timer runs</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-emerald-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Live logging enabled — ending time will auto-stamp when you finish or save.
            </span>
            <button
              type="button"
              onClick={endSession}
              className="px-3 py-1.5 rounded-lg bg-white text-gray-900 font-extrabold text-xs hover:bg-gray-100 transition-colors"
            >
              End Session Now
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  // 3. COMPLETED GYM SESSION: Show auto-captured start, end, and duration
  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-4 border border-emerald-400/40 shadow-lg flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
              Gym Time Auto-Captured • Ready to Log Workouts
            </p>
            <p className="text-sm sm:text-base font-bold">
              {formattedStartTime} – {formattedEndTime} •{' '}
              <span className="underline decoration-emerald-300 underline-offset-4">
                {sessionDurationMinutes} mins total
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCompleteModal}
            title="View Leaving the Gym Tips"
            className="px-3 py-1.5 rounded-xl bg-white text-gray-900 hover:bg-gray-100 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Post-Gym Tips</span>
          </button>
          <button
            type="button"
            onClick={resetSession}
            title="Start a new gym session"
            className="px-3 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-xs font-bold text-white/90 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default GymSessionLogBanner;
