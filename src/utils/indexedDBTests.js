/**
 * IndexedDB Test Suite
 * 
 * Run these tests in the browser console to verify IndexedDB implementation
 */

import { indexedDB } from '../lib/indexedDB';
import { indexedDBStorage } from '../utils/indexedDBStorage';
import { getMigrationStatus, exportIndexedDBData } from '../utils/migrateToIndexedDB';

/**
 * Test 1: Check Migration Status
 */
export async function testMigrationStatus() {
    console.log('🧪 Test 1: Migration Status');

    try {
        const status = await getMigrationStatus();
        console.log('✅ Migration Status:', status);
        return status;
    } catch (error) {
        console.error('❌ Test Failed:', error);
        return null;
    }
}

/**
 * Test 2: Check Database Stats
 */
export async function testDatabaseStats() {
    console.log('🧪 Test 2: Database Stats');

    try {
        const stats = await indexedDBStorage.getStats();
        console.log('✅ Database Stats:', stats);
        return stats;
    } catch (error) {
        console.error('❌ Test Failed:', error);
        return null;
    }
}

/**
 * Test 3: Add Test Workout
 */
export async function testAddWorkout() {
    console.log('🧪 Test 3: Add Workout');

    try {
        const testWorkout = {
            name: 'Test Workout',
            date: new Date().toISOString(),
            duration: 45,
            notes: 'This is a test workout',
            exercises: [
                {
                    name: 'Bench Press',
                    category: 'Chest',
                    notes: 'Focus on form',
                    sets: [
                        { reps: 10, weight: 135, completed: true },
                        { reps: 8, weight: 155, completed: true },
                        { reps: 6, weight: 175, completed: false }
                    ]
                },
                {
                    name: 'Incline Dumbbell Press',
                    category: 'Chest',
                    sets: [
                        { reps: 12, weight: 50, completed: true },
                        { reps: 10, weight: 55, completed: true }
                    ]
                }
            ]
        };

        const created = await indexedDBStorage.addWorkout(testWorkout);
        console.log('✅ Workout Added:', created);
        return created;
    } catch (error) {
        console.error('❌ Test Failed:', error);
        return null;
    }
}

/**
 * Test 4: Get All Workouts
 */
export async function testGetWorkouts() {
    console.log('🧪 Test 4: Get Workouts');

    try {
        const { workouts } = await indexedDBStorage.get();
        console.log(`✅ Found ${workouts.length} workouts`);
        console.log('Workouts:', workouts);
        return workouts;
    } catch (error) {
        console.error('❌ Test Failed:', error);
        return null;
    }
}

/**
 * Test 5: Update Workout
 */
export async function testUpdateWorkout(workoutId) {
    console.log('🧪 Test 5: Update Workout');

    if (!workoutId) {
        console.error('❌ No workout ID provided');
        return null;
    }

    try {
        const workout = await indexedDBStorage.getWorkout(workoutId);

        if (!workout) {
            console.error('❌ Workout not found');
            return null;
        }

        const updated = await indexedDBStorage.updateWorkout(workoutId, {
            ...workout,
            duration: workout.duration + 15,
            notes: workout.notes + ' (Updated)'
        });

        console.log('✅ Workout Updated:', updated);
        return updated;
    } catch (error) {
        console.error('❌ Test Failed:', error);
        return null;
    }
}

/**
 * Test 6: Add Rest Day
 */
export async function testAddRestDay() {
    console.log('🧪 Test 6: Add Rest Day');

    try {
        const restDay = {
            type: 'rest_day',
            date: new Date().toISOString(),
            notes: 'Recovery day',
            recoveryQuality: 4,
            activities: ['Stretching', 'Light Walk', 'Foam Rolling']
        };

        const created = await indexedDBStorage.addWorkout(restDay);
        console.log('✅ Rest Day Added:', created);
        return created;
    } catch (error) {
        console.error('❌ Test Failed:', error);
        return null;
    }
}

/**
 * Test 7: Query Workouts
 */
export async function testQueryWorkouts() {
    console.log('🧪 Test 7: Query Workouts');

    try {
        // Get workouts from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentWorkouts = await indexedDB.workouts
            .where('date')
            .above(sevenDaysAgo.toISOString())
            .toArray();

        console.log(`✅ Found ${recentWorkouts.length} workouts in last 7 days`);

        // Get rest days
        const restDays = await indexedDB.workouts
            .where('type')
            .equals('rest_day')
            .toArray();

        console.log(`✅ Found ${restDays.length} rest days`);

        return { recentWorkouts, restDays };
    } catch (error) {
        console.error('❌ Test Failed:', error);
        return null;
    }
}

/**
 * Test 8: Export Data
 */
export async function testExportData() {
    console.log('🧪 Test 8: Export Data');

    try {
        const exportData = await exportIndexedDBData();
        console.log('✅ Data Exported:', exportData);
        console.log(`📊 Export contains ${exportData.workouts.length} workouts`);
        return exportData;
    } catch (error) {
        console.error('❌ Test Failed:', error);
        return null;
    }
}

/**
 * Test 9: Check IndexedDB Availability
 */
export async function testIndexedDBAvailability() {
    console.log('🧪 Test 9: IndexedDB Availability');

    try {
        const available = await indexedDBStorage.isAvailable();
        console.log(`✅ IndexedDB Available: ${available}`);
        return available;
    } catch (error) {
        console.error('❌ Test Failed:', error);
        return false;
    }
}

/**
 * Test 10: Template Operations
 */
export async function testTemplates() {
    console.log('🧪 Test 10: Template Operations');

    try {
        // Add template
        const template = {
            name: 'Push Day Template',
            duration: 60,
            exercises: [
                {
                    name: 'Bench Press',
                    category: 'Chest',
                    sets: [
                        { reps: 10, weight: 135 },
                        { reps: 8, weight: 155 },
                        { reps: 6, weight: 175 }
                    ]
                },
                {
                    name: 'Overhead Press',
                    category: 'Shoulders',
                    sets: [
                        { reps: 10, weight: 95 },
                        { reps: 8, weight: 105 }
                    ]
                }
            ]
        };

        const created = await indexedDBStorage.addTemplate(template);
        console.log('✅ Template Added:', created);

        // Get all templates
        const templates = await indexedDBStorage.getTemplates();
        console.log(`✅ Found ${templates.length} templates`);

        return { created, templates };
    } catch (error) {
        console.error('❌ Test Failed:', error);
        return null;
    }
}

/**
 * Run All Tests
 */
export async function runAllTests() {
    console.log('🚀 Running All IndexedDB Tests...\n');

    const results = {
        migration: await testMigrationStatus(),
        stats: await testDatabaseStats(),
        availability: await testIndexedDBAvailability(),
        addWorkout: await testAddWorkout(),
        getWorkouts: await testGetWorkouts(),
        addRestDay: await testAddRestDay(),
        query: await testQueryWorkouts(),
        templates: await testTemplates(),
        export: await testExportData()
    };

    console.log('\n✅ All Tests Complete!');
    console.log('Results:', results);

    return results;
}

// Export all test functions
export default {
    testMigrationStatus,
    testDatabaseStats,
    testAddWorkout,
    testGetWorkouts,
    testUpdateWorkout,
    testAddRestDay,
    testQueryWorkouts,
    testExportData,
    testIndexedDBAvailability,
    testTemplates,
    runAllTests
};
