import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkouts } from '../context/WorkoutContext';
import { useTemplates } from '../context/TemplateContext';
import { useMotionValue, useTransform } from 'framer-motion';
 
import { motion } from 'framer-motion';
import Card from '../components/common/Card';
import NumberPicker from '../components/common/NumberPicker';
import RestTimer from '../components/workout/RestTimer';
import Modal from '../components/common/Modal';
import BatchEditModal from '../components/common/BatchEditModal';
import VoiceLogButton from '../components/common/VoiceLogButton';
import SessionCard from '../components/log/SessionCard';
import TemplateGallery from '../components/log/TemplateGallery';
import ExerciseCard from '../components/log/ExerciseCard';
import GymSessionLogBanner from '../components/session/GymSessionLogBanner';
import { useGymSession, formatClockTime } from '../hooks/useGymSession';
import { formatParsedSummary } from '../utils/voiceParser';
import { ArrowLeft, Plus, Trash2, Check, Save, Search, Edit, AlertTriangle, Calendar, BookmarkPlus, FileText, ChevronRight, Sliders, Timer } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { searchExercises, getExercisesByCategory, getCategoryForExercise, isBarbellExercise, getEffectiveWeight, isIsometricExercise } from '../data/exercises';
import { totalToPerSide, perSideToTotal } from '../utils/weightUtils';
import { newId } from '../utils/ids';
import { getLocalDateInputValue, isSameLocalDay } from '../utils/date';

const HYPEREXTENSION_BODYWEIGHT_KG = 83;

const isHyperextensionExercise = (exerciseName = '') => {
  const lowerName = exerciseName.toLowerCase().trim();
  return lowerName.includes('hyperextension') || lowerName.includes('hyperextention');
};

const getHyperextensionDefaultWeight = (exerciseName, fallbackWeight = 0) => {
  if (!isHyperextensionExercise(exerciseName)) return fallbackWeight;
  const parsedFallback = parseFloat(fallbackWeight) || 0;
  return parsedFallback > 0 ? parsedFallback : HYPEREXTENSION_BODYWEIGHT_KG;
};

const WorkoutLogMobile = () => {
  const navigate = useNavigate();
  const { addWorkout, updateWorkout, currentWorkout, clearCurrentWorkout, workouts } = useWorkouts();
  const { templates, saveTemplate } = useTemplates();
  const {
    isActive: isGymSessionActive,
    isCompleted: isGymSessionCompleted,
    workoutLogged,
    sessionDurationMinutes,
    formattedStartTime,
    formattedEndTime,
    manualOverride: isManualOverride,
    endSession: endGymSession,
    markSessionWorkoutLogged,
  } = useGymSession();

  // Check if we're editing an existing workout
  const isEditMode = !!currentWorkout;
  const editingWorkoutId = currentWorkout?.id;
  const isLoggingUnlocked = isEditMode || isGymSessionCompleted || isManualOverride || workoutLogged;
  const lastWorkout = (workouts || []).find((w) => w.type !== 'rest_day');
  const recentNames = [...new Set((workouts || []).flatMap((w) => (w.exercises || []).map((e) => e.name)).filter(Boolean))];

  const [workoutName, setWorkoutName] = useState('');
  const [workoutDate, setWorkoutDate] = useState(getLocalDateInputValue()); // YYYY-MM-DD format
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
  const [editingSet, setEditingSet] = useState(null); // { exerciseId, setIndex, set }
  const [isSaving, setIsSaving] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const initialSnapshotRef = useRef(null);

  // Auto-populate duration when gym session completes
  useEffect(() => {
    if (!isEditMode && isGymSessionCompleted && sessionDurationMinutes) {
      setDuration(sessionDurationMinutes.toString());
    }
  }, [isEditMode, isGymSessionCompleted, sessionDurationMinutes]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleCollapse = (id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const jumpToExercise = (id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    requestAnimationFrame(() => {
      document.getElementById(`exercise-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const snapshotOf = (name, date, list, dur, nts) =>
    JSON.stringify({
      name: (name || '').trim(),
      date: date || '',
      dur: (dur || '').toString().trim(),
      nts: (nts || '').trim(),
      list: (list || []).map((ex) => ({
        id: ex.id,
        name: ex.name,
        category: ex.category,
        notes: ex.notes || '',
        sets: (ex.sets || []).map((s) => ({
          id: s.id,
          reps: s.reps,
          weight: s.weight,
          duration: s.duration ?? null,
          incline: s.incline ?? null,
          speed: s.speed ?? null,
          completed: !!s.completed,
        })),
      })),
    });

  // Load workout data if in edit mode
  useEffect(() => {
    if (currentWorkout) {
      const name = currentWorkout.name || '';
      const date = currentWorkout.date ? getLocalDateInputValue(currentWorkout.date) : getLocalDateInputValue();
      const list = currentWorkout.exercises || [];
      const dur = currentWorkout.duration?.toString() || '';
      const nts = currentWorkout.notes || '';
      setWorkoutName(name);
      setWorkoutDate(date);
      setExercises(list);
      setDuration(dur);
      setNotes(nts);
      initialSnapshotRef.current = snapshotOf(name, date, list, dur, nts);
      toast.success('Editing workout', { duration: 2000 });
    } else {
      initialSnapshotRef.current = snapshotOf('', getLocalDateInputValue(), [], '', '');
    }
  }, [currentWorkout]);

  // Track unsaved changes by diffing against initial snapshot (fixes over-fire on edit load)
  useEffect(() => {
    if (!initialSnapshotRef.current) {
      initialSnapshotRef.current = snapshotOf(workoutName, workoutDate, exercises, duration, notes);
      setHasUnsavedChanges(false);
      return;
    }
    setHasUnsavedChanges(
      snapshotOf(workoutName, workoutDate, exercises, duration, notes) !== initialSnapshotRef.current
    );
  }, [workoutName, exercises, duration, notes, workoutDate]);

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
    const updatedSets = newExercise.sets.map(set => ({
      ...set,
      weight: getHyperextensionDefaultWeight(value, set.weight)
    }));

    setNewExercise({ ...newExercise, name: value, sets: updatedSets });

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
    const updatedSets = newExercise.sets.map(set => ({
      ...set,
      weight: getHyperextensionDefaultWeight(exerciseName, set.weight)
    }));

    setNewExercise({
      ...newExercise,
      name: exerciseName,
      category: category || newExercise.category, // Use detected category or keep current
      sets: updatedSets
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
      sets: [...newExercise.sets, {
        reps: lastSet.reps,
        weight: getHyperextensionDefaultWeight(newExercise.name, lastSet.weight),
        duration: lastSet.duration || 30,
        incline: lastSet.incline || 0,
        speed: lastSet.speed || 0,
        completed: false
      }],
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
      id: newId(),
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
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.delete(exercise.id);
      return next;
    });
    setIsExerciseModalOpen(false);
    toast.success(`${newExercise.name} added!`);
    vibrate([50, 100, 50]);
    requestAnimationFrame(() => {
      document.getElementById(`exercise-${exercise.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Reset form
    setNewExercise({
      name: '',
      category: 'chest',
      sets: [{ reps: 10, weight: 0, duration: 30, incline: 0, speed: 0, completed: false }],
      notes: '',
    });
  };

  // Voice input handler — adds exercise from parsed speech
  const handleVoiceExercise = (exercise) => {
    setExercises(prev => [...prev, exercise]);
    toast.success(`🎤 ${formatParsedSummary(exercise)}`, { duration: 3000 });
    vibrate([50, 100, 50]);
  };

  const handleRemoveExercise = (id) => {
    const index = exercises.findIndex((ex) => ex.id === id);
    if (index === -1) return;
    const [removed] = exercises.filter((ex) => ex.id === id);
    const next = exercises.filter((ex) => ex.id !== id);
    setExercises(next);
    vibrate(50);
    toast(
      (t) => (
        <span className="flex items-center gap-3">
          <span>{removed?.name || 'Exercise'} removed</span>
          <button
            onClick={() => {
              setExercises((prev) => {
                const copy = [...prev];
                copy.splice(Math.min(index, copy.length), 0, removed);
                return copy;
              });
              toast.dismiss(t.id);
              toast.success('Exercise restored');
            }}
            className="font-bold underline underline-offset-2"
          >
            Undo
          </button>
        </span>
      ),
      { duration: 5000 }
    );
  };

  const handleToggleSet = (exerciseId, setIndex) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const updatedSets = [...ex.sets];
        const wasCompleted = updatedSets[setIndex].completed;
        updatedSets[setIndex].completed = !wasCompleted;

        if (!wasCompleted) {
          // Opt-in rest timer: toast only, user opens timer manually via header button.
          // Previously auto-opened on every set which was interruptive during gym use.
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
          weight: getHyperextensionDefaultWeight(ex.name, lastSet.weight),
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

  const handleUpdateSet = (updatedSet) => {
    setExercises(exercises.map(ex => {
      if (ex.id === editingSet.exerciseId) {
        const updatedSets = [...ex.sets];
        updatedSets[editingSet.setIndex] = {
          ...updatedSets[editingSet.setIndex],
          ...updatedSet
        };
        return { ...ex, sets: updatedSets };
      }
      return ex;
    }));
    setEditingSet(null);
    toast.success('Set updated');
    vibrate(30);
  };

  const handleUpdateSetInline = (exerciseId, setIndex, patch) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updated = [...ex.sets];
        updated[setIndex] = { ...updated[setIndex], ...patch };
        return { ...ex, sets: updated };
      })
    );
  };

  const handleDeleteSet = (exerciseId, setIndex) => {
    const target = exercises.find((ex) => ex.id === exerciseId);
    if (!target || target.sets.length <= 1) {
      toast.error('Keep at least one set');
      return;
    }
    const removed = target.sets[setIndex];
    setExercises(exercises.map((ex) => {
      if (ex.id === exerciseId) {
        return { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) };
      }
      return ex;
    }));
    toast(
      (t) => (
        <span className="flex items-center gap-3">
          <span>Set removed</span>
          <button
            onClick={() => {
              setExercises((prev) =>
                prev.map((ex) => {
                  if (ex.id !== exerciseId) return ex;
                  const copy = [...ex.sets];
                  copy.splice(Math.min(setIndex, copy.length), 0, removed);
                  return { ...ex, sets: copy };
                })
              );
              toast.dismiss(t.id);
              toast.success('Set restored');
            }}
            className="font-bold underline underline-offset-2"
          >
            Undo
          </button>
        </span>
      ),
      { duration: 5000 }
    );
  };

  const handleCopyExercise = (exerciseId) => {
    const src = exercises.find((ex) => ex.id === exerciseId);
    if (!src) return;
    const copy = {
      ...src,
      id: newId(),
      sets: src.sets.map((s) => ({ ...s, id: newId(), completed: false })),
    };
    setExercises((prev) => {
      const idx = prev.findIndex((ex) => ex.id === exerciseId);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    toast.success(`${src.name} duplicated`);
  };

  const handleQuickAddExercise = (exerciseName) => {
    const category = getCategoryForExercise(exerciseName) || 'other';
    const isCardio = category === 'cardio';
    setExercises((prev) => [
      ...prev,
      {
        id: newId(),
        name: exerciseName,
        category,
        sets: [{ id: newId(), reps: isCardio ? 0 : 10, weight: getHyperextensionDefaultWeight(exerciseName, 0), duration: isCardio ? 30 : undefined, completed: false }],
        notes: '',
      },
    ]);
    toast.success(`${exerciseName} added`);
  };

  const handleSaveWorkout = async () => {
    if (isSaving) return;
    if (!workoutName.trim()) {
      toast.error('Please enter a workout name');
      return;
    }

    if (exercises.length === 0) {
      toast.error('Please add at least one exercise');
      return;
    }

    // If a gym session is still actively running when saving, auto-complete it now to stamp endTime
    let completedNow = null;
    if (!isEditMode && isGymSessionActive) {
      completedNow = endGymSession();
    }

    // Convert selected date to ISO string at current time
    const selectedDate = new Date(workoutDate);
    selectedDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

    const autoDuration = !isEditMode
      ? completedNow?.sessionDurationMinutes ?? sessionDurationMinutes ?? (parseInt(duration) || 0)
      : parseInt(duration) || 0;

    let finalNotes = notes.trim();
    if (!isEditMode && (isGymSessionCompleted || completedNow)) {
      const startLabel = completedNow ? formatClockTime(completedNow.startTime) : formattedStartTime;
      const endLabel = completedNow ? formatClockTime(completedNow.endTime) : formattedEndTime;
      const sessionStamp = `[Gym Time: ${startLabel} – ${endLabel} (${autoDuration}m)]`;
      if (!finalNotes.includes('[Gym Time:')) {
        finalNotes = finalNotes ? `${sessionStamp} ${finalNotes}` : sessionStamp;
      }
    }

    const workoutData = {
      name: workoutName.trim(),
      date: selectedDate.toISOString(),
      exercises,
      duration: autoDuration,
      notes: finalNotes,
    };

    setIsSaving(true);
    try {
      if (isEditMode) {
        // Update existing workout
        await updateWorkout({ ...workoutData, id: editingWorkoutId, createdAt: currentWorkout.createdAt });
        clearCurrentWorkout();
      } else {
        // Add new workout
        await addWorkout(workoutData);
        if (isSameLocalDay(workoutDate) || isGymSessionCompleted || completedNow) {
          markSessionWorkoutLogged();
        }
      }

      initialSnapshotRef.current = snapshotOf(workoutName, workoutDate, exercises, duration, notes);
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      vibrate([100, 50, 100, 50, 100]);
      toast.success(isEditMode ? 'Workout updated' : 'Workout saved');
      navigate('/history');
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error(isEditMode ? 'Failed to update workout' : 'Failed to save workout');
    } finally {
      setIsSaving(false);
    }
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
      name: workoutName.trim(),
      exercises: exercises.map(ex => ({
        name: ex.name,
        category: ex.category,
        sets: ex.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          duration: set.duration,
          incline: set.incline,
          speed: set.speed,
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

  const handleLoadTemplate = (template, mode = 'replace') => {
    if (mode === 'replace' && exercises.length > 0 && !window.confirm('Replace current exercises with this template?')) {
      return;
    }
    const mapped = template.exercises.map((ex) => ({
      ...ex,
      id: newId(),
      sets: ex.sets.map((set) => ({ ...set, id: newId(), completed: false })),
    }));
    if (mode === 'append') {
      setExercises((prev) => [...prev, ...mapped]);
    } else {
      setWorkoutName(template.name);
      setExercises(mapped);
      setDuration(template.duration?.toString() || '');
    }
    setIsTemplateModalOpen(false);
    toast.success(`Loaded "${template.name}" template (${mode})`);
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
  const SwipeableSet = ({ set, setIndex, onToggle, onDelete, exercise, onEdit }) => {
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
            weight: previousSet.weight,
            duration: previousSet.duration,
            incline: previousSet.incline,
            speed: previousSet.speed
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
          className={`bg-white rounded-xl p-2 shadow-sm cursor-grab active:cursor-grabbing ${set.completed ? 'opacity-60' : ''
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100">
                <span className="font-bold text-gray-700">{setIndex + 1}</span>
              </div>

              <div className="flex-1">
                {/* Clickable set values for editing */}
                <button
                  onClick={onEdit}
                  className="flex items-center space-x-2 text-sm lg:text-md hover:bg-gray-50 px-1 lg:px-2 py-1 rounded-lg transition-colors group"
                >
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
                  ) : isIsometricExercise(exercise.name) ? (
                    <>
                      <span className="font-bold text-gray-900">{set.duration || set.reps || 0}</span>
                      <span className="text-gray-500">secs</span>
                      {set.weight > 0 && (
                        <>
                          <span className="text-gray-400 mx-1">|</span>
                          <span className="font-bold text-gray-900">{set.weight}</span>
                          <span className="text-gray-500">kg</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-gray-900">{set.reps}</span>
                      <span className="text-gray-500">reps ×</span>
                      <span className="font-bold text-gray-900">
                        {isBarbellExercise(exercise.name)
                          ? getEffectiveWeight(set.weight, exercise.name)
                          : set.weight}
                      </span>
                      <span className="text-gray-500">kg</span>
                      {isBarbellExercise(exercise.name) && (
                        <span className="text-xs text-blue-500 font-medium">(bar+plates)</span>
                      )}
                    </>
                  )}
                  <Edit className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </button>
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
                aria-label={set.completed ? 'Mark set not completed' : 'Mark set completed'}
                aria-pressed={!!set.completed}
                className={`flex items-center justify-center w-11 h-11 rounded-full transition-all ${set.completed
                  ? 'bg-success-600'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-primary-900/40'
                  }`}
              >
                {set.completed ? (
                  <Check className="w-6 h-6 text-white" aria-hidden="true" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-400 rounded-full" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Swipe Hints — visible text for discoverability (was opacity-0) */}
        <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
          Swipe right to complete • swipe left to delete • or use the circle button and Edit.
        </p>
      </motion.div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-safe">
      <Toaster position="top-center" />

      {/* Header — sticky so Save stays reachable without the floating bar */}
      <div className="sticky top-16 z-20 -mx-1 px-1 py-1.5 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur flex items-center justify-between gap-2">
        <button
          onClick={() => {
            if (isEditMode) clearCurrentWorkout();
            handleNavigation('/');
          }}
          aria-label="Back to home"
          className="flex items-center space-x-2 min-h-[44px] text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="w-6 h-6" aria-hidden="true" />
          <span className="font-semibold">Back</span>
        </button>

        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <span className="hidden sm:inline text-[13px] font-semibold text-warning-600 dark:text-amber-400" role="status">
              • Unsaved
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTimerOpen(true)}
            aria-label="Open rest timer"
            title="Rest timer"
            className="flex items-center justify-center min-h-[48px] min-w-[48px] px-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Timer className="w-5 h-5" aria-hidden="true" />
          </motion.button>

          {/* Save Workout Button — same disabled rule as sticky bar */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveWorkout}
            disabled={isSaving || exercises.length === 0 || !workoutName.trim()}
            className="flex items-center space-x-2 px-6 py-3 min-h-[48px] bg-primary-600 text-white font-semibold rounded-xl shadow-lg active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" aria-hidden="true" />
            <span>{isSaving ? 'Saving…' : isEditMode ? 'Update' : 'Save'}</span>
          </motion.button>
        </div>
      </div>

      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center space-x-2">
          <Edit className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">Editing Workout</span>
        </div>
      )}

      {/* Gym Session Status & Gate Banner */}
      <GymSessionLogBanner isEditMode={isEditMode} />

      {/* Workout Details & Exercises (Gated until gym session completes or manual override is enabled) */}
      <div
        aria-disabled={!isLoggingUnlocked}
        className={`space-y-4 transition-opacity duration-200 ${
          !isLoggingUnlocked ? 'opacity-45 pointer-events-none select-none' : ''
        }`}
      >
        {/* Session — name first, details collapsed */}
        <SessionCard
          name={workoutName}
          onName={setWorkoutName}
          date={workoutDate}
          onDate={setWorkoutDate}
          duration={duration}
          onDuration={setDuration}
          notes={notes}
          onNotes={setNotes}
          isEditMode={isEditMode}
        />

        {/* Exercises first — the gym loop stays above the fold */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Exercises</h2>
            <div className="flex items-center space-x-2">
              {/* Batch Edit Button - Show when exercises exist */}
              {exercises.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsBatchEditModalOpen(true)}
                  aria-label="Batch edit all sets"
                  className="flex items-center space-x-2 px-3 py-3 min-h-[48px] bg-gray-600 text-white font-semibold rounded-xl shadow-lg"
                  title="Batch Edit All"
                >
                  <Sliders className="w-5 h-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Batch</span>
                </motion.button>
              )}
              {/* Template Button — single entry (header duplicate removed) */}
              {!isEditMode && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsTemplateModalOpen(true)}
                  aria-label="Open templates"
                  className="flex items-center space-x-2 px-4 py-3 min-h-[48px] bg-purple-600 text-white font-semibold rounded-xl shadow-lg"
                >
                  <FileText className="w-5 h-5" aria-hidden="true" />
                  <span className="hidden sm:inline">Templates</span>
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExerciseModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-3 min-h-[48px] bg-primary-600 text-white font-semibold rounded-xl shadow-lg"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                <span>Add</span>
              </motion.button>
            </div>
          </div>

          {exercises.length === 0 ? (
            <TemplateGallery
              templates={templates}
              lastWorkout={lastWorkout}
              recentNames={recentNames}
              onUseTemplate={(t) => handleLoadTemplate(t, 'replace')}
              onAppendTemplate={(t) => handleLoadTemplate(t, 'append')}
              onBlank={() => setIsExerciseModalOpen(true)}
              onQuickAdd={handleQuickAddExercise}
            />
          ) : (
            <>
              {/* Jump nav — no more scrolling blind through 6 exercises to find legs */}
              <div className="sticky top-16 z-20 -mx-1 px-1 py-1.5 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {exercises.map((ex, i) => {
                    const done = ex.sets.filter((s) => s.completed).length;
                    const allDone = done === ex.sets.length && ex.sets.length > 0;
                    return (
                      <button
                        key={ex.id}
                        onClick={() => jumpToExercise(ex.id)}
                        aria-label={`Jump to ${ex.name}, ${done} of ${ex.sets.length} sets done`}
                        className={`flex-shrink-0 min-h-[40px] px-3 rounded-full text-[13px] font-bold transition-colors ${
                          allDone
                            ? 'bg-success-100 dark:bg-emerald-900/40 text-success-700 dark:text-emerald-300'
                            : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {i + 1} • {ex.name.length > 12 ? `${ex.name.slice(0, 12)}…` : ex.name} {done}/{ex.sets.length}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCollapsedIds(new Set(exercises.map((e) => e.id)))}
                    className="flex-shrink-0 min-h-[40px] px-3 rounded-full text-[13px] font-semibold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
                  >
                    Collapse all
                  </button>
                  <button
                    onClick={() => setCollapsedIds(new Set())}
                    className="flex-shrink-0 min-h-[40px] px-3 rounded-full text-[13px] font-semibold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
                  >
                    Expand all
                  </button>
                </div>
              </div>
              <div className="space-y-3 mt-2">
                {exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    collapsed={collapsedIds.has(exercise.id)}
                    onToggleCollapse={() => toggleCollapse(exercise.id)}
                    onUpdateSet={handleUpdateSetInline}
                    onToggleSet={handleToggleSet}
                    onEditSet={(exerciseId, setIndex) => {
                      const ex = exercises.find((e) => e.id === exerciseId);
                      setEditingSet({ exerciseId, setIndex, set: ex.sets[setIndex], exercise: ex });
                    }}
                    onDeleteSet={handleDeleteSet}
                    onAddSet={handleAddSetToExercise}
                    onCopySet={handleCopyExercise}
                    onRemove={handleRemoveExercise}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        title="Add Exercise"
        size="lg"
        footer={
          <div className="flex space-x-3">
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
        }
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
                const isIsometric = isIsometricExercise(newExercise.name);

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
                      ) : isIsometric ? (
                        // Isometric exercises: Duration + Optional Weight
                        <>
                          <NumberPicker
                            label="Duration (secs)"
                            value={set.duration || set.reps || 30}
                            onChange={(val) => handleSetChange(index, 'duration', val)}
                            min={1}
                            max={600}
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
                        // Weight training: Reps and Total weight (total-first).
                        // Stored set.weight stays per-side plates (legacy); UI enters TOTAL.
                        <>
                          <NumberPicker
                            label="Reps"
                            value={set.reps}
                            onChange={(val) => handleSetChange(index, 'reps', val)}
                            min={1}
                            max={100}
                            quickIncrements={[-5, -2, 2, 5]}
                          />
                          <div className="flex flex-col">
                            <NumberPicker
                              label={isBarbellExercise(newExercise.name) ? 'Total weight' : 'Weight'}
                              value={isBarbellExercise(newExercise.name) ? perSideToTotal(set.weight, newExercise.name) : set.weight}
                              onChange={(val) => handleSetChange(index, 'weight', isBarbellExercise(newExercise.name) ? totalToPerSide(val, newExercise.name) : val)}
                              min={0}
                              max={999}
                              step={2.5}
                              quickIncrements={isBarbellExercise(newExercise.name) ? [-10, -5, 5, 10] : [-20, -10, -5, 5, 10, 20]}
                              unit="kg"
                            />
                            {isBarbellExercise(newExercise.name) && (
                              <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium text-center mt-1">
                                {(parseFloat(set.weight) || 0).toFixed(1)} kg/side + 20 kg bar
                              </span>
                            )}
                          </div>
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
                <div
                  key={template.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{template.name}</h3>
                      <div className="flex items-center space-x-3 text-[13px] text-gray-600 dark:text-gray-400 ">
                        <span>{template.exercises?.length || 0} exercises</span>
                        {template.duration > 0 && (
                          <>
                            <span>•</span>
                            <span>{template.duration} min</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleLoadTemplate(template, 'append')}
                      className="min-h-[44px] rounded-lg bg-gray-200 dark:bg-gray-700 font-semibold text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Append
                    </button>
                    <button
                      onClick={() => handleLoadTemplate(template, 'replace')}
                      className="min-h-[44px] rounded-lg bg-purple-600 hover:bg-purple-700 font-semibold text-sm text-white transition-colors"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Set Modal */}
      {editingSet && (
        <Modal
          isOpen={!!editingSet}
          onClose={() => setEditingSet(null)}
          title={`Edit Set ${editingSet.setIndex + 1} - ${editingSet.exercise.name}`}
          size="md"
        >
          <div className="space-y-6">
            {editingSet.exercise.category === 'cardio' ? (
              <>
                {/* Cardio Exercise */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Duration (minutes)
                  </label>
                  <NumberPicker
                    value={editingSet.set.duration || 0}
                    onChange={(value) => setEditingSet({
                      ...editingSet,
                      set: { ...editingSet.set, duration: value }
                    })}
                    min={0}
                    max={180}
                    step={1}
                  />
                </div>

                {/* Treadmill specific fields */}
                {editingSet.exercise.name.toLowerCase().includes('treadmill') && (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Incline (%)
                      </label>
                      <NumberPicker
                        value={editingSet.set.incline || 0}
                        onChange={(value) => setEditingSet({
                          ...editingSet,
                          set: { ...editingSet.set, incline: value }
                        })}
                        min={0}
                        max={15}
                        step={0.5}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Speed (km/h)
                      </label>
                      <NumberPicker
                        value={editingSet.set.speed || 0}
                        onChange={(value) => setEditingSet({
                          ...editingSet,
                          set: { ...editingSet.set, speed: value }
                        })}
                        min={0}
                        max={25}
                        step={0.5}
                      />
                    </div>
                  </>
                )}
              </>
            ) : isIsometricExercise(editingSet.exercise.name) ? (
              <>
                {/* Isometric Exercise */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Duration (seconds)
                  </label>
                  <NumberPicker
                    value={editingSet.set.duration || editingSet.set.reps || 0}
                    onChange={(value) => setEditingSet({
                      ...editingSet,
                      set: { ...editingSet.set, duration: value }
                    })}
                    min={0}
                    max={600}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Weight (kg)
                  </label>
                  <NumberPicker
                    value={editingSet.set.weight || 0}
                    onChange={(value) => setEditingSet({
                      ...editingSet,
                      set: { ...editingSet.set, weight: value }
                    })}
                    min={0}
                    max={500}
                    step={2.5}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Regular Exercise */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Reps
                  </label>
                  <NumberPicker
                    value={editingSet.set.reps || 0}
                    onChange={(value) => setEditingSet({
                      ...editingSet,
                      set: { ...editingSet.set, reps: value }
                    })}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
                    {isBarbellExercise(editingSet.exercise.name) ? 'Total weight (kg)' : 'Weight (kg)'}
                  </label>
                  <NumberPicker
                    value={isBarbellExercise(editingSet.exercise.name) ? perSideToTotal(editingSet.set.weight, editingSet.exercise.name) : (editingSet.set.weight || 0)}
                    onChange={(value) => setEditingSet({
                      ...editingSet,
                      set: { ...editingSet.set, weight: isBarbellExercise(editingSet.exercise.name) ? totalToPerSide(value, editingSet.exercise.name) : value }
                    })}
                    min={0}
                    max={500}
                    step={2.5}
                  />
                  {isBarbellExercise(editingSet.exercise.name) && (
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium text-center mt-2">
                      {(parseFloat(editingSet.set.weight) || 0).toFixed(1)} kg/side + 20 kg bar
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Save Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleUpdateSet(editingSet.set)}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>Save Changes</span>
            </motion.button>
          </div>
        </Modal>
      )}

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

      {/* Voice Log Button */}
      <VoiceLogButton onExerciseParsed={handleVoiceExercise} />

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed bottom-24 right-4 z-30 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lifted"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default WorkoutLogMobile;

