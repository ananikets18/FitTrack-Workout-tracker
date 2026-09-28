import { useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';
 
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
  const inputValue = useMemo(() => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0;
    return Math.max(min, Math.min(max, numericValue));
  }, [value, min, max]);

  const handleIncrement = () => {
    const newValue = Math.min(max, (inputValue || 0) + step);
    onChange(newValue);
    vibrate();
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, (inputValue || 0) - step);
    onChange(newValue);
    vibrate();
  };

  const handleQuickChange = (amount) => {
    const newValue = Math.max(min, Math.min(max, (inputValue || 0) + amount));
    onChange(newValue);
    vibrate();
  };

  const handleInputChange = (e) => {
    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
    if (!isNaN(val) && val >= min && val <= max) {
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
        <label className="text-[13px] md:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
          {label}
        </label>
      )}

      <div className="flex items-center space-x-1.5 md:space-x-2">
        {/* Decrement Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDecrement}
          aria-label={`Decrease ${label || 'value'}`}
          className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl active:bg-gray-400 transition-colors flex-shrink-0"
          type="button"
        >
          <Minus className="w-4 h-4 text-gray-700 dark:text-gray-200" aria-hidden="true" />
        </motion.button>

        {/* Value Display */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl h-11 md:h-12 px-2 md:px-3 min-w-0 transition-colors">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            aria-label={label || 'Value'}
            inputMode="decimal"
            className="w-full text-center text-lg md:text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none appearance-none min-h-[44px]"
            style={{ MozAppearance: 'textfield' }}
          />
          {unit && <span className="ml-1 text-[13px] md:text-sm font-semibold text-gray-600 dark:text-gray-400 flex-shrink-0">{unit}</span>}
        </div>

        {/* Increment Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleIncrement}
          aria-label={`Increase ${label || 'value'}`}
          className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 bg-primary-600 hover:bg-primary-700 rounded-xl active:bg-primary-800 transition-colors flex-shrink-0"
          type="button"
        >
          <Plus className="w-4 h-4 text-white" aria-hidden="true" />
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
              className="px-2.5 py-1.5 min-h-[36px] text-[13px] md:text-sm font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 rounded-lg active:bg-gray-400 transition-colors whitespace-nowrap"
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

