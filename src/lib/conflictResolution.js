/**
 * Conflict Resolution Strategies
 * 
 * Provides different strategies for resolving sync conflicts
 * between local and remote data.
 */

/**
 * Conflict resolution strategies
 */
export const ConflictStrategy = {
    LAST_WRITE_WINS: 'last_write_wins',
    LOCAL_WINS: 'local_wins',
    REMOTE_WINS: 'remote_wins',
    MERGE: 'merge',
    MANUAL: 'manual'
};

/**
 * Detect conflicts between local and remote workout
 * @param {Object} local - Local workout
 * @param {Object} remote - Remote workout
 * @param {string} lastSyncTime - Last sync timestamp
 * @returns {Object} - Conflict detection result
 */
export function detectConflict(local, remote, lastSyncTime) {
    // No conflict if local is synced and not modified
    if (local.syncStatus === 'synced' && !isModifiedSinceSync(local, lastSyncTime)) {
        return {
            hasConflict: false,
            reason: 'local_not_modified'
        };
    }

    // No conflict if remote hasn't changed since last sync
    if (!isModifiedSinceSync(remote, lastSyncTime)) {
        return {
            hasConflict: false,
            reason: 'remote_not_modified'
        };
    }

    // Conflict exists if both local and remote have changes
    if (local.syncStatus === 'pending' && isModifiedSinceSync(remote, lastSyncTime)) {
        return {
            hasConflict: true,
            reason: 'both_modified',
            localUpdated: local.updatedAt,
            remoteUpdated: remote.updatedAt,
            fields: detectFieldConflicts(local, remote)
        };
    }

    return {
        hasConflict: false,
        reason: 'no_conflict'
    };
}

/**
 * Check if workout was modified since last sync
 * @param {Object} workout - Workout object
 * @param {string} lastSyncTime - Last sync timestamp
 * @returns {boolean}
 */
function isModifiedSinceSync(workout, lastSyncTime) {
    if (!lastSyncTime) return true;

    const workoutTime = new Date(workout.updatedAt);
    const syncTime = new Date(lastSyncTime);

    return workoutTime > syncTime;
}

/**
 * Detect which fields have conflicts
 * @param {Object} local - Local workout
 * @param {Object} remote - Remote workout
 * @returns {Array} - List of conflicting fields
 */
function detectFieldConflicts(local, remote) {
    const conflicts = [];

    // Check basic fields
    const fieldsToCheck = ['name', 'date', 'duration', 'notes', 'type'];

    for (const field of fieldsToCheck) {
        if (JSON.stringify(local[field]) !== JSON.stringify(remote[field])) {
            conflicts.push({
                field,
                localValue: local[field],
                remoteValue: remote[field]
            });
        }
    }

    // Check exercises (if applicable)
    if (local.exercises && remote.exercises) {
        if (JSON.stringify(local.exercises) !== JSON.stringify(remote.exercises)) {
            conflicts.push({
                field: 'exercises',
                localValue: local.exercises,
                remoteValue: remote.exercises,
                details: detectExerciseConflicts(local.exercises, remote.exercises)
            });
        }
    }

    return conflicts;
}

/**
 * Detect conflicts in exercises
 * @param {Array} localExercises - Local exercises
 * @param {Array} remoteExercises - Remote exercises
 * @returns {Array} - Exercise conflicts
 */
function detectExerciseConflicts(localExercises, remoteExercises) {
    const conflicts = [];

    // Different number of exercises
    if (localExercises.length !== remoteExercises.length) {
        conflicts.push({
            type: 'count_mismatch',
            local: localExercises.length,
            remote: remoteExercises.length
        });
    }

    // Check each exercise
    const maxLength = Math.max(localExercises.length, remoteExercises.length);
    for (let i = 0; i < maxLength; i++) {
        const local = localExercises[i];
        const remote = remoteExercises[i];

        if (!local) {
            conflicts.push({ type: 'missing_local', index: i, exercise: remote });
        } else if (!remote) {
            conflicts.push({ type: 'missing_remote', index: i, exercise: local });
        } else if (JSON.stringify(local) !== JSON.stringify(remote)) {
            conflicts.push({ type: 'modified', index: i, local, remote });
        }
    }

    return conflicts;
}

/**
 * Resolve conflict using specified strategy
 * @param {Object} local - Local workout
 * @param {Object} remote - Remote workout
 * @param {string} strategy - Resolution strategy
 * @returns {Object} - Resolved workout
 */
export function resolveConflict(local, remote, strategy = ConflictStrategy.LAST_WRITE_WINS) {
    switch (strategy) {
        case ConflictStrategy.LAST_WRITE_WINS:
            return resolveLastWriteWins(local, remote);

        case ConflictStrategy.LOCAL_WINS:
            return { ...local, syncStatus: 'pending' };

        case ConflictStrategy.REMOTE_WINS:
            return { ...remote, syncStatus: 'synced' };

        case ConflictStrategy.MERGE:
            return resolveMerge(local, remote);

        case ConflictStrategy.MANUAL:
            // Return both for manual resolution
            return { local, remote, requiresManual: true };

        default:
            return resolveLastWriteWins(local, remote);
    }
}

/**
 * Resolve using last-write-wins strategy
 * @param {Object} local - Local workout
 * @param {Object} remote - Remote workout
 * @returns {Object} - Resolved workout
 */
function resolveLastWriteWins(local, remote) {
    const localTime = new Date(local.updatedAt);
    const remoteTime = new Date(remote.updatedAt);

    if (remoteTime > localTime) {
        return { ...remote, syncStatus: 'synced', resolution: 'remote_newer' };
    } else {
        return { ...local, syncStatus: 'pending', resolution: 'local_newer' };
    }
}

/**
 * Resolve using merge strategy
 * Attempts to merge non-conflicting changes
 * @param {Object} local - Local workout
 * @param {Object} remote - Remote workout
 * @returns {Object} - Merged workout
 */
function resolveMerge(local, remote) {
    const merged = { ...remote }; // Start with remote as base

    // Merge basic fields (prefer newer)
    const localTime = new Date(local.updatedAt);
    const remoteTime = new Date(remote.updatedAt);

    // If local is newer, use local values for changed fields
    if (localTime > remoteTime) {
        const fieldsToMerge = ['name', 'date', 'duration', 'notes'];

        for (const field of fieldsToMerge) {
            if (local[field] !== remote[field]) {
                merged[field] = local[field];
            }
        }
    }

    // Merge exercises (more complex)
    if (local.exercises && remote.exercises) {
        merged.exercises = mergeExercises(local.exercises, remote.exercises);
    }

    merged.syncStatus = 'pending'; // Needs to be synced
    merged.resolution = 'merged';
    merged.updatedAt = new Date().toISOString();

    return merged;
}

/**
 * Merge exercises arrays
 * @param {Array} localExercises - Local exercises
 * @param {Array} remoteExercises - Remote exercises
 * @returns {Array} - Merged exercises
 */
function mergeExercises(localExercises, remoteExercises) {
    // Simple merge: combine both and deduplicate by name
    const exerciseMap = new Map();

    // Add remote exercises first
    for (const exercise of remoteExercises) {
        exerciseMap.set(exercise.name, exercise);
    }

    // Add/update with local exercises
    for (const exercise of localExercises) {
        const existing = exerciseMap.get(exercise.name);

        if (!existing) {
            // New exercise in local
            exerciseMap.set(exercise.name, exercise);
        } else {
            // Exercise exists - merge sets
            const mergedSets = mergeSets(existing.sets, exercise.sets);
            exerciseMap.set(exercise.name, {
                ...exercise,
                sets: mergedSets
            });
        }
    }

    return Array.from(exerciseMap.values());
}

/**
 * Merge sets arrays
 * @param {Array} remoteSets - Remote sets
 * @param {Array} localSets - Local sets
 * @returns {Array} - Merged sets
 */
function mergeSets(remoteSets, localSets) {
    // Use the array with more sets
    if (localSets.length > remoteSets.length) {
        return localSets;
    } else if (remoteSets.length > localSets.length) {
        return remoteSets;
    }

    // Same length - merge set by set
    return localSets.map((localSet, index) => {
        const remoteSet = remoteSets[index];

        // Prefer completed sets
        if (localSet.completed && !remoteSet.completed) {
            return localSet;
        } else if (!localSet.completed && remoteSet.completed) {
            return remoteSet;
        }

        // Prefer higher weight/reps
        const localVolume = (localSet.weight || 0) * (localSet.reps || 0);
        const remoteVolume = (remoteSet.weight || 0) * (remoteSet.reps || 0);

        return localVolume >= remoteVolume ? localSet : remoteSet;
    });
}

/**
 * Get conflict summary for UI display
 * @param {Object} conflictInfo - Conflict information
 * @returns {Object} - Human-readable summary
 */
export function getConflictSummary(conflictInfo) {
    if (!conflictInfo.hasConflict) {
        return {
            hasConflict: false,
            message: 'No conflicts detected'
        };
    }

    const { fields, localUpdated, remoteUpdated } = conflictInfo;

    return {
        hasConflict: true,
        message: `Conflict detected: ${fields.length} field(s) modified`,
        localTime: new Date(localUpdated).toLocaleString(),
        remoteTime: new Date(remoteUpdated).toLocaleString(),
        fields: fields.map(f => f.field),
        details: fields
    };
}

/**
 * Create conflict resolution record for history
 * @param {Object} conflict - Conflict information
 * @param {Object} resolution - Resolution result
 * @returns {Object} - Conflict record
 */
export function createConflictRecord(conflict, resolution) {
    return {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        workoutId: conflict.local?.id || conflict.remote?.id,
        strategy: resolution.resolution || 'unknown',
        fields: conflict.fields?.map(f => f.field) || [],
        localUpdated: conflict.localUpdated,
        remoteUpdated: conflict.remoteUpdated,
        chosenVersion: resolution.resolution
    };
}
