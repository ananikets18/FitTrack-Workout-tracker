import { searchExercises, getCategoryForExercise, isIsometricExercise, exerciseLibrary } from '../data/exercises';

// ============================================
// VOICE → WORKOUT PARSER
// ============================================
// Converts spoken text like "bench press 12 reps 60 kg, 10 reps 70 kg"
// into structured exercise objects for the workout log.

/**
 * Build a flat list of all known exercises, sorted longest-first
 * so greedy matching picks the most specific name.
 */
const buildExerciseList = () => {
  const allExercises = [];
  for (const category of Object.keys(exerciseLibrary)) {
    for (const name of exerciseLibrary[category]) {
      allExercises.push(name);
    }
  }
  // Sort longest-first for greedy matching
  return allExercises.sort((a, b) => b.length - a.length);
};

const ALL_EXERCISES = buildExerciseList();

// ── helpers ────────────────────────────────────────────

/** Normalize text: lowercase, collapse whitespace, strip filler */
const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[,.](?!\d)/g, ' , ')    // space-pad commas (but not inside "1.5")
    .replace(/\band\s+then\b/g, ',')
    .replace(/\bthen\b/g, ',')
    .replace(/\bnext\b/g, ',')
    .replace(/\s+/g, ' ')
    .trim();

/** Try to extract a number immediately before a keyword */
const numberBefore = (text, keywords) => {
  for (const kw of keywords) {
    // Match patterns like "12 reps", "60 kg", "30 minutes"
    const re = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${kw}`, 'i');
    const m = text.match(re);
    if (m) return parseFloat(m[1]);
  }
  return null;
};



// ── exercise name matching ──────────────────────────────

/**
 * Greedy-match the exercise name at the start of the transcript.
 * Falls back to fuzzy search if no prefix match is found.
 *
 * @param {string} text – normalised transcript
 * @returns {{ name: string, category: string, remaining: string } | null}
 */
const matchExercise = (text) => {
  const lower = text.toLowerCase();

  // 1. Try exact prefix match (longest-first)
  for (const exercise of ALL_EXERCISES) {
    const exLower = exercise.toLowerCase();
    if (lower.startsWith(exLower)) {
      // Make sure the match ends at a word boundary
      const nextChar = lower[exLower.length];
      if (!nextChar || /[\s,]/.test(nextChar)) {
        const remaining = text.slice(exLower.length).trim();
        const category = getCategoryForExercise(exercise) || 'other';
        return { name: exercise, category, remaining };
      }
    }
  }

  // 2. Fuzzy search — take the first few words and search
  const words = text.split(/\s+/);
  for (let len = Math.min(words.length, 5); len >= 1; len--) {
    const candidate = words.slice(0, len).join(' ');
    const results = searchExercises(candidate);
    if (results.length > 0) {
      const bestMatch = results[0];
      const category = getCategoryForExercise(bestMatch) || 'other';
      // Remove the matched words from the text
      const remaining = words.slice(len).join(' ').trim();
      return { name: bestMatch, category, remaining };
    }
  }

  return null;
};

// ── set description parsing ─────────────────────────────

/**
 * Parse a single set description like "12 reps 60 kg" or "30 minutes"
 *
 * @param {string} text
 * @param {boolean} isCardio
 * @param {boolean} isIsometric
 * @returns {object} set data
 */
const parseSetSegment = (text, isCardio, isIsometric) => {
  const reps = numberBefore(text, ['reps', 'rep', 'repetitions']);
  const weight = numberBefore(text, ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms', 'pounds', 'lbs', 'lb']);
  const durationMins = numberBefore(text, ['minutes', 'minute', 'mins', 'min']);
  const durationSecs = numberBefore(text, ['seconds', 'second', 'secs', 'sec']);
  const incline = numberBefore(text, ['incline', 'percent', '%']);
  const speed = numberBefore(text, ['speed', 'km/h', 'kmph', 'kph']);

  // Also try "at" pattern: "12 at 60" → 12 reps, 60 kg
  let atWeight = null;
  let atReps = null;
  const atMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:at|@)\s*(\d+(?:\.\d+)?)/i);
  if (atMatch) {
    atReps = parseFloat(atMatch[1]);
    atWeight = parseFloat(atMatch[2]);
  }

  const duration = durationMins || durationSecs || null;
  const durationUnit = durationMins ? 'minutes' : durationSecs ? 'seconds' : null;

  if (isCardio) {
    return {
      reps: 0,
      weight: weight || atWeight || 0,
      duration: duration || 0,
      incline: incline || 0,
      speed: speed || 0,
      completed: false,
    };
  }

  if (isIsometric) {
    // For isometric, prefer duration; convert minutes to seconds if needed
    let holdDuration = duration || 0;
    if (durationUnit === 'minutes') {
      holdDuration = holdDuration * 60;
    }
    return {
      reps: 0,
      weight: weight || atWeight || 0,
      duration: holdDuration || 60, // default 60 seconds
      completed: false,
    };
  }

  // Standard strength exercise
  const finalReps = reps ?? atReps ?? null;
  const finalWeight = weight ?? atWeight ?? null;

  // If we only found bare numbers without keywords, try to infer
  if (finalReps === null && finalWeight === null) {
    const numbers = text.match(/\d+(?:\.\d+)?/g);
    if (numbers && numbers.length >= 2) {
      // First number = reps, second = weight (common spoken pattern)
      return {
        reps: parseInt(numbers[0]) || 0,
        weight: parseFloat(numbers[1]) || 0,
        completed: false,
      };
    } else if (numbers && numbers.length === 1) {
      // Single number — assume reps
      return {
        reps: parseInt(numbers[0]) || 0,
        weight: 0,
        completed: false,
      };
    }
  }

  return {
    reps: finalReps != null ? Math.round(finalReps) : 0,
    weight: finalWeight != null ? finalWeight : 0,
    completed: false,
  };
};

// ── main parser ─────────────────────────────────────────

/**
 * Parse a voice transcript into a structured exercise object.
 *
 * Supports:
 *   Uniform:   "bench press 4 sets 12 reps 60 kg"
 *   Varied:    "bench press 12 reps 60 kg, 10 reps 70 kg, 8 reps 80 kg"
 *   Cardio:    "treadmill 30 minutes"
 *   Isometric: "plank 3 sets 60 seconds"
 *   At-syntax: "squat 5 at 100, 5 at 100, 3 at 120"
 *
 * @param {string} rawTranscript – text from the speech recognition API
 * @returns {{ success: boolean, exercise?: object, error?: string }}
 */
export const parseVoiceTranscript = (rawTranscript) => {
  if (!rawTranscript || !rawTranscript.trim()) {
    return { success: false, error: 'No speech detected. Please try again.' };
  }

  const text = normalize(rawTranscript);

  // 1. Match exercise name
  const match = matchExercise(text);
  if (!match) {
    return {
      success: false,
      error: `Couldn't recognise the exercise name in: "${rawTranscript}"`,
      raw: rawTranscript,
    };
  }

  const { name, category, remaining } = match;
  const isCardio = category === 'cardio';
  const isIsometric = isIsometricExercise(name);

  // 2. Check for uniform pattern: "N sets ..." (e.g., "4 sets 12 reps 60 kg")
  const uniformMatch = remaining.match(/^(\d+)\s*sets?\b(.*)$/i);

  let sets = [];

  if (uniformMatch) {
    const setCount = parseInt(uniformMatch[1]) || 1;
    const setDescription = uniformMatch[2].trim();

    // Check if there's varied data after "N sets" (e.g., "4 sets 12 reps 60 kg , 10 reps 70 kg")
    const segments = setDescription.split(/\s*,\s*/).filter(s => s.trim());

    if (segments.length > 1) {
      // Varied sets after "N sets" — unusual but handle it
      sets = segments.map(seg => parseSetSegment(seg, isCardio, isIsometric));
    } else {
      // Uniform: all sets are the same
      const singleSet = parseSetSegment(setDescription, isCardio, isIsometric);
      sets = Array.from({ length: setCount }, () => ({ ...singleSet }));
    }
  } else {
    // 3. Check for varied sets separated by commas / "then" / "and"
    const segments = remaining.split(/\s*,\s*/).filter(s => s.trim());

    if (segments.length > 1) {
      // Multiple set descriptions
      sets = segments.map(seg => parseSetSegment(seg, isCardio, isIsometric));
    } else if (remaining.trim()) {
      // Single set description
      const singleSet = parseSetSegment(remaining, isCardio, isIsometric);

      // Check if there's a "sets" number embedded differently
      // e.g., "12 reps 60 kg 4 sets" (sets at the end)
      const endSetsMatch = remaining.match(/(\d+)\s*sets?\s*$/i);
      if (endSetsMatch) {
        const setCount = parseInt(endSetsMatch[1]) || 1;
        const cleanRemaining = remaining.replace(/\d+\s*sets?\s*$/i, '').trim();
        const cleanSet = parseSetSegment(cleanRemaining, isCardio, isIsometric);
        sets = Array.from({ length: setCount }, () => ({ ...cleanSet }));
      } else {
        sets = [singleSet];
      }
    } else {
      // No set data at all — create one empty set
      sets = [{
        reps: isCardio || isIsometric ? 0 : 10,
        weight: 0,
        duration: isCardio ? 30 : isIsometric ? 60 : undefined,
        completed: false,
      }];
    }
  }

  // Build the exercise object
  const exercise = {
    id: crypto.randomUUID(),
    name,
    category,
    sets: sets.map(set => {
      const cleaned = { ...set };
      // Remove undefined fields
      if (cleaned.duration === undefined || cleaned.duration === null) delete cleaned.duration;
      if (cleaned.incline === undefined || cleaned.incline === null || cleaned.incline === 0) delete cleaned.incline;
      if (cleaned.speed === undefined || cleaned.speed === null || cleaned.speed === 0) delete cleaned.speed;
      // Re-add for cardio
      if (isCardio) {
        cleaned.duration = cleaned.duration || 0;
        cleaned.reps = 0;
      }
      if (isIsometric) {
        cleaned.duration = cleaned.duration || 60;
        cleaned.reps = 0;
      }
      return cleaned;
    }),
    notes: '',
  };

  return { success: true, exercise };
};

/**
 * Format a parsed exercise into a human-readable summary for the toast.
 * e.g., "Bench Press — 4 sets: 12×60, 10×70, 8×80, 6×90 kg"
 */
export const formatParsedSummary = (exercise) => {
  if (!exercise) return '';

  const { name, sets, category } = exercise;
  const isCardio = category === 'cardio';
  const isIsometric = isIsometricExercise(name);

  if (isCardio) {
    const dur = sets[0]?.duration || 0;
    return `${name} — ${dur} mins`;
  }

  if (isIsometric) {
    const dur = sets[0]?.duration || 0;
    return `${name} — ${sets.length} × ${dur}s`;
  }

  // Check if all sets are identical
  const allSame = sets.every(s => s.reps === sets[0].reps && s.weight === sets[0].weight);

  if (allSame && sets.length > 1) {
    return `${name} — ${sets.length} × ${sets[0].reps} @ ${sets[0].weight}kg`;
  }

  const setDescriptions = sets.map(s => `${s.reps}×${s.weight}`).join(', ');
  return `${name} — ${setDescriptions} kg`;
};
