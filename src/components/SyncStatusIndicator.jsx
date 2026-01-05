import { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useSyncStatus, useNetworkStatus } from '../hooks/useSyncStatus';
import { useAuth } from '../context/AuthContext';

/**
 * Sync Status Indicator Component
 * 
 * Shows current sync status, network status, and pending operations.
 * Allows manual sync trigger.
 */
export default function SyncStatusIndicator({ compact = false }) {
    const { user } = useAuth();
    const { isOnline } = useNetworkStatus();
    const {
        lastSync,
        isSyncing,
        pendingWorkouts,
        errorWorkouts,
        queuedOperations,
        failedOperations,
        forceSync,
        retryFailed,
        clearFailed
    } = useSyncStatus();

    const [showDetails, setShowDetails] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const handleForceSync = async () => {
        if (!user || syncing) return;

        setSyncing(true);
        try {
            await forceSync(user.id);
        } finally {
            setSyncing(false);
        }
    };

    const handleRetryFailed = async () => {
        await retryFailed();
    };

    const handleClearFailed = async () => {
        if (window.confirm('Are you sure you want to clear all failed operations? This cannot be undone.')) {
            await clearFailed();
        }
    };

    // Get status icon and color
    const getStatusIcon = () => {
        if (!isOnline) {
            return { Icon: WifiOff, color: 'text-gray-500', label: 'Offline' };
        }

        if (isSyncing || syncing) {
            return { Icon: RefreshCw, color: 'text-blue-500 animate-spin', label: 'Syncing...' };
        }

        if (errorWorkouts > 0 || failedOperations > 0) {
            return { Icon: AlertCircle, color: 'text-red-500', label: 'Sync Errors' };
        }

        if (pendingWorkouts > 0 || queuedOperations > 0) {
            return { Icon: Clock, color: 'text-yellow-500', label: 'Pending Sync' };
        }

        return { Icon: CheckCircle, color: 'text-green-500', label: 'Synced' };
    };

    const { Icon, color, label } = getStatusIcon();

    // Format last sync time
    const formatLastSync = () => {
        if (!lastSync) return 'Never';

        const date = new Date(lastSync);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    // Compact view (just icon)
    if (compact) {
        return (
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={label}
            >
                <Icon className={`w-5 h-5 ${color}`} />

                {/* Badge for pending/errors */}
                {(pendingWorkouts > 0 || queuedOperations > 0 || errorWorkouts > 0 || failedOperations > 0) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {pendingWorkouts + queuedOperations + errorWorkouts + failedOperations}
                    </span>
                )}
            </button>
        );
    }

    // Full view
    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                </div>

                {user && isOnline && (
                    <button
                        onClick={handleForceSync}
                        disabled={syncing || isSyncing}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                        <RefreshCw className={`w-4 h-4 ${(syncing || isSyncing) ? 'animate-spin' : ''}`} />
                        Sync Now
                    </button>
                )}
            </div>

            {/* Network Status */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                {isOnline ? (
                    <>
                        <Wifi className="w-4 h-4 text-green-500" />
                        <span>Online</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-4 h-4 text-gray-500" />
                        <span>Offline</span>
                    </>
                )}

                {lastSync && (
                    <>
                        <span className="mx-2">•</span>
                        <span>Last sync: {formatLastSync()}</span>
                    </>
                )}
            </div>

            {/* Stats */}
            {(pendingWorkouts > 0 || queuedOperations > 0 || errorWorkouts > 0 || failedOperations > 0) && (
                <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {pendingWorkouts > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Pending workouts:</span>
                            <span className="font-medium text-yellow-600 dark:text-yellow-500">{pendingWorkouts}</span>
                        </div>
                    )}

                    {queuedOperations > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Queued operations:</span>
                            <span className="font-medium text-yellow-600 dark:text-yellow-500">{queuedOperations}</span>
                        </div>
                    )}

                    {errorWorkouts > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Error workouts:</span>
                            <span className="font-medium text-red-600 dark:text-red-500">{errorWorkouts}</span>
                        </div>
                    )}

                    {failedOperations > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Failed operations:</span>
                            <span className="font-medium text-red-600 dark:text-red-500">{failedOperations}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Actions for failed operations */}
            {failedOperations > 0 && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleRetryFailed}
                        className="flex-1 px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                        Retry Failed
                    </button>
                    <button
                        onClick={handleClearFailed}
                        className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Clear Failed
                    </button>
                </div>
            )}

            {/* Offline mode message */}
            {!isOnline && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        You're working offline. Changes will sync when you're back online.
                    </p>
                </div>
            )}
        </div>
    );
}
