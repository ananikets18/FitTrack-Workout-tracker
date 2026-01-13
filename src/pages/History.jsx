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
import { Trash2, Search, Calendar, Edit, TrendingUp, TrendingDown, Minus, Sheet, FileJson, Upload, FileSpreadsheet, Hotel, Star, Filter, ArrowUpDown, Layers, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
// Sub-component for individual workout card
const WorkoutCard = ({ workout, onClick }) => {
  // Safety check for null/undefined workout
  if (!workout) {
    console.warn('WorkoutCard received null/undefined workout');
    return null;
  }
  
  return (
  <Card hover onClick={onClick} className="p-3 md:p-4">
    {workout.type === 'rest_day' ? (
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 md:space-x-3 flex-1">
          <div className="bg-purple-100 rounded-xl p-2 md:p-3 flex-shrink-0">
            <Hotel className="w-5 h-5 md:w-6 md:h-6 text-purple-600 " />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 ">Rest Day</h3>
            <div className="flex items-center space-x-2 mt-1 md:mt-2 text-gray-600 ">
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="text-xs md:text-sm">{formatDate(workout.date)}</span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3 mt-2 md:mt-3">
              <div className="flex items-center space-x-1">
                <span className="text-xs md:text-sm text-gray-600 ">Recovery:</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 ${i < (workout.recoveryQuality || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 '}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {workout.activities?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2 md:mt-3">
                {workout.activities.map((activity, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 md:py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full"
                  >
                    {activity ? activity.replace('_', ' ') : 'Unknown'}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    ) : (
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 truncate">{workout.name || 'Unnamed Workout'}</h3>
          <div className="flex items-center space-x-2 mt-1 md:mt-2 text-gray-600 ">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
            <span className="text-xs md:text-sm">{formatDate(workout.date)}</span>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4 mt-2 md:mt-3 text-xs md:text-sm text-gray-600 flex-wrap">
            <span className="font-semibold">{workout.exercises?.length || 0} exercises</span>
            <span className="hidden sm:inline">•</span>
            <span>{calculateTotalSets(workout)} sets</span>
            {workout.duration && workout.duration > 0 && (
              <>
                <span className="hidden sm:inline">•</span>
                <span>{workout.duration} min</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2 md:mt-3">
            {workout.exercises?.slice(0, 3).map((ex, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 md:py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full truncate max-w-[120px] md:max-w-none"
              >
                {ex?.name || 'Unknown Exercise'}
              </span>
            ))}
            {workout.exercises?.length > 3 && (
              <span className="px-2 py-0.5 md:py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                +{workout.exercises.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    )}
  </Card>
  );
};

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
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filtering and Sorting states
  const [filterType, setFilterType] = useState('all'); // 'all', 'workout', 'rest_day'
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'name-asc', 'name-desc', 'duration-desc', 'volume-desc'
  const [groupByDate, setGroupByDate] = useState(true); // Toggle for date grouping

  // Helper function to calculate total volume for a workout
  const calculateWorkoutVolume = (workout) => {
    if (!workout || workout.type === 'rest_day' || !workout.exercises || !Array.isArray(workout.exercises)) return 0;
    try {
      return workout.exercises.reduce((total, exercise) => {
        return total + calculateExerciseVolume(exercise);
      }, 0);
    } catch (error) {
      console.error('Error calculating workout volume:', error);
      return 0;
    }
  };

  // Filter workouts by type and search term
  const filteredWorkouts = workouts.filter(workout => {
    // Filter by type
    if (filterType === 'workout' && workout.type === 'rest_day') return false;
    if (filterType === 'rest_day' && workout.type !== 'rest_day') return false;

    // Filter by search term
    if (workout.type === 'rest_day') {
      const matchesNotes = workout.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesActivities = Array.isArray(workout.activities) && 
        workout.activities.some(activity => activity?.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesNotes || matchesActivities;
    }
    const matchesName = workout.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesExercises = Array.isArray(workout.exercises) && 
      workout.exercises.some(ex => ex?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesName || matchesExercises;
  });

  // Sort workouts
  const sortedWorkouts = [...filteredWorkouts].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.date) - new Date(a.date);
      case 'date-asc':
        return new Date(a.date) - new Date(b.date);
      case 'name-asc': {
        const nameA = a.type === 'rest_day' ? 'Rest Day' : a.name;
        const nameB = b.type === 'rest_day' ? 'Rest Day' : b.name;
        return nameA.localeCompare(nameB);
      }
      case 'name-desc': {
        const nameA2 = a.type === 'rest_day' ? 'Rest Day' : a.name;
        const nameB2 = b.type === 'rest_day' ? 'Rest Day' : b.name;
        return nameB2.localeCompare(nameA2);
      }
      case 'duration-desc':
        return (b.duration || 0) - (a.duration || 0);
      case 'volume-desc':
        return calculateWorkoutVolume(b) - calculateWorkoutVolume(a);
      default:
        return new Date(b.date) - new Date(a.date);
    }
  });

  // Group workouts by date if enabled
  const groupedWorkouts = groupByDate ? (() => {
    const groups = {};
    sortedWorkouts.forEach(workout => {
      try {
        // Validate workout date
        if (!workout?.date) {
          console.warn('Workout missing date:', workout);
          return;
        }

        const date = new Date(workout.date);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid workout date:', workout.date);
          return;
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset time parts for accurate comparison
        const workoutDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayDateOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        let groupKey;
        if (workoutDateOnly.getTime() === todayDateOnly.getTime()) {
          groupKey = 'Today';
        } else if (workoutDateOnly.getTime() === yesterdayDateOnly.getTime()) {
          groupKey = 'Yesterday';
        } else {
          // Group by week
          const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);

          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

          // Check if it's this week
          const thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          thisWeekStart.setDate(today.getDate() - today.getDay());
          const thisWeekStartOnly = new Date(thisWeekStart.getFullYear(), thisWeekStart.getMonth(), thisWeekStart.getDate());

          if (weekStart.getTime() === thisWeekStartOnly.getTime()) {
            groupKey = 'This Week';
          } else {
            // Safely get month name with bounds check
            const startMonth = monthNames[weekStart.getMonth()] || 'Unknown';
            const endMonth = monthNames[weekEnd.getMonth()] || 'Unknown';
            // Format as "Week of Jan 1 - Jan 7"
            groupKey = `Week of ${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}`;
          }
        }

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(workout);
      } catch (error) {
        console.error('Error grouping workout:', error, workout);
      }
    });
    return groups;
  })() : null;

  const handleViewDetails = (workout) => {
    if (!workout) {
      console.warn('Attempted to view details of null/undefined workout');
      return;
    }
    setSelectedWorkout(workout);
    setIsDetailModalOpen(true);
  };

  const handleEditWorkout = (workout) => {
    if (!workout) {
      console.warn('Attempted to edit null/undefined workout');
      toast.error('Cannot edit workout: invalid data');
      return;
    }
    setCurrentWorkout(workout);
    navigate('/log');
  };

  const handleDeleteWorkout = (workout) => {
    if (!workout) {
      console.warn('Attempted to delete null/undefined workout');
      toast.error('Cannot delete workout: invalid data');
      return;
    }
    setWorkoutToDelete(workout);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (workoutToDelete && workoutToDelete.id) {
      deleteWorkout(workoutToDelete.id);
      setIsDetailModalOpen(false);
      setWorkoutToDelete(null);
      toast.success('Workout deleted successfully');
    } else {
      console.error('Cannot delete workout: missing workout ID');
      toast.error('Failed to delete workout');
      setIsDeleteDialogOpen(false);
      setWorkoutToDelete(null);
    }
  };

  const handleExport = async (format) => {
    if (workouts.length === 0) {
      toast.error('No workouts to export');
      return;
    }

    if (isExporting) {
      toast.error('Export already in progress');
      return;
    }

    // For JSON, open the date range modal
    if (format === 'json') {
      setIsExportModalOpen(true);
      return;
    }

    // For CSV and Excel, export directly
    setIsExporting(true);
    try {
      let success = false;
      switch (format) {
        case 'csv':
          success = exportToCSV(workouts);
          break;
        case 'excel':
          success = exportToExcel(workouts);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      if (success) {
        toast.success(`Exported successfully as ${format.toUpperCase()}!`);
      } else {
        toast.error('Export failed. Please try again.');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmExport = async () => {
    if (isExporting) {
      toast.error('Export already in progress');
      return;
    }

    setIsExporting(true);
    try {
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
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isImporting) {
      toast.error('Import already in progress');
      e.target.value = '';
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension) {
      toast.error('Unable to determine file type');
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    const loadingToast = toast.loading('Importing workouts...');

    try {
      let importedWorkouts;

      if (fileExtension === 'json') {
        importedWorkouts = await importFromJSON(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        importedWorkouts = await importFromExcel(file);
      } else {
        throw new Error('Unsupported file format. Use JSON or Excel files.');
      }

      // Validate imported data
      if (!Array.isArray(importedWorkouts)) {
        throw new Error('Invalid data format: expected an array of workouts');
      }

      if (importedWorkouts.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No workouts found in the file');
        return;
      }

      importWorkouts(importedWorkouts);
      toast.dismiss(loadingToast);
      toast.success(`Successfully imported ${importedWorkouts.length} workout(s)!`);
    } catch (error) {
      console.error('Import error:', error);
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to import workouts');
    } finally {
      setIsImporting(false);
      // Reset file input
      e.target.value = '';
    }
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
                  disabled={isExporting || isImporting}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-soft transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export as CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden lg:inline">{isExporting ? 'Exporting...' : 'CSV'}</span>
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={isExporting || isImporting}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-soft transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export as Excel"
                >
                  <Sheet className="w-4 h-4" />
                  <span className="hidden lg:inline">{isExporting ? 'Exporting...' : 'Excel'}</span>
                </button>
                <button
                  onClick={() => handleExport('json')}
                  disabled={isExporting || isImporting}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-soft transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export as JSON"
                >
                  <FileJson className="w-4 h-4" />
                  <span className="hidden lg:inline">{isExporting ? 'Exporting...' : 'JSON'}</span>
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
                disabled={isExporting || isImporting}
                className="flex items-center justify-center px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-lg shadow-soft transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export as CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={isExporting || isImporting}
                className="flex items-center justify-center px-2.5 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-lg shadow-soft transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export as Excel"
              >
                <Sheet className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting || isImporting}
                className="flex items-center justify-center px-2.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg shadow-soft transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export as JSON"
              >
                <FileJson className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <Card>
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search workouts or exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Controls Toolbar */}
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar items-center">
              {/* Type Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="h-10 appearance-none pl-9 pr-8 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                >
                  <option value="all">All Types</option>
                  <option value="workout">Workouts</option>
                  <option value="rest_day">Rest Days</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
              </div>

              {/* Sort Dropdown */}
              <div className="relative min-w-[140px]">
                <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 w-full appearance-none pl-9 pr-8 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="duration-desc">Duration (High-Low)</option>
                  <option value="volume-desc">Volume (High-Low)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
              </div>

              {/* Group Toggle */}
              <button
                onClick={() => setGroupByDate(!groupByDate)}
                className={`flex h-10 items-center gap-2 px-3 border rounded-lg text-sm font-medium transition-colors ${groupByDate
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                title="Toggle date grouping"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Group</span>
              </button>
            </div>
          </div>
        </Card>
      </div>

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
              ? 'Try adjusting your search terms or filters'
              : 'Start logging workouts to see them here'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupByDate && groupedWorkouts ? (
            // Grouped View
            Object.entries(groupedWorkouts).map(([group, groupWorkouts]) => (
              <div key={group} className="space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider pl-1 sticky top-0 bg-gray-50/95 backdrop-blur-sm py-2 z-10 w-full">
                  {group}
                </h3>
                <div className="space-y-4">
                  {Array.isArray(groupWorkouts) && groupWorkouts.map((workout, idx) => (
                    <WorkoutCard
                      key={workout?.id || `workout-${group}-${idx}`}
                      workout={workout}
                      onClick={() => handleViewDetails(workout)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Flat List View
            <div className="space-y-4">
              {sortedWorkouts.map((workout, idx) => (
                <WorkoutCard
                  key={workout?.id || `workout-flat-${idx}`}
                  workout={workout}
                  onClick={() => handleViewDetails(workout)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={selectedWorkout.type === 'rest_day' ? 'Rest Day' : (selectedWorkout.name || 'Unnamed Workout')}
          size="lg"
          footer={
            selectedWorkout.type === 'rest_day' ? (
              <Button
                variant="danger"
                size="md"
                onClick={() => handleDeleteWorkout(selectedWorkout)}
                className="w-full min-h-[44px]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            ) : (
              <div className="flex gap-2 md:gap-3 w-full">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleEditWorkout(selectedWorkout)}
                  className="flex-1 min-h-[44px]"
                >
                  <Edit className="w-4 h-4 mr-1 md:mr-2" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => handleDeleteWorkout(selectedWorkout)}
                  className="flex-1 min-h-[44px]"
                >
                  <Trash2 className="w-4 h-4 mr-1 md:mr-2" />
                  <span>Delete</span>
                </Button>
              </div>
            )
          }
        >
          {selectedWorkout.type === 'rest_day' ? (
            <div className="space-y-4 md:space-y-6">
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
                          className={`w-5 h-5 ${i < (selectedWorkout.recoveryQuality || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 '}`}
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
                          {activity ? activity.replace('_', ' ') : 'Unknown'}
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
              </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {/* Workout Info */}
              <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                  <div>
                    <p className="text-sm text-gray-600 ">Date</p>
                    <p className="font-semibold text-gray-900 text-sm md:text-base">{formatDate(selectedWorkout.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 ">Duration</p>
                    <p className="font-semibold text-gray-900 text-sm md:text-base">
                      {selectedWorkout.duration && selectedWorkout.duration > 0 ? `${selectedWorkout.duration} min` : 'Not recorded'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 ">Total Exercises</p>
                    <p className="font-semibold text-gray-900 text-sm md:text-base">{selectedWorkout.exercises?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 ">Total Sets</p>
                    <p className="font-semibold text-gray-900 text-sm md:text-base">{calculateTotalSets(selectedWorkout)}</p>
                  </div>
                </div>

                {/* Notes */}
                {selectedWorkout.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Notes</p>
                    <p className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm md:text-base">{selectedWorkout.notes}</p>
                  </div>
                )}

                {/* Exercises */}
                <div>
                  <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-2.5 md:mb-4">Exercises</h3>
                  <div className="space-y-2.5 md:space-y-4">
                    {selectedWorkout.exercises?.map((exercise) => {
                    if (!exercise) return null;
                    const exerciseVolume = calculateExerciseVolume(exercise);
                    const weights = Array.isArray(exercise.sets) ? exercise.sets.map(s => s?.weight || 0) : [0];
                    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
                    const progressData = getProgressiveOverload(exercise?.name, selectedWorkout, workouts);
                    const isCardioOrBodyweight = exercise.category === 'cardio' || maxWeight === 0;

                    return (
                      <div key={exercise.id} className="border border-gray-200 rounded-lg p-3 md:p-4">
                        <div className="flex items-start justify-between mb-2 md:mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm md:text-base">{exercise.name}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="inline-block px-2 py-0.5 md:py-1 text-xs font-semibold text-primary-600 bg-primary-50 rounded-full">
                                {exercise.category}
                              </span>
                              {!isCardioOrBodyweight && (
                                <>
                                  <span className="text-xs text-gray-600">
                                    Vol: {kgToTons(exerciseVolume)}T
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    Max: {maxWeight}kg
                                  </span>
                                </>
                              )}
                              {isCardioOrBodyweight && (
                                <span className="text-xs text-gray-600">
                                  Duration/BW
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
                              <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm font-semibold text-gray-700">
                                <div>Set</div>
                                <div>Duration/Reps</div>
                                <div className="text-right">Status</div>
                              </div>
                              {Array.isArray(exercise.sets) && exercise.sets.map((set, index) => {
                                if (!set) return null;
                                return (
                                <div
                                  key={index}
                                  className={`grid grid-cols-3 gap-1 md:gap-2 text-xs md:text-sm ${set.completed ? 'text-gray-900 bg-green-50' : 'text-gray-600'
                                    } py-1.5 md:py-2 px-1.5 md:px-2 rounded`}
                                >
                                  <div className="font-medium">{index + 1}</div>
                                  <div className="font-semibold truncate">
                                    {exercise.category === 'cardio' ? `${set.duration || 0}m` : `${set.reps || 0} reps`}
                                  </div>
                                  <div className="text-right text-xs">
                                    {set.completed ? '✓' : '-'}
                                  </div>
                                </div>
                              )})}
                            </>
                          ) : (
                            // Weight training display
                            <>
                              <div className="grid grid-cols-4 gap-1 md:gap-2 text-xs md:text-sm font-semibold text-gray-700">
                                <div>Set</div>
                                <div>Weight × Reps</div>
                                <div className="text-right">Vol</div>
                                <div className="text-right">✓</div>
                              </div>
                              {Array.isArray(exercise.sets) && exercise.sets.map((set, index) => {
                                if (!set) return null;
                                const setVolume = (set.reps || 0) * (set.weight || 0);
                                return (
                                  <div
                                    key={index}
                                    className={`grid grid-cols-4 gap-1 md:gap-2 text-xs md:text-sm ${set.completed ? 'text-gray-900 bg-green-50' : 'text-gray-600'
                                      } py-1.5 md:py-2 px-1.5 md:px-2 rounded`}
                                  >
                                    <div className="font-medium">{index + 1}</div>
                                    <div className="font-semibold truncate">{set.weight || 0}×{set.reps || 0}</div>
                                    <div className="text-right font-medium truncate">{setVolume}</div>
                                    <div className="text-right text-xs">
                                      {set.completed ? '✓' : '-'}
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>

                        {exercise.notes && (
                          <p className="text-xs md:text-sm text-gray-600 mt-2 md:mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                            📝 {exercise.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
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
              disabled={isExporting}
              className="flex-1"
            >
              <FileJson className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export JSON'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default History;

