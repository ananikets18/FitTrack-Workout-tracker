import { useState, useEffect } from 'react';
import { Download, Upload, RefreshCw, AlertCircle, CheckCircle2, Clock, Wifi, WifiOff, Database } from 'lucide-react';
import { useSyncStatus, useNetworkStatus } from '../hooks/useSyncStatus';
import { useAuth } from '../context/AuthContext';
import { exportIndexedDBData } from '../utils/migrateToIndexedDB';
import { indexedDBStorage } from '../utils/indexedDBStorage';

/**
 * Enhanced Sync Dashboard Component
 * 
 * Comprehensive sync status display with:
 * - Real-time sync status
 * - Network status
 * - Pending operations
 * - Error recovery
 * - Data export/backup
 */
export default function SyncDashboard() {
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
        clearFailed,
        refresh
    } = useSyncStatus();

    const [stats, setStats] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Load database stats
    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const dbStats = await indexedDBStorage.getStats();
        setStats(dbStats);
    };

    const handleForceSync = async () => {
        if (!user || syncing) return;

        setSyncing(true);
        try {
            await forceSync(user.id);
            await refresh();
            await loadStats();
        } finally {
            setSyncing(false);
        }
    };

    const handleRetryFailed = async () => {
        await retryFailed();
        await refresh();
    };

    const handleClearFailed = async () => {
        if (window.confirm('Clear all failed operations? This cannot be undone.')) {
            await clearFailed();
            await refresh();
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const data = await exportIndexedDBData();

            // Create download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fittrack-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed: ' + error.message);
        } finally {
            setExporting(false);
        }
    };

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

    // Get status color and icon
    const getStatusInfo = () => {
        if (!isOnline) {
            return {
                color: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
                icon: WifiOff,
                label: 'Offline',
                description: 'Working offline. Changes will sync when online.'
            };
        }

        if (isSyncing || syncing) {
            return {
                color: 'text-blue-500 bg-blue-100 dark:bg-blue-900',
                icon: RefreshCw,
                label: 'Syncing...',
                description: 'Synchronizing your data with the cloud.'
            };
        }

        if (errorWorkouts > 0 || failedOperations > 0) {
            return {
                color: 'text-red-500 bg-red-100 dark:bg-red-900',
                icon: AlertCircle,
                label: 'Sync Errors',
                description: 'Some operations failed. Click to retry.'
            };
        }

        if (pendingWorkouts > 0 || queuedOperations > 0) {
            return {
                color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900',
                icon: Clock,
                label: 'Pending Sync',
                description: 'Changes waiting to be synchronized.'
            };
        }

        return {
            color: 'text-green-500 bg-green-100 dark:bg-green-900',
            icon: CheckCircle2,
            label: 'All Synced',
            description: 'Everything is up to date.'
        };
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    return (
        <div className="space-y-6">
            {/* Main Status Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className={`${statusInfo.color} p-6`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <StatusIcon className={`w-8 h-8 ${isSyncing || syncing ? 'animate-spin' : ''}`} />
                            <div>
                                <h2 className="text-2xl font-bold">{statusInfo.label}</h2>
                                <p className="text-sm opacity-80">{statusInfo.description}</p>
                            </div>
                        </div>

                        {user && isOnline && (
                            <button
                                onClick={handleForceSync}
                                disabled={syncing || isSyncing}
                                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md"
                            >
                                <RefreshCw className={`w-4 h-4 ${(syncing || isSyncing) ? 'animate-spin' : ''}`} />
                                Sync Now
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 dark:bg-gray-800">
                    <StatCard
                        icon={Database}
                        label="Total Workouts"
                        value={stats?.workouts || 0}
                        color="text-blue-500"
                    />
                    <StatCard
                        icon={Clock}
                        label="Pending"
                        value={pendingWorkouts + queuedOperations}
                        color="text-yellow-500"
                    />
                    <StatCard
                        icon={AlertCircle}
                        label="Errors"
                        value={errorWorkouts + failedOperations}
                        color="text-red-500"
                    />
                    <StatCard
                        icon={isOnline ? Wifi : WifiOff}
                        label="Status"
                        value={isOnline ? 'Online' : 'Offline'}
                        color={isOnline ? 'text-green-500' : 'text-gray-500'}
                    />
                </div>

                {/* Last Sync Info */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Last sync: {formatLastSync()}</span>
                        {stats && (
                            <span>Storage: {stats.estimatedSizeMB} MB</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Recovery Section */}
            {(errorWorkouts > 0 || failedOperations > 0) && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                                Sync Errors Detected
                            </h3>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                                {errorWorkouts} workout(s) and {failedOperations} operation(s) failed to sync.
                                You can retry or clear these errors.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleRetryFailed}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                                >
                                    Retry All
                                </button>
                                <button
                                    onClick={handleClearFailed}
                                    className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm font-medium"
                                >
                                    Clear Errors
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Offline Mode Info */}
            {!isOnline && (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <WifiOff className="w-6 h-6 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Working Offline
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                You're currently offline. All changes are being saved locally and will automatically
                                sync when you're back online.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Management Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Data Management
                </h3>

                <div className="space-y-3">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        <Download className={`w-5 h-5 ${exporting ? 'animate-bounce' : ''}`} />
                        {exporting ? 'Exporting...' : 'Export Backup'}
                    </button>

                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Download a complete backup of your workout data
                    </p>
                </div>

                {stats && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Database Statistics
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Workouts:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{stats.workouts}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Exercises:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{stats.exercises}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Sets:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{stats.sets}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Templates:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{stats.templates}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Stat Card Component
 */
function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
}
