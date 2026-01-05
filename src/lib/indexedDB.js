import Dexie from 'dexie';

/**
 * FitTrack IndexedDB Database
 * 
 * This database provides offline-first storage with sync capabilities.
 * All data is stored locally and synced to Supabase when online.
 */
class FitTrackDatabase extends Dexie {
    constructor() {
        super('FitTrackDB');

        // Define database schema
        // Version 1: Initial schema
        this.version(1).stores({
            // Workouts table
            // Indexes: id, userId, date, type, syncStatus, updatedAt
            workouts: '&id, userId, date, type, syncStatus, updatedAt, createdAt',

            // Exercises table (related to workouts)
            // Indexes: id, workoutId, order
            exercises: '&id, workoutId, order',

            // Sets table (related to exercises)
            // Indexes: id, exerciseId, order
            sets: '&id, exerciseId, order',

            // Rest day activities table
            // Indexes: id, workoutId
            restDayActivities: '&id, workoutId',

            // Templates table
            // Indexes: id, userId, name
            templates: '&id, userId, name, createdAt',

            // Sync queue for offline operations
            // Indexes: id, timestamp, status, operation
            syncQueue: '++id, timestamp, status, operation, retryCount',

            // Metadata for app state (last sync time, migration status, etc.)
            // Key-value store
            metadata: '&key'
        });

        // Add hooks for automatic timestamp management
        this.workouts.hook('creating', (primKey, obj) => {
            obj.createdAt = obj.createdAt || new Date().toISOString();
            obj.updatedAt = new Date().toISOString();
            obj.syncStatus = obj.syncStatus || 'pending';

            // Generate ID if not provided
            if (!obj.id) {
                obj.id = crypto.randomUUID();
            }
        });

        this.workouts.hook('updating', (mods, primKey, obj) => {
            mods.updatedAt = new Date().toISOString();

            // Mark as pending sync if it was previously synced
            if (obj && obj.syncStatus === 'synced') {
                mods.syncStatus = 'pending';
            }
        });

        // Hooks for exercises
        this.exercises.hook('creating', (primKey, obj) => {
            obj.createdAt = obj.createdAt || new Date().toISOString();

            if (!obj.id) {
                obj.id = crypto.randomUUID();
            }
        });

        // Hooks for sets
        this.sets.hook('creating', (primKey, obj) => {
            obj.createdAt = obj.createdAt || new Date().toISOString();

            if (!obj.id) {
                obj.id = crypto.randomUUID();
            }
        });

        // Hooks for rest day activities
        this.restDayActivities.hook('creating', (primKey, obj) => {
            obj.createdAt = obj.createdAt || new Date().toISOString();

            if (!obj.id) {
                obj.id = crypto.randomUUID();
            }
        });

        // Hooks for templates
        this.templates.hook('creating', (primKey, obj) => {
            obj.createdAt = obj.createdAt || new Date().toISOString();
            obj.updatedAt = new Date().toISOString();

            if (!obj.id) {
                obj.id = crypto.randomUUID();
            }
        });

        this.templates.hook('updating', (mods, primKey, obj) => {
            mods.updatedAt = new Date().toISOString();
        });
    }

    /**
     * Get all workouts with their related data (exercises, sets, activities)
     */
    async getWorkoutsWithRelations(userId = null) {
        try {
            let workoutsQuery = this.workouts.orderBy('date').reverse();

            if (userId) {
                workoutsQuery = workoutsQuery.filter(w => w.userId === userId || !w.userId);
            }

            const workouts = await workoutsQuery.toArray();

            // Fetch related data for each workout
            const workoutsWithRelations = await Promise.all(
                workouts.map(async (workout) => {
                    if (workout.type === 'rest_day') {
                        // Fetch rest day activities
                        const activities = await this.restDayActivities
                            .where('workoutId').equals(workout.id)
                            .toArray();

                        return {
                            ...workout,
                            activities: activities.map(a => a.activity),
                            recoveryQuality: activities[0]?.recoveryQuality || 3
                        };
                    } else {
                        // Fetch exercises and sets
                        const exercises = await this.exercises
                            .where('workoutId').equals(workout.id)
                            .sortBy('order');

                        const exercisesWithSets = await Promise.all(
                            exercises.map(async (exercise) => {
                                const sets = await this.sets
                                    .where('exerciseId').equals(exercise.id)
                                    .sortBy('order');

                                return {
                                    ...exercise,
                                    sets: sets.map(({ id, exerciseId, createdAt, order, ...set }) => set)
                                };
                            })
                        );

                        return {
                            ...workout,
                            exercises: exercisesWithSets.map(({ workoutId, createdAt, order, ...ex }) => ex)
                        };
                    }
                })
            );

            return workoutsWithRelations;
        } catch (error) {
            console.error('Error fetching workouts with relations:', error);
            throw error;
        }
    }

    /**
     * Add a workout with all its related data
     */
    async addWorkoutWithRelations(workout, userId = null) {
        try {
            return await this.transaction('rw',
                this.workouts,
                this.exercises,
                this.sets,
                this.restDayActivities,
                async () => {
                    // Add main workout
                    const workoutData = {
                        ...workout,
                        userId: userId || workout.userId,
                        syncStatus: userId ? 'pending' : 'local',
                        id: workout.id || crypto.randomUUID()
                    };

                    await this.workouts.add(workoutData);

                    // Add related data based on workout type
                    if (workout.type === 'rest_day' && workout.activities?.length > 0) {
                        // Add rest day activities
                        await this.restDayActivities.bulkAdd(
                            workout.activities.map((activity, index) => ({
                                id: crypto.randomUUID(),
                                workoutId: workoutData.id,
                                activity,
                                recoveryQuality: workout.recoveryQuality || 3,
                                order: index
                            }))
                        );
                    } else if (workout.exercises?.length > 0) {
                        // Add exercises
                        for (let i = 0; i < workout.exercises.length; i++) {
                            const exercise = workout.exercises[i];
                            const exerciseId = exercise.id || crypto.randomUUID();

                            await this.exercises.add({
                                id: exerciseId,
                                workoutId: workoutData.id,
                                name: exercise.name,
                                category: exercise.category,
                                notes: exercise.notes,
                                order: i
                            });

                            // Add sets for this exercise
                            if (exercise.sets?.length > 0) {
                                // Check for existing sets to prevent duplicates
                                const existingSets = await this.sets
                                    .where('exerciseId').equals(exerciseId)
                                    .toArray();

                                const newSets = exercise.sets.filter((set, setIndex) => {
                                    // Check if this exact set already exists
                                    return !existingSets.some(existing => 
                                        existing.reps === set.reps &&
                                        existing.weight === set.weight &&
                                        existing.order === setIndex
                                    );
                                });

                                if (newSets.length > 0) {
                                    await this.sets.bulkAdd(
                                        newSets.map((set, setIndex) => ({
                                            id: crypto.randomUUID(),
                                            exerciseId: exerciseId,
                                            reps: set.reps,
                                            weight: set.weight,
                                            completed: set.completed || false,
                                            order: setIndex
                                        }))
                                    );
                                }
                            }
                        }
                    }

                    return workoutData;
                }
            );
        } catch (error) {
            console.error('Error adding workout with relations:', error);
            throw error;
        }
    }

    /**
     * Update a workout with all its related data
     */
    async updateWorkoutWithRelations(workoutId, workout) {
        try {
            return await this.transaction('rw',
                this.workouts,
                this.exercises,
                this.sets,
                this.restDayActivities,
                async () => {
                    // Update main workout
                    await this.workouts.update(workoutId, {
                        name: workout.name,
                        date: workout.date,
                        duration: workout.duration,
                        notes: workout.notes,
                        type: workout.type,
                        updatedAt: new Date().toISOString()
                    });

                    // Get existing exercises to delete their sets first
                    const existingExercises = await this.exercises
                        .where('workoutId').equals(workoutId)
                        .toArray();

                    // Delete all sets for existing exercises (prevents orphaned sets)
                    for (const exercise of existingExercises) {
                        await this.sets.where('exerciseId').equals(exercise.id).delete();
                    }

                    // Delete existing related data
                    await this.exercises.where('workoutId').equals(workoutId).delete();
                    await this.restDayActivities.where('workoutId').equals(workoutId).delete();

                    // Add new related data
                    if (workout.type === 'rest_day' && workout.activities?.length > 0) {
                        await this.restDayActivities.bulkAdd(
                            workout.activities.map((activity, index) => ({
                                id: crypto.randomUUID(),
                                workoutId: workoutId,
                                activity,
                                recoveryQuality: workout.recoveryQuality || 3,
                                order: index
                            }))
                        );
                    } else if (workout.exercises?.length > 0) {
                        for (let i = 0; i < workout.exercises.length; i++) {
                            const exercise = workout.exercises[i];
                            const exerciseId = exercise.id || crypto.randomUUID();

                            await this.exercises.add({
                                id: exerciseId,
                                workoutId: workoutId,
                                name: exercise.name,
                                category: exercise.category,
                                notes: exercise.notes,
                                order: i
                            });

                            if (exercise.sets?.length > 0) {
                                await this.sets.bulkAdd(
                                    exercise.sets.map((set, setIndex) => ({
                                        id: crypto.randomUUID(),
                                        exerciseId: exerciseId,
                                        reps: set.reps,
                                        weight: set.weight,
                                        completed: set.completed || false,
                                        order: setIndex
                                    }))
                                );
                            }
                        }
                    }

                    return { id: workoutId };
                }
            );
        } catch (error) {
            console.error('Error updating workout with relations:', error);
            throw error;
        }
    }

    /**
     * Delete a workout and all its related data
     */
    async deleteWorkoutWithRelations(workoutId) {
        try {
            return await this.transaction('rw',
                this.workouts,
                this.exercises,
                this.sets,
                this.restDayActivities,
                async () => {
                    // Get all exercises for this workout
                    const exercises = await this.exercises
                        .where('workoutId').equals(workoutId)
                        .toArray();

                    // Delete all sets for these exercises
                    for (const exercise of exercises) {
                        await this.sets.where('exerciseId').equals(exercise.id).delete();
                    }

                    // Delete exercises
                    await this.exercises.where('workoutId').equals(workoutId).delete();

                    // Delete rest day activities
                    await this.restDayActivities.where('workoutId').equals(workoutId).delete();

                    // Delete workout
                    await this.workouts.delete(workoutId);

                    return { id: workoutId };
                }
            );
        } catch (error) {
            console.error('Error deleting workout with relations:', error);
            throw error;
        }
    }

    /**
     * Clear all data (useful for logout or reset)
     */
    async clearAllData() {
        try {
            await this.transaction('rw',
                this.workouts,
                this.exercises,
                this.sets,
                this.restDayActivities,
                this.templates,
                this.syncQueue,
                async () => {
                    await this.workouts.clear();
                    await this.exercises.clear();
                    await this.sets.clear();
                    await this.restDayActivities.clear();
                    await this.templates.clear();
                    await this.syncQueue.clear();
                }
            );

            console.log('✅ All data cleared from IndexedDB');
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }

    /**
     * Get database statistics
     */
    async getStats() {
        try {
            const [workoutsCount, exercisesCount, setsCount, templatesCount, queueCount] = await Promise.all([
                this.workouts.count(),
                this.exercises.count(),
                this.sets.count(),
                this.templates.count(),
                this.syncQueue.count()
            ]);

            return {
                workouts: workoutsCount,
                exercises: exercisesCount,
                sets: setsCount,
                templates: templatesCount,
                pendingSync: queueCount
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return null;
        }
    }
}

// Create and export singleton instance
export const indexedDB = new FitTrackDatabase();

// Export database class for testing
export { FitTrackDatabase };
