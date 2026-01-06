import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkouts } from '../../context/WorkoutContext';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { lightHaptic } from '../../utils/haptics';
import toast from 'react-hot-toast';

/**
 * Simple Sync Status Indicator
 * Shows online/offline status and allows manual refresh
 */
const SyncStatusIndicator = ({ compact = false }) => {
    const { user } = useAuth();
    const { isOnline, refreshWorkouts } = useWorkouts();
    const [refreshing, setRefreshing] = useState(false);

    // Handle manual refresh
    const handleRefresh = async () => {
        if (!user || !isOnline || refreshing) return;

        lightHaptic();
        setRefreshing(true);

        try {
            await refreshWorkouts();
            toast.success('Refreshed!', { duration: 1500 });
        } catch (error) {
            toast.error('Refresh failed');
            console.error('Refresh error:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Determine status
    const getStatus = () => {
        if (!user) return { icon: CloudOff, color: 'text-gray-400', label: 'Not logged in', bg: 'bg-gray-100 dark:bg-gray-800' };
        if (!isOnline) return { icon: CloudOff, color: 'text-orange-500', label: 'Offline', bg: 'bg-orange-50 dark:bg-orange-900/20' };
        if (refreshing) return { icon: RefreshCw, color: 'text-blue-500', label: 'Refreshing...', bg: 'bg-blue-50 dark:bg-blue-900/20', spin: true };
        return { icon: Cloud, color: 'text-green-500', label: 'Online', bg: 'bg-green-50 dark:bg-green-900/20' };
    };

    const status = getStatus();
    const Icon = status.icon;

    if (compact) {
        // Compact version for mobile
        return (
            <button
                onClick={handleRefresh}
                disabled={!user || !isOnline || refreshing}
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
            onClick={handleRefresh}
            disabled={!user || !isOnline || refreshing}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${status.bg} hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Click to refresh"
        >
            <Icon className={`w-5 h-5 ${status.color} ${status.spin ? 'animate-spin' : ''}`} />
            <span className={`text-sm font-semibold ${status.color}`}>
                {status.label}
            </span>
        </button>
    );
};

export default SyncStatusIndicator;
