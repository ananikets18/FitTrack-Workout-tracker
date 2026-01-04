import { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '../utils/storage';
import { migrateData } from '../utils/migration';

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

  // Load data from localStorage on mount
  useEffect(() => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    // Run data migrations first
    const migrationResult = migrateData();
    if (migrationResult.migrated) {
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
        
        // Restore currentWorkout if it exists (for page refresh during workout logging)
        if (data.currentWorkout) {
          dispatch({ type: ACTIONS.SET_CURRENT_WORKOUT, payload: data.currentWorkout });
        }
      } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      } finally {
        setIsInitialized();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Save to localStorage whenever workouts change (but only after initial load)
  useEffect(() => {
    if (!isInitialized) return; // Don't save until we've loaded initial data
    
    try {
      storage.set({ workouts: state.workouts });
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  }, [state.workouts, isInitialized]);

  // Save currentWorkout to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
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
  }, [state.currentWorkout, isInitialized]);

  // Actions
  const addWorkout = (workout) => {
    const newWorkout = {
      ...workout,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: ACTIONS.ADD_WORKOUT, payload: newWorkout });
    return newWorkout;
  };

  const addRestDay = (restDayData) => {
    // Convert selected date to ISO string at current time
    const selectedDate = new Date(restDayData.date);
    selectedDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());
    
    const restDay = {
      id: crypto.randomUUID(),
      type: 'rest_day',
      date: selectedDate.toISOString(),
      recoveryQuality: restDayData.recoveryQuality,
      activities: restDayData.activities || [],
      notes: restDayData.notes || '',
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: ACTIONS.ADD_WORKOUT, payload: restDay });
    return restDay;
  };

  const updateWorkout = (workout) => {
    dispatch({ type: ACTIONS.UPDATE_WORKOUT, payload: workout });
  };

  const deleteWorkout = (id) => {
    dispatch({ type: ACTIONS.DELETE_WORKOUT, payload: id });
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
