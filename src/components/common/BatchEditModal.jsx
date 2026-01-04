import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Modal from './Modal';
import Button from './Button';
import NumberPicker from './NumberPicker';
import { TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';

const BatchEditModal = ({ isOpen, onClose, onApply }) => {
  const [editType, setEditType] = useState('weight'); // 'weight', 'reps', 'sets'
  const [operation, setOperation] = useState('add'); // 'add' or 'subtract'
  const [value, setValue] = useState(5);

  const editTypes = [
    { id: 'weight', label: 'Adjust Weight', icon: TrendingUp, description: 'Change weight for all sets' },
    { id: 'reps', label: 'Adjust Reps', icon: TrendingUp, description: 'Change reps for all sets' },
    { id: 'sets', label: 'Add/Remove Sets', icon: Plus, description: 'Add or remove sets from all exercises' },
  ];

  const handleApply = () => {
    onApply({
      type: editType,
      operation,
      value
    });
    onClose();
  };

  const getPreviewText = () => {
    const op = operation === 'add' ? '+' : '-';
    if (editType === 'sets') {
      return operation === 'add' 
        ? `Add ${value} set(s) to all exercises`
        : `Remove last ${value} set(s) from all exercises`;
    }
    return `${op}${value} ${editType} to all sets`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Batch Edit Workout">
      <div className="space-y-6">
        {/* Edit Type Selection */}
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
            What to adjust
          </label>
          <div className="grid grid-cols-1 gap-2">
            {editTypes.map((type) => (
              <motion.button
                key={type.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditType(type.id);
                  // Reset value based on type
                  if (type.id === 'weight') setValue(5);
                  if (type.id === 'reps') setValue(2);
                  if (type.id === 'sets') setValue(1);
                }}
                className={`flex items-start space-x-3 p-4 rounded-xl border-2 transition-all text-left ${
                  editType === type.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  editType === type.id 
                    ? 'bg-blue-100 dark:bg-blue-800/30' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <type.icon className={`w-5 h-5 ${
                    editType === type.id 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">{type.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{type.description}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Operation Selection */}
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
            Operation
          </label>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setOperation('add')}
              className={`flex items-center justify-center space-x-2 p-4 rounded-xl border-2 transition-all font-semibold ${
                operation === 'add'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400 text-green-700 dark:text-green-400'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>{editType === 'sets' ? 'Add' : 'Increase'}</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setOperation('subtract')}
              className={`flex items-center justify-center space-x-2 p-4 rounded-xl border-2 transition-all font-semibold ${
                operation === 'subtract'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400 text-red-700 dark:text-red-400'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Minus className="w-5 h-5" />
              <span>{editType === 'sets' ? 'Remove' : 'Decrease'}</span>
            </motion.button>
          </div>
        </div>

        {/* Value Selector */}
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
            Amount
          </label>
          {editType === 'weight' && (
            <NumberPicker
              label=""
              value={value}
              onChange={setValue}
              min={2.5}
              max={50}
              step={2.5}
              quickIncrements={[-10, -5, -2.5, 2.5, 5, 10]}
              unit="kg"
            />
          )}
          {editType === 'reps' && (
            <NumberPicker
              label=""
              value={value}
              onChange={setValue}
              min={1}
              max={20}
              quickIncrements={[-5, -2, -1, 1, 2, 5]}
              unit="reps"
            />
          )}
          {editType === 'sets' && (
            <NumberPicker
              label=""
              value={value}
              onChange={setValue}
              min={1}
              max={5}
              quickIncrements={[-1, 1]}
              unit="set(s)"
            />
          )}
        </div>

        {/* Preview */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-blue-900 dark:text-blue-200">Preview</span>
          </div>
          <p className="text-blue-800 dark:text-blue-300 font-medium">
            {getPreviewText()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleApply}
            className="flex-1"
          >
            Apply Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BatchEditModal;
