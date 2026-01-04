import { validateStorageData, checkStorageQuota, sanitizeWorkout } from './validation';

const STORAGE_KEY = 'workout-tracker-data';
const STORAGE_VERSION = '1.0.0';

export const storage = {
  get: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      
      if (!data) {
        return { workouts: [], version: STORAGE_VERSION };
      }
      
      const validation = validateStorageData(data);
      
      if (!validation.isValid) {
        console.error('Invalid storage data, returning empty');
        return { workouts: [], version: STORAGE_VERSION };
      }
      
      return { ...validation.data, version: STORAGE_VERSION };
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return { workouts: [], version: STORAGE_VERSION };
    }
  },

  set: (data) => {
    try {
      // Check storage availability
      const quotaCheck = checkStorageQuota();
      if (!quotaCheck.available) {
        throw new Error(quotaCheck.error);
      }
      
      // Sanitize workouts before saving
      const sanitizedData = {
        workouts: data.workouts.map(w => sanitizeWorkout(w)),
        version: STORAGE_VERSION,
        lastModified: new Date().toISOString()
      };
      
      const stringified = JSON.stringify(sanitizedData);
      
      // Check if data size is reasonable (< 4MB to be safe)
      const sizeInMB = stringified.length / (1024 * 1024);
      if (sizeInMB > 4) {
        console.warn(`Storage size is large: ${sizeInMB.toFixed(2)}MB`);
      }
      
      localStorage.setItem(STORAGE_KEY, stringified);
      return { success: true, size: sizeInMB };
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      throw error;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};
