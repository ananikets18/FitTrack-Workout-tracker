import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db, transformWorkoutFromDB } from '../lib/supabase';
import { storage } from '../utils/storage';
import { migrateData } from '../utils/migration';
import { sanitizeWorkout } from '../utils/validation';

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
  IMPORT_WORKOUTS: 'IMPORT_WORKOUTS',
};

// Reducer
const workoutReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case ACTIONS.SET_WORKOUTS:
      return {
        ...state,
        workouts: action.payload,
        isLoading: false,
      };

    case ACTIONS.IMPORT_WORKOUTS:
      return {
        ...state,
        workouts: [...action.payload, ...state.workouts],
        isLoading: false,
      };

    case ACTIONS.ADD_WORKOUT:
      return {
        ...state,
        workouts: [action.payload, ...state.workouts],
      };

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
      return {
        ...state,
        currentWorkout: action.payload,
      };

    case ACTIONS.CLEAR_CURRENT_WORKOUT:
      return {
        ...state,
        currentWorkout: null,
      };

    default:
      return state;
  }
};

// Initial state
const initialState = {
  workouts: [],
  currentWorkout: null,
  isLoading: true,
};

// Provider component
export const WorkoutProvider = ({ children }) => {
  const [state, dispatch] = useReducer(workoutReducer, initialState);
  const [isInitialized, setIsInitialized] = useReducer(() => true, false);
  const { user } = useAuth();
  const [useSupabase, setUseSupabase] = useState(false);

  // Determine if we should use Supabase or localStorage
  useEffect(() => {
    setUseSupabase(!!user);
  }, [user]);

  const loadFromLocalStorage = useCallback(() => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      // Run data migrations first
      const migrationResult = migrateData();
      if (migrationResult.migrated && import.meta.env.MODE !== 'production') {
        console.info(`Data migrated from ${migrationResult.fromVersion} to ${migrationResult.toVersion}`);
      }

      // Simulate brief loading to show skeleton
      const timer = setTimeout(() => {
        try {
          const data = storage.get();
          if (data.workouts && Array.isArray(data.workouts)) {
            dispatch({ type: ACTIONS.SET_WORKOUTS, payload: data.workouts });
          } else {
            dispatch({ type: ACTIONS.SET_LOADING, payload: false });
          }

          // Restore currentWorkout if it exists
          if (data.currentWorkout) {
            dispatch({ type: ACTIONS.SET_CURRENT_WORKOUT, payload: data.currentWorkout });
          }
        } catch (error) {
          if (import.meta.env.MODE !== 'production') {
            console.error('❌ Error loading from localStorage:', error);
          }
          dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        } finally {
          setIsInitialized();
        }
      }, 300);

      return () => clearTimeout(timer);
    } catch (error) {
      // Catch migration errors
      if (import.meta.env.MODE !== 'production') {
        console.error('❌ Migration error:', error);
      }
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      setIsInitialized();
    }
  }, []);

  const loadFromSupabase = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      const workouts = await db.getWorkouts(user.id);
      const transformed = workouts.map(transformWorkoutFromDB);
      dispatch({ type: ACTIONS.SET_WORKOUTS, payload: transformed });
    } catch (error) {
      if (import.meta.env.MODE !== 'production') {
        console.error('❌ Error loading from Supabase:', error);
      }
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    } finally {
      // Always mark as initialized
      setIsInitialized();
    }
  }, [user]);

  // Load data on mount
  useEffect(() => {
    if (!user) {
      // Use localStorage when not authenticated
      loadFromLocalStorage();
    } else {
      // Use Supabase when authenticated
      loadFromSupabase();
    }
  }, [user, loadFromLocalStorage, loadFromSupabase]);

  // Save to localStorage whenever workouts change (but only after initial load and if not using Supabase)
  useEffect(() => {
    if (!isInitialized || useSupabase) return; // Don't save to localStorage if using Supabase

    try {
      storage.set({ workouts: state.workouts });
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  }, [state.workouts, isInitialized, useSupabase]);

  // Save currentWorkout to localStorage whenever it changes (only if not using Supabase)
  useEffect(() => {
    if (!isInitialized || useSupabase) return;

    try {
      const data = storage.get();
      if (state.currentWorkout) {
        storage.set({ ...data, currentWorkout: state.currentWorkout });
      } else {
        // Remove currentWorkout from storage when cleared
        const { currentWorkout, ...rest } = data;
        storage.set(rest);
      }
    } catch (error) {
      console.error('❌ Error saving currentWorkout to localStorage:', error);
    }
  }, [state.currentWorkout, isInitialized, useSupabase]);

  // Actions
  const addWorkout = async (workout) => {
    // Sanitize workout data before saving
    const sanitized = sanitizeWorkout(workout);

    const newWorkout = {
      ...sanitized,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    if (useSupabase && user) {
      try {
        const created = await db.createWorkout(newWorkout, user.id);
        const transformed = transformWorkoutFromDB(created);
        dispatch({ type: ACTIONS.ADD_WORKOUT, payload: transformed });
        return transformed;
      } catch (error) {
        if (import.meta.env.MODE !== 'production') {
          console.error('❌ Error adding workout to Supabase:', error);
        }
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.ADD_WORKOUT, payload: newWorkout });
      return newWorkout;
    }
  };

  const addRestDay = async (restDayData) => {
    // Convert selected date to ISO string at current time
    const selectedDate = new Date(restDayData.date);
    selectedDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

    const restDay = {
      id: crypto.randomUUID(),
      type: 'rest_day',
      date: selectedDate.toISOString(),
      recoveryQuality: Math.max(1, Math.min(5, parseInt(restDayData.recoveryQuality) || 3)),
      activities: Array.isArray(restDayData.activities) ? restDayData.activities : [],
      notes: (restDayData.notes || '').trim().slice(0, 1000),
      createdAt: new Date().toISOString(),
    };

    if (useSupabase && user) {
      try {
        const created = await db.createWorkout(restDay, user.id);
        const transformed = transformWorkoutFromDB(created);
        dispatch({ type: ACTIONS.ADD_WORKOUT, payload: transformed });
        return transformed;
      } catch (error) {
        if (import.meta.env.MODE !== 'production') {
          console.error('❌ Error adding rest day to Supabase:', error);
        }
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.ADD_WORKOUT, payload: restDay });
      return restDay;
    }
  };

  const updateWorkout = async (workout) => {
    // Sanitize before updating
    const sanitized = sanitizeWorkout(workout);

    if (useSupabase && user) {
      try {
        await db.updateWorkout(sanitized.id, sanitized, user.id);
        dispatch({ type: ACTIONS.UPDATE_WORKOUT, payload: sanitized });
      } catch (error) {
        if (import.meta.env.MODE !== 'production') {
          console.error('❌ Error updating workout in Supabase:', error);
        }
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.UPDATE_WORKOUT, payload: workout });
    }
  };

  const deleteWorkout = async (id) => {
    if (useSupabase && user) {
      try {
        await db.deleteWorkout(id, user.id);
        dispatch({ type: ACTIONS.DELETE_WORKOUT, payload: id });
      } catch (error) {
        console.error('❌ Error deleting workout from Supabase:', error);
        throw error;
      }
    } else {
      dispatch({ type: ACTIONS.DELETE_WORKOUT, payload: id });
    }
  };

  const setCurrentWorkout = (workout) => {
    dispatch({ type: ACTIONS.SET_CURRENT_WORKOUT, payload: workout });
  };

  const clearCurrentWorkout = () => {
    dispatch({ type: ACTIONS.CLEAR_CURRENT_WORKOUT });
  };

  const cloneWorkout = (workout) => {
    // Clone workout for repeat/template use
    const clonedWorkout = {
      ...workout,
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        id: crypto.randomUUID(),
        sets: exercise.sets.map(set => ({
          ...set,
          completed: false // Reset completion status
        }))
      }))
    };

    // Set as current workout for editing
    setCurrentWorkout(clonedWorkout);
    return clonedWorkout;
  };

  const importWorkouts = (workouts) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    setTimeout(() => {
      dispatch({ type: ACTIONS.IMPORT_WORKOUTS, payload: workouts });
    }, 300);
  };

  const value = {
    workouts: state.workouts,
    currentWorkout: state.currentWorkout,
    isLoading: state.isLoading,
    addWorkout,
    addRestDay,
    updateWorkout,
    deleteWorkout,
    setCurrentWorkout,
    clearCurrentWorkout,
    cloneWorkout,
    importWorkouts,
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
