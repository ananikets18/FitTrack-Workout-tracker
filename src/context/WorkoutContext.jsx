import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db as supabase, transformWorkoutFromDB } from '../lib/supabase';
import { sanitizeWorkout } from '../utils/validation';
import toast from 'react-hot-toast';
import { getNewlyUnlockedAchievements } from '../utils/achievements';

const WorkoutContext = createContext();

// Action types
const ACTIONS = {
  SET_WORKOUTS: 'SET_WORKOUTS',
  ADD_WORKOUT: 'ADD_WORKOUT',
  UPDATE_WORKOUT: 'UPDATE_WORKOUT',
  DELETE_WORKOUT: 'DELETE_WORKOUT',
  SET_CURRENT_WORKOUT: 'SET_CURRENT_WORKOUT',
  CLEAR_CURRENT_WORKOUT: 'CLEAR_CURRENT_WORKOUT',
  SET_LOADING: 'SET_LOADING',
  SET_WATER_INTAKE: 'SET_WATER_INTAKE',
  ADD_WATER_INTAKE: 'ADD_WATER_INTAKE',
  RESET_WATER_INTAKE: 'RESET_WATER_INTAKE',
  SET_WATER_LOADING: 'SET_WATER_LOADING',
  SET_WATER_HISTORY: 'SET_WATER_HISTORY',
  SET_WATER_HISTORY_LOADING: 'SET_WATER_HISTORY_LOADING',
};

// Reducer
const workoutReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ACTIONS.SET_WORKOUTS:
      return { ...state, workouts: action.payload, isLoading: false };
    case ACTIONS.ADD_WORKOUT:
      return { ...state, workouts: [action.payload, ...state.workouts] };
    case ACTIONS.UPDATE_WORKOUT:
      return {
        ...state,
        workouts: state.workouts.map(w =>
          w.id === action.payload.id ? action.payload : w
        ),
      };
    case ACTIONS.DELETE_WORKOUT:
      return {
        ...state,
        workouts: state.workouts.filter(w => w.id !== action.payload),
      };
    case ACTIONS.SET_CURRENT_WORKOUT:
      return { ...state, currentWorkout: action.payload };
    case ACTIONS.CLEAR_CURRENT_WORKOUT:
      return { ...state, currentWorkout: null };
    case ACTIONS.SET_WATER_INTAKE:
      return { ...state, waterIntake: action.payload };
    case ACTIONS.ADD_WATER_INTAKE:
      return { ...state, waterIntake: { ...state.waterIntake, amount: state.waterIntake.amount + action.payload } };
    case ACTIONS.RESET_WATER_INTAKE:
      return { ...state, waterIntake: { date: new Date().toISOString().split('T')[0], amount: 0 } };
    case ACTIONS.SET_WATER_LOADING:
      return { ...state, isWaterLoading: action.payload };
    case ACTIONS.SET_WATER_HISTORY:
      return { ...state, waterHistory: action.payload };
    case ACTIONS.SET_WATER_HISTORY_LOADING:
      return { ...state, isWaterHistoryLoading: action.payload };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  workouts: [],
  currentWorkout: null,
  isLoading: true,
  waterIntake: { date: new Date().toISOString().split('T')[0], amount: 0 },
  isWaterLoading: true,
  waterHistory: [],
  isWaterHistoryLoading: true,
};

const upsertWaterHistoryEntry = (history, date, amount) => {
  const map = new Map(history.map(entry => [entry.date, entry.amount]));
  map.set(date, Math.max(0, amount));

  return Array.from(map.entries())
    .map(([entryDate, entryAmount]) => ({ date: entryDate, amount: entryAmount }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

const saveGuestWaterHistory = (history) => {
  localStorage.setItem('waterIntakeHistory_guest', JSON.stringify(history));
};

// Fire a rich toast for each newly unlocked achievement (staggered so they don't overlap)
const fireAchievementToasts = (newlyUnlocked) => {
  newlyUnlocked.forEach((achievement, index) => {
    setTimeout(() => {
      toast(
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontSize: '2rem',
            lineHeight: 1,
            flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {achievement.icon}
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '2px' }}>
              🏆 Achievement Unlocked!
            </div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', lineHeight: 1.2 }}>
              {achievement.name}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>
              {achievement.description}
            </div>
          </div>
        </div>,
        {
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
            border: '1px solid rgba(167,139,250,0.4)',
            borderRadius: '16px',
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(109,40,217,0.35)',
            maxWidth: '340px',
          },
        }
      );
    }, index * 700);
  });
};

// Provider component
export const WorkoutProvider = ({ children }) => {
  const [state, dispatch] = useReducer(workoutReducer, initialState);
  const { user } = useAuth();
  const waterIntakeRef = useRef(initialState.waterIntake);
  const waterHistoryRef = useRef(initialState.waterHistory);

  useEffect(() => {
    waterIntakeRef.current = state.waterIntake;
  }, [state.waterIntake]);

  useEffect(() => {
    waterHistoryRef.current = state.waterHistory;
  }, [state.waterHistory]);

  // Load workouts from Supabase
  const loadWorkouts = useCallback(async () => {
    if (!user) {
      dispatch({ type: ACTIONS.SET_WORKOUTS, payload: [] });
      return;
    }

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      const data = await supabase.getWorkouts(user.id);
      const transformed = data.map(transformWorkoutFromDB);
      dispatch({ type: ACTIONS.SET_WORKOUTS, payload: transformed });
    } catch (error) {
      console.error('Error loading workouts:', error);
      toast.error('Failed to load workouts');
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [user]);

  // Load data on mount and when user changes
  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  // Add workout - Direct to Supabase
  const addWorkout = async (workout) => {
    if (!user) {
      toast.error('Please log in to save workouts');
      return;
    }

    try {
      const sanitized = sanitizeWorkout(workout);
      const previousWorkouts = state.workouts;

      // Save directly to Supabase
      const newWorkout = await supabase.createWorkout(sanitized, user.id);
      const transformed = transformWorkoutFromDB(newWorkout);

      // Update local state
      dispatch({ type: ACTIONS.ADD_WORKOUT, payload: transformed });

      toast.success('Workout saved!');

      // Check for newly unlocked achievements
      const updatedWorkouts = [transformed, ...previousWorkouts];
      const newlyUnlocked = getNewlyUnlockedAchievements(updatedWorkouts, previousWorkouts);
      if (newlyUnlocked.length > 0) fireAchievementToasts(newlyUnlocked);

      return transformed;
    } catch (error) {
      console.error('Error adding workout:', error);
      toast.error('Failed to save workout');
      throw error;
    }
  };

  // Add rest day - Direct to Supabase
  const addRestDay = async (restDayData) => {
    if (!user) {
      toast.error('Please log in to save rest days');
      return;
    }

    try {
      const selectedDate = new Date(restDayData.date);
      selectedDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

      const restDay = {
        type: 'rest_day',
        date: selectedDate.toISOString(),
        recoveryQuality: Math.max(1, Math.min(5, parseInt(restDayData.recoveryQuality) || 3)),
        activities: Array.isArray(restDayData.activities) ? restDayData.activities : [],
        notes: (restDayData.notes || '').trim().slice(0, 1000),
      };

      const previousWorkouts = state.workouts;

      // Save directly to Supabase
      const newRestDay = await supabase.createWorkout(restDay, user.id);
      const transformed = transformWorkoutFromDB(newRestDay);

      // Update local state
      dispatch({ type: ACTIONS.ADD_WORKOUT, payload: transformed });

      toast.success('Rest day logged!');

      // Check for newly unlocked achievements (rest day category)
      const updatedWorkouts = [transformed, ...previousWorkouts];
      const newlyUnlocked = getNewlyUnlockedAchievements(updatedWorkouts, previousWorkouts);
      if (newlyUnlocked.length > 0) fireAchievementToasts(newlyUnlocked);

      return transformed;
    } catch (error) {
      console.error('Error adding rest day:', error);
      toast.error('Failed to log rest day');
      throw error;
    }
  };

  // Update workout - Direct to Supabase
  const updateWorkout = async (workout) => {
    if (!user) {
      toast.error('Please log in to update workouts');
      return;
    }

    try {
      const sanitized = sanitizeWorkout(workout);

      // Update in Supabase
      await supabase.updateWorkout(sanitized.id, sanitized, user.id);

      // Reload to get fresh data
      await loadWorkouts();

      toast.success('Workout updated!');
    } catch (error) {
      console.error('Error updating workout:', error);
      toast.error('Failed to update workout');
      throw error;
    }
  };

  // Delete workout - Direct to Supabase
  const deleteWorkout = async (id) => {
    if (!user) {
      toast.error('Please log in to delete workouts');
      return;
    }

    try {
      // Delete from Supabase
      await supabase.deleteWorkout(id, user.id);

      // Update local state
      dispatch({ type: ACTIONS.DELETE_WORKOUT, payload: id });

      toast.success('Workout deleted!');
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
      throw error;
    }
  };

  // Current workout (in-memory only, for logging)
  const setCurrentWorkout = (workout) => {
    dispatch({ type: ACTIONS.SET_CURRENT_WORKOUT, payload: workout });
  };

  const clearCurrentWorkout = () => {
    dispatch({ type: ACTIONS.CLEAR_CURRENT_WORKOUT });
  };

  const cloneWorkout = (workout) => {
    const clonedWorkout = {
      ...workout,
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        id: crypto.randomUUID(),
        sets: exercise.sets.map(set => ({
          ...set,
          completed: false
        }))
      }))
    };

    setCurrentWorkout(clonedWorkout);
    return clonedWorkout;
  };

  // Water intake methods
  const addWaterIntake = async (amount) => {
    const today = new Date().toISOString().split('T')[0];
    const currentWaterIntake = waterIntakeRef.current;
    const currentHistory = waterHistoryRef.current;
    const currentAmount = currentWaterIntake.date === today ? currentWaterIntake.amount : 0;

    // Reset if it's a new day
    if (currentWaterIntake.date !== today) {
      dispatch({ type: ACTIONS.RESET_WATER_INTAKE });
    }

    const newAmount = Math.max(0, currentAmount + amount); // Prevent negative values
    const waterData = { date: today, amount: newAmount };

    waterIntakeRef.current = waterData;

    dispatch({ type: ACTIONS.SET_WATER_INTAKE, payload: waterData });

    const updatedHistory = upsertWaterHistoryEntry(currentHistory, today, newAmount);
    waterHistoryRef.current = updatedHistory;
    dispatch({ type: ACTIONS.SET_WATER_HISTORY, payload: updatedHistory });

    // Save to Supabase if user is logged in
    if (user) {
      try {
        await supabase.upsertWaterIntake(user.id, today, newAmount);
      } catch (error) {
        // Silently handle - water intake table might not exist yet
        console.warn('Water intake save skipped:', error.message);
        // Don't show error toast to avoid confusing users
      }
    } else {
      // Save to localStorage for guests
      try {
        localStorage.setItem('waterIntake_guest', JSON.stringify(waterData));
        saveGuestWaterHistory(updatedHistory);
      } catch (error) {
        console.error('Error saving water intake to localStorage:', error);
      }
    }
  };

  const resetWaterIntake = async () => {
    const today = new Date().toISOString().split('T')[0];
    const waterData = { date: today, amount: 0 };
    waterIntakeRef.current = waterData;
    dispatch({ type: ACTIONS.RESET_WATER_INTAKE });

    const updatedHistory = upsertWaterHistoryEntry(waterHistoryRef.current, today, 0);
    waterHistoryRef.current = updatedHistory;
    dispatch({ type: ACTIONS.SET_WATER_HISTORY, payload: updatedHistory });

    if (user) {
      try {
        await supabase.upsertWaterIntake(user.id, today, 0);
      } catch (error) {
        // Silently handle - water intake table might not exist yet
        console.warn('Water intake reset skipped:', error.message);
      }
    } else {
      try {
        localStorage.setItem('waterIntake_guest', JSON.stringify(waterData));
        saveGuestWaterHistory(updatedHistory);
      } catch (error) {
        console.error('Error resetting water intake in localStorage:', error);
      }
    }
  };

  // Load water intake from Supabase or localStorage
  useEffect(() => {
    const loadWaterIntake = async () => {
      const today = new Date().toISOString().split('T')[0];

      // Signal that water data is being fetched — UI should show skeleton
      dispatch({ type: ACTIONS.SET_WATER_LOADING, payload: true });

      if (user) {
        try {
          const data = await supabase.getWaterIntake(user.id, today);
          if (data) {
            dispatch({ type: ACTIONS.SET_WATER_INTAKE, payload: { date: data.date, amount: data.amount } });
          } else {
            // No record for today — start fresh at 0 (no flicker: was already loading)
            dispatch({ type: ACTIONS.RESET_WATER_INTAKE });
          }
        } catch (error) {
          // Silently handle errors - water intake table might not exist yet
          console.warn('Water intake feature not available:', error.message);
          dispatch({ type: ACTIONS.RESET_WATER_INTAKE });
        } finally {
          dispatch({ type: ACTIONS.SET_WATER_LOADING, payload: false });
        }
      } else {
        // Load from localStorage for guests
        try {
          const saved = localStorage.getItem('waterIntake_guest');
          if (saved) {
            const waterData = JSON.parse(saved);

            // Reset if saved data is from a previous day
            if (waterData.date !== today) {
              dispatch({ type: ACTIONS.RESET_WATER_INTAKE });
            } else {
              dispatch({ type: ACTIONS.SET_WATER_INTAKE, payload: waterData });
            }
          }
        } catch (error) {
          console.error('Error loading water intake from localStorage:', error);
        } finally {
          dispatch({ type: ACTIONS.SET_WATER_LOADING, payload: false });
        }
      }
    };

    loadWaterIntake();
  }, [user]);

  // Load water intake history (for weekly/monthly stats)
  useEffect(() => {
    const loadWaterHistory = async () => {
      const today = new Date().toISOString().split('T')[0];
      dispatch({ type: ACTIONS.SET_WATER_HISTORY_LOADING, payload: true });

      if (user) {
        try {
          const history = await supabase.getWaterIntakeHistory(user.id, 90);
          const normalized = (history || []).map(entry => ({
            date: entry.date,
            amount: Number(entry.amount) || 0,
          }));

          dispatch({ type: ACTIONS.SET_WATER_HISTORY, payload: normalized });
        } catch (error) {
          console.warn('Water intake history not available:', error.message);
          dispatch({ type: ACTIONS.SET_WATER_HISTORY, payload: [] });
        } finally {
          dispatch({ type: ACTIONS.SET_WATER_HISTORY_LOADING, payload: false });
        }
      } else {
        try {
          const savedHistory = localStorage.getItem('waterIntakeHistory_guest');
          const savedToday = localStorage.getItem('waterIntake_guest');

          let history = [];

          if (savedHistory) {
            const parsed = JSON.parse(savedHistory);
            if (Array.isArray(parsed)) {
              history = parsed
                .filter(entry => entry && typeof entry.date === 'string')
                .map(entry => ({
                  date: entry.date,
                  amount: Number(entry.amount) || 0,
                }));
            }
          }

          if (savedToday) {
            const todayData = JSON.parse(savedToday);
            if (todayData?.date === today) {
              history = upsertWaterHistoryEntry(history, todayData.date, Number(todayData.amount) || 0);
            }
          }

          dispatch({ type: ACTIONS.SET_WATER_HISTORY, payload: history });

          if (history.length > 0) {
            saveGuestWaterHistory(history);
          }
        } catch (error) {
          console.error('Error loading water history from localStorage:', error);
          dispatch({ type: ACTIONS.SET_WATER_HISTORY, payload: [] });
        } finally {
          dispatch({ type: ACTIONS.SET_WATER_HISTORY_LOADING, payload: false });
        }
      }
    };

    loadWaterHistory();
  }, [user]);

  const value = {
    workouts: state.workouts,
    currentWorkout: state.currentWorkout,
    isLoading: state.isLoading,
    waterIntake: state.waterIntake,
    isWaterLoading: state.isWaterLoading,
    waterHistory: state.waterHistory,
    isWaterHistoryLoading: state.isWaterHistoryLoading,
    addWorkout,
    addRestDay,
    updateWorkout,
    deleteWorkout,
    setCurrentWorkout,
    clearCurrentWorkout,
    cloneWorkout,
    refreshWorkouts: loadWorkouts,
    addWaterIntake,
    resetWaterIntake,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
};

// Custom hook to use the context
// eslint-disable-next-line react-refresh/only-export-components
export const useWorkouts = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkouts must be used within a WorkoutProvider');
  }
  return context;
};

