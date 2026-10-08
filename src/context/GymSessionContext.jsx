import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { GYM_SESSION } from '../constants/session';
import { getLocalDateInputValue, isSameLocalDay } from '../utils/date';
import { successHaptic, warningHaptic, errorHaptic, mediumHaptic } from '../utils/haptics';
import { useAuth } from './AuthContext';
import { useWorkouts } from './WorkoutContext';
import { db } from '../lib/supabase';

const GymSessionContext = createContext(null);

// Subtle Web Audio API synthesizer for gym timer alerts (no external audio file dependency)
const playAlertTone = (type = 'warning') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playNote = (freq, startTime, duration, peakGain = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    if (type === '30m') {
      playNote(587.33, now, 0.18, 0.2); // D5
      playNote(880, now + 0.2, 0.25, 0.22); // A5
    } else if (type === '15m') {
      playNote(659.25, now, 0.16, 0.25); // E5
      playNote(659.25, now + 0.2, 0.16, 0.25); // E5
      playNote(987.77, now + 0.4, 0.28, 0.28); // B5
    } else if (type === '5m') {
      playNote(880, now, 0.14, 0.3); // A5
      playNote(880, now + 0.18, 0.14, 0.3);
      playNote(1046.5, now + 0.36, 0.3, 0.32); // C6
    } else if (type === 'complete') {
      playNote(523.25, now, 0.15, 0.3); // C5
      playNote(659.25, now + 0.16, 0.15, 0.3); // E5
      playNote(783.99, now + 0.32, 0.15, 0.3); // G5
      playNote(1046.5, now + 0.48, 0.4, 0.35); // C6
    }
  } catch {
    // Ignore audio errors when browser blocks autoplay
  }
};

const formatHMS = (totalSeconds) => {
  const safeSecs = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(safeSecs / 3600);
  const mins = Math.floor((safeSecs % 3600) / 60);
  const secs = safeSecs % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatClockTime = (isoString) => {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getInitialSessionState = () => {
  const today = getLocalDateInputValue();
  try {
    const raw = localStorage.getItem(GYM_SESSION.STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Keep active session even across midnight, or keep today's completed session
      if (parsed && (parsed.status === 'active' || parsed.date === today)) {
        const startMs = parsed.startTime ? new Date(parsed.startTime).getTime() : Date.now();
        const endMs = parsed.endTime ? new Date(parsed.endTime).getTime() : Date.now();
        const elapsed = parsed.status === 'active'
          ? Math.max(0, Math.floor((Date.now() - startMs) / 1000))
          : Math.max(0, Math.floor((endMs - startMs) / 1000));

        return {
          dbSessionId: parsed.dbSessionId || null,
          status: parsed.status || 'idle', // 'idle' | 'active' | 'completed'
          date: parsed.date || today,
          startTime: parsed.startTime || null,
          endTime: parsed.endTime || null,
          targetMinutes: parsed.targetMinutes || GYM_SESSION.TARGET_MINUTES,
          extensionsUsed: parsed.extensionsUsed || 0,
          elapsedSeconds: elapsed,
          alertsFired: Array.isArray(parsed.alertsFired) ? parsed.alertsFired : [],
          sessionDurationMinutes: parsed.sessionDurationMinutes ?? null,
          workoutLogged: !!parsed.workoutLogged,
          manualOverride: !!parsed.manualOverride,
          checkedTips: Array.isArray(parsed.checkedTips) ? parsed.checkedTips : [],
        };
      }
    }
  } catch (err) {
    console.warn('Failed to restore gym session from localStorage:', err);
  }

  return {
    dbSessionId: null,
    status: 'idle',
    date: today,
    startTime: null,
    endTime: null,
    targetMinutes: GYM_SESSION.TARGET_MINUTES,
    extensionsUsed: 0,
    elapsedSeconds: 0,
    alertsFired: [],
    sessionDurationMinutes: null,
    workoutLogged: false,
    manualOverride: false,
    checkedTips: [],
  };
};

export const GymSessionProvider = ({ children }) => {
  const [session, setSession] = useState(getInitialSessionState);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const { user } = useAuth();
  const { workouts = [], isLoading: isWorkoutsLoading = false } = useWorkouts();
  const userId = user?.id;

  const todayYmd = getLocalDateInputValue();
  const { hasWorkoutToday, hasRestDayToday, hasLoggedToday, todayWorkoutsCount } = useMemo(() => {
    const safeList = Array.isArray(workouts) ? workouts : [];
    const todayEntries = safeList.filter((w) => isSameLocalDay(w?.date, todayYmd));
    const workoutToday = todayEntries.some((w) => w.type !== 'rest_day');
    const restDayToday = todayEntries.some((w) => w.type === 'rest_day');
    return {
      hasWorkoutToday: workoutToday,
      hasRestDayToday: restDayToday,
      hasLoggedToday: workoutToday || restDayToday,
      todayWorkoutsCount: todayEntries.filter((w) => w.type !== 'rest_day').length,
    };
  }, [workouts, todayYmd]);

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Sync session.workoutLogged with today's workouts/rest days in WorkoutContext
  useEffect(() => {
    if (hasLoggedToday) {
      setIsCheckinModalOpen(false);
      setSession((prev) => {
        const shouldResetActiveOnRestDay = hasRestDayToday && !hasWorkoutToday && prev.status === 'active';
        if (prev.workoutLogged && !shouldResetActiveOnRestDay) return prev;
        return {
          ...prev,
          status: shouldResetActiveOnRestDay ? 'idle' : prev.status,
          workoutLogged: true,
        };
      });
      const current = sessionRef.current;
      if (userId && current.dbSessionId && !current.workoutLogged) {
        db.updateGymSession(current.dbSessionId, userId, {
          workoutLogged: true,
        }).catch(() => {});
      }
    } else if (userId && !isWorkoutsLoading && session.workoutLogged) {
      // If all of today's workouts/rest days were deleted in History, reset workoutLogged
      setSession((prev) => (prev.workoutLogged ? { ...prev, workoutLogged: false } : prev));
      const current = sessionRef.current;
      if (current.dbSessionId) {
        db.updateGymSession(current.dbSessionId, userId, {
          workoutLogged: false,
        }).catch(() => {});
      }
    }
  }, [hasLoggedToday, hasRestDayToday, hasWorkoutToday, isWorkoutsLoading, session.workoutLogged, userId]);

  // Persist session state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(GYM_SESSION.STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      console.warn('Failed to persist gym session:', err);
    }
  }, [session]);

  // Hydrate or sync active/today's session with Supabase when user is authenticated
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    const syncWithDatabase = async () => {
      const today = getLocalDateInputValue();
      const current = sessionRef.current;

      try {
        // Case 1: Local state has an active/completed session that hasn't been created in DB yet
        if (current.status !== 'idle' && current.startTime && !current.dbSessionId) {
          const created = await db.createGymSession(userId, current);
          if (!cancelled && created?.id) {
            setSession((prev) => ({ ...prev, dbSessionId: created.id }));
          }
          return;
        }

        // Case 2: Local state is idle — check if DB has an active or today's session (e.g. from another device)
        if (current.status === 'idle') {
          const remote = await db.getActiveOrTodayGymSession(userId, today);
          if (!cancelled && remote) {
            const startMs = new Date(remote.start_time).getTime();
            const endMs = remote.end_time ? new Date(remote.end_time).getTime() : Date.now();
            const elapsed = remote.status === 'active'
              ? Math.max(0, Math.floor((Date.now() - startMs) / 1000))
              : Math.max(0, Math.floor((endMs - startMs) / 1000));

            setSession((prev) => ({
              dbSessionId: remote.id,
              status: remote.status,
              date: remote.date,
              startTime: remote.start_time,
              endTime: remote.end_time || null,
              targetMinutes: remote.target_minutes || GYM_SESSION.TARGET_MINUTES,
              extensionsUsed: remote.extensions_used || 0,
              elapsedSeconds: elapsed,
              alertsFired: [],
              sessionDurationMinutes: remote.duration_minutes ?? null,
              workoutLogged: Boolean(remote.workout_logged || prev.workoutLogged),
              manualOverride: false,
              checkedTips: Array.isArray(remote.checked_tips) ? remote.checked_tips : [],
            }));
            setIsCheckinModalOpen(false);
          }
        }
      } catch (err) {
        console.warn('Gym session DB sync skipped:', err);
      }
    };

    syncWithDatabase();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Decide whether to show the "Are you at the gym?" modal on app open
  useEffect(() => {
    if (userId && isWorkoutsLoading) return undefined;

    const today = getLocalDateInputValue();
    let dismissedDate = null;
    try {
      dismissedDate = localStorage.getItem(GYM_SESSION.DISMISSED_DATE_KEY);
    } catch {
      // ignore
    }

    if (
      session.status === 'idle' &&
      dismissedDate !== today &&
      !session.workoutLogged &&
      !hasLoggedToday
    ) {
      const timer = setTimeout(() => {
        if (sessionRef.current.status === 'idle' && !sessionRef.current.workoutLogged) {
          setIsCheckinModalOpen(true);
        }
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [session.status, session.workoutLogged, hasLoggedToday, isWorkoutsLoading, userId]);

  // Save a completed session to history in localStorage
  const archiveSessionToHistory = useCallback((completedSession) => {
    try {
      const raw = localStorage.getItem(GYM_SESSION.HISTORY_KEY);
      const history = raw ? JSON.parse(raw) : [];
      const entry = {
        id: completedSession.dbSessionId || `${completedSession.startTime}`,
        date: completedSession.date,
        startTime: completedSession.startTime,
        endTime: completedSession.endTime,
        durationMinutes: completedSession.sessionDurationMinutes,
        targetMinutes: completedSession.targetMinutes,
        extensionsUsed: completedSession.extensionsUsed,
        checkedTips: completedSession.checkedTips || [],
      };
      const filtered = Array.isArray(history)
        ? history.filter((h) => h.id !== entry.id).slice(0, 89)
        : [];
      localStorage.setItem(GYM_SESSION.HISTORY_KEY, JSON.stringify([entry, ...filtered]));
    } catch (err) {
      console.warn('Failed to archive gym session:', err);
    }
  }, []);

  // Trigger progressive alert toast
  const fireThresholdAlert = useCallback((thresholdMinutes) => {
    if (thresholdMinutes === 30) {
      playAlertTone('30m');
      warningHaptic();
      toast(
        (t) => (
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">⏳</span>
            <div className="flex-1">
              <p className="font-extrabold text-amber-300 text-sm uppercase tracking-wider">
                30 Minutes Remaining!
              </p>
              <p className="text-xs text-gray-100 mt-0.5 leading-relaxed">
                You are approaching your <strong>1 hr 45 min</strong> gym goal. Keep pushing and pace your remaining sets! 💪
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-xs font-bold text-gray-300 hover:text-white px-1.5 py-0.5"
            >
              OK
            </button>
          </div>
        ),
        {
          duration: 8000,
          style: {
            background: 'linear-gradient(135deg, #451a03, #78350f)',
            border: '1px solid rgba(251, 191, 36, 0.5)',
            color: '#fff',
            borderRadius: '16px',
            maxWidth: '400px',
          },
        }
      );
    } else if (thresholdMinutes === 15) {
      playAlertTone('15m');
      warningHaptic();
      toast(
        (t) => (
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">⚡</span>
            <div className="flex-1">
              <p className="font-extrabold text-orange-300 text-sm uppercase tracking-wider">
                15 Minutes Left — Wrap Up Soon!
              </p>
              <p className="text-xs text-gray-100 mt-0.5 leading-relaxed">
                Only 15 mins left in your 1h 45m window. Start finishing your final exercise!
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-xs font-bold text-gray-300 hover:text-white px-1.5 py-0.5"
            >
              OK
            </button>
          </div>
        ),
        {
          duration: 8000,
          style: {
            background: 'linear-gradient(135deg, #431407, #9a3412)',
            border: '1px solid rgba(251, 146, 60, 0.55)',
            color: '#fff',
            borderRadius: '16px',
            maxWidth: '400px',
          },
        }
      );
    } else if (thresholdMinutes === 5) {
      playAlertTone('5m');
      errorHaptic();
      toast(
        (t) => (
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">🚨</span>
            <div className="flex-1">
              <p className="font-extrabold text-red-300 text-sm uppercase tracking-wider">
                5 Minutes Left — Final Sets!
              </p>
              <p className="text-xs text-gray-100 mt-0.5 leading-relaxed">
                Your 1 hr 45 min strict gym target ends in 5 minutes! Finish your last set &amp; prepare to log.
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-xs font-bold text-gray-300 hover:text-white px-1.5 py-0.5"
            >
              OK
            </button>
          </div>
        ),
        {
          duration: 10000,
          style: {
            background: 'linear-gradient(135deg, #450a0a, #991b1b)',
            border: '1px solid rgba(248, 113, 113, 0.6)',
            color: '#fff',
            borderRadius: '16px',
            maxWidth: '400px',
          },
        }
      );
    }
  }, []);

  // Live 1-second ticker while session is active
  useEffect(() => {
    if (session.status !== 'active' || !session.startTime) return undefined;

    const tick = () => {
      const current = sessionRef.current;
      if (current.status !== 'active' || !current.startTime) return;

      const startMs = new Date(current.startTime).getTime();
      const nowMs = Date.now();
      const elapsedSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      const targetSecs = (current.targetMinutes || GYM_SESSION.TARGET_MINUTES) * 60;
      const remainingSecs = Math.max(0, targetSecs - elapsedSecs);

      const newAlerts = [...(current.alertsFired || [])];
      let newlyTriggeredAlert = null;

      // Check 30m, 15m, 5m thresholds
      if (remainingSecs <= 30 * 60 && remainingSecs > 15 * 60 && !newAlerts.includes(30)) {
        newAlerts.push(30);
        newlyTriggeredAlert = 30;
      } else if (remainingSecs <= 15 * 60 && remainingSecs > 5 * 60 && !newAlerts.includes(15)) {
        newAlerts.push(15);
        newlyTriggeredAlert = 15;
      } else if (remainingSecs <= 5 * 60 && remainingSecs > 0 && !newAlerts.includes(5)) {
        newAlerts.push(5);
        newlyTriggeredAlert = 5;
      }

      if (newlyTriggeredAlert !== null) {
        fireThresholdAlert(newlyTriggeredAlert);
      }

      // Check if 0m (target reached -> auto-capture end time & complete session!)
      if (remainingSecs <= 0 && !newAlerts.includes(0)) {
        newAlerts.push(0);
        const endIso = new Date(nowMs).toISOString();
        const computedMinutes = current.targetMinutes || GYM_SESSION.TARGET_MINUTES;

        playAlertTone('complete');
        errorHaptic();

        const completedState = {
          ...current,
          status: 'completed',
          endTime: endIso,
          elapsedSeconds: targetSecs,
          alertsFired: newAlerts,
          sessionDurationMinutes: computedMinutes,
        };

        setSession(completedState);
        archiveSessionToHistory(completedState);
        setIsCompleteModalOpen(true);

        if (userId && current.dbSessionId) {
          db.updateGymSession(current.dbSessionId, userId, {
            status: 'completed',
            endTime: endIso,
            sessionDurationMinutes: computedMinutes,
          }).catch(() => {});
        }
        return;
      }

      setSession((prev) => ({
        ...prev,
        elapsedSeconds: elapsedSecs,
        alertsFired: newAlerts,
      }));
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [session.status, session.startTime, fireThresholdAlert, archiveSessionToHistory, userId]);

  // Start gym session (Clock In + Sync to Supabase)
  const startSession = useCallback(() => {
    const now = new Date();
    const startIso = now.toISOString();
    const today = getLocalDateInputValue(now);
    const targetEnd = new Date(now.getTime() + GYM_SESSION.TARGET_MINUTES * 60000);

    const nextState = {
      dbSessionId: null,
      status: 'active',
      date: today,
      startTime: startIso,
      endTime: null,
      targetMinutes: GYM_SESSION.TARGET_MINUTES,
      extensionsUsed: 0,
      elapsedSeconds: 0,
      alertsFired: [],
      sessionDurationMinutes: null,
      workoutLogged: false,
      manualOverride: false,
      checkedTips: [],
    };

    setSession(nextState);
    setIsCheckinModalOpen(false);
    setIsCompleteModalOpen(false);
    successHaptic();

    if (userId) {
      db.createGymSession(userId, nextState)
        .then((created) => {
          if (created?.id) {
            setSession((prev) => ({ ...prev, dbSessionId: created.id }));
          }
        })
        .catch(() => {});
    }

    toast.success(
      `🏋️ Gym session started at ${formatClockTime(startIso)}! Target finish: ${formatClockTime(targetEnd.toISOString())} (1h 45m)`,
      { duration: 4500 }
    );
  }, [userId]);

  // End gym session (Clock Out, Sync to Supabase & unlock workout logging)
  const endSession = useCallback(() => {
    const current = sessionRef.current;
    if (!current.startTime) return null;

    const now = new Date();
    const endIso = now.toISOString();
    const startMs = new Date(current.startTime).getTime();
    const elapsedSecs = Math.max(0, Math.floor((now.getTime() - startMs) / 1000));
    const computedMinutes = Math.max(1, Math.round(elapsedSecs / 60));

    const completedState = {
      ...current,
      status: 'completed',
      endTime: endIso,
      elapsedSeconds: elapsedSecs,
      sessionDurationMinutes: computedMinutes,
    };

    setSession(completedState);
    archiveSessionToHistory(completedState);
    setIsCompleteModalOpen(true);
    successHaptic();

    if (userId) {
      if (current.dbSessionId) {
        db.updateGymSession(current.dbSessionId, userId, {
          status: 'completed',
          endTime: endIso,
          sessionDurationMinutes: computedMinutes,
        }).catch(() => {});
      } else {
        db.createGymSession(userId, completedState)
          .then((created) => {
            if (created?.id) {
              setSession((prev) => ({ ...prev, dbSessionId: created.id }));
            }
          })
          .catch(() => {});
      }
    }

    return completedState;
  }, [archiveSessionToHistory, userId]);

  // Extend session by +15 minutes (up to MAX_EXTENSIONS)
  const extendSession = useCallback(
    (extraMinutes = GYM_SESSION.EXTENSION_MINUTES) => {
      const current = sessionRef.current;
      if (current.extensionsUsed >= GYM_SESSION.MAX_EXTENSIONS) {
        toast.error(`Maximum of ${GYM_SESSION.MAX_EXTENSIONS} extensions reached. Time to wrap up!`);
        return false;
      }

      const nextTarget = (current.targetMinutes || GYM_SESSION.TARGET_MINUTES) + extraMinutes;
      const nextExtensions = (current.extensionsUsed || 0) + 1;
      const updatedAlerts = (current.alertsFired || []).filter((a) => a !== 5 && a !== 0);

      setSession((prev) => ({
        ...prev,
        status: 'active',
        endTime: null,
        sessionDurationMinutes: null,
        targetMinutes: nextTarget,
        extensionsUsed: nextExtensions,
        alertsFired: updatedAlerts,
      }));

      if (userId && current.dbSessionId) {
        db.updateGymSession(current.dbSessionId, userId, {
          status: 'active',
          endTime: null,
          sessionDurationMinutes: null,
          targetMinutes: nextTarget,
          extensionsUsed: nextExtensions,
        }).catch(() => {});
      }

      setIsCompleteModalOpen(false);
      mediumHaptic();
      toast.success(`⏱️ Added +${extraMinutes} mins! New target: ${nextTarget} mins`, {
        duration: 3500,
      });
      return true;
    },
    [userId]
  );

  // Toggle a post-gym tip checked state and sync to Supabase
  const toggleTipChecked = useCallback(
    (tipId) => {
      const current = sessionRef.current;
      const existing = Array.isArray(current.checkedTips) ? current.checkedTips : [];
      const nextChecked = existing.includes(tipId)
        ? existing.filter((id) => id !== tipId)
        : [...existing, tipId];

      setSession((prev) => ({
        ...prev,
        checkedTips: nextChecked,
      }));

      if (userId && current.dbSessionId) {
        db.updateGymSession(current.dbSessionId, userId, {
          checkedTips: nextChecked,
        }).catch(() => {});
      }
    },
    [userId]
  );

  // Dismiss "Are you at the gym?" prompt for today
  const dismissPromptForToday = useCallback(() => {
    const today = getLocalDateInputValue();
    try {
      localStorage.setItem(GYM_SESSION.DISMISSED_DATE_KEY, today);
    } catch {
      // ignore
    }
    setIsCheckinModalOpen(false);
    mediumHaptic();
  }, []);

  // Mark that the workout for this session has been logged
  const markSessionWorkoutLogged = useCallback(() => {
    const current = sessionRef.current;
    setSession((prev) => ({
      ...prev,
      workoutLogged: true,
    }));

    if (userId && current.dbSessionId) {
      db.updateGymSession(current.dbSessionId, userId, {
        workoutLogged: true,
      }).catch(() => {});
    }
  }, [userId]);

  // Enable manual override (if user wants to log a past workout or log while timer is running)
  const enableManualLoggingOverride = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      manualOverride: true,
    }));
    mediumHaptic();
  }, []);

  // Reset session back to idle (e.g. if user wants to start a second gym session today)
  const resetSession = useCallback(() => {
    const today = getLocalDateInputValue();
    const fresh = {
      dbSessionId: null,
      status: 'idle',
      date: today,
      startTime: null,
      endTime: null,
      targetMinutes: GYM_SESSION.TARGET_MINUTES,
      extensionsUsed: 0,
      elapsedSeconds: 0,
      alertsFired: [],
      sessionDurationMinutes: null,
      workoutLogged: false,
      manualOverride: false,
      checkedTips: [],
    };
    setSession(fresh);
    setIsCompleteModalOpen(false);
  }, []);

  const totalTargetSeconds = (session.targetMinutes || GYM_SESSION.TARGET_MINUTES) * 60;
  const remainingSeconds = Math.max(0, totalTargetSeconds - session.elapsedSeconds);
  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  const progressPercent = Math.min(100, Math.round((session.elapsedSeconds / totalTargetSeconds) * 100));

  const targetEndTimeIso = useMemo(() => {
    if (!session.startTime) return null;
    const startMs = new Date(session.startTime).getTime();
    return new Date(startMs + totalTargetSeconds * 1000).toISOString();
  }, [session.startTime, totalTargetSeconds]);

  const urgencyLevel = useMemo(() => {
    if (session.status !== 'active') return 'normal';
    if (remainingSeconds <= 5 * 60) return 'critical'; // < 5 mins: red pulse
    if (remainingSeconds <= 15 * 60) return 'urgent'; // 5-15 mins: orange
    if (remainingSeconds <= 30 * 60) return 'warning'; // 15-30 mins: amber/yellow
    return 'normal'; // > 30 mins: emerald green
  }, [session.status, remainingSeconds]);

  const effectiveWorkoutLogged = Boolean(session.workoutLogged || hasLoggedToday);

  const value = useMemo(
    () => ({
      // State
      session,
      dbSessionId: session.dbSessionId,
      status: session.status,
      isActive: session.status === 'active',
      isCompleted: session.status === 'completed',
      startTime: session.startTime,
      endTime: session.endTime,
      targetEndTimeIso,
      targetMinutes: session.targetMinutes,
      extensionsUsed: session.extensionsUsed,
      maxExtensions: GYM_SESSION.MAX_EXTENSIONS,
      elapsedSeconds: session.elapsedSeconds,
      remainingSeconds,
      remainingMinutes,
      progressPercent,
      urgencyLevel,
      sessionDurationMinutes: session.sessionDurationMinutes,
      workoutLogged: effectiveWorkoutLogged,
      hasWorkoutToday,
      hasRestDayToday,
      hasLoggedToday: effectiveWorkoutLogged,
      todayWorkoutsCount,
      manualOverride: session.manualOverride,
      checkedTips: session.checkedTips || [],
      isCheckinModalOpen,
      isCompleteModalOpen,

      // Formatting helpers
      formattedElapsed: formatHMS(session.elapsedSeconds),
      formattedRemaining: formatHMS(remainingSeconds),
      formattedStartTime: formatClockTime(session.startTime),
      formattedEndTime: formatClockTime(session.endTime),
      formattedTargetEndTime: formatClockTime(targetEndTimeIso),

      // Actions
      startSession,
      endSession,
      extendSession,
      toggleTipChecked,
      dismissPromptForToday,
      markSessionWorkoutLogged,
      enableManualLoggingOverride,
      resetSession,
      openCheckinModal: () => setIsCheckinModalOpen(true),
      closeCheckinModal: () => setIsCheckinModalOpen(false),
      openCompleteModal: () => setIsCompleteModalOpen(true),
      closeCompleteModal: () => setIsCompleteModalOpen(false),
    }),
    [
      session,
      targetEndTimeIso,
      remainingSeconds,
      remainingMinutes,
      progressPercent,
      urgencyLevel,
      effectiveWorkoutLogged,
      hasWorkoutToday,
      hasRestDayToday,
      todayWorkoutsCount,
      isCheckinModalOpen,
      isCompleteModalOpen,
      startSession,
      endSession,
      extendSession,
      toggleTipChecked,
      dismissPromptForToday,
      markSessionWorkoutLogged,
      enableManualLoggingOverride,
      resetSession,
    ]
  );

  return <GymSessionContext.Provider value={value}>{children}</GymSessionContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGymSession = () => {
  const context = useContext(GymSessionContext);
  if (!context) {
    throw new Error('useGymSession must be used within a GymSessionProvider');
  }
  return context;
};

export default GymSessionContext;
