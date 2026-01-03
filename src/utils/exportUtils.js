import * as XLSX from 'xlsx';
import { formatDate, calculateTotalVolume, calculateTotalSets } from './calculations';

// Export workouts as JSON
export const exportToJSON = (workouts) => {
  try {
    const dataStr = JSON.stringify(workouts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fittrack-workouts-${new Date().toISOString().split('T')[0]}.json`;
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
    const summaryData = workouts.map(workout => ({
      'Date': formatDate(workout.date),
      'Workout Name': workout.name,
      'Duration (min)': workout.duration || 0,
      'Total Exercises': workout.exercises?.length || 0,
      'Total Sets': calculateTotalSets(workout),
      'Total Volume (kg)': calculateTotalVolume(workout),
      'Notes': workout.notes || ''
    }));

    // Create detailed exercises sheet
    const exercisesData = [];
    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        exercise.sets.forEach((set, index) => {
          exercisesData.push({
            'Date': formatDate(workout.date),
            'Workout': workout.name,
            'Exercise': exercise.name,
            'Category': exercise.category,
            'Set Number': index + 1,
            'Reps': set.reps,
            'Weight (kg)': set.weight,
            'Volume (kg)': set.reps * set.weight,
            'Completed': set.completed ? 'Yes' : 'No',
            'Notes': exercise.notes || ''
          });
        });
      });
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
        const workouts = JSON.parse(e.target.result);
        
        // Validate structure
        if (!Array.isArray(workouts)) {
          reject(new Error('Invalid JSON format: Expected an array'));
          return;
        }
        
        // Validate each workout
        const validWorkouts = workouts.filter(w => {
          return w.name && w.date && Array.isArray(w.exercises);
        });
        
        if (validWorkouts.length === 0) {
          reject(new Error('No valid workouts found in file'));
          return;
        }
        
        // Assign new IDs to avoid conflicts
        const importedWorkouts = validWorkouts.map(w => ({
          ...w,
          id: crypto.randomUUID(),
          createdAt: w.createdAt || new Date().toISOString(),
          imported: true,
        }));
        
        resolve(importedWorkouts);
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
