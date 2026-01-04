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
import { ArrowLeft, Plus, Trash2, Check, Save, Search, Edit, AlertTriangle, Calendar, BookmarkPlus, FileText, ChevronRight } from 'lucide-react';
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
    sets: [{ reps: 10, weight: 0, completed: false }],
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
      sets: [...newExercise.sets, { reps: lastSet.reps, weight: lastSet.weight, completed: false }],
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

    const exercise = {
      id: crypto.randomUUID(),
      name: newExercise.name,
      category: newExercise.category,
      sets: newExercise.sets,
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
      sets: [{ reps: 10, weight: 0, completed: false }],
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

  // Swipeable Set Component
  const SwipeableSet = ({ set, setIndex, onToggle, onDelete }) => {
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
                  <span className="font-bold text-gray-900">{set.reps}</span>
                  <span className="text-gray-500">reps ×</span>
                  <span className="font-bold text-gray-900">{set.weight}</span>
                  <span className="text-gray-500">kg</span>
                </div>
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
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
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
              className="flex items-center space-x-2 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl shadow-sm"
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
          <h2 className="text-2xl font-bold text-gray-900">Exercises</h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExerciseModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add</span>
          </motion.button>
        </div>

        {exercises.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🏋️</div>
            <p className="text-gray-600 text-lg mb-4">No exercises added yet</p>
            <p className="text-gray-500 text-sm">Tap "Add" to get started</p>
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
                className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg active:bg-blue-200"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Set</span>
              </motion.button>
            </div>

            <div className="space-y-3">
              {newExercise.sets.map((set, index) => {
                const isCardio = newExercise.category === 'cardio';
                
                return (
                  <div key={index} className="bg-gray-50 rounded-xl p-3 md:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base md:text-lg font-bold text-gray-900">Set {index + 1}</span>
                      {newExercise.sets.length > 1 && (
                        <button
                          onClick={() => handleRemoveSet(index)}
                          className="p-1.5 active:bg-red-100 rounded-lg text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {isCardio ? (
                        // Cardio exercises: Duration only
                        <>
                          <NumberPicker
                            label="Duration (mins)"
                            value={set.reps}
                            onChange={(val) => handleSetChange(index, 'reps', val)}
                            min={1}
                            max={120}
                            quickIncrements={[-5, -1, 1, 5]}
                          />
                          <div className="flex items-center justify-center text-gray-400">
                            <span className="text-sm">No weight needed</span>
                          </div>
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
              className="flex-1 px-4 py-3.5 md:py-4 bg-gray-200 active:bg-gray-300 rounded-xl font-semibold text-gray-700 text-base md:text-lg"
            >
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddExercise}
              className="flex-1 px-4 py-3.5 md:py-4 bg-gradient-to-r from-blue-600 to-blue-700 active:from-blue-700 active:to-blue-800 rounded-xl font-semibold text-white text-base md:text-lg shadow-lg"
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

      {/* Template Selection Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Load Template"
      >
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No templates saved yet</p>
              <p className="text-sm text-gray-500 mt-1">Create a workout and save it as a template!</p>
            </div>
          ) : (
            templates.map((template) => (
              <motion.div
                key={template.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLoadTemplate(template)}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{template.name}</h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
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
