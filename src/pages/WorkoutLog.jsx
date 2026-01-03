import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkouts } from '../context/WorkoutContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { Plus, Trash2, Check, X, Save } from 'lucide-react';

const WorkoutLog = () => {
  const navigate = useNavigate();
  const { addWorkout } = useWorkouts();

  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  
  // Exercise form state
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: 'chest',
    sets: [{ reps: '', weight: '', completed: false }],
    notes: '',
  });

  const categories = [
    'chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'cardio', 'other'
  ];

  const handleAddSet = () => {
    setNewExercise({
      ...newExercise,
      sets: [...newExercise.sets, { reps: '', weight: '', completed: false }],
    });
  };

  const handleRemoveSet = (index) => {
    setNewExercise({
      ...newExercise,
      sets: newExercise.sets.filter((_, i) => i !== index),
    });
  };

  const handleSetChange = (index, field, value) => {
    const updatedSets = [...newExercise.sets];
    updatedSets[index][field] = value;
    setNewExercise({ ...newExercise, sets: updatedSets });
  };

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) {
      alert('Please enter an exercise name');
      return;
    }

    const exercise = {
      id: crypto.randomUUID(),
      name: newExercise.name,
      category: newExercise.category,
      sets: newExercise.sets.map(set => ({
        reps: parseInt(set.reps) || 0,
        weight: parseFloat(set.weight) || 0,
        completed: set.completed,
      })),
      notes: newExercise.notes,
    };

    setExercises([...exercises, exercise]);
    setIsExerciseModalOpen(false);
    
    // Reset form
    setNewExercise({
      name: '',
      category: 'chest',
      sets: [{ reps: '', weight: '', completed: false }],
      notes: '',
    });
  };

  const handleRemoveExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleToggleSet = (exerciseId, setIndex) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const updatedSets = [...ex.sets];
        updatedSets[setIndex].completed = !updatedSets[setIndex].completed;
        return { ...ex, sets: updatedSets };
      }
      return ex;
    }));
  };

  const handleSaveWorkout = () => {
    if (!workoutName.trim()) {
      alert('Please enter a workout name');
      return;
    }

    if (exercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    const workout = {
      name: workoutName,
      date: new Date().toISOString(),
      exercises,
      duration: parseInt(duration) || 0,
      notes,
    };

    addWorkout(workout);
    navigate('/history');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Log Workout</h1>
        <div className="space-x-2">
          <Button variant="secondary" onClick={() => navigate('/')}>
            <X className="w-5 h-5 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSaveWorkout}>
            <Save className="w-5 h-5 mr-2" />
            Save Workout
          </Button>
        </div>
      </div>

      {/* Workout Details */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Workout Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Workout Name"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="e.g., Upper Body Day"
            required
          />
          <Input
            label="Duration (minutes)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="60"
          />
        </div>
        <div className="mt-4">
          <label className="text-sm font-semibold text-gray-700 mb-1 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this workout..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
          />
        </div>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Exercises</h2>
          <Button onClick={() => setIsExerciseModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Exercise
          </Button>
        </div>

        {exercises.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-4xl mb-4">🏋️</div>
            <p className="text-gray-600">No exercises added yet. Click "Add Exercise" to get started.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <Card key={exercise.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-primary-600 bg-primary-50 rounded-full mt-1">
                      {exercise.category}
                    </span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveExercise(exercise.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-sm font-semibold text-gray-700">
                    <div>Set</div>
                    <div>Reps</div>
                    <div>Weight (kg)</div>
                    <div className="text-center">Done</div>
                  </div>
                  {exercise.sets.map((set, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center">
                      <div className="text-gray-600">{index + 1}</div>
                      <div className="text-gray-900 font-semibold">{set.reps}</div>
                      <div className="text-gray-900 font-semibold">{set.weight}</div>
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggleSet(exercise.id, index)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            set.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-primary-500'
                          }`}
                        >
                          {set.completed && <Check className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {exercise.notes && (
                  <p className="text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded-lg">{exercise.notes}</p>
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
      >
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            value={newExercise.name}
            onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
            placeholder="e.g., Bench Press"
            required
          />

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Category
            </label>
            <select
              value={newExercise.category}
              onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Sets</label>
              <Button size="sm" onClick={handleAddSet}>
                <Plus className="w-4 h-4 mr-1" />
                Add Set
              </Button>
            </div>

            <div className="space-y-2">
              {newExercise.sets.map((set, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-700 w-8">#{index + 1}</span>
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={set.reps}
                    onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Weight"
                    value={set.weight}
                    onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                    className="flex-1"
                  />
                  {newExercise.sets.length > 1 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveSet(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Notes</label>
            <textarea
              value={newExercise.notes}
              onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
              placeholder="Add notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button variant="secondary" onClick={() => setIsExerciseModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddExercise} className="flex-1">
              Add Exercise
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkoutLog;
