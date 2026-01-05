import { useState, useEffect } from 'react';
import { syncManager } from '../lib/syncManager';
import { offlineQueue } from '../lib/offlineQueue';
import { networkDetector } from '../utils/networkDetector';

/**
 * Hook to monitor sync status
 * @returns {Object} - Sync status and control functions
 */
export function useSyncStatus() {
    const [status, setStatus] = useState({
        lastSync: null,
        isSyncing: false,
        pendingWorkouts: 0,
        errorWorkouts: 0,
        queuedOperations: 0,
        failedOperations: 0,
        autoSyncEnabled: true,
        isOnline: navigator.onLine
    });

    const [isLoading, setIsLoading] = useState(true);

    // Update status
    const updateStatus = async () => {
        try {
            const syncStatus = await syncManager.getSyncStatus();
            if (syncStatus) {
                setStatus(syncStatus);
            }
        } catch (error) {
            console.error('Error updating sync status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial status update
        updateStatus();

        // Subscribe to network changes
        const unsubscribeNetwork = networkDetector.subscribe((isOnline) => {
            setStatus(prev => ({ ...prev, isOnline }));
        });

        // Poll for status updates every 10 seconds
        const interval = setInterval(updateStatus, 10000);

        return () => {
            unsubscribeNetwork();
            clearInterval(interval);
        };
    }, []);

    // Force sync
    const forceSync = async (userId) => {
        if (!userId) {
            console.warn('Cannot sync without user ID');
            return null;
        }

        setStatus(prev => ({ ...prev, isSyncing: true }));

        try {
            const result = await syncManager.forceSyncNow(userId);
            await updateStatus();
            return result;
        } catch (error) {
            console.error('Force sync failed:', error);
            return null;
        }
    };

    // Retry failed operations
    const retryFailed = async () => {
        try {
            const failed = await offlineQueue.getFailed();

            for (const item of failed) {
                await offlineQueue.retryOperation(item.id);
            }

            await updateStatus();
            return true;
        } catch (error) {
            console.error('Retry failed operations error:', error);
            return false;
        }
    };

    // Clear failed operations
    const clearFailed = async () => {
        try {
            const count = await offlineQueue.clearFailed();
            await updateStatus();
            return count;
        } catch (error) {
            console.error('Clear failed operations error:', error);
            return 0;
        }
    };

    return {
        ...status,
        isLoading,
        forceSync,
        retryFailed,
        clearFailed,
        refresh: updateStatus
    };
}

/**
 * Hook to monitor network status
 * @returns {Object} - Network status
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const unsubscribe = networkDetector.subscribe((online) => {
            setIsOnline(online);
        });

        return unsubscribe;
    }, []);

    return {
        isOnline,
        isOffline: !isOnline
    };
}

/**
 * Hook to monitor offline queue
 * @returns {Object} - Queue status and operations
 */
export function useOfflineQueue() {
    const [stats, setStats] = useState({
        pending: 0,
        failed: 0,
        total: 0
    });

    const [isLoading, setIsLoading] = useState(true);

    const updateStats = async () => {
        try {
            const queueStats = await offlineQueue.getStats();
            setStats(queueStats);
        } catch (error) {
            console.error('Error updating queue stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        updateStats();

        // Poll for updates every 10 seconds
        const interval = setInterval(updateStats, 10000);

        return () => clearInterval(interval);
    }, []);

    // Process queue manually
    const processQueue = async () => {
        try {
            const result = await offlineQueue.processQueue();
            await updateStats();
            return result;
        } catch (error) {
            console.error('Process queue error:', error);
            return null;
        }
    };

    // Get pending operations
    const getPending = async () => {
        try {
            return await offlineQueue.getPending();
        } catch (error) {
            console.error('Get pending error:', error);
            return [];
        }
    };

    // Get failed operations
    const getFailed = async () => {
        try {
            return await offlineQueue.getFailed();
        } catch (error) {
            console.error('Get failed error:', error);
            return [];
        }
    };

    return {
        ...stats,
        isLoading,
        processQueue,
        getPending,
        getFailed,
        refresh: updateStats
    };
}
