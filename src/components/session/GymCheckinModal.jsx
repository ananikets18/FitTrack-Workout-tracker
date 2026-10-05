import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Clock, Bell, Flame, X, CheckCircle2 } from 'lucide-react';
import { useGymSession, formatClockTime } from '../../hooks/useGymSession';
import { useAuth } from '../../context/AuthContext';
import { GYM_SESSION } from '../../constants/session';

const getGreeting = (date = new Date()) => {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const GymCheckinModal = () => {
  const { isCheckinModalOpen, startSession, dismissPromptForToday, closeCheckinModal } = useGymSession();
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!isCheckinModalOpen) return undefined;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isCheckinModalOpen]);

  if (!user) return null;

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Athlete';
  const targetEnd = new Date(now.getTime() + GYM_SESSION.TARGET_MINUTES * 60000);

  return (
    <AnimatePresence>
      {isCheckinModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gym-checkin-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 text-white border border-white/15 shadow-2xl p-6 sm:p-7"
          >
            {/* Close button */}
            <button
              onClick={closeCheckinModal}
              aria-label="Close check-in prompt"
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Animated Dumbbell Badge */}
            <div className="flex justify-center mb-5">
              <motion.div
                initial={{ rotate: -12, scale: 0.8 }}
                animate={{ rotate: [0, -8, 8, 0], scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20"
              >
                <Dumbbell className="w-8 h-8 text-gray-950 stroke-[2.5]" />
              </motion.div>
            </div>

            {/* Greeting & Main Question */}
            <div className="text-center space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                {getGreeting(now)}, {userName} 💪
              </p>
              <h2 id="gym-checkin-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Are you at the gym?
              </h2>
              <p className="text-sm text-gray-300 max-w-xs mx-auto">
                Lock in your strict <span className="text-white font-bold">1 hr 45 min</span> workout window and let FitTrack track your session automatically.
              </p>
            </div>

            {/* Live Check-in & Target Window Preview */}
            <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/5">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                    Check-In Time
                  </p>
                  <p className="text-lg font-extrabold text-emerald-400 mt-0.5">
                    {formatClockTime(now.toISOString())}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/5">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                    Target Finish (1h 45m)
                  </p>
                  <p className="text-lg font-extrabold text-amber-300 mt-0.5">
                    {formatClockTime(targetEnd.toISOString())}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Auto-captures start &amp; end time (105 mins target)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Smart alerts at <strong>30m</strong>, <strong>15m</strong> &amp; <strong>5m</strong> remaining</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Unlocks exercise logging with duration pre-filled</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={startSession}
                className="w-full min-h-[52px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-gray-950 font-extrabold text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <Flame className="w-5 h-5 fill-current" />
                <span>Yes, Start My 1h 45m Timer!</span>
              </motion.button>

              <button
                onClick={dismissPromptForToday}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Not at the gym right now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GymCheckinModal;
