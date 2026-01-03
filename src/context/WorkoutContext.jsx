import { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '../utils/storage';

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
    
    // Simulate brief loading to show skeleton
    const timer = setTimeout(() => {
      try {
        const data = storage.get();
        console.log('📦 Loading workouts from localStorage:', data.workouts?.length || 0, 'workouts');
        if (data.workouts && Array.isArray(data.workouts)) {
          dispatch({ type: ACTIONS.SET_WORKOUTS, payload: data.workouts });
        } else {
          dispatch({ type: ACTIONS.SET_LOADING, payload: false });
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
      console.log('💾 Saved to localStorage:', state.workouts.length, 'workouts');
      console.log('💾 Full workout data:', JSON.stringify(state.workouts, null, 2));
      
      // Verify save
      const verification = storage.get();
      console.log('✅ Verification - localStorage now has:', verification.workouts?.length || 0, 'workouts');
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  }, [state.workouts, isInitialized]);

  // Actions
  const addWorkout = (workout) => {
    const newWorkout = {
      ...workout,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    console.log('➕ Adding new workout:', newWorkout.name, 'with', newWorkout.exercises?.length || 0, 'exercises');
    dispatch({ type: ACTIONS.ADD_WORKOUT, payload: newWorkout });
    return newWorkout;
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
    updateWorkout,
    deleteWorkout,
    setCurrentWorkout,
    clearCurrentWorkout,
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
