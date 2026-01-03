import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

const NumberPicker = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  quickIncrements = [],
  unit = '',
  className = ''
}) => {
  const [inputValue, setInputValue] = useState(value || 0);

  const handleIncrement = () => {
    const newValue = Math.min(max, (inputValue || 0) + step);
    setInputValue(newValue);
    onChange(newValue);
    vibrate();
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, (inputValue || 0) - step);
    setInputValue(newValue);
    onChange(newValue);
    vibrate();
  };

  const handleQuickChange = (amount) => {
    const newValue = Math.max(min, Math.min(max, (inputValue || 0) + amount));
    setInputValue(newValue);
    onChange(newValue);
    vibrate();
  };

  const handleInputChange = (e) => {
    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
    if (!isNaN(val) && val >= min && val <= max) {
      setInputValue(val);
      onChange(val);
    }
  };

  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="flex items-center space-x-2">
        {/* Decrement Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDecrement}
          className="flex items-center justify-center w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-xl active:bg-gray-400 transition-colors"
          type="button"
        >
          <Minus className="w-5 h-5 text-gray-700" />
        </motion.button>

        {/* Value Display */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-xl h-12 px-4">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            className="w-full text-center text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none appearance-none"
            style={{ MozAppearance: 'textfield' }}
          />
          {unit && <span className="ml-2 text-sm font-semibold text-gray-600">{unit}</span>}
        </div>

        {/* Increment Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleIncrement}
          className="flex items-center justify-center w-12 h-12 bg-primary-600 hover:bg-primary-700 rounded-xl active:bg-primary-800 transition-colors"
          type="button"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Quick Increment Buttons */}
      {quickIncrements.length > 0 && (
        <div className="flex items-center justify-center space-x-2 mt-3">
          {quickIncrements.map((inc) => (
            <motion.button
              key={inc}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickChange(inc)}
              className="px-3 py-1.5 text-sm font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg active:bg-gray-400 transition-colors"
              type="button"
            >
              {inc > 0 ? '+' : ''}{inc}{unit}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NumberPicker;
