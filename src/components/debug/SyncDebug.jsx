import { syncManager } from '../lib/syncManager';
import { indexedDB } from '../lib/indexedDB';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { RefreshCw, Database, Cloud, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Sync Debug Component
 * Shows sync status and allows manual sync trigger
 */
const SyncDebug = () => {
    const { user } = useAuth();
    const [syncStatus, setSyncStatus] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [localStats, setLocalStats] = useState(null);

    const loadSyncStatus = async () => {
        try {
            const status = await syncManager.getSyncStatus();
            setSyncStatus(status);

            // Get local stats
            const workouts = await indexedDB.workouts.toArray();
            const pending = workouts.filter(w => w.syncStatus === 'pending').length;
            const synced = workouts.filter(w => w.syncStatus === 'synced').length;
            const error = workouts.filter(w => w.syncStatus === 'error').length;

            setLocalStats({
                total: workouts.length,
                pending,
                synced,
                error,
                workouts: workouts.map(w => ({
                    id: w.id,
                    name: w.name,
                    date: w.date,
                    syncStatus: w.syncStatus,
                    userId: w.userId
                }))
            });
        } catch (error) {
            console.error('Error loading sync status:', error);
        }
    };

    const handleForceSync = async () => {
        if (!user) {
            alert('Please log in to sync');
            return;
        }

        setSyncing(true);
        try {
            const result = await syncManager.forceSyncNow(user.id);
            console.log('Sync result:', result);
            await loadSyncStatus();
            alert(`Sync complete!\nPushed: ${result.pushed}\nPulled: ${result.pulled}\nConflicts: ${result.conflicts}`);
        } catch (error) {
            console.error('Sync error:', error);
            alert('Sync failed: ' + error.message);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="space-y-4 p-4">
            <Card>
                <h2 className="text-xl font-bold mb-4">🔍 Sync Diagnostics</h2>

                <div className="space-y-3">
                    <Button onClick={loadSyncStatus} variant="outline" className="w-full">
                        <Database className="w-4 h-4 mr-2" />
                        Check Status
                    </Button>

                    <Button
                        onClick={handleForceSync}
                        disabled={!user || syncing}
                        className="w-full"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Force Sync Now'}
                    </Button>
                </div>

                {syncStatus && (
                    <div className="mt-4 space-y-2 text-sm">
                        <h3 className="font-semibold">Sync Status:</h3>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded space-y-1">
                            <div className="flex items-center justify-between">
                                <span>Online:</span>
                                <span className={syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
                                    {syncStatus.isOnline ? '✓ Yes' : '✗ No'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Auto-sync:</span>
                                <span>{syncStatus.autoSyncEnabled ? '✓ Enabled' : '✗ Disabled'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Last Sync:</span>
                                <span className="text-xs">
                                    {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Pending:</span>
                                <span className="text-orange-600">{syncStatus.pendingWorkouts}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Errors:</span>
                                <span className="text-red-600">{syncStatus.errorWorkouts}</span>
                            </div>
                        </div>
                    </div>
                )}

                {localStats && (
                    <div className="mt-4 space-y-2 text-sm">
                        <h3 className="font-semibold">Local Database:</h3>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded space-y-1">
                            <div className="flex items-center justify-between">
                                <span>Total Workouts:</span>
                                <span className="font-bold">{localStats.total}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Synced:</span>
                                <span className="text-green-600">{localStats.synced}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Pending:</span>
                                <span className="text-orange-600">{localStats.pending}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Errors:</span>
                                <span className="text-red-600">{localStats.error}</span>
                            </div>
                        </div>

                        <details className="mt-2">
                            <summary className="cursor-pointer font-semibold">View All Workouts</summary>
                            <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                                {localStats.workouts.map(w => (
                                    <div key={w.id} className="text-xs bg-white dark:bg-gray-900 p-2 rounded border">
                                        <div className="font-semibold">{w.name || 'Rest Day'}</div>
                                        <div className="text-gray-500">ID: {w.id}</div>
                                        <div className="text-gray-500">Date: {new Date(w.date).toLocaleDateString()}</div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span>Status: {w.syncStatus}</span>
                                            <span>User: {w.userId ? '✓' : '✗'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </details>
                    </div>
                )}

                {user && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                        <div className="font-semibold">Logged in as:</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{user.email}</div>
                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SyncDebug;
