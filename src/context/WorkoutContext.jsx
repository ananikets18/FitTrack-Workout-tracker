import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { indexedDBStorage } from '../utils/indexedDBStorage';
import { syncManager } from '../lib/syncManager';
import { offlineQueue } from '../lib/offlineQueue';
import { networkDetector } from '../utils/networkDetector';
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Subscribe to network changes
  useEffect(() => {
    const unsubscribe = networkDetector.subscribe((online) => {
      setIsOnline(online);

      // Trigger sync when coming back online
      if (online && user) {
        console.log('🔄 Network restored, syncing...');
        syncManager.syncAll(user.id).catch(console.error);
      }
    });

    return unsubscribe;
  }, [user]);

  // Load workouts from IndexedDB
  const loadWorkouts = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      // Always load from IndexedDB (offline-first)
      const { workouts } = await indexedDBStorage.get(user?.id);
      dispatch({ type: ACTIONS.SET_WORKOUTS, payload: workouts });

      // Load current workout if exists
      const currentWorkout = await indexedDBStorage.getCurrentWorkout();
      if (currentWorkout) {
        dispatch({ type: ACTIONS.SET_CURRENT_WORKOUT, payload: currentWorkout });
      }

      // If user is logged in and online, trigger sync
      if (user && isOnline) {
        syncManager.syncAll(user.id).catch(console.error);
      }
    } catch (error) {
      if (import.meta.env.MODE !== 'production') {
        console.error('❌ Error loading workouts:', error);
      }
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    } finally {
      setIsInitialized();
    }
  }, [user, isOnline]);

  // Load data on mount and when user changes
  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  // Enable auto-sync when user is logged in
  useEffect(() => {
    if (user) {
      syncManager.enableAutoSync();
    } else {
      syncManager.disableAutoSync();
    }
  }, [user]);

  // Actions
  const addWorkout = async (workout) => {
    try {
      // Sanitize workout data
      const sanitized = sanitizeWorkout(workout);

      const newWorkout = {
        ...sanitized,
        id: user ? crypto.randomUUID() : `local-${Date.now()}`,
        userId: user?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to IndexedDB (optimistic update)
      const created = await indexedDBStorage.addWorkout(newWorkout, user?.id);
      dispatch({ type: ACTIONS.ADD_WORKOUT, payload: created });

      // If online and authenticated, queue for sync
      if (user && isOnline) {
        try {
          await syncManager.syncAll(user.id);
        } catch (error) {
          // If sync fails, add to offline queue
          await offlineQueue.add({
            type: 'CREATE_WORKOUT',
            data: created,
            userId: user.id
          });
        }
      }

      return created;
    } catch (error) {
      console.error('❌ Error adding workout:', error);
      throw error;
    }
  };

  const addRestDay = async (restDayData) => {
    try {
      const selectedDate = new Date(restDayData.date);
      selectedDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

      const restDay = {
        id: user ? crypto.randomUUID() : `local-${Date.now()}`,
        type: 'rest_day',
        date: selectedDate.toISOString(),
        recoveryQuality: Math.max(1, Math.min(5, parseInt(restDayData.recoveryQuality) || 3)),
        activities: Array.isArray(restDayData.activities) ? restDayData.activities : [],
        notes: (restDayData.notes || '').trim().slice(0, 1000),
        userId: user?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to IndexedDB
      const created = await indexedDBStorage.addWorkout(restDay, user?.id);
      dispatch({ type: ACTIONS.ADD_WORKOUT, payload: created });

      // Sync if online
      if (user && isOnline) {
        try {
          await syncManager.syncAll(user.id);
        } catch (error) {
          await offlineQueue.add({
            type: 'CREATE_WORKOUT',
            data: created,
            userId: user.id
          });
        }
      }

      return created;
    } catch (error) {
      console.error('❌ Error adding rest day:', error);
      throw error;
    }
  };

  const updateWorkout = async (workout) => {
    try {
      // Sanitize before updating
      const sanitized = sanitizeWorkout(workout);

      const updated = {
        ...sanitized,
        updatedAt: new Date().toISOString(),
      };

      // Update in IndexedDB
      await indexedDBStorage.updateWorkout(updated.id, updated);
      dispatch({ type: ACTIONS.UPDATE_WORKOUT, payload: updated });

      // Sync if online
      if (user && isOnline) {
        try {
          await syncManager.syncAll(user.id);
        } catch (error) {
          await offlineQueue.add({
            type: 'UPDATE_WORKOUT',
            data: updated,
            userId: user.id
          });
        }
      }
    } catch (error) {
      console.error('❌ Error updating workout:', error);
      throw error;
    }
  };

  const deleteWorkout = async (id) => {
    try {
      // Delete from IndexedDB
      await indexedDBStorage.deleteWorkout(id);
      dispatch({ type: ACTIONS.DELETE_WORKOUT, payload: id });

      // Sync if online
      if (user && isOnline) {
        try {
          await syncManager.syncAll(user.id);
        } catch (error) {
          await offlineQueue.add({
            type: 'DELETE_WORKOUT',
            data: { id },
            userId: user.id
          });
        }
      }
    } catch (error) {
      console.error('❌ Error deleting workout:', error);
      throw error;
    }
  };

  const setCurrentWorkout = async (workout) => {
    try {
      dispatch({ type: ACTIONS.SET_CURRENT_WORKOUT, payload: workout });
      await indexedDBStorage.setCurrentWorkout(workout);
    } catch (error) {
      console.error('❌ Error setting current workout:', error);
    }
  };

  const clearCurrentWorkout = async () => {
    try {
      dispatch({ type: ACTIONS.CLEAR_CURRENT_WORKOUT });
      await indexedDBStorage.setCurrentWorkout(null);
    } catch (error) {
      console.error('❌ Error clearing current workout:', error);
    }
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

  const importWorkouts = async (workouts) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });

      // Add each workout to IndexedDB
      for (const workout of workouts) {
        await indexedDBStorage.addWorkout(workout, user?.id);
      }

      // Reload workouts
      await loadWorkouts();

      // Sync if online
      if (user && isOnline) {
        syncManager.syncAll(user.id).catch(console.error);
      }
    } catch (error) {
      console.error('❌ Error importing workouts:', error);
      throw error;
    }
  };

  // Force sync (for manual trigger)
  const forceSync = async () => {
    if (!user) {
      console.warn('Cannot sync without user');
      return null;
    }

    try {
      const result = await syncManager.forceSyncNow(user.id);

      // Reload workouts after sync
      await loadWorkouts();

      return result;
    } catch (error) {
      console.error('❌ Force sync failed:', error);
      return null;
    }
  };

  const value = {
    workouts: state.workouts,
    currentWorkout: state.currentWorkout,
    isLoading: state.isLoading,
    isOnline,
    addWorkout,
    addRestDay,
    updateWorkout,
    deleteWorkout,
    setCurrentWorkout,
    clearCurrentWorkout,
    cloneWorkout,
    importWorkouts,
    forceSync,
    refreshWorkouts: loadWorkouts,
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
