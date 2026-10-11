import { validateImportedData } from './validation';
import { getLocalDateInputValue } from './date';

// Helper function to filter workouts by date range
const filterWorkoutsByDateRange = (workouts, dateRange) => {
  if (!dateRange || !dateRange.period) {
    return workouts; // No filter applied
  }

  const { period, date } = dateRange;
  const referenceDate = date ? new Date(date) : new Date();

  // Reset time to start of day for accurate comparison
  referenceDate.setHours(0, 0, 0, 0);

  let startDate, endDate;

  switch (period) {
    case 'day':
      // Single day
      startDate = new Date(referenceDate);
      endDate = new Date(referenceDate);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'week':
      // Current week (Monday to Sunday)
      startDate = new Date(referenceDate);
      const dayOfWeek = startDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(startDate.getDate() - daysToMonday);

      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'month':
      // Current month
      startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      endDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'year':
      // Current year
      startDate = new Date(referenceDate.getFullYear(), 0, 1);
      endDate = new Date(referenceDate.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      return workouts;
  }

  // Filter workouts within the date range
  return workouts.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= startDate && workoutDate <= endDate;
  });
};

// Export workouts as JSON with optional date range filtering
export const exportToJSON = (workouts, dateRange = null) => {
  try {
    // Filter workouts if dateRange is provided
    const filteredWorkouts = filterWorkoutsByDateRange(workouts, dateRange);

    if (filteredWorkouts.length === 0) {
      console.warn('No workouts found in the selected date range');
      return false;
    }

    const dataStr = JSON.stringify(filteredWorkouts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;

    // Create filename with date range info if applicable
    let filename = 'fittrack-workouts';
    if (dateRange && dateRange.period) {
      const dateStr = dateRange.date ? getLocalDateInputValue(dateRange.date) : getLocalDateInputValue();
      filename += `-${dateRange.period}-${dateStr}`;
    } else {
      filename += `-${getLocalDateInputValue()}`;
    }
    link.download = `${filename}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    return false;
  }
};

// Import workouts from JSON
export const importFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const rawData = JSON.parse(e.target.result);

        // Validate and sanitize imported data
        const validation = validateImportedData(Array.isArray(rawData) ? rawData : [rawData]);

        if (!validation.isValid || validation.validWorkouts.length === 0) {
          reject(new Error(validation.errors.join('; ') || 'No valid workouts found in file'));
          return;
        }

        // Assign new IDs to avoid conflicts
        const importedWorkouts = validation.validWorkouts.map(w => ({
          ...w,
          id: crypto.randomUUID(),
          createdAt: w.createdAt || new Date().toISOString(),
          imported: true,
        }));

        resolve({
          workouts: importedWorkouts,
          summary: {
            total: validation.totalProcessed,
            valid: validation.validCount,
            invalid: validation.invalidCount
          }
        });
      } catch (error) {
        reject(new Error(`Error parsing JSON: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

/**
 * Validate structure of exported JSON data schema
 * @param {Object} data - Parsed JSON import data
 * @returns {Object} Validation status and workout list
 */
export const validateExportSchema = (data) => {
  if (!data) return { isValid: false, reason: 'Empty data payload', workouts: [] };
  
  let workouts = [];
  if (Array.isArray(data)) {
    workouts = data;
  } else if (typeof data === 'object' && Array.isArray(data.workouts)) {
    workouts = data.workouts;
  } else {
    return { isValid: false, reason: 'JSON missing array of workouts', workouts: [] };
  }

  const validWorkouts = workouts.filter(w => w && (w.name || w.type === 'rest_day') && (w.date || w.id));
  return {
    isValid: validWorkouts.length > 0,
    totalCount: workouts.length,
    validCount: validWorkouts.length,
    workouts: validWorkouts
  };
};

