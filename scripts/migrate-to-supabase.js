/**
 * One-Time Migration Script
 * Marks all existing IndexedDB workouts as 'pending' so they sync to Supabase
 * 
 * HOW TO USE:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 * 4. Wait for "Migration complete" message
 * 5. Click the sync button or wait for auto-sync
 */

(async function migrateExistingData() {
    console.log('🔄 Starting migration of existing IndexedDB data...');

    try {
        // Open IndexedDB
        const dbName = 'FitTrackDB';
        const request = indexedDB.open(dbName);

        request.onerror = () => {
            console.error('❌ Failed to open IndexedDB');
        };

        request.onsuccess = async (event) => {
            const db = event.target.result;

            // Get all workouts
            const transaction = db.transaction(['workouts'], 'readwrite');
            const store = transaction.objectStore('workouts');
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = async () => {
                const workouts = getAllRequest.result;
                console.log(`📊 Found ${workouts.length} workouts in IndexedDB`);

                if (workouts.length === 0) {
                    console.log('ℹ️ No workouts to migrate');
                    return;
                }

                // Mark each workout as pending
                let updated = 0;
                const updateTransaction = db.transaction(['workouts'], 'readwrite');
                const updateStore = updateTransaction.objectStore('workouts');

                for (const workout of workouts) {
                    // Only update if not already synced or pending
                    if (!workout.syncStatus || workout.syncStatus === 'synced') {
                        workout.syncStatus = 'pending';
                        workout.updatedAt = new Date().toISOString();

                        const updateRequest = updateStore.put(workout);
                        updateRequest.onsuccess = () => {
                            updated++;
                            console.log(`✅ Marked workout ${workout.id} as pending (${updated}/${workouts.length})`);
                        };
                    }
                }

                updateTransaction.oncomplete = () => {
                    console.log(`✅ Migration complete! ${updated} workouts marked as pending`);
                    console.log('🔄 Now click the sync button or wait for auto-sync');
                    console.log('📊 Check /debug/sync to monitor sync progress');
                };

                updateTransaction.onerror = () => {
                    console.error('❌ Failed to update workouts');
                };
            };

            getAllRequest.onerror = () => {
                console.error('❌ Failed to get workouts');
            };
        };

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
})();
