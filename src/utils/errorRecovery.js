import { indexedDB } from '../lib/indexedDB';
import { indexedDBStorage } from './indexedDBStorage';
import { syncManager } from '../lib/syncManager';
import { offlineQueue } from '../lib/offlineQueue';

/**
 * Error Recovery Utility
 * 
 * Provides functions to recover from various error states:
 * - Sync errors
 * - Database corruption
 * - Data inconsistencies
 * - Failed operations
 */

/**
 * Error types
 */
export const ErrorType = {
    SYNC_ERROR: 'sync_error',
    DATABASE_ERROR: 'database_error',
    NETWORK_ERROR: 'network_error',
    DATA_CORRUPTION: 'data_corruption',
    QUOTA_EXCEEDED: 'quota_exceeded'
};

/**
 * Diagnose current error state
 * @returns {Promise<Object>} - Diagnostic results
 */
export async function diagnoseErrors() {
    const diagnosis = {
        timestamp: new Date().toISOString(),
        errors: [],
        warnings: [],
        info: []
    };

    try {
        // Check IndexedDB availability
        const isAvailable = await indexedDBStorage.isAvailable();
        if (!isAvailable) {
            diagnosis.errors.push({
                type: ErrorType.DATABASE_ERROR,
                message: 'IndexedDB is not available',
                severity: 'critical'
            });
        }

        // Check for sync errors
        const syncStatus = await syncManager.getSyncStatus();
        if (syncStatus) {
            if (syncStatus.errorWorkouts > 0) {
                diagnosis.errors.push({
                    type: ErrorType.SYNC_ERROR,
                    message: `${syncStatus.errorWorkouts} workout(s) failed to sync`,
                    severity: 'high',
                    count: syncStatus.errorWorkouts
                });
            }

            if (syncStatus.pendingWorkouts > 0) {
                diagnosis.warnings.push({
                    type: ErrorType.SYNC_ERROR,
                    message: `${syncStatus.pendingWorkouts} workout(s) pending sync`,
                    severity: 'medium',
                    count: syncStatus.pendingWorkouts
                });
            }
        }

        // Check offline queue
        const queueStats = await offlineQueue.getStats();
        if (queueStats.failed > 0) {
            diagnosis.errors.push({
                type: ErrorType.SYNC_ERROR,
                message: `${queueStats.failed} operation(s) failed in queue`,
                severity: 'high',
                count: queueStats.failed
            });
        }

        if (queueStats.pending > 0) {
            diagnosis.info.push({
                type: ErrorType.SYNC_ERROR,
                message: `${queueStats.pending} operation(s) queued`,
                severity: 'low',
                count: queueStats.pending
            });
        }

        // Check database integrity
        const stats = await indexedDBStorage.getStats();
        if (stats) {
            const sizeInMB = parseFloat(stats.estimatedSizeMB);

            if (sizeInMB > 40) {
                diagnosis.warnings.push({
                    type: ErrorType.QUOTA_EXCEEDED,
                    message: `Database size is ${sizeInMB.toFixed(2)}MB (approaching limit)`,
                    severity: 'medium'
                });
            }

            // Check for orphaned data
            const orphanCheck = await checkOrphanedData();
            if (orphanCheck.hasOrphans) {
                diagnosis.warnings.push({
                    type: ErrorType.DATA_CORRUPTION,
                    message: `Found ${orphanCheck.count} orphaned records`,
                    severity: 'medium',
                    details: orphanCheck
                });
            }
        }

    } catch (error) {
        diagnosis.errors.push({
            type: ErrorType.DATABASE_ERROR,
            message: error.message,
            severity: 'critical'
        });
    }

    return diagnosis;
}

/**
 * Check for orphaned data (exercises/sets without parent workout)
 * @returns {Promise<Object>}
 */
async function checkOrphanedData() {
    try {
        const workoutIds = new Set();
        const workouts = await indexedDB.workouts.toArray();
        workouts.forEach(w => workoutIds.add(w.id));

        const exercises = await indexedDB.exercises.toArray();
        const orphanedExercises = exercises.filter(e => !workoutIds.has(e.workoutId));

        const exerciseIds = new Set();
        exercises.forEach(e => exerciseIds.add(e.id));

        const sets = await indexedDB.sets.toArray();
        const orphanedSets = sets.filter(s => !exerciseIds.has(s.exerciseId));

        return {
            hasOrphans: orphanedExercises.length > 0 || orphanedSets.length > 0,
            count: orphanedExercises.length + orphanedSets.length,
            orphanedExercises: orphanedExercises.length,
            orphanedSets: orphanedSets.length
        };
    } catch (error) {
        console.error('Error checking orphaned data:', error);
        return { hasOrphans: false, count: 0 };
    }
}

/**
 * Attempt automatic recovery
 * @returns {Promise<Object>} - Recovery results
 */
export async function attemptAutoRecovery() {
    const results = {
        timestamp: new Date().toISOString(),
        actions: [],
        success: true
    };

    try {
        // 1. Retry failed sync operations
        const queueStats = await offlineQueue.getStats();
        if (queueStats.failed > 0) {
            results.actions.push({
                action: 'retry_failed_operations',
                status: 'attempting'
            });

            const failed = await offlineQueue.getFailed();
            for (const item of failed) {
                try {
                    await offlineQueue.retryOperation(item.id);
                    results.actions[results.actions.length - 1].status = 'success';
                } catch (error) {
                    results.actions[results.actions.length - 1].status = 'failed';
                    results.actions[results.actions.length - 1].error = error.message;
                }
            }
        }

        // 2. Fix sync status for error workouts
        const errorWorkouts = await indexedDB.workouts
            .where('syncStatus')
            .equals('error')
            .toArray();

        if (errorWorkouts.length > 0) {
            results.actions.push({
                action: 'reset_error_workouts',
                count: errorWorkouts.length,
                status: 'attempting'
            });

            for (const workout of errorWorkouts) {
                await indexedDB.workouts.update(workout.id, {
                    syncStatus: 'pending',
                    syncError: null
                });
            }

            results.actions[results.actions.length - 1].status = 'success';
        }

        // 3. Clean up orphaned data
        const orphanCheck = await checkOrphanedData();
        if (orphanCheck.hasOrphans) {
            results.actions.push({
                action: 'clean_orphaned_data',
                count: orphanCheck.count,
                status: 'attempting'
            });

            await cleanOrphanedData();
            results.actions[results.actions.length - 1].status = 'success';
        }

        // 4. Trigger sync if online
        if (navigator.onLine) {
            results.actions.push({
                action: 'trigger_sync',
                status: 'attempting'
            });

            // Sync will be triggered by the sync manager
            results.actions[results.actions.length - 1].status = 'queued';
        }

    } catch (error) {
        results.success = false;
        results.error = error.message;
    }

    return results;
}

/**
 * Clean orphaned data
 * @returns {Promise<number>} - Number of records cleaned
 */
async function cleanOrphanedData() {
    let cleaned = 0;

    try {
        const workoutIds = new Set();
        const workouts = await indexedDB.workouts.toArray();
        workouts.forEach(w => workoutIds.add(w.id));

        // Clean orphaned exercises
        const exercises = await indexedDB.exercises.toArray();
        for (const exercise of exercises) {
            if (!workoutIds.has(exercise.workoutId)) {
                await indexedDB.exercises.delete(exercise.id);
                cleaned++;
            }
        }

        // Clean orphaned sets
        const exerciseIds = new Set();
        const remainingExercises = await indexedDB.exercises.toArray();
        remainingExercises.forEach(e => exerciseIds.add(e.id));

        const sets = await indexedDB.sets.toArray();
        for (const set of sets) {
            if (!exerciseIds.has(set.exerciseId)) {
                await indexedDB.sets.delete(set.id);
                cleaned++;
            }
        }

    } catch (error) {
        console.error('Error cleaning orphaned data:', error);
    }

    return cleaned;
}

/**
 * Reset all error states
 * @returns {Promise<Object>}
 */
export async function resetAllErrors() {
    const results = {
        workoutsReset: 0,
        queueCleared: 0
    };

    try {
        // Reset error workouts to pending
        const errorWorkouts = await indexedDB.workouts
            .where('syncStatus')
            .equals('error')
            .toArray();

        for (const workout of errorWorkouts) {
            await indexedDB.workouts.update(workout.id, {
                syncStatus: 'pending',
                syncError: null
            });
            results.workoutsReset++;
        }

        // Clear failed queue items
        const cleared = await offlineQueue.clearFailed();
        results.queueCleared = cleared;

    } catch (error) {
        console.error('Error resetting errors:', error);
        throw error;
    }

    return results;
}

/**
 * Create backup before recovery
 * @returns {Promise<Object>}
 */
export async function createRecoveryBackup() {
    try {
        const { exportIndexedDBData } = await import('./migrateToIndexedDB');
        const data = await exportIndexedDBData();

        // Store in localStorage as emergency backup
        const backupKey = 'fittrack-recovery-backup';
        const backup = {
            timestamp: new Date().toISOString(),
            data: data
        };

        localStorage.setItem(backupKey, JSON.stringify(backup));

        return {
            success: true,
            timestamp: backup.timestamp,
            size: JSON.stringify(backup).length
        };
    } catch (error) {
        console.error('Error creating recovery backup:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Restore from recovery backup
 * @returns {Promise<Object>}
 */
export async function restoreFromRecoveryBackup() {
    try {
        const backupKey = 'fittrack-recovery-backup';
        const backupData = localStorage.getItem(backupKey);

        if (!backupData) {
            throw new Error('No recovery backup found');
        }

        const backup = JSON.parse(backupData);
        const { importIndexedDBData } = await import('./migrateToIndexedDB');

        await importIndexedDBData(backup.data, { merge: false });

        return {
            success: true,
            timestamp: backup.timestamp,
            workoutsRestored: backup.data.workouts?.length || 0
        };
    } catch (error) {
        console.error('Error restoring from backup:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get recovery suggestions based on diagnosis
 * @param {Object} diagnosis - Diagnosis results
 * @returns {Array} - Recovery suggestions
 */
export function getRecoverySuggestions(diagnosis) {
    const suggestions = [];

    // Critical errors
    const criticalErrors = diagnosis.errors.filter(e => e.severity === 'critical');
    if (criticalErrors.length > 0) {
        suggestions.push({
            priority: 'critical',
            action: 'restore_from_backup',
            message: 'Critical errors detected. Consider restoring from backup.',
            automated: false
        });
    }

    // Sync errors
    const syncErrors = diagnosis.errors.filter(e => e.type === ErrorType.SYNC_ERROR);
    if (syncErrors.length > 0) {
        suggestions.push({
            priority: 'high',
            action: 'retry_sync',
            message: 'Retry failed sync operations.',
            automated: true
        });
    }

    // Orphaned data
    const orphanWarnings = diagnosis.warnings.filter(e => e.type === ErrorType.DATA_CORRUPTION);
    if (orphanWarnings.length > 0) {
        suggestions.push({
            priority: 'medium',
            action: 'clean_orphaned_data',
            message: 'Clean up orphaned database records.',
            automated: true
        });
    }

    // Quota warnings
    const quotaWarnings = diagnosis.warnings.filter(e => e.type === ErrorType.QUOTA_EXCEEDED);
    if (quotaWarnings.length > 0) {
        suggestions.push({
            priority: 'medium',
            action: 'export_and_clean',
            message: 'Export data and clean old records to free up space.',
            automated: false
        });
    }

    return suggestions;
}
