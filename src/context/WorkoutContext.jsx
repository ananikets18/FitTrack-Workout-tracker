import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db as supabase } from '../lib/supabase';
import { sanitizeWorkout } from '../utils/validation';
import toast from 'react-hot-toast';

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
  const { user } = useAuth();

  // Load workouts from Supabase
  const loadWorkouts = useCallback(async () => {
    if (!user) {
      dispatch({ type: ACTIONS.SET_WORKOUTS, payload: [] });
      return;
    }

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      const workouts = await supabase.getWorkouts(user.id);
      dispatch({ type: ACTIONS.SET_WORKOUTS, payload: workouts });
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
      const newWorkout = {
        ...sanitized,
        id: crypto.randomUUID(),
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save directly to Supabase
      await supabase.createWorkout(newWorkout, user.id);

      // Update local state
      dispatch({ type: ACTIONS.ADD_WORKOUT, payload: newWorkout });

      toast.success('Workout saved!');
      return newWorkout;
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
        id: crypto.randomUUID(),
        type: 'rest_day',
        date: selectedDate.toISOString(),
        recoveryQuality: Math.max(1, Math.min(5, parseInt(restDayData.recoveryQuality) || 3)),
        activities: Array.isArray(restDayData.activities) ? restDayData.activities : [],
        notes: (restDayData.notes || '').trim().slice(0, 1000),
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save directly to Supabase
      await supabase.createWorkout(restDay, user.id);

      // Update local state
      dispatch({ type: ACTIONS.ADD_WORKOUT, payload: restDay });

      toast.success('Rest day logged!');
      return restDay;
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
      const updated = {
        ...sanitized,
        updatedAt: new Date().toISOString(),
      };

      // Update in Supabase
      await supabase.updateWorkout(updated.id, updated, user.id);

      // Update local state
      dispatch({ type: ACTIONS.UPDATE_WORKOUT, payload: updated });

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

  const value = {
    workouts: state.workouts,
    currentWorkout: state.currentWorkout,
    isLoading: state.isLoading,
    isOnline: navigator.onLine, // Simple online check
    addWorkout,
    addRestDay,
    updateWorkout,
    deleteWorkout,
    setCurrentWorkout,
    clearCurrentWorkout,
    cloneWorkout,
    refreshWorkouts: loadWorkouts,
    forceSync: loadWorkouts, // Just reload from Supabase
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
