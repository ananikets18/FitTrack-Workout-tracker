const STORAGE_KEY = 'workout-tracker-data';

export const storage = {
  get: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : { workouts: [] };
      console.log('🔍 Storage.get() called - found:', parsed.workouts?.length || 0, 'workouts');
      return parsed;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return { workouts: [] };
    }
  },

  set: (data) => {
    try {
      const stringified = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, stringified);
      console.log('📝 Storage.set() called - saved:', data.workouts?.length || 0, 'workouts');
      console.log('📝 Data size:', (stringified.length / 1024).toFixed(2), 'KB');
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🗑️ Storage cleared');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};
