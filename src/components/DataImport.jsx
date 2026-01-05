import { useState } from 'react';
import { Upload, FileJson, AlertCircle, CheckCircle, X } from 'lucide-react';
import { importIndexedDBData } from '../utils/migrateToIndexedDB';
import { showSyncToast } from './SyncNotifications';

/**
 * Data Import Component
 * 
 * Allows users to import workout data from:
 * - JSON backup files
 * - Previous exports
 * - Other sources
 */
export default function DataImport({ onClose, onImportComplete }) {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [mergeMode, setMergeMode] = useState(true);

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);

        // Read and preview file
        try {
            const text = await selectedFile.text();
            const data = JSON.parse(text);

            // Validate data structure
            if (!data.workouts || !Array.isArray(data.workouts)) {
                throw new Error('Invalid backup file format');
            }

            setPreview({
                workouts: data.workouts.length,
                templates: data.templates?.length || 0,
                exportDate: data.exportDate || 'Unknown',
                version: data.version || 'Unknown'
            });
        } catch (err) {
            setError(err.message);
            setFile(null);
            setPreview(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        setError(null);

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Import data
            const result = await importIndexedDBData(data, { merge: mergeMode });

            showSyncToast.imported(data.workouts.length);

            if (onImportComplete) {
                onImportComplete(result);
            }

            // Close modal after short delay
            setTimeout(() => {
                if (onClose) onClose();
            }, 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Import Data
                    </h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* File Upload */}
                    {!file && (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                            <FileJson className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Select a backup file to import
                            </p>
                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
                                <Upload className="w-4 h-4" />
                                Choose File
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}

                    {/* File Preview */}
                    {preview && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {file.name}
                                </span>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setPreview(null);
                                        setError(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">Workouts</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {preview.workouts}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">Templates</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {preview.templates}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">Export Date</p>
                                    <p className="font-semibold text-gray-900 dark:text-white text-xs">
                                        {new Date(preview.exportDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400">Version</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {preview.version}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Import Mode */}
                    {preview && (
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={mergeMode}
                                    onChange={() => setMergeMode(true)}
                                    className="w-4 h-4 text-blue-500"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Merge with existing data
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Keep existing workouts and add new ones
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!mergeMode}
                                    onChange={() => setMergeMode(false)}
                                    className="w-4 h-4 text-blue-500"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Replace all data
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Delete existing data and import backup
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                    Import Failed
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                    {error}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Warning for Replace Mode */}
                    {preview && !mergeMode && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                    Warning
                                </p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                    This will delete all your existing data. Make sure you have a backup!
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    {onClose && (
                        <button
                            onClick={onClose}
                            disabled={importing}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleImport}
                        disabled={!preview || importing}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {importing ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Import
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
