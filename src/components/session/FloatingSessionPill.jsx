import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  ChevronUp,
  ChevronDown,
  Square,
  Plus,
  CheckCircle2,
  ArrowRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useGymSession } from '../../hooks/useGymSession';
import { useAuth } from '../../context/AuthContext';

const URGENCY_STYLES = {
  normal: {
    pillBg: 'from-emerald-600 via-teal-600 to-emerald-700 border-emerald-400/40 shadow-emerald-900/40',
    badge: 'bg-emerald-400/20 text-emerald-200',
    dot: 'bg-emerald-300',
    bar: 'bg-emerald-300',
    label: 'On Track',
  },
  warning: {
    pillBg: 'from-amber-600 via-yellow-600 to-amber-700 border-amber-300/50 shadow-amber-900/40',
    badge: 'bg-amber-300/20 text-amber-100',
    dot: 'bg-amber-200',
    bar: 'bg-amber-200',
    label: '≤ 30m Left',
  },
  urgent: {
    pillBg: 'from-orange-600 via-red-600 to-orange-700 border-orange-300/50 shadow-orange-900/40',
    badge: 'bg-orange-300/20 text-orange-100',
    dot: 'bg-orange-200',
    bar: 'bg-orange-200',
    label: 'Wrap Up Soon',
  },
  critical: {
    pillBg: 'from-red-600 via-rose-600 to-red-700 border-red-300/60 shadow-red-900/50',
    badge: 'bg-red-300/25 text-red-100',
    dot: 'bg-white',
    bar: 'bg-white',
    label: 'Final 5 Mins!',
  },
};

const FloatingSessionPill = () => {
  const {
    isActive,
    isCompleted,
    workoutLogged,
    urgencyLevel,
    formattedElapsed,
    formattedRemaining,
    formattedStartTime,
    formattedEndTime,
    formattedTargetEndTime,
    progressPercent,
    sessionDurationMinutes,
    extensionsUsed,
    maxExtensions,
    endSession,
    extendSession,
  } = useGymSession();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  if (!user) return null;

  // Completed session banner (if workout hasn't been logged yet and user isn't already on /log)
  if (isCompleted && !workoutLogged) {
    if (location.pathname === '/log') return null;
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md pointer-events-none">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={() => navigate('/log')}
          className="pointer-events-auto w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 text-white border border-white/20 shadow-2xl"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            <div className="text-left truncate">
              <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                Session Ended ({formattedStartTime} – {formattedEndTime})
              </p>
              <p className="text-sm font-bold truncate">
                {sessionDurationMinutes} mins recorded • Tap to log exercises
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 bg-white text-gray-900 font-extrabold text-xs px-3 py-1.5 rounded-xl flex-shrink-0">
            Log Now <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </motion.button>
      </div>
    );
  }

  if (!isActive) return null;

  const style = URGENCY_STYLES[urgencyLevel] || URGENCY_STYLES.normal;

  const handleEndAndLog = () => {
    setExpanded(false);
    endSession();
    navigate('/log');
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md pointer-events-none">
      <motion.div
        layout
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-gradient-to-r ${style.pillBg} text-white border shadow-2xl ${
          urgencyLevel === 'critical' ? 'ring-2 ring-red-300 animate-pulse' : ''
        }`}
      >
        {/* Top Row — Always Visible */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`}
              />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${style.dot}`} />
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-90">
                  🏋️ Gym Timer
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                  {style.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg font-black tabular-nums tracking-tight">
                  {formattedRemaining} left
                </span>
                <span className="text-xs text-white/80 font-medium tabular-nums">
                  • {formattedElapsed} elapsed
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold bg-black/20 px-2.5 py-1 rounded-lg tabular-nums">
              {progressPercent}%
            </span>
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-white/80" />
            ) : (
              <ChevronUp className="w-5 h-5 text-white/80" />
            )}
          </div>
        </button>

        {/* Expanded Details Drawer */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 pb-3.5 pt-1 border-t border-white/15 bg-black/20 space-y-3"
            >
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="rounded-xl bg-white/10 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                    Clocked In
                  </p>
                  <p className="text-xs font-extrabold mt-0.5">{formattedStartTime}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                    Target End
                  </p>
                  <p className="text-xs font-extrabold mt-0.5">{formattedTargetEndTime}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                    Elapsed
                  </p>
                  <p className="text-xs font-extrabold mt-0.5 tabular-nums">{formattedElapsed}</p>
                </div>
              </div>

              {urgencyLevel !== 'normal' && (
                <div className="flex items-center gap-2 text-xs bg-black/25 px-3 py-2 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <span>
                    Approaching your strict 1h 45m goal! Wrap up sets so you finish on time.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEndAndLog}
                  className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current text-red-600" />
                  <span>End Gym &amp; Log Workouts</span>
                </button>

                {extensionsUsed < maxExtensions && (
                  <button
                    type="button"
                    onClick={() => extendSession(15)}
                    className="min-h-[42px] px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                    title="Extend target by 15 minutes"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>15m ({maxExtensions - extensionsUsed} left)</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Progress Bar */}
        <div className="h-1 w-full bg-black/30">
          <div
            className={`h-full transition-all duration-500 ${style.bar}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default FloatingSessionPill;
