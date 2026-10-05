import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Clock,
  ArrowRight,
  ArrowLeft,
  Plus,
  CheckCircle2,
  X,
  Shuffle,
  Droplets,
  Sparkles,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useGymSession } from '../../hooks/useGymSession';
import { useWorkouts } from '../../context/WorkoutContext';
import { GYM_SESSION } from '../../constants/session';
import { WATER_INTAKE } from '../../constants';
import { getSmartPostGymGameplan } from '../../data/postGymTips';
import { lightHaptic, successHaptic } from '../../utils/haptics';

const ACCENT_STYLES = {
  emerald: {
    card: 'bg-emerald-500/10 border-emerald-400/25 hover:border-emerald-400/45',
    checkedCard: 'bg-emerald-500/20 border-emerald-400/60',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  sky: {
    card: 'bg-sky-500/10 border-sky-400/25 hover:border-sky-400/45',
    checkedCard: 'bg-sky-500/20 border-sky-400/60',
    badge: 'bg-sky-500/20 text-sky-300',
  },
  purple: {
    card: 'bg-purple-500/10 border-purple-400/25 hover:border-purple-400/45',
    checkedCard: 'bg-purple-500/20 border-purple-400/60',
    badge: 'bg-purple-500/20 text-purple-300',
  },
  amber: {
    card: 'bg-amber-500/10 border-amber-400/25 hover:border-amber-400/45',
    checkedCard: 'bg-amber-500/20 border-amber-400/60',
    badge: 'bg-amber-500/20 text-amber-300',
  },
};

const SessionCompleteModal = () => {
  const {
    isCompleteModalOpen,
    closeCompleteModal,
    formattedStartTime,
    formattedEndTime,
    sessionDurationMinutes,
    extensionsUsed,
    maxExtensions,
    extendSession,
    checkedTips = [],
    toggleTipChecked,
  } = useGymSession();
  const { waterIntake, addWaterIntake } = useWorkouts();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Session Summary, 2 = Leaving the Gym Tips
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [postGymWaterAdded, setPostGymWaterAdded] = useState(false);

  const currentWaterMl = waterIntake?.amount || 0;

  const gameplanTips = useMemo(
    () =>
      getSmartPostGymGameplan({
        hour: new Date().getHours(),
        durationMinutes: sessionDurationMinutes || GYM_SESSION.TARGET_MINUTES,
        waterAmountMl: currentWaterMl,
        seed: shuffleSeed,
      }),
    [sessionDurationMinutes, currentWaterMl, shuffleSeed]
  );

  const handleClose = () => {
    setStep(1);
    closeCompleteModal();
  };

  const handleGoToLog = () => {
    setStep(1);
    closeCompleteModal();
    navigate('/log');
  };

  const handleShuffle = () => {
    lightHaptic();
    setShuffleSeed((prev) => prev + 1);
  };

  const handleToggleTipCheck = (id) => {
    lightHaptic();
    toggleTipChecked(id);
  };

  const handleQuickAddPostGymWater = async (e) => {
    e.stopPropagation();
    if (postGymWaterAdded) return;
    setPostGymWaterAdded(true);
    successHaptic();
    await addWaterIntake(500);
    toast.success('💧 +500ml Post-Gym Water logged!');
  };

  const isWithinStrictGoal = (sessionDurationMinutes || 0) <= GYM_SESSION.TARGET_MINUTES;

  return (
    <AnimatePresence>
      {isCompleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-complete-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-900 text-white border border-white/15 shadow-2xl p-5 sm:p-7 my-auto"
          >
            {/* Top Step Indicator & Close Button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-gray-200">
                  Step {step} of 2
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`h-1.5 rounded-full transition-all ${
                      step === 1 ? 'w-6 bg-emerald-400' : 'w-2.5 bg-emerald-400/50'
                    }`}
                  />
                  <span
                    className={`h-1.5 rounded-full transition-all ${
                      step === 2 ? 'w-6 bg-emerald-400' : 'w-2.5 bg-white/20'
                    }`}
                  />
                </div>
              </div>

              <button
                onClick={handleClose}
                aria-label="Close session summary"
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                /* ==========================================
                   STEP 1: GYM SESSION TIME SUMMARY
                   ========================================== */
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Trophy Icon */}
                  <div className="flex justify-center mb-4">
                    <motion.div
                      initial={{ scale: 0.5, rotate: -15 }}
                      animate={{ scale: [1, 1.12, 1], rotate: 0 }}
                      transition={{ duration: 0.6 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-400/20"
                    >
                      <Trophy className="w-8 h-8 text-gray-950 stroke-[2.5]" />
                    </motion.div>
                  </div>

                  <div className="text-center space-y-1.5">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isWithinStrictGoal ? '1h 45m Discipline Goal Met!' : 'Gym Session Recorded'}
                    </span>
                    <h2 id="session-complete-title" className="text-2xl sm:text-3xl font-extrabold pt-1">
                      Gym Time Complete! 🎯
                    </h2>
                    <p className="text-sm text-gray-300">
                      Your ending gym time and total workout duration have been automatically captured.
                    </p>
                  </div>

                  {/* Session Timestamps Summary */}
                  <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-white/5 p-2.5 border border-white/5">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                          Logged In
                        </p>
                        <p className="text-base font-extrabold text-emerald-400 mt-0.5">
                          {formattedStartTime}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-2.5 border border-white/5">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                          Ended At
                        </p>
                        <p className="text-base font-extrabold text-sky-400 mt-0.5">
                          {formattedEndTime}
                        </p>
                      </div>
                      <div className="rounded-xl bg-emerald-500/15 p-2.5 border border-emerald-400/30">
                        <p className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">
                          Total Time
                        </p>
                        <p className="text-base font-black text-white mt-0.5">
                          {sessionDurationMinutes} min
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                      <Clock className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                      <span>
                        Exercise logging is unlocked with <strong>{sessionDurationMinutes} mins</strong> pre-filled!
                      </span>
                    </div>
                  </div>

                  {/* Step 1 Actions */}
                  <div className="mt-6 space-y-2.5">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => {
                        lightHaptic();
                        setStep(2);
                      }}
                      className="w-full min-h-[52px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-gray-950 font-extrabold text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>Next: Leaving the Gym Tips</span>
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>

                    {extensionsUsed < maxExtensions && (
                      <button
                        type="button"
                        onClick={() => extendSession(15)}
                        className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Need +15 more minutes in the gym ({maxExtensions - extensionsUsed} left)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleGoToLog}
                      className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                    >
                      Skip tips &amp; log workouts directly →
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ==========================================
                   STEP 2: LEAVING THE GYM — 4-CARD GAMEPLAN
                   ========================================== */
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                        Post-Gym Exit Gameplan • {checkedTips.length}/4 Checked
                      </span>
                      <h2 id="session-complete-title" className="text-xl sm:text-2xl font-extrabold">
                        Before You Leave the Gym 🎒
                      </h2>
                      <p className="text-xs text-gray-300 mt-0.5">
                        Tap a card to check it off as you head out.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleShuffle}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-emerald-300 flex items-center gap-1.5 flex-shrink-0 border border-white/10 transition-colors"
                      title="Get fresh tips"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Shuffle</span>
                    </button>
                  </div>

                  {/* 4 Category Cards */}
                  <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-0.5">
                    {gameplanTips.map((item) => {
                      const isChecked = checkedTips.includes(item.id);
                      const style = ACCENT_STYLES[item.accent] || ACCENT_STYLES.emerald;

                      return (
                        <div
                          key={item.category}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleToggleTipCheck(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleToggleTipCheck(item.id);
                            }
                          }}
                          className={`w-full text-left rounded-2xl p-3.5 border transition-all cursor-pointer ${
                            isChecked ? style.checkedCard : style.card
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl leading-none pt-0.5 flex-shrink-0">
                              {item.emoji}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}
                                >
                                  {item.label}
                                </span>

                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                                    isChecked
                                      ? 'bg-emerald-500 border-emerald-400 text-gray-950'
                                      : 'border-white/25 text-transparent'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              </div>

                              <h3
                                className={`text-sm font-extrabold mt-1 ${
                                  isChecked ? 'line-through text-gray-300' : 'text-white'
                                }`}
                              >
                                {item.title}
                              </h3>
                              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                                {item.body}
                              </p>

                              {/* Quick +500ml Water Action inside Diet & Hydration Card */}
                              {item.category === 'diet' && (
                                <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[11px] text-emerald-200 font-semibold">
                                    Today’s Water: <strong>{currentWaterMl}</strong> / {WATER_INTAKE.DAILY_GOAL_ML} ml
                                  </span>
                                  <button
                                    type="button"
                                    onClick={handleQuickAddPostGymWater}
                                    disabled={postGymWaterAdded}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                                      postGymWaterAdded
                                        ? 'bg-emerald-500/30 text-emerald-200 cursor-default'
                                        : 'bg-sky-500 hover:bg-sky-400 text-gray-950 shadow-sm'
                                    }`}
                                  >
                                    <Droplets className="w-3.5 h-3.5" />
                                    <span>
                                      {postGymWaterAdded ? '✓ +500ml Logged!' : '+500ml Post-Gym Water'}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Step 2 Footer Buttons */}
                  <div className="mt-5 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        lightHaptic();
                        setStep(1);
                      }}
                      className="min-h-[50px] px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={handleGoToLog}
                      className="flex-1 min-h-[50px] py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-gray-950 font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Log My Workouts One by One</span>
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SessionCompleteModal;
