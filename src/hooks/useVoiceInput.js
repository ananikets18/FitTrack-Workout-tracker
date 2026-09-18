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
const useVoiceInput = ({
  lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US',
  continuous = false,
  silenceTimeout = 3500,
} = {}) => {
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

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Reset state
    setError(null);
    setTranscript('');
    setInterimText('');

    // Pre-flight microphone permission check if mediaDevices is available
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release the audio track so SpeechRecognition can bind cleanly
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone permission denied. Please allow mic access in your browser.');
          return;
        }
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No microphone found. Please connect a microphone or use text input.');
          return;
        }
      }
    }

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
        setError('Microphone permission denied. Please allow mic access in your browser and Windows privacy settings.');
      } else if (event.error === 'audio-capture') {
        setError('Microphone is busy or unavailable.');
      } else if (event.error === 'network') {
        const isBrave =
          typeof navigator !== 'undefined' &&
          (Boolean(navigator.brave) ||
            Boolean(navigator.userAgentData?.brands?.some((b) => b.brand === 'Brave')));

        if (isBrave) {
          setError('Brave blocks Google Speech Services by default. Enable it at brave://settings/system ("Use Google services for speech recognition"), or use text input below.');
        } else {
          setError('Speech service unreachable. Ensure microphone access is allowed, check for VPN/firewall blocks, or use text input below.');
        }
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
