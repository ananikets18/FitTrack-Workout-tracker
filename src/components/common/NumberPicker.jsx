import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

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

  // Sync internal state with prop changes
  useEffect(() => {
    setInputValue(value || 0);
  }, [value]);

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
        <label className="text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
          {label}
        </label>
      )}

      <div className="flex items-center space-x-1.5 md:space-x-2">
        {/* Decrement Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDecrement}
          className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-gray-200 hover:bg-gray-300 rounded-lg md:rounded-xl active:bg-gray-400 transition-colors flex-shrink-0"
          type="button"
        >
          <Minus className="w-4 h-4 text-gray-700" />
        </motion.button>

        {/* Value Display */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg md:rounded-xl h-9 md:h-10 px-2 md:px-3 min-w-0">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            className="w-full text-center text-lg md:text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none appearance-none"
            style={{ MozAppearance: 'textfield' }}
          />
          {unit && <span className="ml-1 text-xs md:text-sm font-semibold text-gray-600 flex-shrink-0">{unit}</span>}
        </div>

        {/* Increment Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleIncrement}
          className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-primary-600 hover:bg-primary-700 rounded-lg md:rounded-xl active:bg-primary-800 transition-colors flex-shrink-0"
          type="button"
        >
          <Plus className="w-4 h-4 text-white" />
        </motion.button>
      </div>

      {/* Quick Increment Buttons */}
      {quickIncrements.length > 0 && (
        <div className="flex items-center justify-center flex-wrap gap-1.5 md:gap-2 mt-2">
          {quickIncrements.map((inc) => (
            <motion.button
              key={inc}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickChange(inc)}
              className="px-2 md:px-2.5 py-1 text-xs md:text-sm font-semibold bg-gray-200 hover:bg-gray-300 rounded-md active:bg-gray-400 transition-colors whitespace-nowrap"
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

