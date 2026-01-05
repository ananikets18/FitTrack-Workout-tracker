import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Upload, Download } from 'lucide-react';

/**
 * Sync Progress Indicator
 * 
 * Shows detailed sync progress with:
 * - Current operation
 * - Progress percentage
 * - Items synced/total
 * - Estimated time remaining
 */
export default function SyncProgress({
    isVisible = false,
    operation = 'sync',
    current = 0,
    total = 0,
    onCancel
}) {
    const [progress, setProgress] = useState(0);
    const [estimatedTime, setEstimatedTime] = useState(null);
    const [startTime] = useState(Date.now());

    useEffect(() => {
        if (total > 0) {
            const newProgress = Math.round((current / total) * 100);
            setProgress(newProgress);

            // Calculate estimated time remaining
            if (current > 0) {
                const elapsed = Date.now() - startTime;
                const avgTimePerItem = elapsed / current;
                const remaining = (total - current) * avgTimePerItem;
                setEstimatedTime(Math.ceil(remaining / 1000)); // Convert to seconds
            }
        }
    }, [current, total, startTime]);

    if (!isVisible) return null;

    const getOperationInfo = () => {
        switch (operation) {
            case 'push':
                return {
                    icon: Upload,
                    label: 'Uploading',
                    color: 'text-blue-500'
                };
            case 'pull':
                return {
                    icon: Download,
                    label: 'Downloading',
                    color: 'text-green-500'
                };
            case 'sync':
                return {
                    icon: RefreshCw,
                    label: 'Syncing',
                    color: 'text-purple-500'
                };
            default:
                return {
                    icon: RefreshCw,
                    label: 'Processing',
                    color: 'text-gray-500'
                };
        }
    };

    const { icon: Icon, label, color } = getOperationInfo();

    return (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-80 z-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${color} animate-spin`} />
                    <span className="font-semibold text-gray-900 dark:text-white">{label}</span>
                </div>

                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>{current} of {total}</span>
                    <span>{progress}%</span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-300 ease-out`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Estimated Time */}
            {estimatedTime !== null && estimatedTime > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    About {estimatedTime} second{estimatedTime !== 1 ? 's' : ''} remaining
                </div>
            )}
        </div>
    );
}

/**
 * Mini Sync Indicator (for header/navbar)
 */
export function MiniSyncIndicator({ isSyncing, hasErrors, pendingCount }) {
    if (!isSyncing && !hasErrors && pendingCount === 0) {
        return (
            <div className="flex items-center gap-1 text-green-500" title="All synced">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Synced</span>
            </div>
        );
    }

    if (hasErrors) {
        return (
            <div className="flex items-center gap-1 text-red-500" title="Sync errors">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Errors</span>
            </div>
        );
    }

    if (isSyncing) {
        return (
            <div className="flex items-center gap-1 text-blue-500" title="Syncing...">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-xs hidden sm:inline">Syncing</span>
            </div>
        );
    }

    if (pendingCount > 0) {
        return (
            <div className="flex items-center gap-1 text-yellow-500" title={`${pendingCount} pending`}>
                <RefreshCw className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">{pendingCount}</span>
            </div>
        );
    }

    return null;
}

/**
 * Sync Status Badge
 */
export function SyncStatusBadge({ status }) {
    const getStatusConfig = () => {
        switch (status) {
            case 'synced':
                return {
                    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    icon: CheckCircle,
                    label: 'Synced'
                };
            case 'pending':
                return {
                    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    icon: RefreshCw,
                    label: 'Pending'
                };
            case 'error':
                return {
                    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                    icon: AlertCircle,
                    label: 'Error'
                };
            case 'local':
                return {
                    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                    icon: RefreshCw,
                    label: 'Local'
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                    icon: RefreshCw,
                    label: 'Unknown'
                };
        }
    };

    const { color, icon: Icon, label } = getStatusConfig();

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}
