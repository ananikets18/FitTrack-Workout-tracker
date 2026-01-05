import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Wifi, WifiOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useNetworkStatus, useSyncStatus } from '../hooks/useSyncStatus';
import { useAuth } from '../context/AuthContext';

/**
 * Sync Notifications Component
 * 
 * Displays toast notifications for sync events:
 * - Network status changes
 * - Sync completion
 * - Sync errors
 * - Background sync
 */
export default function SyncNotifications() {
    const { isOnline } = useNetworkStatus();
    const { user } = useAuth();
    const {
        isSyncing,
        pendingWorkouts,
        errorWorkouts,
        failedOperations
    } = useSyncStatus();

    // Network status notifications
    useEffect(() => {
        if (isOnline) {
            toast.success(
                (t) => (
                    <div className="flex items-center gap-2">
                        <Wifi className="w-5 h-5 text-green-500" />
                        <div>
                            <p className="font-medium">Back Online</p>
                            {user && pendingWorkouts > 0 && (
                                <p className="text-sm text-gray-600">Syncing {pendingWorkouts} pending changes...</p>
                            )}
                        </div>
                    </div>
                ),
                {
                    duration: 3000,
                    position: 'top-right',
                    id: 'network-online'
                }
            );
        } else {
            toast.error(
                (t) => (
                    <div className="flex items-center gap-2">
                        <WifiOff className="w-5 h-5 text-gray-500" />
                        <div>
                            <p className="font-medium">You're Offline</p>
                            <p className="text-sm text-gray-600">Changes will sync when you're back online</p>
                        </div>
                    </div>
                ),
                {
                    duration: 4000,
                    position: 'top-right',
                    id: 'network-offline'
                }
            );
        }
    }, [isOnline, user, pendingWorkouts]);

    // Sync completion notification
    useEffect(() => {
        let prevSyncing = false;

        return () => {
            if (prevSyncing && !isSyncing) {
                // Sync just completed
                if (errorWorkouts === 0 && failedOperations === 0) {
                    toast.success(
                        (t) => (
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <div>
                                    <p className="font-medium">Sync Complete</p>
                                    <p className="text-sm text-gray-600">All changes saved to cloud</p>
                                </div>
                            </div>
                        ),
                        {
                            duration: 2000,
                            position: 'top-right',
                            id: 'sync-complete'
                        }
                    );
                }
            }
            prevSyncing = isSyncing;
        };
    }, [isSyncing, errorWorkouts, failedOperations]);

    // Error notifications
    useEffect(() => {
        if (errorWorkouts > 0 || failedOperations > 0) {
            toast.error(
                (t) => (
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="font-medium">Sync Errors</p>
                            <p className="text-sm text-gray-600">
                                {errorWorkouts + failedOperations} operation(s) failed
                            </p>
                        </div>
                    </div>
                ),
                {
                    duration: 5000,
                    position: 'top-right',
                    id: 'sync-errors'
                }
            );
        }
    }, [errorWorkouts, failedOperations]);

    return null; // This component only handles notifications
}

/**
 * Custom toast notification functions
 */

export const showSyncToast = {
    /**
     * Show sync started notification
     */
    started: () => {
        toast.loading(
            (t) => (
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="font-medium">Syncing...</span>
                </div>
            ),
            {
                id: 'sync-progress',
                position: 'bottom-right'
            }
        );
    },

    /**
     * Show sync completed notification
     * @param {number} count - Number of items synced
     */
    completed: (count = 0) => {
        toast.success(
            (t) => (
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                        <p className="font-medium">Sync Complete</p>
                        {count > 0 && (
                            <p className="text-sm text-gray-600">{count} item(s) synced</p>
                        )}
                    </div>
                </div>
            ),
            {
                id: 'sync-progress',
                duration: 2000,
                position: 'bottom-right'
            }
        );
    },

    /**
     * Show sync failed notification
     * @param {string} error - Error message
     */
    failed: (error) => {
        toast.error(
            (t) => (
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                        <p className="font-medium">Sync Failed</p>
                        <p className="text-sm text-gray-600">{error}</p>
                    </div>
                </div>
            ),
            {
                id: 'sync-progress',
                duration: 4000,
                position: 'bottom-right'
            }
        );
    },

    /**
     * Show data saved notification
     */
    saved: () => {
        toast.success(
            (t) => (
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Saved</span>
                </div>
            ),
            {
                duration: 1500,
                position: 'bottom-center'
            }
        );
    },

    /**
     * Show export completed notification
     */
    exported: () => {
        toast.success(
            (t) => (
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                        <p className="font-medium">Export Complete</p>
                        <p className="text-sm text-gray-600">Backup downloaded successfully</p>
                    </div>
                </div>
            ),
            {
                duration: 3000,
                position: 'top-right'
            }
        );
    },

    /**
     * Show import completed notification
     * @param {number} count - Number of items imported
     */
    imported: (count) => {
        toast.success(
            (t) => (
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                        <p className="font-medium">Import Complete</p>
                        <p className="text-sm text-gray-600">{count} workout(s) imported</p>
                    </div>
                </div>
            ),
            {
                duration: 3000,
                position: 'top-right'
            }
        );
    },

    /**
     * Show conflict detected notification
     * @param {number} count - Number of conflicts
     */
    conflicts: (count) => {
        toast(
            (t) => (
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <div>
                        <p className="font-medium">Conflicts Detected</p>
                        <p className="text-sm text-gray-600">{count} conflict(s) resolved automatically</p>
                    </div>
                </div>
            ),
            {
                duration: 4000,
                position: 'top-right',
                icon: '⚠️'
            }
        );
    }
};
