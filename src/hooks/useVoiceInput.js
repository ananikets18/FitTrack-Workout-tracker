import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook wrapping the browser's native Web Speech API.
 *
 * Returns:
 *   transcript      – final recognised text
 *   interimText     – live "still-listening" text (partial result)
 *   isListening     – whether the mic is active
 *   isSupported     – whether this browser supports SpeechRecognition
 *   error           – error message string (or null)
 *   startListening  – call to begin recognition
 *   stopListening   – call to end recognition
 *   resetTranscript – call to clear the transcript
 */
const useVoiceInput = ({ lang = 'en-US', continuous = true, silenceTimeout = 3000 } = {}) => {
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Detect browser support
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      // Auto-stop after silence
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    }, silenceTimeout);
  }, [silenceTimeout]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Reset state
    setError(null);
    setTranscript('');
    setInterimText('');

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      resetSilenceTimer();
    };

    recognition.onresult = (event) => {
      resetSilenceTimer();

      let finalText = '';
      let interim = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript(finalText.trim());
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      // 'no-speech' is not a real error — user just didn't say anything
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setError('Microphone permission denied. Please allow mic access.');
      } else if (event.error === 'network') {
        setError('Network error — voice input requires an internet connection.');
      } else {
        setError(`Voice error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setError('Failed to start voice recognition.');
      setIsListening(false);
    }
  }, [SpeechRecognition, isSupported, lang, continuous, resetSilenceTimer]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimText('');
    setError(null);
  }, []);

  return {
    transcript,
    interimText,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useVoiceInput;
