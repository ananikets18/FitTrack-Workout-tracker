import { useState, useEffect, useRef, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';

const RestTimer = ({
  isOpen,
  onClose,
  defaultDuration = 90,
  onComplete
}) => {
  const [timeLeft, setTimeLeft] = useState(defaultDuration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // Use defaultDuration directly instead of state
  const initialTime = defaultDuration;

  // Helper functions defined before useEffect
  const playBeep = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDiL0vLTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXyzoU1Bxtr...');
    audio.volume = 0.3;
    audio.play().catch(() => { });
  };

  const playCompleteSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDiL0vLTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXyzoU1Bxtr...');
    audio.volume = 0.5;
    audio.play().catch(() => { });
  };

  const vibrate = (pattern) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    vibrate([200, 100, 200, 100, 200]);
    playCompleteSound();
    if (onComplete) onComplete();
  }, [onComplete]);

  // Reset timer when modal opens - using a separate effect for timer management
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect  
      setIsRunning(true);
    }
    return () => {
      if (!isOpen) {
        setIsRunning(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    };
  }, [isOpen]);

  // Reset time when opening
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(defaultDuration);
    }
  }, [isOpen, defaultDuration]);


  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }

          // Beep at 10, 5, 4, 3, 2, 1 seconds
          if (prev === 10 || prev <= 5) {
            playBeep();
            vibrate(prev <= 3 ? [100] : [50]);
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    vibrate(30);
  };

  const resetTimer = () => {
    setTimeLeft(initialTime);
    setIsRunning(true);
    vibrate(50);
  };

  const adjustTime = (seconds) => {
    setTimeLeft((prev) => Math.max(0, prev + seconds));
    vibrate(30);
  };

  const setPreset = (seconds) => {
    setTimeLeft(seconds);
    setIsRunning(true);
    vibrate(50);
  };

  const presets = [
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
    { label: '90s', value: 90 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 },
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Timer Card */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 pb-safe"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Rest Timer</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Timer Display */}
              <div className="relative flex items-center justify-center mb-8">
                {/* Progress Ring */}
                <svg className="absolute w-64 h-64 -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke={timeLeft <= 10 ? '#ef4444' : '#0284c7'}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                    transition={{ duration: 0.5 }}
                  />
                </svg>

                {/* Time Text */}
                <div className="text-center">
                  <div className={`text-6xl font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-primary-600'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-gray-500 mt-2">
                    {isRunning ? 'Resting...' : 'Paused'}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => adjustTime(-30)}
                  className="flex items-center justify-center w-14 h-14 bg-gray-200 hover:bg-gray-300 rounded-full"
                >
                  <Minus className="w-5 h-5 text-gray-700" />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleTimer}
                  className="flex items-center justify-center w-20 h-20 bg-primary-600 hover:bg-primary-700 rounded-full shadow-lg"
                >
                  {isRunning ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-1" />
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => adjustTime(30)}
                  className="flex items-center justify-center w-14 h-14 bg-gray-200 hover:bg-gray-300 rounded-full"
                >
                  <Plus className="w-5 h-5 text-gray-700" />
                </motion.button>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                {/* Preset Buttons */}
                <div className="flex items-center justify-center gap-2">
                  {presets.map((preset) => (
                    <motion.button
                      key={preset.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPreset(preset.value)}
                      className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        timeLeft === preset.value && !isRunning
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {preset.label}
                    </motion.button>
                  ))}
                </div>

                {/* Reset and Skip */}
                <div className="flex items-center justify-center space-x-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={resetTimer}
                    className="flex items-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl font-semibold text-white"
                  >
                    Skip Rest
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


export default RestTimer;

