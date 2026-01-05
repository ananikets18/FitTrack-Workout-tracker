import { indexedDB } from '../lib/indexedDB';
import { networkDetector } from '../utils/networkDetector';


/**
 * Offline Queue Manager
 * 
 * Manages a queue of operations that failed due to network issues.
 * Automatically retries operations when network is restored.
 */

class OfflineQueue {
    constructor() {
        this.isProcessing = false;
        this.maxRetries = 5;
        this.retryDelays = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff

        // Subscribe to network changes
        this.unsubscribe = networkDetector.subscribe((isOnline) => {
            if (isOnline) {
                console.log('📡 Network restored, processing offline queue...');
                this.processQueue();
            }
        });
    }

    /**
     * Add operation to queue
     * @param {Object} operation - Operation to queue
     * @returns {Promise<Object>} - Queued operation
     */
    async add(operation) {
        try {
            const queueItem = {
                operation: operation.type,
                data: operation.data,
                timestamp: Date.now(),
                status: 'pending',
                retryCount: 0,
                error: null,
                userId: operation.userId || null
            };

            const id = await indexedDB.syncQueue.add(queueItem);

            console.log(`📥 Added to offline queue: ${operation.type}`, { id, data: operation.data });

            return { ...queueItem, id };
        } catch (error) {
            console.error('Error adding to offline queue:', error);
            throw error;
        }
    }

    /**
     * Process the entire queue
     * @returns {Promise<Object>} - Processing results
     */
    async processQueue() {
        if (this.isProcessing) {
            console.log('⏳ Queue processing already in progress');
            return { alreadyProcessing: true };
        }

        if (!networkDetector.getStatus()) {
            console.log('📴 Offline - queue processing skipped');
            return { offline: true };
        }

        this.isProcessing = true;
        const results = {
            processed: 0,
            succeeded: 0,
            failed: 0,
            errors: []
        };

        try {
            // Get all pending items, sorted by timestamp (oldest first)
            const queue = await indexedDB.syncQueue
                .where('status')
                .equals('pending')
                .sortBy('timestamp');

            console.log(`📋 Processing ${queue.length} queued operations...`);

            for (const item of queue) {
                results.processed++;

                try {
                    await this.processItem(item);
                    results.succeeded++;

                    // Remove from queue after successful processing
                    await indexedDB.syncQueue.delete(item.id);

                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        id: item.id,
                        operation: item.operation,
                        error: error.message
                    });

                    // Handle retry logic
                    await this.handleRetry(item, error);
                }
            }

            console.log(`✅ Queue processing complete:`, results);

        } catch (error) {
            console.error('Error processing queue:', error);
        } finally {
            this.isProcessing = false;
        }

        return results;
    }

    /**
     * Process a single queue item
     * @param {Object} item - Queue item to process
     * @returns {Promise<void>}
     */
    async processItem(item) {
        console.log(`⚙️ Processing: ${item.operation}`, item.data);

        switch (item.operation) {
            case 'CREATE_WORKOUT':
                await this.executeCreateWorkout(item.data, item.userId);
                break;

            case 'UPDATE_WORKOUT':
                await this.executeUpdateWorkout(item.data, item.userId);
                break;

            case 'DELETE_WORKOUT':
                await this.executeDeleteWorkout(item.data, item.userId);
                break;

            case 'CREATE_TEMPLATE':
                await this.executeCreateTemplate(item.data, item.userId);
                break;

            case 'DELETE_TEMPLATE':
                await this.executeDeleteTemplate(item.data, item.userId);
                break;

            default:
                throw new Error(`Unknown operation type: ${item.operation}`);
        }
    }

    /**
     * Execute create workout operation
     */
    async executeCreateWorkout(data, userId) {
        // Import Supabase db dynamically to avoid circular dependencies
        const { db } = await import('../lib/supabase');

        const created = await db.createWorkout(data, userId);

        // Update local record with server ID and sync status
        if (data.id && data.id.startsWith('local-')) {
            await indexedDB.workouts.update(data.id, {
                id: created.id,
                syncStatus: 'synced'
            });
        } else {
            await indexedDB.workouts.update(data.id, {
                syncStatus: 'synced'
            });
        }
    }

    /**
     * Execute update workout operation
     */
    async executeUpdateWorkout(data, userId) {
        const { db } = await import('../lib/supabase');

        await db.updateWorkout(data.id, data, userId);

        // Update sync status
        await indexedDB.workouts.update(data.id, {
            syncStatus: 'synced'
        });
    }

    /**
     * Execute delete workout operation
     */
    async executeDeleteWorkout(data, userId) {
        const { db } = await import('../lib/supabase');

        await db.deleteWorkout(data.id, userId);

        // Already deleted locally, no need to update
    }

    /**
     * Execute create template operation
     */
    async executeCreateTemplate(data, userId) {
        const { db } = await import('../lib/supabase');

        const created = await db.createTemplate(data, userId);

        // Update local record
        if (data.id && data.id.startsWith('local-')) {
            await indexedDB.templates.update(data.id, {
                id: created.id
            });
        }
    }

    /**
     * Execute delete template operation
     */
    async executeDeleteTemplate(data, userId) {
        const { db } = await import('../lib/supabase');

        await db.deleteTemplate(data.id, userId);
    }

    /**
     * Handle retry logic for failed operations
     * @param {Object} item - Failed queue item
     * @param {Error} error - Error that occurred
     */
    async handleRetry(item, error) {
        const newRetryCount = item.retryCount + 1;

        if (newRetryCount >= this.maxRetries) {
            // Max retries reached - mark as failed
            await indexedDB.syncQueue.update(item.id, {
                status: 'failed',
                retryCount: newRetryCount,
                error: error.message,
                failedAt: Date.now()
            });

            console.error(`❌ Operation failed after ${this.maxRetries} retries:`, item.operation);
        } else {
            // Schedule retry with exponential backoff
            const delay = this.retryDelays[newRetryCount - 1] || 30000;
            const nextRetry = Date.now() + delay;

            await indexedDB.syncQueue.update(item.id, {
                retryCount: newRetryCount,
                nextRetry: nextRetry,
                error: error.message
            });

            console.warn(`⚠️ Retry ${newRetryCount}/${this.maxRetries} scheduled in ${delay}ms for:`, item.operation);

            // Schedule retry
            setTimeout(() => {
                if (networkDetector.getStatus()) {
                    this.processQueue();
                }
            }, delay);
        }
    }

    /**
     * Get queue statistics
     * @returns {Promise<Object>} - Queue stats
     */
    async getStats() {
        try {
            const pending = await indexedDB.syncQueue
                .where('status')
                .equals('pending')
                .count();

            const failed = await indexedDB.syncQueue
                .where('status')
                .equals('failed')
                .count();

            const all = await indexedDB.syncQueue.count();

            return {
                pending,
                failed,
                total: all
            };
        } catch (error) {
            console.error('Error getting queue stats:', error);
            return { pending: 0, failed: 0, total: 0 };
        }
    }

    /**
     * Get all pending operations
     * @returns {Promise<Array>} - Pending operations
     */
    async getPending() {
        try {
            return await indexedDB.syncQueue
                .where('status')
                .equals('pending')
                .sortBy('timestamp');
        } catch (error) {
            console.error('Error getting pending operations:', error);
            return [];
        }
    }

    /**
     * Get all failed operations
     * @returns {Promise<Array>} - Failed operations
     */
    async getFailed() {
        try {
            return await indexedDB.syncQueue
                .where('status')
                .equals('failed')
                .sortBy('timestamp');
        } catch (error) {
            console.error('Error getting failed operations:', error);
            return [];
        }
    }

    /**
     * Retry a specific failed operation
     * @param {number} id - Queue item ID
     * @returns {Promise<boolean>} - Success status
     */
    async retryOperation(id) {
        try {
            const item = await indexedDB.syncQueue.get(id);

            if (!item) {
                throw new Error('Queue item not found');
            }

            // Reset to pending
            await indexedDB.syncQueue.update(id, {
                status: 'pending',
                retryCount: 0,
                error: null
            });

            // Process queue
            await this.processQueue();

            return true;
        } catch (error) {
            console.error('Error retrying operation:', error);
            return false;
        }
    }

    /**
     * Clear all failed operations
     * @returns {Promise<number>} - Number of items cleared
     */
    async clearFailed() {
        try {
            const failed = await this.getFailed();

            for (const item of failed) {
                await indexedDB.syncQueue.delete(item.id);
            }

            console.log(`🗑️ Cleared ${failed.length} failed operations`);

            return failed.length;
        } catch (error) {
            console.error('Error clearing failed operations:', error);
            return 0;
        }
    }

    /**
     * Clear entire queue (use with caution!)
     * @returns {Promise<void>}
     */
    async clearAll() {
        try {
            await indexedDB.syncQueue.clear();
            console.log('🗑️ Cleared entire sync queue');
        } catch (error) {
            console.error('Error clearing queue:', error);
            throw error;
        }
    }

    /**
     * Cleanup - unsubscribe from network events
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Create singleton instance
export const offlineQueue = new OfflineQueue();

// Export class for testing
export { OfflineQueue };
