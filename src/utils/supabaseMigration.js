import { db } from '../lib/supabase';

/**
 * Migrate localStorage data to Supabase
 */
export const migrateLocalStorageToSupabase = async (userId) => {
  try {
    // Get data from localStorage
    const localStorageKey = 'workout-tracker-data';
    const templatesKey = 'workout_templates';
    
    const workoutData = localStorage.getItem(localStorageKey);
    const templatesData = localStorage.getItem(templatesKey);
    
    if (!workoutData && !templatesData) {
      return {
        success: true,
        workoutsMigrated: 0,
        templatesMigrated: 0,
        message: 'No data to migrate',
      };
    }

    let workoutsMigrated = 0;
    let templatesMigrated = 0;

    // Migrate workouts
    if (workoutData) {
      const parsed = JSON.parse(workoutData);
      const workouts = parsed.workouts || [];

      for (const workout of workouts) {
        try {
          await db.createWorkout(workout, userId);
          workoutsMigrated++;
        } catch (error) {
          console.error('Error migrating workout:', workout.id, error);
        }
      }
    }

    // Migrate templates
    if (templatesData) {
      const templates = JSON.parse(templatesData);

      for (const template of templates) {
        try {
          await db.createTemplate(template, userId);
          templatesMigrated++;
        } catch (error) {
          console.error('Error migrating template:', template.id, error);
        }
      }
    }

    return {
      success: true,
      workoutsMigrated,
      templatesMigrated,
      message: `Successfully migrated ${workoutsMigrated} workouts and ${templatesMigrated} templates`,
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to migrate data',
    };
  }
};

/**
 * Check if user has local data that needs migration
 */
export const hasLocalData = () => {
  try {
    const workoutData = localStorage.getItem('workout-tracker-data');
    const templatesData = localStorage.getItem('workout_templates');
    
    if (workoutData) {
      const parsed = JSON.parse(workoutData);
      if (parsed.workouts && parsed.workouts.length > 0) {
        return {
          hasWorkouts: true,
          workoutCount: parsed.workouts.length,
          hasTemplates: false,
          templateCount: 0,
        };
      }
    }
    
    if (templatesData) {
      const templates = JSON.parse(templatesData);
      if (Array.isArray(templates) && templates.length > 0) {
        return {
          hasWorkouts: false,
          workoutCount: 0,
          hasTemplates: true,
          templateCount: templates.length,
        };
      }
    }
    
    return {
      hasWorkouts: false,
      workoutCount: 0,
      hasTemplates: false,
      templateCount: 0,
    };
  } catch (error) {
    console.error('Error checking local data:', error);
    return {
      hasWorkouts: false,
      workoutCount: 0,
      hasTemplates: false,
      templateCount: 0,
    };
  }
};

/**
 * Clear localStorage after successful migration
 */
export const clearLocalStorageData = () => {
  try {
    // Backup to a different key in case needed
    const workoutData = localStorage.getItem('workout-tracker-data');
    const templatesData = localStorage.getItem('workout_templates');
    
    if (workoutData) {
      localStorage.setItem('workout-tracker-data-backup', workoutData);
      localStorage.removeItem('workout-tracker-data');
    }
    
    if (templatesData) {
      localStorage.setItem('workout_templates-backup', templatesData);
      localStorage.removeItem('workout_templates');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Restore from backup if needed
 */
export const restoreFromBackup = () => {
  try {
    const workoutBackup = localStorage.getItem('workout-tracker-data-backup');
    const templatesBackup = localStorage.getItem('workout_templates-backup');
    
    if (workoutBackup) {
      localStorage.setItem('workout-tracker-data', workoutBackup);
    }
    
    if (templatesBackup) {
      localStorage.setItem('workout_templates', templatesBackup);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check migration status for a user
 */
export const checkMigrationStatus = () => {
  try {
    const migrated = localStorage.getItem('supabase-migrated');
    return migrated === 'true';
  } catch {
    return false;
  }
};

/**
 * Mark migration as completed
 */
export const markMigrationComplete = () => {
  try {
    localStorage.setItem('supabase-migrated', 'true');
    localStorage.setItem('supabase-migration-date', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error marking migration complete:', error);
    return false;
  }
};
