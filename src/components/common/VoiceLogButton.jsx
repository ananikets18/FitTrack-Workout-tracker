import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Check, RotateCcw, WifiOff, AlertCircle, Keyboard } from 'lucide-react';
import useVoiceInput from '../../hooks/useVoiceInput';
import { parseVoiceTranscript } from '../../utils/voiceParser';

/**
 * VoiceLogButton — Floating mic & quick-text button that records speech
 * or natural language text and parses it into structured exercise data.
 *
 * Props:
 *   onExerciseParsed(exercise)  – called when a valid exercise is parsed
 */
const VoiceLogButton = ({ onExerciseParsed }) => {
  const {
    transcript,
    interimText,
    isListening,
    isSupported,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({ silenceTimeout: 4000 });

  // Whether the user has dismissed/confirmed the latest result
  const [dismissed, setDismissed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track the transcript we last processed so we only parse once per new transcript
  const [lastProcessed, setLastProcessed] = useState('');

  // Fallback text input state
  const [manualText, setManualText] = useState('');
  const [manualResult, setManualResult] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Derive parsed result from transcript or manual input (no setState in effects)
  const parsedResult = useMemo(() => {
    if (manualResult) return manualResult;
    if (!transcript || isListening || dismissed) return null;
    if (transcript === lastProcessed) return null;
    const result = parseVoiceTranscript(transcript);
    return result;
  }, [manualResult, transcript, isListening, dismissed, lastProcessed]);

  // Derive the current stage from state
  const stage = useMemo(() => {
    if (isListening) return 'listening';
    if (showTextInput) return 'textInput';
    if (dismissed) return 'idle';
    if (voiceError) return 'error';
    if (parsedResult?.success) return 'preview';
    if (parsedResult && !parsedResult.success) return 'error';
    return 'idle';
  }, [isListening, showTextInput, dismissed, voiceError, parsedResult]);

  const displayError = useMemo(() => {
    if (voiceError) return voiceError;
    if (parsedResult && !parsedResult.success) return parsedResult.error;
    return null;
  }, [voiceError, parsedResult]);

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    if (!manualText.trim()) return;
    const result = parseVoiceTranscript(manualText.trim());
    setManualResult(result);
    setShowTextInput(false);
    setDismissed(false);
  };

  const handleMicClick = () => {
    if (!isSupported) {
      return;
    }

    if (!isOnline) {
      return;
    }

    setShowTextInput(false);

    if (isListening) {
      stopListening();
    } else {
      setDismissed(false);
      setManualResult(null);
      setLastProcessed('');
      startListening();
    }
  };

  const handleConfirm = () => {
    if (parsedResult?.exercise && onExerciseParsed) {
      onExerciseParsed(parsedResult.exercise);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    }
    handleDismiss();
  };

  const handleRetry = () => {
    resetTranscript();
    setManualResult(null);
    setShowTextInput(false);
    setDismissed(false);
    setLastProcessed('');
    setTimeout(() => startListening(), 300);
  };

  const handleDismiss = () => {
    setLastProcessed(transcript || '');
    setDismissed(true);
    setManualResult(null);
    setShowTextInput(false);
    resetTranscript();
    if (isListening) stopListening();
  };

  // Don't render if speech recognition is not supported at all
  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Floating Buttons Group */}
      <div className="fixed bottom-24 right-5 z-40 flex items-center space-x-2">
        {/* Quick Text Input Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (isListening) stopListening();
            setShowTextInput((prev) => !prev);
            setDismissed(false);
          }}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/95 text-gray-700 hover:text-indigo-600 shadow-md border border-gray-200 hover:border-indigo-300 transition-colors"
          title="Quick text entry"
          aria-label="Quick text entry"
        >
          <Keyboard className="w-5 h-5" />
        </motion.button>

        {/* Floating Mic Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleMicClick}
          className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors ${
            isListening
              ? 'bg-red-500 shadow-red-500/40'
              : !isOnline
                ? 'bg-gray-400'
                : 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-indigo-500/40'
          }`}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          {/* Pulse rings while listening */}
          {isListening && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full bg-red-400"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.span
                className="absolute inset-0 rounded-full bg-red-400"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
              />
            </>
          )}

          {/* Idle subtle pulse */}
          {stage === 'idle' && isOnline && (
            <motion.span
              className="absolute inset-0 rounded-full bg-indigo-400"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 1.2, opacity: [0, 0.3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {!isOnline ? (
            <WifiOff className="w-6 h-6 text-white relative z-10" />
          ) : isListening ? (
            <MicOff className="w-6 h-6 text-white relative z-10" />
          ) : (
            <Mic className="w-6 h-6 text-white relative z-10" />
          )}
        </motion.button>
      </div>

      {/* Quick Text Input Card */}
      <AnimatePresence>
        {stage === 'textInput' && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-40 right-5 left-5 z-50 max-w-md mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Keyboard className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Quick Workout Logger</h3>
                      <p className="text-xs text-gray-500">Type or paste natural language</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleManualSubmit} className="mt-3 space-y-3">
                  <div>
                    <input
                      type="text"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder='e.g. "bench press 4 sets 12 reps 60 kg"'
                      autoFocus
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-400"
                    />
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      Supports uniform sets, pyramid/varied sets (&ldquo;12 at 60, 10 at 70&rdquo;), or duration (&ldquo;plank 60s&rdquo;).
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={!manualText.trim()}
                      className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                    >
                      <span>Parse &amp; Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live transcript bubble (while listening) */}
      <AnimatePresence>
        {isListening && (interimText || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-40 right-5 left-5 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-md mx-auto"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <motion.div
                  className="w-3 h-3 rounded-full bg-red-500"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Listening...
                </p>
                <p className="text-gray-900 font-medium text-base">
                  {transcript || interimText}
                  {interimText && !transcript && (
                    <motion.span
                      className="inline-block w-0.5 h-4 bg-indigo-500 ml-1 align-text-bottom"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview card (after parsing) */}
      <AnimatePresence>
        {stage === 'preview' && parsedResult?.exercise && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-40 right-5 left-5 z-50 max-w-md mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mic className="w-4 h-4 text-white/80" />
                  <span className="text-white font-semibold text-sm">Voice Input</span>
                </div>
                <button onClick={handleDismiss} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Heard text */}
                <p className="text-xs text-gray-500 mb-1">I heard:</p>
                <p className="text-sm text-gray-600 italic mb-3 bg-gray-50 rounded-lg px-3 py-2">
                  &ldquo;{transcript}&rdquo;
                </p>

                {/* Parsed result */}
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-3 mb-3">
                  <h3 className="font-bold text-gray-900 text-lg">{parsedResult.exercise.name}</h3>
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full mt-1">
                    {parsedResult.exercise.category}
                  </span>

                  {/* Sets preview */}
                  <div className="mt-3 space-y-1.5">
                    {parsedResult.exercise.sets.map((set, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-2 text-sm bg-white/70 rounded-lg px-3 py-1.5"
                      >
                        <span className="font-bold text-indigo-600 w-6">S{i + 1}</span>
                        {parsedResult.exercise.category === 'cardio' ? (
                          <span className="text-gray-700">
                            {set.duration || 0} mins
                            {set.incline ? ` · ${set.incline}% incline` : ''}
                            {set.speed ? ` · ${set.speed} km/h` : ''}
                          </span>
                        ) : set.duration !== undefined ? (
                          <span className="text-gray-700">
                            {set.duration}s hold
                            {set.weight > 0 ? ` · ${set.weight}kg` : ''}
                          </span>
                        ) : (
                          <span className="text-gray-700">
                            <span className="font-semibold">{set.reps}</span> reps
                            {' × '}
                            <span className="font-semibold">{set.weight}</span> kg
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirm}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    <Check className="w-5 h-5" />
                    <span>Add Exercise</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRetry}
                    className="flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error card */}
      <AnimatePresence>
        {stage === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-40 right-5 left-5 z-50 max-w-md mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">
                      {voiceError ? 'Voice Connection Issue' : "Couldn't parse that"}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">{displayError}</p>
                    {!voiceError && (
                      <p className="text-xs text-gray-400 mt-2">
                        Try: &ldquo;bench press 3 sets 12 reps 60 kg&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRetry}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Mic Again</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDismiss}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Dismiss
                  </motion.button>
                </div>

                {/* Inline Text Fallback */}
                <div className="mt-3.5 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Keyboard className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Or type/paste your workout:</span>
                  </p>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder='e.g. "bench press 3 sets 12 reps 60 kg"'
                      className="flex-1 text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                    />
                    <button
                      type="submit"
                      disabled={!manualText.trim()}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl disabled:opacity-40 transition-colors shadow-sm"
                    >
                      Parse
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceLogButton;
