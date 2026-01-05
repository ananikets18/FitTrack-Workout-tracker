import { indexedDB } from '../lib/indexedDB';
import { storage } from './storage';

/**
 * Migrate data from localStorage to IndexedDB
 * 
 * This migration runs once on app startup and:
 * 1. Checks if migration has already been completed
 * 2. Reads data from localStorage
 * 3. Transforms and validates the data
 * 4. Stores it in IndexedDB
 * 5. Creates a backup of localStorage data
 * 6. Marks migration as complete
 */
export async function migrateToIndexedDB() {
    try {
        console.log('🔄 Checking IndexedDB migration status...');

        // Check if already migrated
        const migrationStatus = await indexedDB.metadata.get('migrated-from-localStorage');

        if (migrationStatus?.completed) {
            console.log('✅ Already migrated to IndexedDB');
            return {
                success: true,
                alreadyMigrated: true,
                timestamp: migrationStatus.timestamp
            };
        }

        console.log('📦 Starting migration from localStorage to IndexedDB...');

        // Get data from localStorage
        const localStorageData = storage.get();

        if (!localStorageData.workouts || localStorageData.workouts.length === 0) {
            console.log('ℹ️ No workouts found in localStorage, skipping migration');

            // Mark as migrated even if no data
            await indexedDB.metadata.put({
                key: 'migrated-from-localStorage',
                completed: true,
                timestamp: new Date().toISOString(),
                workoutsMigrated: 0
            });

            return {
                success: true,
                workoutsMigrated: 0,
                message: 'No data to migrate'
            };
        }

        console.log(`📊 Found ${localStorageData.workouts.length} workouts to migrate`);

        // Migrate workouts with transaction for data integrity
        let migratedCount = 0;
        const errors = [];

        for (const workout of localStorageData.workouts) {
            try {
                // Transform and add workout with all relations
                await indexedDB.addWorkoutWithRelations({
                    ...workout,
                    syncStatus: 'local', // Mark as local since it's from localStorage
                    updatedAt: workout.updatedAt || workout.createdAt || new Date().toISOString()
                });

                migratedCount++;
            } catch (error) {
                console.error(`❌ Error migrating workout ${workout.id}:`, error);
                errors.push({
                    workoutId: workout.id,
                    workoutName: workout.name,
                    error: error.message
                });
            }
        }

        // Migrate templates if they exist
        let templatesMigrated = 0;
        const templatesKey = 'workout_templates';
        const templatesData = localStorage.getItem(templatesKey);

        if (templatesData) {
            try {
                const templates = JSON.parse(templatesData);

                if (Array.isArray(templates) && templates.length > 0) {
                    await indexedDB.templates.bulkAdd(
                        templates.map(template => ({
                            ...template,
                            id: template.id || crypto.randomUUID(),
                            createdAt: template.createdAt || new Date().toISOString(),
                            updatedAt: template.updatedAt || new Date().toISOString()
                        }))
                    );

                    templatesMigrated = templates.length;
                    console.log(`✅ Migrated ${templatesMigrated} templates`);
                }
            } catch (error) {
                console.error('❌ Error migrating templates:', error);
            }
        }

        // Create backup of localStorage data
        try {
            const backupKey = 'workout-tracker-backup';
            const backupData = {
                workouts: localStorageData.workouts,
                templates: templatesData ? JSON.parse(templatesData) : [],
                backupDate: new Date().toISOString(),
                version: localStorageData.version
            };

            localStorage.setItem(backupKey, JSON.stringify(backupData));
            console.log('💾 Created backup of localStorage data');
        } catch (error) {
            console.warn('⚠️ Could not create backup:', error);
        }

        // Mark migration as complete
        await indexedDB.metadata.put({
            key: 'migrated-from-localStorage',
            completed: true,
            timestamp: new Date().toISOString(),
            workoutsMigrated: migratedCount,
            templatesMigrated: templatesMigrated,
            errors: errors.length > 0 ? errors : undefined
        });

        // Get final stats
        const stats = await indexedDB.getStats();

        console.log('✅ Migration completed successfully!');
        console.log(`📊 Migrated: ${migratedCount} workouts, ${templatesMigrated} templates`);

        if (errors.length > 0) {
            console.warn(`⚠️ ${errors.length} workouts failed to migrate`);
        }

        return {
            success: true,
            workoutsMigrated: migratedCount,
            templatesMigrated: templatesMigrated,
            errors: errors.length > 0 ? errors : undefined,
            stats: stats
        };

    } catch (error) {
        console.error('❌ Migration failed:', error);

        // Try to mark migration as failed
        try {
            await indexedDB.metadata.put({
                key: 'migrated-from-localStorage',
                completed: false,
                failed: true,
                timestamp: new Date().toISOString(),
                error: error.message
            });
        } catch (metaError) {
            console.error('Could not save migration failure status:', metaError);
        }

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Reset migration status (for testing or re-migration)
 * WARNING: This will clear all IndexedDB data!
 */
export async function resetMigration() {
    try {
        console.log('⚠️ Resetting migration status and clearing IndexedDB...');

        // Clear all data
        await indexedDB.clearAllData();

        // Remove migration metadata
        await indexedDB.metadata.delete('migrated-from-localStorage');

        console.log('✅ Migration reset complete');

        return { success: true };
    } catch (error) {
        console.error('❌ Error resetting migration:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get migration status
 */
export async function getMigrationStatus() {
    try {
        const status = await indexedDB.metadata.get('migrated-from-localStorage');

        if (!status) {
            return {
                migrated: false,
                message: 'Migration not started'
            };
        }

        if (status.failed) {
            return {
                migrated: false,
                failed: true,
                error: status.error,
                timestamp: status.timestamp
            };
        }

        if (status.completed) {
            return {
                migrated: true,
                timestamp: status.timestamp,
                workoutsMigrated: status.workoutsMigrated,
                templatesMigrated: status.templatesMigrated,
                errors: status.errors
            };
        }

        return {
            migrated: false,
            message: 'Unknown migration status'
        };
    } catch (error) {
        console.error('Error getting migration status:', error);
        return {
            migrated: false,
            error: error.message
        };
    }
}

/**
 * Restore from localStorage backup (rollback)
 */
export async function restoreFromBackup() {
    try {
        console.log('🔄 Restoring from localStorage backup...');

        const backupKey = 'workout-tracker-backup';
        const backupData = localStorage.getItem(backupKey);

        if (!backupData) {
            throw new Error('No backup found in localStorage');
        }

        const backup = JSON.parse(backupData);

        // Clear current IndexedDB data
        await indexedDB.clearAllData();

        // Restore workouts
        if (backup.workouts && backup.workouts.length > 0) {
            for (const workout of backup.workouts) {
                await indexedDB.addWorkoutWithRelations(workout);
            }
        }

        // Restore templates
        if (backup.templates && backup.templates.length > 0) {
            await indexedDB.templates.bulkAdd(backup.templates);
        }

        console.log('✅ Restored from backup successfully');

        return {
            success: true,
            workoutsRestored: backup.workouts?.length || 0,
            templatesRestored: backup.templates?.length || 0
        };
    } catch (error) {
        console.error('❌ Error restoring from backup:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Export IndexedDB data to JSON (for backup/export)
 */
export async function exportIndexedDBData() {
    try {
        const workouts = await indexedDB.getWorkoutsWithRelations();
        const templates = await indexedDB.templates.toArray();
        const stats = await indexedDB.getStats();

        const exportData = {
            version: '2.0.0', // IndexedDB version
            exportDate: new Date().toISOString(),
            stats: stats,
            workouts: workouts,
            templates: templates
        };

        return exportData;
    } catch (error) {
        console.error('Error exporting IndexedDB data:', error);
        throw error;
    }
}

/**
 * Import data into IndexedDB (for import/restore)
 */
export async function importIndexedDBData(data, options = { merge: false }) {
    try {
        if (!options.merge) {
            // Clear existing data if not merging
            await indexedDB.clearAllData();
        }

        // Import workouts
        if (data.workouts && data.workouts.length > 0) {
            for (const workout of data.workouts) {
                if (options.merge) {
                    // Check if workout already exists
                    const existing = await indexedDB.workouts.get(workout.id);
                    if (existing) {
                        continue; // Skip if merging and already exists
                    }
                }

                await indexedDB.addWorkoutWithRelations(workout);
            }
        }

        // Import templates
        if (data.templates && data.templates.length > 0) {
            if (options.merge) {
                // Add only new templates
                for (const template of data.templates) {
                    const existing = await indexedDB.templates.get(template.id);
                    if (!existing) {
                        await indexedDB.templates.add(template);
                    }
                }
            } else {
                await indexedDB.templates.bulkAdd(data.templates);
            }
        }

        const stats = await indexedDB.getStats();

        return {
            success: true,
            stats: stats
        };
    } catch (error) {
        console.error('Error importing data:', error);
        throw error;
    }
}
