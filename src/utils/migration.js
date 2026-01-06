/**
 * Data Migration Utilities
 * Handles schema changes and data migrations across versions
 */

import { storage } from './storage';
import { sanitizeWorkout } from './validation';

const CURRENT_VERSION = '1.0.0';

// Migration functions for each version
const migrations = {
  // Example: Migration from no version to 1.0.0
  '0.0.0': (data) => {
    return {
      ...data,
      workouts: data.workouts.map(workout => ({
        ...workout,
        id: workout.id || crypto.randomUUID(),
        createdAt: workout.createdAt || new Date().toISOString(),
      })),
      version: '1.0.0',
    };
  },
  
  // Future migrations would go here
  // '1.0.0': (data) => { ... migrate to 1.1.0 },
  // '1.1.0': (data) => { ... migrate to 1.2.0 },
};

/**
 * Compare version strings
 */
const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
};

/**
 * Run migrations in sequence
 */
const runMigrations = (data, fromVersion, toVersion) => {
  let currentData = { ...data };
  let currentVersion = fromVersion;
  
  // Get list of migrations to run
  const migrationsToRun = Object.keys(migrations)
    .filter(v => compareVersions(v, currentVersion) >= 0 && compareVersions(v, toVersion) < 0)
    .sort(compareVersions);
  
  // Run each migration
  for (const version of migrationsToRun) {
    try {
      currentData = migrations[version](currentData);
      currentVersion = currentData.version;
    } catch (error) {
      console.error(`Migration failed at version ${version}:`, error);
      throw new Error(`Data migration failed at version ${version}`);
    }
  }
  
  return currentData;
};

/**
 * Check and run migrations if needed
 */
export const migrateData = () => {
  try {
    const data = storage.get();
    const currentDataVersion = data.version || '0.0.0';
    
    // No migration needed
    if (currentDataVersion === CURRENT_VERSION) {
      return { migrated: false, version: CURRENT_VERSION };
    }
    
    // Data is newer than app (shouldn't happen normally)
    if (compareVersions(currentDataVersion, CURRENT_VERSION) > 0) {
      console.warn('Data version is newer than app version');
      return { migrated: false, version: currentDataVersion, warning: 'newer' };
    }
    
    // Run migrations
    const migratedData = runMigrations(data, currentDataVersion, CURRENT_VERSION);
    
    // Sanitize after migration
    migratedData.workouts = migratedData.workouts.map(w => sanitizeWorkout(w));
    
    // Save migrated data
    storage.set(migratedData);
    
    return {
      migrated: true,
      fromVersion: currentDataVersion,
      toVersion: CURRENT_VERSION,
    };
  } catch (error) {
    console.error('Data migration error:', error);
    return {
      migrated: false,
      error: error.message,
    };
  }
};

/**
 * Backup data before migration
 */
export const backupData = () => {
  try {
    const data = storage.get();
    const backup = {
      ...data,
      backupDate: new Date().toISOString(),
    };
    
    // Store in separate key
    localStorage.setItem('workout-tracker-backup', JSON.stringify(backup));
    return { success: true };
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Restore from backup
 */
export const restoreFromBackup = () => {
  try {
    const backupData = localStorage.getItem('workout-tracker-backup');
    if (!backupData) {
      return { success: false, error: 'No backup found' };
    }
    
    const backup = JSON.parse(backupData);
    storage.set(backup);
    
    return { success: true, backupDate: backup.backupDate };
  } catch (error) {
    console.error('Restore failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current version info
 */
export const getVersionInfo = () => {
  const data = storage.get();
  return {
    appVersion: CURRENT_VERSION,
    dataVersion: data.version || '0.0.0',
    needsMigration: (data.version || '0.0.0') !== CURRENT_VERSION,
    lastModified: data.lastModified,
  };
};

export default {
  migrateData,
  backupData,
  restoreFromBackup,
  getVersionInfo,
  CURRENT_VERSION,
};

