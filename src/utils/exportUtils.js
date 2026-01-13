import * as XLSX from 'xlsx';
import { formatDate, calculateTotalVolume, calculateTotalSets } from './calculations';
import { validateImportedData } from './validation';

// Export workouts as CSV
export const exportToCSV = (workouts) => {
  try {
    // Create CSV header
    const headers = ['Date', 'Type', 'Workout Name', 'Exercise', 'Category', 'Set', 'Reps', 'Weight (kg)', 'Volume (kg)', 'Duration (min)', 'Recovery Quality', 'Activities', 'Notes'];

    // Create CSV rows
    const rows = [];
    workouts.forEach(workout => {
      if (workout.type === 'rest_day') {
        // Rest day row
        rows.push([
          formatDate(workout.date),
          'Rest Day',
          'Rest Day',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          workout.recoveryQuality || '-',
          (workout.activities || []).join('; '),
          (workout.notes || '').replace(/,/g, ';')
        ]);
      } else {
        // Regular workout rows
        workout.exercises?.forEach(exercise => {
          exercise.sets.forEach((set, index) => {
            rows.push([
              formatDate(workout.date),
              'Workout',
              workout.name,
              exercise.name,
              exercise.category,
              index + 1,
              set.reps,
              set.weight,
              (set.reps * set.weight).toFixed(2),
              workout.duration || '',
              '-',
              '-',
              (workout.notes || exercise.notes || '').replace(/,/g, ';')
            ]);
          });
        });
      }
    });

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fittrack-workouts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return false;
  }
};

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
      const dateStr = dateRange.date ? new Date(dateRange.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      filename += `-${dateRange.period}-${dateStr}`;
    } else {
      filename += `-${new Date().toISOString().split('T')[0]}`;
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

// Export workouts as Excel
export const exportToExcel = (workouts) => {
  try {
    // Create workouts summary sheet
    const summaryData = workouts.map(workout => {
      if (workout.type === 'rest_day') {
        return {
          'Date': formatDate(workout.date),
          'Type': 'Rest Day',
          'Workout Name': 'Rest Day',
          'Duration (min)': '-',
          'Total Exercises': '-',
          'Total Sets': '-',
          'Total Volume (kg)': '-',
          'Recovery Quality': workout.recoveryQuality || '-',
          'Activities': (workout.activities || []).join(', '),
          'Notes': workout.notes || ''
        };
      } else {
        return {
          'Date': formatDate(workout.date),
          'Type': 'Workout',
          'Workout Name': workout.name,
          'Duration (min)': workout.duration || 0,
          'Total Exercises': workout.exercises?.length || 0,
          'Total Sets': calculateTotalSets(workout),
          'Total Volume (kg)': calculateTotalVolume(workout),
          'Recovery Quality': '-',
          'Activities': '-',
          'Notes': workout.notes || ''
        };
      }
    });

    // Create detailed exercises sheet
    const exercisesData = [];
    workouts.forEach(workout => {
      if (workout.type === 'rest_day') {
        exercisesData.push({
          'Date': formatDate(workout.date),
          'Type': 'Rest Day',
          'Workout': 'Rest Day',
          'Exercise': '-',
          'Category': '-',
          'Set Number': '-',
          'Reps': '-',
          'Weight (kg)': '-',
          'Volume (kg)': '-',
          'Completed': '-',
          'Recovery Quality': workout.recoveryQuality || '-',
          'Activities': (workout.activities || []).join(', '),
          'Notes': workout.notes || ''
        });
      } else {
        workout.exercises?.forEach(exercise => {
          exercise.sets.forEach((set, index) => {
            exercisesData.push({
              'Date': formatDate(workout.date),
              'Type': 'Workout',
              'Workout': workout.name,
              'Exercise': exercise.name,
              'Category': exercise.category,
              'Set Number': index + 1,
              'Reps': set.reps,
              'Weight (kg)': set.weight,
              'Volume (kg)': set.reps * set.weight,
              'Completed': set.completed ? 'Yes' : 'No',
              'Recovery Quality': '-',
              'Activities': '-',
              'Notes': exercise.notes || ''
            });
          });
        });
      }
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add summary sheet
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Workout Summary');

    // Add detailed exercises sheet
    const ws2 = XLSX.utils.json_to_sheet(exercisesData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Exercise Details');

    // Save file
    XLSX.writeFile(wb, `fittrack-workouts-${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
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

// Import workouts from Excel
export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Check for required sheets
        if (!workbook.SheetNames.includes('Workout Summary')) {
          reject(new Error('Invalid Excel file: Missing "Workout Summary" sheet'));
          return;
        }

        // Read summary sheet
        const summarySheet = workbook.Sheets['Workout Summary'];
        const summaryData = XLSX.utils.sheet_to_json(summarySheet);

        // Read exercise details sheet if available
        const hasDetails = workbook.SheetNames.includes('Exercise Details');
        let exerciseData = [];
        if (hasDetails) {
          const detailsSheet = workbook.Sheets['Exercise Details'];
          exerciseData = XLSX.utils.sheet_to_json(detailsSheet);
        }

        // Build workout objects
        const workouts = summaryData.map(summary => {
          const workoutName = summary['Workout Name'];
          const workoutDate = summary['Date'];

          // Find exercises for this workout
          const workoutExercises = {};
          exerciseData
            .filter(ex => ex['Workout'] === workoutName && ex['Date'] === workoutDate)
            .forEach(ex => {
              const exerciseName = ex['Exercise'];
              if (!workoutExercises[exerciseName]) {
                workoutExercises[exerciseName] = {
                  name: exerciseName,
                  category: (ex['Category'] || 'other').toLowerCase(),
                  sets: [],
                  notes: ex['Notes'] || '',
                };
              }
              workoutExercises[exerciseName].sets.push({
                reps: ex['Reps'] || 0,
                weight: ex['Weight (kg)'] || 0,
                completed: ex['Completed'] === 'Yes',
              });
            });

          return {
            id: crypto.randomUUID(),
            name: workoutName,
            date: new Date(workoutDate).toISOString(),
            duration: summary['Duration (min)'] || 0,
            exercises: Object.values(workoutExercises),
            notes: summary['Notes'] || '',
            createdAt: new Date().toISOString(),
            imported: true,
          };
        });

        if (workouts.length === 0) {
          reject(new Error('No valid workouts found in Excel file'));
          return;
        }

        resolve(workouts);
      } catch (error) {
        reject(new Error(`Error parsing Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

