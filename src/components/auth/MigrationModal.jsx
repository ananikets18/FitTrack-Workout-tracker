import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  migrateLocalStorageToSupabase, 
  hasLocalData, 
  clearLocalStorageData,
  markMigrationComplete 
} from '../../utils/supabaseMigration';
import { DatabaseIcon, CheckCircleIcon, XCircleIcon, LoaderIcon } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

const MigrationModal = ({ isOpen, onClose, onComplete }) => {
  const { user } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [error, setError] = useState(null);

  const localDataInfo = hasLocalData();
  const hasData = localDataInfo.hasWorkouts || localDataInfo.hasTemplates;

  const handleMigrate = async () => {
    if (!user) {
      setError('You must be logged in to migrate data');
      return;
    }

    setMigrating(true);
    setError(null);

    try {
      const result = await migrateLocalStorageToSupabase(user.id);
      
      if (result.success) {
        setMigrationResult(result);
        
        // Clear localStorage after successful migration
        clearLocalStorageData();
        markMigrationComplete();
        
        // Notify parent to reload data
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      } else {
        setError(result.message || 'Migration failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during migration');
    } finally {
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    markMigrationComplete();
    onClose();
  };

  if (!hasData) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} title="Migrate Your Data">
      <div className="space-y-6">
        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <DatabaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Local Data Detected
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                We found existing workout data on your device. Would you like to migrate it to the cloud?
              </p>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Data to migrate:
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {localDataInfo.hasWorkouts && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {localDataInfo.workoutCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Workouts
                </div>
              </div>
            )}
            {localDataInfo.hasTemplates && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {localDataInfo.templateCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Templates
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Migration Result */}
        {migrationResult && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Migration Successful!
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {migrationResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  Migration Failed
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        {!migrationResult && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Benefits of cloud sync:
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Access your workouts from any device</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Automatic backup and sync</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Never lose your workout history</span>
              </li>
            </ul>
          </div>
        )}

        {/* Actions */}
        {!migrationResult && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleMigrate}
              disabled={migrating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {migrating ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                'Migrate Data'
              )}
            </Button>
            <Button
              onClick={handleSkip}
              disabled={migrating}
              variant="outline"
              className="flex-1"
            >
              Skip for Now
            </Button>
          </div>
        )}

        {migrationResult && (
          <Button
            onClick={() => {
              onComplete?.();
              onClose();
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Continue to App
          </Button>
        )}

        {/* Warning */}
        {!migrationResult && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Your local data will be backed up and can be restored if needed
          </p>
        )}
      </div>
    </Modal>
  );
};

export default MigrationModal;
