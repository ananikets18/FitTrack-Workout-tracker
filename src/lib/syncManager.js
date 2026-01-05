import { indexedDB } from './indexedDB';
import { db as supabase, transformWorkoutFromDB } from './supabase';
import { offlineQueue } from './offlineQueue';
import { networkDetector } from '../utils/networkDetector';
import { detectConflict as detectConflictAdvanced, resolveConflict as resolveConflictAdvanced, ConflictStrategy, createConflictRecord } from './conflictResolution';


/**
 * Sync Manager
 * 
 * Manages bi-directional synchronization between IndexedDB and Supabase.
 * Handles conflict resolution, sync status tracking, and automatic sync.
 */

class SyncManager {
    constructor() {
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.autoSyncEnabled = true;
        this.autoSyncIntervalMs = 5 * 60 * 1000; // 5 minutes
        this.conflictStrategy = ConflictStrategy.LAST_WRITE_WINS; // Default strategy
        this.conflictHistory = []; // Track resolved conflicts
        this.syncQueue = []; // Queue for pending sync requests
        this.syncDebounceTimer = null; // Debounce timer
        this.lastSyncAttempt = null; // Last sync attempt timestamp
        this.minSyncInterval = 10000; // Minimum 10 seconds between syncs

        // Subscribe to network changes for automatic sync
        this.unsubscribe = networkDetector.subscribe((isOnline) => {
            if (isOnline && this.autoSyncEnabled) {
                console.log('🔄 Network restored, triggering debounced sync...');
                this.debouncedSync();
            }
        });
    }

    /**
     * Debounced sync - waits 2 seconds before syncing
     * Prevents rapid concurrent sync calls
     */
    debouncedSync(userId = null) {
        // Clear existing debounce timer
        if (this.syncDebounceTimer) {
            clearTimeout(this.syncDebounceTimer);
        }

        // Set new debounce timer
        this.syncDebounceTimer = setTimeout(() => {
            this.syncAll(userId);
        }, 2000); // 2 second debounce
    }

    /**
     * Enable automatic sync
     * @param {number} intervalMs - Sync interval in milliseconds
     */
    enableAutoSync(intervalMs = this.autoSyncIntervalMs) {
        this.autoSyncEnabled = true;
        this.autoSyncIntervalMs = intervalMs;

        // Clear existing interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Set up periodic sync
        this.syncInterval = setInterval(() => {
            if (networkDetector.getStatus()) {
                this.syncAll();
            }
        }, intervalMs);

        console.log(`✅ Auto-sync enabled (every ${intervalMs / 1000}s)`);
    }

    /**
     * Disable automatic sync
     */
    disableAutoSync() {
        this.autoSyncEnabled = false;

        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }

        console.log('❌ Auto-sync disabled');
    }

    /**
     * Sync all data (bi-directional)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Sync results
     */
    async syncAll(userId) {
        if (this.isSyncing) {
            console.log('⏳ Sync already in progress');
            return { alreadySyncing: true };
        }

        // Enforce minimum sync interval
        if (this.lastSyncAttempt) {
            const timeSinceLastSync = Date.now() - this.lastSyncAttempt;
            if (timeSinceLastSync < this.minSyncInterval) {
                console.log(`⏱️ Sync rate limited (${timeSinceLastSync}ms since last sync)`);
                return { rateLimited: true };
            }
        }

        if (!networkDetector.getStatus()) {
            console.log('📴 Offline - sync skipped');
            return { offline: true };
        }

        if (!userId) {
            console.log('ℹ️ No user ID - sync skipped');
            return { noUser: true };
        }

        this.isSyncing = true;
        this.lastSyncAttempt = Date.now();
        const results = {
            pushed: 0,
            pulled: 0,
            conflicts: 0,
            errors: []
        };

        try {
            console.log('🔄 Starting sync...');

            // 1. Process offline queue first
            await offlineQueue.processQueue();

            // 2. Push local changes to Supabase
            const pushResults = await this.pushChanges(userId);
            results.pushed = pushResults.pushed;
            results.errors.push(...pushResults.errors);

            // 3. Pull remote changes from Supabase
            const pullResults = await this.pullChanges(userId);
            results.pulled = pullResults.pulled;
            results.conflicts = pullResults.conflicts;
            results.errors.push(...pullResults.errors);

            // 4. Update last sync time
            this.lastSyncTime = new Date().toISOString();
            await indexedDB.metadata.put({
                key: 'lastSync',
                value: this.lastSyncTime,
                timestamp: Date.now()
            });

            console.log('✅ Sync complete:', results);

        } catch (error) {
            console.error('❌ Sync failed:', error);
            results.errors.push({ message: error.message });
        } finally {
            this.isSyncing = false;
        }

        return results;
    }

    /**
     * Push local changes to Supabase
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Push results
     */
    async pushChanges(userId) {
        const results = {
            pushed: 0,
            errors: []
        };

        try {
            // Get all pending workouts
            const pendingWorkouts = await indexedDB.workouts
                .where('syncStatus')
                .equals('pending')
                .and(w => w.userId === userId || !w.userId)
                .toArray();

            console.log(`📤 Pushing ${pendingWorkouts.length} local changes...`);

            for (const workout of pendingWorkouts) {
                try {
                    // Get full workout with relations
                    const fullWorkout = await this.getWorkoutWithRelations(workout.id);

                    if (workout.id.startsWith('local-')) {
                        // New workout - create in Supabase
                        const created = await supabase.createWorkout(fullWorkout, userId);

                        // Update local record with server ID
                        await this.updateLocalWorkoutId(workout.id, created.id);

                        results.pushed++;
                    } else {
                        // Existing workout - update in Supabase
                        await supabase.updateWorkout(workout.id, fullWorkout, userId);

                        // Mark as synced
                        await indexedDB.workouts.update(workout.id, {
                            syncStatus: 'synced'
                        });

                        results.pushed++;
                    }
                } catch (error) {
                    console.error(`Error pushing workout ${workout.id}:`, error);

                    // Mark as error
                    await indexedDB.workouts.update(workout.id, {
                        syncStatus: 'error',
                        syncError: error.message
                    });

                    results.errors.push({
                        workoutId: workout.id,
                        error: error.message
                    });
                }
            }

        } catch (error) {
            console.error('Error in pushChanges:', error);
            results.errors.push({ message: error.message });
        }

        return results;
    }

    /**
     * Pull remote changes from Supabase
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Pull results
     */
    async pullChanges(userId) {
        const results = {
            pulled: 0,
            conflicts: 0,
            errors: []
        };

        try {
            // Get last sync time
            const lastSyncMeta = await indexedDB.metadata.get('lastSync');
            const lastSync = lastSyncMeta?.value || new Date(0).toISOString();

            console.log(`📥 Pulling changes since ${lastSync}...`);

            // Fetch all workouts from Supabase (we'll filter by date)
            const remoteWorkouts = await supabase.getWorkouts(userId);
            const transformed = remoteWorkouts.map(transformWorkoutFromDB);

            for (const remoteWorkout of transformed) {
                try {
                    // Check if workout exists locally
                    const localWorkout = await indexedDB.workouts.get(remoteWorkout.id);

                    if (!localWorkout) {
                        // Check for duplicate by date/name/exercises (in case of ID mismatch)
                        const duplicateCheck = await this.findDuplicateWorkout(remoteWorkout);
                        
                        if (duplicateCheck) {
                            console.log(`⚠️ Duplicate workout detected, skipping: ${remoteWorkout.name}`);
                            continue;
                        }

                        // New remote workout - add to local
                        await indexedDB.addWorkoutWithRelations({
                            ...remoteWorkout,
                            syncStatus: 'synced'
                        });

                        results.pulled++;
                    } else {
                        // Workout exists - check for conflicts
                        const conflict = await this.detectConflict(localWorkout, remoteWorkout);

                        if (conflict) {
                            results.conflicts++;
                            await this.resolveConflict(localWorkout, remoteWorkout);
                        } else if (localWorkout.syncStatus === 'synced') {
                            // Remote is newer and no local changes - update local
                            if (new Date(remoteWorkout.updatedAt) > new Date(localWorkout.updatedAt)) {
                                await indexedDB.updateWorkoutWithRelations(remoteWorkout.id, {
                                    ...remoteWorkout,
                                    syncStatus: 'synced'
                                });

                                results.pulled++;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error pulling workout ${remoteWorkout.id}:`, error);
                    results.errors.push({
                        workoutId: remoteWorkout.id,
                        error: error.message
                    });
                }
            }

        } catch (error) {
            console.error('Error in pullChanges:', error);
            results.errors.push({ message: error.message });
        }

        return results;
    }

    /**
     * Detect if there's a conflict between local and remote
     * @param {Object} local - Local workout
     * @param {Object} remote - Remote workout
     * @returns {boolean} - True if conflict exists
     */
    async detectConflict(local, remote) {
        // Conflict exists if:
        // 1. Local has pending changes (syncStatus !== 'synced')
        // 2. Remote has been updated since last sync

        if (local.syncStatus !== 'pending') {
            return false; // No local changes
        }

        const lastSyncMeta = await indexedDB.metadata.get('lastSync');
        const lastSync = lastSyncMeta?.value || new Date(0).toISOString();

        const remoteUpdated = new Date(remote.updatedAt);
        const lastSyncDate = new Date(lastSync);

        return remoteUpdated > lastSyncDate;
    }

    /**
     * Resolve conflict between local and remote
     * Strategy: Last-write-wins based on updatedAt timestamp
     * @param {Object} local - Local workout
     * @param {Object} remote - Remote workout
     */
    async resolveConflict(local, remote) {
        console.warn('⚠️ Conflict detected for workout:', local.id);

        const localUpdated = new Date(local.updatedAt);
        const remoteUpdated = new Date(remote.updatedAt);

        if (remoteUpdated > localUpdated) {
            // Remote is newer - keep remote
            console.log('📥 Resolving conflict: Keeping remote version');

            await indexedDB.updateWorkoutWithRelations(remote.id, {
                ...remote,
                syncStatus: 'synced'
            });
        } else {
            // Local is newer - push to remote
            console.log('📤 Resolving conflict: Keeping local version');

            const fullWorkout = await this.getWorkoutWithRelations(local.id);
            await supabase.updateWorkout(local.id, fullWorkout, local.userId);

            await indexedDB.workouts.update(local.id, {
                syncStatus: 'synced'
            });
        }
    }

    /**
     * Get workout with all relations
     * @param {string} workoutId - Workout ID
     * @returns {Promise<Object>} - Full workout object
     */
    async getWorkoutWithRelations(workoutId) {
        const workout = await indexedDB.workouts.get(workoutId);

        if (!workout) {
            throw new Error('Workout not found');
        }

        if (workout.type === 'rest_day') {
            const activities = await indexedDB.restDayActivities
                .where('workoutId').equals(workoutId)
                .toArray();

            return {
                ...workout,
                activities: activities.map(a => a.activity),
                recoveryQuality: activities[0]?.recoveryQuality || 3
            };
        } else {
            const exercises = await indexedDB.exercises
                .where('workoutId').equals(workoutId)
                .sortBy('order');

            const exercisesWithSets = await Promise.all(
                exercises.map(async (exercise) => {
                    const sets = await indexedDB.sets
                        .where('exerciseId').equals(exercise.id)
                        .sortBy('order');

                    return {
                        id: exercise.id,
                        name: exercise.name,
                        category: exercise.category,
                        notes: exercise.notes,
                        sets: sets.map(({ id, exerciseId, createdAt, order, ...set }) => set)
                    };
                })
            );

            return {
                ...workout,
                exercises: exercisesWithSets
            };
        }
    }

    /**
     * Update local workout ID after server creation
     * @param {string} oldId - Old local ID
     * @param {string} newId - New server ID
     */
    async updateLocalWorkoutId(oldId, newId) {
        try {
            // Get workout with relations
            const workout = await this.getWorkoutWithRelations(oldId);

            // Delete old workout
            await indexedDB.deleteWorkoutWithRelations(oldId);

            // Add with new ID
            await indexedDB.addWorkoutWithRelations({
                ...workout,
                id: newId,
                syncStatus: 'synced'
            });

            console.log(`✅ Updated local ID: ${oldId} → ${newId}`);
        } catch (error) {
            console.error('Error updating local workout ID:', error);
            throw error;
        }
    }

    /**
     * Get sync status
     * @returns {Promise<Object>} - Sync status
     */
    async getSyncStatus() {
        try {
            const lastSyncMeta = await indexedDB.metadata.get('lastSync');

            const pendingCount = await indexedDB.workouts
                .where('syncStatus')
                .equals('pending')
                .count();

            const errorCount = await indexedDB.workouts
                .where('syncStatus')
                .equals('error')
                .count();

            const queueStats = await offlineQueue.getStats();

            return {
                lastSync: lastSyncMeta?.value || null,
                isSyncing: this.isSyncing,
                pendingWorkouts: pendingCount,
                errorWorkouts: errorCount,
                queuedOperations: queueStats.pending,
                failedOperations: queueStats.failed,
                autoSyncEnabled: this.autoSyncEnabled,
                isOnline: networkDetector.getStatus()
            };
        } catch (error) {
            console.error('Error getting sync status:', error);
            return null;
        }
    }

    /**
     * Force sync now (manual trigger)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Sync results
     */
    async forceSyncNow(userId) {
        console.log('🔄 Force sync triggered');
        return await this.syncAll(userId);
    }

    /**
     * Find duplicate workout by date, name, and exercises
     * @param {Object} workout - Workout to check
     * @returns {Promise<Object|null>} - Duplicate workout or null
     */
    async findDuplicateWorkout(workout) {
        try {
            // Find workouts with same date (within 1 minute)
            const workoutDate = new Date(workout.date).getTime();
            const allWorkouts = await indexedDB.workouts
                .filter(w => {
                    const wDate = new Date(w.date).getTime();
                    return Math.abs(wDate - workoutDate) < 60000; // Within 1 minute
                })
                .toArray();

            // Check each potential duplicate
            for (const existing of allWorkouts) {
                // Same name?
                if (existing.name?.trim().toLowerCase() !== workout.name?.trim().toLowerCase()) {
                    continue;
                }

                // Same number of exercises?
                const existingExercises = await indexedDB.exercises
                    .where('workoutId').equals(existing.id)
                    .toArray();

                if (existingExercises.length !== (workout.exercises?.length || 0)) {
                    continue;
                }

                // If we got here, it's likely a duplicate
                console.log(`Found potential duplicate: ${existing.id}`);
                return existing;
            }

            return null;
        } catch (error) {
            console.error('Error checking for duplicates:', error);
            return null;
        }
    }

    /**
     * Cleanup - unsubscribe and clear intervals
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }

        if (this.syncDebounceTimer) {
            clearTimeout(this.syncDebounceTimer);
            this.syncDebounceTimer = null;
        }
    }
}

// Create singleton instance
export const syncManager = new SyncManager();

// Export class for testing
export { SyncManager };
