import { useState, useEffect } from 'react';
import { syncManager } from '../../lib/syncManager';
import { useAuth } from '../../context/AuthContext';
import { useWorkouts } from '../../context/WorkoutContext';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { lightHaptic } from '../../utils/haptics';
import toast from 'react-hot-toast';

/**
 * Sync Status Indicator Component
 * Shows current sync status and allows manual sync
 */
const SyncStatusIndicator = ({ compact = false }) => {
    const { user } = useAuth();
    const { isOnline, forceSync } = useWorkouts();
    const [syncStatus, setSyncStatus] = useState(null);
    const [syncing, setSyncing] = useState(false);

    // Load sync status
    const loadStatus = async () => {
        if (!user) return;

        try {
            const status = await syncManager.getSyncStatus();
            setSyncStatus(status);
        } catch (error) {
            console.error('Error loading sync status:', error);
        }
    };

    // Load status on mount and periodically
    useEffect(() => {
        loadStatus();
        const interval = setInterval(loadStatus, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, [user]);

    // Handle manual sync
    const handleSync = async () => {
        if (!user || !isOnline || syncing) return;

        lightHaptic();
        setSyncing(true);

        try {
            const result = await forceSync();

            if (result) {
                toast.success(`Synced! ↑${result.pushed} ↓${result.pulled}`, {
                    duration: 2000,
                    icon: '🔄'
                });
            }

            await loadStatus();
        } catch (error) {
            toast.error('Sync failed');
            console.error('Sync error:', error);
        } finally {
            setSyncing(false);
        }
    };

    // Determine status
    const getStatus = () => {
        if (!user) return { icon: CloudOff, color: 'text-gray-400', label: 'Not logged in', bg: 'bg-gray-100 dark:bg-gray-800' };
        if (!isOnline) return { icon: CloudOff, color: 'text-orange-500', label: 'Offline', bg: 'bg-orange-50 dark:bg-orange-900/20' };
        if (syncing || syncStatus?.isSyncing) return { icon: Loader, color: 'text-blue-500', label: 'Syncing...', bg: 'bg-blue-50 dark:bg-blue-900/20', spin: true };
        if (syncStatus?.errorWorkouts > 0) return { icon: AlertCircle, color: 'text-red-500', label: `${syncStatus.errorWorkouts} errors`, bg: 'bg-red-50 dark:bg-red-900/20' };
        if (syncStatus?.pendingWorkouts > 0) return { icon: RefreshCw, color: 'text-yellow-500', label: `${syncStatus.pendingWorkouts} pending`, bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
        return { icon: CheckCircle, color: 'text-green-500', label: 'Synced', bg: 'bg-green-50 dark:bg-green-900/20' };
    };

    const status = getStatus();
    const Icon = status.icon;

    if (compact) {
        // Compact version for mobile
        return (
            <button
                onClick={handleSync}
                disabled={!user || !isOnline || syncing}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg ${status.bg} transition-all active:scale-95 disabled:opacity-50`}
                title={status.label}
            >
                <Icon className={`w-4 h-4 ${status.color} ${status.spin ? 'animate-spin' : ''}`} />
                <span className={`text-xs font-medium ${status.color}`}>
                    {status.label}
                </span>
            </button>
        );
    }

    // Full version for desktop
    return (
        <button
            onClick={handleSync}
            disabled={!user || !isOnline || syncing}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${status.bg} hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Click to sync now"
        >
            <Icon className={`w-5 h-5 ${status.color} ${status.spin ? 'animate-spin' : ''}`} />
            <div className="flex flex-col items-start">
                <span className={`text-xs font-semibold ${status.color}`}>
                    {status.label}
                </span>
                {syncStatus?.lastSync && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {new Date(syncStatus.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
        </button>
    );
};

export default SyncStatusIndicator;
