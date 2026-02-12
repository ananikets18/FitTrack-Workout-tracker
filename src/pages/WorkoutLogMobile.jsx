import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkouts } from '../context/WorkoutContext';
import { useTemplates } from '../context/TemplateContext';
import { useMotionValue, useTransform } from 'framer-motion';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import NumberPicker from '../components/common/NumberPicker';
import RestTimer from '../components/workout/RestTimer';
import Modal from '../components/common/Modal';
import BatchEditModal from '../components/common/BatchEditModal';
import { ArrowLeft, Plus, Trash2, Check, Save, Search, Edit, AlertTriangle, Calendar, BookmarkPlus, FileText, ChevronRight, Sliders } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { searchExercises, getExercisesByCategory, getCategoryForExercise } from '../data/exercises';

const WorkoutLogMobile = () => {
  const navigate = useNavigate();
  const { addWorkout, updateWorkout, currentWorkout, clearCurrentWorkout } = useWorkouts();
  const { templates, saveTemplate } = useTemplates();

  // Check if we're editing an existing workout
  const isEditMode = !!currentWorkout;
  const editingWorkoutId = currentWorkout?.id;

  const [workoutName, setWorkoutName] = useState('');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
  const [exercises, setExercises] = useState([]);
  const [duration, setDuration] = useState('');

  const [notes, setNotes] = useState('');
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Load workout data if in edit mode
  useEffect(() => {
    if (currentWorkout) {
      setWorkoutName(currentWorkout.name || '');
      setWorkoutDate(currentWorkout.date ? new Date(currentWorkout.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setExercises(currentWorkout.exercises || []);
      setDuration(currentWorkout.duration?.toString() || '');
      setNotes(currentWorkout.notes || '');
      toast.success('Editing workout', { duration: 2000 });
    }
  }, [currentWorkout]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = workoutName.trim() !== '' || exercises.length > 0 || duration.trim() !== '' || notes.trim() !== '';
    setHasUnsavedChanges(hasChanges);
  }, [workoutName, exercises, duration, notes]);

  // Warn before unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Custom navigation handler to intercept back button/navigation
  const handleNavigation = (path) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowExitWarning(true);
    } else {
      navigate(path);
    }
  };

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Exercise form state
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: 'chest',
    sets: [{ reps: 10, weight: 0, duration: 30, incline: 0, speed: 0, completed: false }],
    notes: '',
  });

  const categories = [
    'chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'cardio', 'other'
  ];

  const handleExerciseNameChange = (value) => {
    setNewExercise({ ...newExercise, name: value });

    if (value.trim().length > 0) {
      // Search across ALL categories when typing, not just the selected one
      const results = searchExercises(value, null);
      setSuggestions(results.slice(0, 8)); // Show max 8 suggestions
      setShowSuggestions(results.length > 0);
    } else {
      // Show category exercises when input is empty
      const categoryExercises = getExercisesByCategory(newExercise.category);
      setSuggestions(categoryExercises.slice(0, 8));
      setShowSuggestions(true);
    }
  };

  const handleSelectExercise = (exerciseName) => {
    const category = getCategoryForExercise(exerciseName);
    setNewExercise({
      ...newExercise,
      name: exerciseName,
      category: category || newExercise.category // Use detected category or keep current
    });
    setShowSuggestions(false);
    vibrate(30);

    if (category) {
      toast.success(`${exerciseName} - ${category}`, { duration: 2000 });
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
        inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load category exercises when modal opens
  useEffect(() => {
    if (isExerciseModalOpen) {
      const categoryExercises = getExercisesByCategory(newExercise.category);
      setSuggestions(categoryExercises.slice(0, 8));
    }
  }, [isExerciseModalOpen, newExercise.category]);

  const handleAddSet = () => {
    const lastSet = newExercise.sets[newExercise.sets.length - 1];
    setNewExercise({
      ...newExercise,
      sets: [...newExercise.sets, { reps: lastSet.reps, weight: lastSet.weight, duration: lastSet.duration || 30, incline: lastSet.incline || 0, speed: lastSet.speed || 0, completed: false }],
    });
    vibrate(30);
  };

  const handleRemoveSet = (index) => {
    if (newExercise.sets.length > 1) {
      setNewExercise({
        ...newExercise,
        sets: newExercise.sets.filter((_, i) => i !== index),
      });
      vibrate(50);
    }
  };

  const handleSetChange = (index, field, value) => {
    const updatedSets = [...newExercise.sets];
    updatedSets[index][field] = value;
    setNewExercise({ ...newExercise, sets: updatedSets });
  };

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) {
      toast.error('Please enter an exercise name');
      return;
    }

    const isCardio = newExercise.category === 'cardio';
    const isTreadmill = isCardio && newExercise.name.toLowerCase().includes('treadmill');

    const exercise = {
      id: crypto.randomUUID(),
      name: newExercise.name,
      category: newExercise.category,
      sets: newExercise.sets.map(set => ({
        reps: isCardio ? 0 : (parseInt(set.reps) || 0),
        weight: parseFloat(set.weight) || 0,
        duration: isCardio ? (parseInt(set.duration) || 0) : undefined,
        incline: isTreadmill ? (parseFloat(set.incline) || 0) : undefined,
        speed: isTreadmill ? (parseFloat(set.speed) || 0) : undefined,
        completed: set.completed,
      })),
      notes: newExercise.notes,
    };

    setExercises([...exercises, exercise]);
    setIsExerciseModalOpen(false);
    toast.success(`${newExercise.name} added!`);
    vibrate([50, 100, 50]);

    // Reset form
    setNewExercise({
      name: '',
      category: 'chest',
      sets: [{ reps: 10, weight: 0, duration: 30, incline: 0, speed: 0, completed: false }],
      notes: '',
    });
  };

  const handleRemoveExercise = (id) => {
    const exercise = exercises.find(ex => ex.id === id);
    setExercises(exercises.filter(ex => ex.id !== id));
    toast.success(`${exercise.name} removed`);
    vibrate(50);
  };

  const handleToggleSet = (exerciseId, setIndex) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const updatedSets = [...ex.sets];
        const wasCompleted = updatedSets[setIndex].completed;
        updatedSets[setIndex].completed = !wasCompleted;

        if (!wasCompleted) {
          // Set completed - start rest timer
          setIsTimerOpen(true);
          toast.success('Set completed! 💪');
          vibrate([100, 50, 100]);
        }

        return { ...ex, sets: updatedSets };
      }
      return ex;
    }));
  };

  const handleAddSetToExercise = (exerciseId) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const isCardio = ex.category === 'cardio';
        const isTreadmill = isCardio && ex.name.toLowerCase().includes('treadmill');
        
        const newSet = {
          reps: isCardio ? 0 : (lastSet.reps || 10),
          weight: lastSet.weight || 0,
          duration: isCardio ? (lastSet.duration || 30) : undefined,
          incline: isTreadmill ? (lastSet.incline || 0) : undefined,
          speed: isTreadmill ? (lastSet.speed || 0) : undefined,
          completed: false
        };
        
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    }));
    toast.success('Set added');
    vibrate(30);
  };

  const handleSaveWorkout = () => {
    if (!workoutName.trim()) {
      toast.error('Please enter a workout name');
      return;
    }

    if (exercises.length === 0) {
      toast.error('Please add at least one exercise');
      return;
    }

    // Convert selected date to ISO string at current time
    const selectedDate = new Date(workoutDate);
    selectedDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

    const workoutData = {
      name: workoutName,
      date: selectedDate.toISOString(),
      exercises,
      duration: parseInt(duration) || 0,
      notes,
    };

    if (isEditMode) {
      // Update existing workout
      updateWorkout({ ...workoutData, id: editingWorkoutId, createdAt: currentWorkout.createdAt });
      toast.success('Workout updated! 🎉');
      clearCurrentWorkout();
    } else {
      // Add new workout
      addWorkout(workoutData);
      toast.success('Workout saved! 🎉');
    }

    setHasUnsavedChanges(false); // Clear unsaved changes flag
    vibrate([100, 50, 100, 50, 100]);
    setTimeout(() => navigate('/history'), 1000);
  };

  const handleSaveAsTemplate = () => {
    if (!workoutName.trim()) {
      toast.error('Please enter a workout name');
      return;
    }

    if (exercises.length === 0) {
      toast.error('Please add at least one exercise');
      return;
    }

    const templateData = {
      name: workoutName,
      exercises: exercises.map(ex => ({
        name: ex.name,
        category: ex.category,
        sets: ex.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          duration: set.duration,
          completed: false
        })),
        notes: ex.notes
      })),
      duration: parseInt(duration) || 0,
    };

    saveTemplate(templateData);
    toast.success('Saved as template! 📋');
    vibrate([50, 30, 50]);
  };

  const handleLoadTemplate = (template) => {
    setWorkoutName(template.name);
    setExercises(template.exercises.map(ex => ({
      ...ex,
      id: crypto.randomUUID(),
      sets: ex.sets.map(set => ({ ...set, completed: false }))
    })));
    setDuration(template.duration?.toString() || '');
    setIsTemplateModalOpen(false);
    toast.success(`Loaded "${template.name}" template`);
    vibrate(30);
  };

  const handleCancelWarning = () => {
    setShowExitWarning(false);
    setPendingNavigation(null);
  };

  const handleConfirmExit = () => {
    setShowExitWarning(false);
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const vibrate = (pattern) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const handleBatchEdit = ({ type, operation, value }) => {
    if (type === 'weight' || type === 'reps') {
      // Adjust weight or reps for all sets
      setExercises(exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(set => {
          const currentValue = type === 'weight' ? set.weight : set.reps;
          const newValue = operation === 'add'
            ? currentValue + value
            : Math.max(0, currentValue - value); // Prevent negative values

          return {
            ...set,
            [type]: newValue
          };
        })
      })));

      const action = operation === 'add' ? 'increased' : 'decreased';
      toast.success(`All ${type}s ${action} by ${value}`, { duration: 2000 });
    } else if (type === 'sets') {
      // Add or remove sets from all exercises
      setExercises(exercises.map(ex => {
        if (operation === 'add') {
          // Add new sets based on the last set
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSets = Array(value).fill(null).map(() => ({
            ...lastSet,
            completed: false
          }));
          return {
            ...ex,
            sets: [...ex.sets, ...newSets]
          };
        } else {
          // Remove last sets
          const setsToRemove = Math.min(value, ex.sets.length - 1); // Keep at least 1 set
          return {
            ...ex,
            sets: ex.sets.slice(0, ex.sets.length - setsToRemove)
          };
        }
      }));

      const action = operation === 'add' ? 'added' : 'removed';
      toast.success(`${value} set(s) ${action} to all exercises`, { duration: 2000 });
    }

    vibrate(50);
  };

  // Swipeable Set Component
  const SwipeableSet = ({ set, setIndex, onToggle, onDelete, exercise }) => {
    const x = useMotionValue(0);
    const backgroundColor = useTransform(
      x,
      [-100, 0, 100],
      ['#ef4444', '#ffffff', '#10b981']
    );

    const handleDragEnd = (event, info) => {
      if (info.offset.x > 100) {
        onToggle();
      } else if (info.offset.x < -100) {
        onDelete();
      }
    };

    const handleCopyPreviousSet = () => {
      if (setIndex === 0) return; // Can't copy if first set

      const previousSet = exercise.sets[setIndex - 1];
      setExercises(exercises.map(ex => {
        if (ex.id === exercise.id) {
          const updatedSets = [...ex.sets];
          updatedSets[setIndex] = {
            ...updatedSets[setIndex],
            reps: previousSet.reps,
            weight: previousSet.weight
          };
          return { ...ex, sets: updatedSets };
        }
        return ex;
      }));
      toast.success('Copied from previous set', { duration: 1500 });
      vibrate(30);
    };

    return (
      <motion.div
        className="relative overflow-hidden rounded-xl mb-3"
        style={{ backgroundColor }}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={`bg-white rounded-xl p-4 shadow-sm cursor-grab active:cursor-grabbing ${set.completed ? 'opacity-60' : ''
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                <span className="font-bold text-gray-700">{setIndex + 1}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2 text-lg">
                  {exercise.category === 'cardio' ? (
                    <>
                      {exercise.name.toLowerCase().includes('treadmill') && (set.incline || set.speed) ? (
                        // Treadmill display with incline and speed
                        <>
                          <span className="font-bold text-gray-900">{set.duration || 0}</span>
                          <span className="text-gray-500">mins</span>
                          <span className="text-gray-400">|</span>
                          <span className="font-bold text-gray-900">{set.incline || 0}</span>
                          <span className="text-gray-500">%</span>
                          <span className="text-gray-400">|</span>
                          <span className="font-bold text-gray-900">{set.speed || 0}</span>
                          <span className="text-gray-500">km/h</span>
                        </>
                      ) : (
                        // Regular cardio display
                        <>
                          <span className="font-bold text-gray-900">{set.duration || 0}</span>
                          <span className="text-gray-500">mins</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-gray-900">{set.reps}</span>
                      <span className="text-gray-500">reps ×</span>
                      <span className="font-bold text-gray-900">{set.weight}</span>
                      <span className="text-gray-500">kg</span>
                    </>
                  )}
                </div>
                {setIndex > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyPreviousSet}
                    className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                  >
                    <span>↑ Copy previous</span>
                  </motion.button>
                )}
              </div>

              <button
                onClick={onToggle}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${set.completed
                  ? 'bg-green-500'
                  : 'bg-gray-200 hover:bg-primary-100'
                  }`}
              >
                {set.completed ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <div className="w-6 h-6 border-2 border-gray-400 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Swipe Hints */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white font-semibold opacity-0 pointer-events-none">
          🗑️ Delete
        </div>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white font-semibold opacity-0 pointer-events-none">
          ✓ Complete
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-safe">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (isEditMode) clearCurrentWorkout();
            handleNavigation('/');
          }}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 "
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="font-semibold">Back</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Load Template Button */}
          {!isEditMode && exercises.length === 0 && templates.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </motion.button>
          )}

          {/* Save as Template Button */}
          {!isEditMode && exercises.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveAsTemplate}
              className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-xl shadow-sm"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Template</span>
            </motion.button>
          )}

          {/* Save Workout Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveWorkout}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl shadow-lg active:bg-primary-700"
          >
            <Save className="w-5 h-5" />
            <span>{isEditMode ? 'Update' : 'Save'}</span>
          </motion.button>
        </div>
      </div>

      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center space-x-2">
          <Edit className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">Editing Workout</span>
        </div>
      )}

      {/* Workout Details */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Workout Details</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Workout Name *
            </label>
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Chest & Triceps"
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Workout Date</span>
            </label>
            <input
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 ">Exercises</h2>
          <div className="flex items-center space-x-2">
            {/* Batch Edit Button - Show when exercises exist */}
            {exercises.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsBatchEditModalOpen(true)}
                className="flex items-center space-x-2 px-3 py-3 bg-gray-600 text-white font-semibold rounded-xl shadow-lg"
                title="Batch Edit All"
              >
                <Sliders className="w-5 h-5" />
                <span className="hidden sm:inline">Batch</span>
              </motion.button>
            )}
            {/* Template Button - Always visible when not editing */}
            {!isEditMode && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-3 bg-purple-600 text-white font-semibold rounded-xl shadow-lg"
              >
                <FileText className="w-5 h-5" />
                <span className="hidden sm:inline">Templates</span>
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExerciseModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add</span>
            </motion.button>
          </div>
        </div>

        {exercises.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🏋️</div>
            <p className="text-gray-600 text-lg mb-4">No exercises added yet</p>
            <p className="text-gray-500 text-sm mb-6">Tap "Add" to get started</p>

            {/* Load Template shortcut */}
            {!isEditMode && templates.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsTemplateModalOpen(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl shadow-lg"
              >
                <FileText className="w-5 h-5" />
                <span>Load from Template</span>
              </motion.button>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {exercises.map((exercise) => (
              <Card key={exercise.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{exercise.name}</h3>
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-primary-600 bg-primary-50 rounded-full mt-2">
                      {exercise.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(exercise.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Swipe right to complete, left to delete
                  </p>
                  {exercise.sets.map((set, setIndex) => (
                    <SwipeableSet
                      key={setIndex}
                      exercise={exercise}
                      set={set}
                      setIndex={setIndex}
                      onToggle={() => handleToggleSet(exercise.id, setIndex)}
                      onDelete={() => {
                        // Remove set logic
                        setExercises(exercises.map(ex => {
                          if (ex.id === exercise.id && ex.sets.length > 1) {
                            return {
                              ...ex,
                              sets: ex.sets.filter((_, i) => i !== setIndex)
                            };
                          }
                          return ex;
                        }));
                        toast.success('Set removed');
                      }}
                    />
                  ))}
                  
                  {/* Add Set Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddSetToExercise(exercise.id)}
                    className="w-full mt-2 py-3 px-4 bg-primary-50 hover:bg-primary-100 text-primary-600 font-semibold rounded-xl border-2 border-dashed border-primary-300 flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Set</span>
                  </motion.button>
                </div>

                {exercise.notes && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900">{exercise.notes}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        title="Add Exercise"
        size="lg"
      >
        <div className="space-y-4 md:space-y-6">
          <div className="relative">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Exercise Name *
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={newExercise.name}
                onChange={(e) => handleExerciseNameChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Start typing or select below..."
                className="w-full px-4 py-3 md:py-3.5 pr-10 text-base md:text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoComplete="off"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
              >
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
                    {newExercise.name.trim() ? 'Matching Exercises' : 'Popular Exercises'}
                  </div>
                  {suggestions.map((exercise, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectExercise(exercise)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors text-base text-gray-900 font-medium"
                    >
                      {exercise}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Category
            </label>
            <select
              value={newExercise.category}
              onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
              className="w-full px-4 py-3 md:py-3.5 text-base md:text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">Sets</label>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddSet}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-100 text-blue-700 font-semibold rounded-lg active:bg-blue-200"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs">Add Set</span>
              </motion.button>
            </div>

            <div className="space-y-2 md:space-y-3">
              {newExercise.sets.map((set, index) => {
                const isCardio = newExercise.category === 'cardio';
                const isTreadmill = isCardio && newExercise.name.toLowerCase().includes('treadmill');

                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-2.5 md:p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm md:text-base font-bold text-gray-900">Set {index + 1}</span>
                      {newExercise.sets.length > 1 && (
                        <button
                          onClick={() => handleRemoveSet(index)}
                          className="p-1 active:bg-red-100 rounded-lg text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className={isTreadmill ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"}>
                      {isTreadmill ? (
                        // Treadmill: Duration + Incline + Speed
                        <>
                          <NumberPicker
                            label="Duration (mins)"
                            value={set.duration}
                            onChange={(val) => handleSetChange(index, 'duration', val)}
                            min={1}
                            max={120}
                            quickIncrements={[-5, -1, 1, 5]}
                          />
                          <NumberPicker
                            label="Incline (%)"
                            value={set.incline}
                            onChange={(val) => handleSetChange(index, 'incline', val)}
                            min={0}
                            max={15}
                            step={0.5}
                            quickIncrements={[-2, -0.5, 0.5, 2]}
                          />
                          <NumberPicker
                            label="Speed (km/h)"
                            value={set.speed}
                            onChange={(val) => handleSetChange(index, 'speed', val)}
                            min={0}
                            max={20}
                            step={0.5}
                            quickIncrements={[-1, -0.5, 0.5, 1]}
                          />
                        </>
                      ) : isCardio ? (
                        // Regular Cardio: Duration only
                        <>
                          <NumberPicker
                            label="Duration (mins)"
                            value={set.duration}
                            onChange={(val) => handleSetChange(index, 'duration', val)}
                            min={1}
                            max={120}
                            quickIncrements={[-5, -1, 1, 5]}
                          />
                          <div className="flex items-center justify-center text-gray-400">
                            <span className="text-sm">No weight needed</span>
                          </div>
                        </>
                      ) : newExercise.category === 'core' ? (
                        // Core exercises: Reps + Optional Weight
                        <>
                          <NumberPicker
                            label="Reps"
                            value={set.reps}
                            onChange={(val) => handleSetChange(index, 'reps', val)}
                            min={1}
                            max={200}
                            quickIncrements={[-10, -5, 5, 10]}
                          />
                          <NumberPicker
                            label="Weight (optional)"
                            value={set.weight}
                            onChange={(val) => handleSetChange(index, 'weight', val)}
                            min={0}
                            max={100}
                            step={2.5}
                            quickIncrements={[-10, -5, 5, 10]}
                            unit="kg"
                          />
                        </>
                      ) : (
                        // Weight training: Reps and Weight
                        <>
                          <NumberPicker
                            label="Reps"
                            value={set.reps}
                            onChange={(val) => handleSetChange(index, 'reps', val)}
                            min={1}
                            max={100}
                            quickIncrements={[-5, -2, 2, 5]}
                          />
                          <NumberPicker
                            label="Weight"
                            value={set.weight}
                            onChange={(val) => handleSetChange(index, 'weight', val)}
                            min={0}
                            max={999}
                            step={2.5}
                            quickIncrements={[-20, -10, -5, 5, 10, 20]}
                            unit="kg"
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Notes (Optional)</label>
            <textarea
              value={newExercise.notes}
              onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
              placeholder="Form cues, how it felt, etc..."
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-2 sticky bottom-0 bg-white pb-safe">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExerciseModalOpen(false)}
              className="flex-1 px-4 py-2.5 md:py-3 bg-gray-200 active:bg-gray-300 rounded-xl font-semibold text-gray-700 text-sm md:text-base"
            >
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddExercise}
              className="flex-1 px-4 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 active:from-blue-700 active:to-blue-800 rounded-xl font-semibold text-white text-sm md:text-base shadow-lg"
            >
              Add Exercise
            </motion.button>
          </div>
        </div>
      </Modal>

      {/* Rest Timer */}
      <RestTimer
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        defaultDuration={90}
        onComplete={() => {
          toast.success('Rest complete! Next set! 💪');
          setIsTimerOpen(false);
        }}
      />

      {/* Batch Edit Modal */}
      <BatchEditModal
        isOpen={isBatchEditModalOpen}
        onClose={() => setIsBatchEditModalOpen(false)}
        onApply={handleBatchEdit}
      />

      {/* Template Selection Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Workout Templates"
      >
        <div className="space-y-4">
          {/* Save Current Workout as Template */}
          {exercises.length > 0 && !isEditMode && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveAsTemplate}
              className="w-full p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl border-2 border-purple-500 shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <BookmarkPlus className="w-6 h-6 flex-shrink-0" />
                <div className="text-left flex-1">
                  <h3 className="font-bold text-lg">Save Current Workout</h3>
                  <p className="text-sm text-purple-100">Save this workout as a reusable template</p>
                </div>
              </div>
            </motion.button>
          )}

          {/* Templates List Header */}
          {templates.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Your Templates</h3>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{templates.length}</span>
            </div>
          )}

          {/* Templates List */}
          <div className="space-y-3">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No templates saved yet</p>
                <p className="text-sm text-gray-500 ">Create a workout with exercises, then save it as a template!</p>
              </div>
            ) : (
              templates.map((template) => (
                <motion.div
                  key={template.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLoadTemplate(template)}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600 ">
                        <span>{template.exercises?.length || 0} exercises</span>
                        {template.duration > 0 && (
                          <>
                            <span>•</span>
                            <span>{template.duration} min</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Exit Warning Modal */}
      <Modal
        isOpen={showExitWarning}
        onClose={handleCancelWarning}
        title="Unsaved Changes"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-yellow-100 p-2 rounded-full flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">You have unsaved changes</h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to leave? All unsaved changes will be lost.
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCancelWarning}
              className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700"
            >
              Stay
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleConfirmExit}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white"
            >
              Leave
            </motion.button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkoutLogMobile;

