import { indexedDB } from '../lib/indexedDB';

/**
 * IndexedDB Storage Wrapper
 * 
 * This provides a similar interface to the existing storage.js
 * but uses IndexedDB instead of localStorage for better performance
 * and larger storage capacity.
 */

const STORAGE_VERSION = '2.0.0'; // IndexedDB version

export const indexedDBStorage = {
    /**
     * Get all workouts
     * @param {string|null} userId - Optional user ID to filter workouts
     * @returns {Promise<{workouts: Array, version: string}>}
     */
    async get(userId = null) {
        try {
            const workouts = await indexedDB.getWorkoutsWithRelations(userId);

            return {
                workouts: workouts || [],
                version: STORAGE_VERSION
            };
        } catch (error) {
            console.error('Error reading from IndexedDB:', error);
            return {
                workouts: [],
                version: STORAGE_VERSION
            };
        }
    },

    /**
     * Set/save workouts (bulk operation)
     * Note: This is mainly for compatibility. Use addWorkout/updateWorkout for single operations.
     * @param {Object} data - Data object with workouts array
     * @returns {Promise<{success: boolean, count: number}>}
     */
    async set(data) {
        try {
            if (!data.workouts || !Array.isArray(data.workouts)) {
                throw new Error('Invalid data format: workouts must be an array');
            }

            // Clear existing workouts (if replacing all)
            // Note: This is a destructive operation
            await indexedDB.workouts.clear();
            await indexedDB.exercises.clear();
            await indexedDB.sets.clear();
            await indexedDB.restDayActivities.clear();

            // Add all workouts
            for (const workout of data.workouts) {
                await indexedDB.addWorkoutWithRelations(workout);
            }

            return {
                success: true,
                count: data.workouts.length
            };
        } catch (error) {
            console.error('Error writing to IndexedDB:', error);
            throw error;
        }
    },

    /**
     * Add a single workout
     * @param {Object} workout - Workout object
     * @param {string|null} userId - Optional user ID
     * @returns {Promise<Object>} - Created workout
     */
    async addWorkout(workout, userId = null) {
        try {
            const created = await indexedDB.addWorkoutWithRelations(workout, userId);
            return created;
        } catch (error) {
            console.error('Error adding workout to IndexedDB:', error);
            throw error;
        }
    },

    /**
     * Update a single workout
     * @param {string} workoutId - Workout ID
     * @param {Object} workout - Updated workout data
     * @returns {Promise<Object>} - Update result
     */
    async updateWorkout(workoutId, workout) {
        try {
            const result = await indexedDB.updateWorkoutWithRelations(workoutId, workout);
            return result;
        } catch (error) {
            console.error('Error updating workout in IndexedDB:', error);
            throw error;
        }
    },

    /**
     * Delete a single workout
     * @param {string} workoutId - Workout ID
     * @returns {Promise<Object>} - Delete result
     */
    async deleteWorkout(workoutId) {
        try {
            const result = await indexedDB.deleteWorkoutWithRelations(workoutId);
            return result;
        } catch (error) {
            console.error('Error deleting workout from IndexedDB:', error);
            throw error;
        }
    },

    /**
     * Get a single workout by ID
     * @param {string} workoutId - Workout ID
     * @returns {Promise<Object|null>} - Workout object or null
     */
    async getWorkout(workoutId) {
        try {
            const workout = await indexedDB.workouts.get(workoutId);

            if (!workout) {
                return null;
            }

            // Fetch related data
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
        } catch (error) {
            console.error('Error getting workout from IndexedDB:', error);
            return null;
        }
    },

    /**
     * Clear all data
     * @returns {Promise<void>}
     */
    async clear() {
        try {
            await indexedDB.clearAllData();
            console.log('✅ IndexedDB cleared');
        } catch (error) {
            console.error('Error clearing IndexedDB:', error);
            throw error;
        }
    },

    /**
     * Get storage statistics
     * @returns {Promise<Object>} - Storage stats
     */
    async getStats() {
        try {
            const stats = await indexedDB.getStats();

            // Estimate storage size
            const workouts = await indexedDB.workouts.toArray();
            const estimatedSize = new Blob([JSON.stringify(workouts)]).size;
            const sizeInMB = estimatedSize / (1024 * 1024);

            return {
                ...stats,
                estimatedSizeMB: sizeInMB.toFixed(2),
                version: STORAGE_VERSION
            };
        } catch (error) {
            console.error('Error getting IndexedDB stats:', error);
            return null;
        }
    },

    /**
     * Check if IndexedDB is available and working
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        try {
            // Try to perform a simple operation
            await indexedDB.metadata.put({
                key: 'health-check',
                timestamp: new Date().toISOString()
            });

            await indexedDB.metadata.delete('health-check');

            return true;
        } catch (error) {
            console.error('IndexedDB not available:', error);
            return false;
        }
    },

    /**
     * Get templates
     * @param {string|null} userId - Optional user ID to filter templates
     * @returns {Promise<Array>}
     */
    async getTemplates(userId = null) {
        try {
            let query = indexedDB.templates.orderBy('createdAt').reverse();

            if (userId) {
                query = query.filter(t => t.userId === userId || !t.userId);
            }

            return await query.toArray();
        } catch (error) {
            console.error('Error getting templates from IndexedDB:', error);
            return [];
        }
    },

    /**
     * Add a template
     * @param {Object} template - Template object
     * @param {string|null} userId - Optional user ID
     * @returns {Promise<Object>}
     */
    async addTemplate(template, userId = null) {
        try {
            const templateData = {
                ...template,
                userId: userId || template.userId,
                id: template.id || crypto.randomUUID()
            };

            await indexedDB.templates.add(templateData);
            return templateData;
        } catch (error) {
            console.error('Error adding template to IndexedDB:', error);
            throw error;
        }
    },

    /**
     * Delete a template
     * @param {string} templateId - Template ID
     * @returns {Promise<Object>}
     */
    async deleteTemplate(templateId) {
        try {
            await indexedDB.templates.delete(templateId);
            return { id: templateId };
        } catch (error) {
            console.error('Error deleting template from IndexedDB:', error);
            throw error;
        }
    },

    /**
     * Get current workout (from metadata)
     * @returns {Promise<Object|null>}
     */
    async getCurrentWorkout() {
        try {
            const current = await indexedDB.metadata.get('currentWorkout');
            return current?.data || null;
        } catch (error) {
            console.error('Error getting current workout:', error);
            return null;
        }
    },

    /**
     * Set current workout (in metadata)
     * @param {Object|null} workout - Workout object or null to clear
     * @returns {Promise<void>}
     */
    async setCurrentWorkout(workout) {
        try {
            if (workout) {
                await indexedDB.metadata.put({
                    key: 'currentWorkout',
                    data: workout,
                    timestamp: new Date().toISOString()
                });
            } else {
                await indexedDB.metadata.delete('currentWorkout');
            }
        } catch (error) {
            console.error('Error setting current workout:', error);
            throw error;
        }
    }
};

// Export for use in the app
export default indexedDBStorage;
