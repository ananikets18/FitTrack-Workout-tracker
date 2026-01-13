import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkouts } from '../context/WorkoutContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import SkeletonCard from '../components/common/SkeletonCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatDate, calculateTotalSets, calculateExerciseVolume, kgToTons, getProgressiveOverload } from '../utils/calculations';
import { exportToExcel, exportToJSON, exportToCSV, importFromJSON, importFromExcel } from '../utils/exportUtils';
import { Trash2, Search, Calendar, Edit, TrendingUp, TrendingDown, Minus, Sheet, FileJson, Upload, FileSpreadsheet, Hotel, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const History = () => {
  const navigate = useNavigate();
  const { workouts, deleteWorkout, setCurrentWorkout, importWorkouts, isLoading } = useWorkouts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPeriod, setExportPeriod] = useState('all');
  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredWorkouts = workouts.filter(workout => {
    if (workout.type === 'rest_day') {
      return workout.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.activities?.some(activity => activity.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.exercises?.some(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  });

  const handleViewDetails = (workout) => {
    setSelectedWorkout(workout);
    setIsDetailModalOpen(true);
  };

  const handleEditWorkout = (workout) => {
    setCurrentWorkout(workout);
    navigate('/log');
  };

  const handleDeleteWorkout = (workout) => {
    setWorkoutToDelete(workout);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (workoutToDelete) {
      deleteWorkout(workoutToDelete.id);
      setIsDetailModalOpen(false);
      setWorkoutToDelete(null);
      toast.success('Workout deleted successfully');
    }
  };

  const handleExport = (format) => {
    if (workouts.length === 0) {
      toast.error('No workouts to export');
      return;
    }

    // For JSON, open the date range modal
    if (format === 'json') {
      setIsExportModalOpen(true);
      return;
    }

    // For CSV and Excel, export directly
    let success = false;
    switch (format) {
      case 'csv':
        success = exportToCSV(workouts);
        break;
      case 'excel':
        success = exportToExcel(workouts);
        break;
      default:
        break;
    }

    if (success) {
      toast.success(`Exported successfully as ${format.toUpperCase()}!`);
    } else {
      toast.error('Export failed. Please try again.');
    }
  };

  const handleConfirmExport = () => {
    const dateRange = exportPeriod === 'all' ? null : {
      period: exportPeriod,
      date: exportDate
    };

    const success = exportToJSON(workouts, dateRange);

    if (success) {
      const periodText = exportPeriod === 'all' ? 'all workouts' : `${exportPeriod} workouts`;
      toast.success(`Exported ${periodText} successfully!`);
      setIsExportModalOpen(false);
    } else {
      toast.error('No workouts found in the selected date range');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    try {
      let importedWorkouts;

      if (fileExtension === 'json') {
        importedWorkouts = await importFromJSON(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        importedWorkouts = await importFromExcel(file);
      } else {
        toast.error('Unsupported file format. Use JSON or Excel files.');
        return;
      }

      importWorkouts(importedWorkouts);
      toast.success(`Successfully imported ${importedWorkouts.length} workout(s)!`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import workouts');
    }

    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3 md:mb-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 ">Workout History</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">View and manage your past workouts</p>
          </div>

          {/* Import/Export Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {/* Import Button */}
            <label
              htmlFor="import-file"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Import workouts"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden lg:inline">Import</span>
            </label>
            <input
              id="import-file"
              type="file"
              accept=".json,.xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />

            {/* Export Buttons */}
            {workouts.length > 0 && (
              <>
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-soft transition-colors active:scale-95"
                  title="Export as CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden lg:inline">CSV</span>
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-soft transition-colors active:scale-95"
                  title="Export as Excel"
                >
                  <Sheet className="w-4 h-4" />
                  <span className="hidden lg:inline">Excel</span>
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-soft transition-colors active:scale-95"
                  title="Export as JSON"
                >
                  <FileJson className="w-4 h-4" />
                  <span className="hidden lg:inline">JSON</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Import/Export Buttons - Mobile */}
        <div className="flex md:hidden items-center gap-2">
          {/* Import Button */}
          <label
            htmlFor="import-file-mobile"
            className="flex items-center justify-center px-2.5 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            title="Import workouts"
          >
            <Upload className="w-4 h-4" />
          </label>
          <input
            id="import-file-mobile"
            type="file"
            accept=".json,.xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />

          {/* Export Buttons */}
          {workouts.length > 0 && (
            <>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center justify-center px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-lg shadow-soft transition-colors active:scale-95"
                title="Export as CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="flex items-center justify-center px-2.5 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-lg shadow-soft transition-colors active:scale-95"
                title="Export as Excel"
              >
                <Sheet className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleExport('json')}
                className="flex items-center justify-center px-2.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg shadow-soft transition-colors active:scale-95"
                title="Export as JSON"
              >
                <FileJson className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search workouts or exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* Workouts List */}
      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No workouts found' : 'No workouts yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Start logging workouts to see them here'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWorkouts.map((workout) => (
            <Card
              key={workout.id}
              hover
              onClick={() => handleViewDetails(workout)}
            >
              {workout.type === 'rest_day' ? (
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="bg-purple-100 rounded-xl p-3 flex-shrink-0">
                      <Hotel className="w-6 h-6 text-purple-600 " />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 ">Rest Day</h3>
                      <div className="flex items-center space-x-2 mt-2 text-gray-600 ">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(workout.date)}</span>
                      </div>
                      <div className="flex items-center space-x-3 mt-3">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-600 ">Recovery:</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < workout.recoveryQuality ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 '}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {workout.activities?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {workout.activities.map((activity, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full"
                            >
                              {activity.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 ">{workout.name}</h3>
                    <div className="flex items-center space-x-2 mt-2 text-gray-600 ">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{formatDate(workout.date)}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600 ">
                      <span className="font-semibold">{workout.exercises?.length || 0} exercises</span>
                      <span>•</span>
                      <span>{calculateTotalSets(workout)} sets</span>
                      {workout.duration > 0 && (
                        <>
                          <span>•</span>
                          <span>{workout.duration} min</span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {workout.exercises?.slice(0, 3).map((ex, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full"
                        >
                          {ex.name}
                        </span>
                      ))}
                      {workout.exercises?.length > 3 && (
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                          +{workout.exercises.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={selectedWorkout.type === 'rest_day' ? 'Rest Day' : selectedWorkout.name}
          size="lg"
        >
          {selectedWorkout.type === 'rest_day' ? (
            <div className="space-y-6">
              {/* Rest Day Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 ">Date</p>
                  <p className="font-semibold text-gray-900 ">{formatDate(selectedWorkout.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 ">Recovery Quality</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < selectedWorkout.recoveryQuality ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 '}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Recovery Activities */}
              {selectedWorkout.activities && selectedWorkout.activities.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">Active Recovery Activities</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkout.activities.map((activity, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-2 text-sm font-semibold bg-purple-100 text-purple-700 rounded-lg"
                      >
                        {activity.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedWorkout.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Notes</p>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-900 ">{selectedWorkout.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => handleDeleteWorkout(selectedWorkout)}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Workout Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 ">Date</p>
                  <p className="font-semibold text-gray-900 ">{formatDate(selectedWorkout.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 ">Duration</p>
                  <p className="font-semibold text-gray-900 ">
                    {selectedWorkout.duration > 0 ? `${selectedWorkout.duration} min` : 'Not recorded'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 ">Total Exercises</p>
                  <p className="font-semibold text-gray-900 ">{selectedWorkout.exercises?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 ">Total Sets</p>
                  <p className="font-semibold text-gray-900 ">{calculateTotalSets(selectedWorkout)}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedWorkout.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Notes</p>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-900 ">{selectedWorkout.notes}</p>
                </div>
              )}

              {/* Exercises */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Exercises</h3>
                <div className="space-y-4">
                  {selectedWorkout.exercises?.map((exercise) => {
                    const exerciseVolume = calculateExerciseVolume(exercise);
                    const maxWeight = Math.max(...exercise.sets.map(s => s.weight || 0));
                    const progressData = getProgressiveOverload(exercise.name, selectedWorkout, workouts);
                    const isCardioOrBodyweight = exercise.category === 'cardio' || maxWeight === 0;

                    return (
                      <div key={exercise.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="inline-block px-2 py-1 text-xs font-semibold text-primary-600 bg-primary-50 rounded-full">
                                {exercise.category}
                              </span>
                              {!isCardioOrBodyweight && (
                                <>
                                  <span className="text-xs text-gray-600">
                                    Volume: {kgToTons(exerciseVolume)}T ({exerciseVolume}kg)
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    Max: {maxWeight}kg
                                  </span>
                                </>
                              )}
                              {isCardioOrBodyweight && (
                                <span className="text-xs text-gray-600">
                                  Duration/Bodyweight
                                </span>
                              )}
                            </div>
                            {progressData && progressData.status !== 'new' && (
                              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${progressData.status === 'improved' ? 'text-green-600' :
                                progressData.status === 'declined' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                {progressData.status === 'improved' && <TrendingUp className="w-3 h-3" />}
                                {progressData.status === 'declined' && <TrendingDown className="w-3 h-3" />}
                                {progressData.status === 'maintained' && <Minus className="w-3 h-3" />}
                                {progressData.message}
                              </div>
                            )}
                            {progressData && progressData.status === 'new' && (
                              <div className="text-xs text-blue-600 font-medium mt-2">
                                🎉 {progressData.message}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {isCardioOrBodyweight ? (
                            // Cardio/Bodyweight display
                            <>
                              <div className="grid grid-cols-3 gap-2 text-sm font-semibold text-gray-700">
                                <div>Set</div>
                                <div>Duration/Reps</div>
                                <div className="text-right">Status</div>
                              </div>
                              {exercise.sets.map((set, index) => (
                                <div
                                  key={index}
                                  className={`grid grid-cols-3 gap-2 text-sm ${set.completed ? 'text-gray-900 bg-green-50' : 'text-gray-600'
                                    } py-2 px-2 rounded`}
                                >
                                  <div className="font-medium">{index + 1}</div>
                                  <div className="font-semibold">
                                    {exercise.category === 'cardio' ? `${set.duration || 0} mins` : `${set.reps} reps`}
                                  </div>
                                  <div className="text-right text-xs">
                                    {set.completed ? '✓ Done' : '-'}
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            // Weight training display
                            <>
                              <div className="grid grid-cols-4 gap-2 text-sm font-semibold text-gray-700">
                                <div>Set</div>
                                <div>Weight × Reps</div>
                                <div className="text-right">Volume</div>
                                <div className="text-right">Status</div>
                              </div>
                              {exercise.sets.map((set, index) => {
                                const setVolume = set.reps * set.weight;
                                return (
                                  <div
                                    key={index}
                                    className={`grid grid-cols-4 gap-2 text-sm ${set.completed ? 'text-gray-900 bg-green-50' : 'text-gray-600'
                                      } py-2 px-2 rounded`}
                                  >
                                    <div className="font-medium">{index + 1}</div>
                                    <div className="font-semibold">{set.weight}kg × {set.reps}</div>
                                    <div className="text-right font-medium">{setVolume}kg</div>
                                    <div className="text-right text-xs">
                                      {set.completed ? '✓ Done' : '-'}
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>

                        {exercise.notes && (
                          <p className="text-sm text-gray-600 mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                            📝 {exercise.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t ">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleEditWorkout(selectedWorkout)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteWorkout(selectedWorkout)}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Workout"
        message={`Are you sure you want to delete "${workoutToDelete?.type === 'rest_day' ? 'Rest Day' : workoutToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* JSON Export Modal with Date Range Selection */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Workouts (JSON)"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Select the time period for your workout data export
            </p>

            {/* Period Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Export Period
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExportPeriod('all')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${exportPeriod === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  All Workouts
                </button>
                <button
                  onClick={() => setExportPeriod('day')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${exportPeriod === 'day'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Single Day
                </button>
                <button
                  onClick={() => setExportPeriod('week')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${exportPeriod === 'week'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setExportPeriod('month')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${exportPeriod === 'month'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setExportPeriod('year')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all col-span-2 ${exportPeriod === 'year'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Year
                </button>
              </div>
            </div>

            {/* Date Picker - Only show when not "all" */}
            {exportPeriod !== 'all' && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Reference Date
                </label>
                <input
                  type="date"
                  value={exportDate}
                  onChange={(e) => setExportDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {exportPeriod === 'day' && 'Export workouts from this specific day'}
                  {exportPeriod === 'week' && 'Export workouts from the week containing this date (Mon-Sun)'}
                  {exportPeriod === 'month' && 'Export workouts from the month containing this date'}
                  {exportPeriod === 'year' && 'Export workouts from the year containing this date'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsExportModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmExport}
              className="flex-1"
            >
              <FileJson className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default History;

