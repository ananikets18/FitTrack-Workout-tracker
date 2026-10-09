export const exerciseLibrary = {
  chest: [
    // Flat + Incline Barbell — Flat Bench Press is barbell 20kg bar (renamed from Barbell Bench Press)
    'Flat Bench Press',
    'Incline Bench Press',
    // Dumbbell Press Variations
    'Incline Dumbbell Press',
    'Decline Dumbbell Press',
    'Decline Bench Press',
    // Fly Variations
    'Low Cable Fly',
    'High Cable Fly',
    'Pec Deck Fly',
    // Machine & Bodyweight
    'Machine Chest Press',
    'Push-ups'
  ],
  back: [
    // Deadlift Variations — kept (Deadlift 11x; other variants 0 logs removed)
    'Deadlift',
    // Lat Pulldown Variations — Wide = ex-Lat generic (15x), Medium = ex-Wide (14x)
    'Wide-Grip Lat Pulldown',
    'Medium-Grip Lat Pulldown',
    'Close-Grip Lat Pulldown',
    'Neutral-Grip Lat Pulldown',
    'Straight-Arm Pulldown',
    'Single-Arm Lat Pulldown',
    // Row Variations — kept (Barbell Row 1x removed, customs merged)
    'Bent-Over Barbell Row',
    'T-Bar Row',
    'Seated Cable Row',
    'Plate-Loaded Low Row',
    'Chest-Supported Row',
    // Pull-up Variations — kept (Pull-ups 8x; other variants 0 logs removed)
    'Pull-ups',
    // Other Back Exercises — Face Pull(s) live in shoulders as 'Face Pulls' (single canonical)
    'Rope Face Pulls',
    'Dumbbell Shrugs',
    'Hyperextension'
  ],
  shoulders: [
    // Overhead Press Variations — kept (audit: regularly tracked + template)
    'Dumbbell Shoulder Press',
    'Machine Shoulder Press',
    'Military Press',
    // Lateral Raise Variations — kept (incl. Machine Lateral Raise custom 2x)
    'Cable Lateral Raise',
    'Dumbbell Lateral Raise',
    'Machine Lateral Raise',
    'Leaning Lateral Raise',
    // Rear Delt Variations — kept
    'Rear Delt Fly',
    'Reverse Pec Deck',
    // Other — kept
    'Face Pulls'
  ],
  legs: [
    // Squat Variations — kept 6 (Sumo/Pause/Box/Overhead archived, 0 logs)
    'Squat',
    'Back Squat',
    'Front Squat',
    'Goblet Squat',
    'Hack Squat',
    'Bulgarian Split Squat',
    // Leg Press Variations — kept 2 (Wide/Narrow merged into variation metadata)
    'Leg Press',
    'Single-Leg Press',
    // Lunge Variations — singular canonical (plurals merged; Dumbbell/Barbell removed, 0 logs)
    'Lunge',
    'Walking Lunge',
    'Reverse Lunge',
    'Forward Lunge',
    'Lateral Lunge',
    // Hamstring Exercises — RDL/Hamstring Curls/Nordic Curls merged into singular canonical
    'Romanian Deadlift',
    'Leg Curl',
    'Lying Leg Curl',
    'Seated Leg Curl',
    'Hamstring Curl',
    'Nordic Curl',
    // Quad Exercises
    'Leg Extension',
    'Single-Leg Extension',
    // Calf Exercises — Calf Raises merged into Calf Raise; Single-Leg/Donkey archived
    'Calf Raise',
    'Standing Calf Raise',
    'Seated Calf Raise',
    'Leg Press Calf Raise',
    // Other Leg Exercises — plurals merged; Good Morning kept
    'Step-Up',
    'Glute Bridge',
    'Hip Thrust',
    'Good Morning'
  ],
  arms: [
    // Bicep Curl Variations
    'Bicep Curl',
    'Barbell Curl',
    'EZ-Bar Curl',
    'Dumbbell Curl',
    'Alternating Dumbbell Curl',
    'Hammer Curl',
    'Cross-Body Hammer Curl',
    'Preacher Curl',
    'EZ-Bar Preacher Curl',
    'Dumbbell Preacher Curl',
    'Incline Dumbbell Curl',
    'Incline Curl',
    'Concentration Curl',
    'Cable Curl',
    'High Cable Curl',
    'Low Cable Curl',
    'Rope Cable Curl',
    'Spider Curl',
    'Zottman Curl',
    '21s Curl',
    '21s',
    // Tricep Extension Variations
    'Tricep Extension',
    'Tricep Pushdown',
    'Rope Tricep Pushdown',
    'V-Bar Tricep Pushdown',
    'Single-Arm Tricep Pushdown',
    'Overhead Tricep Extension',
    'Dumbbell Tricep Extension',
    'Cable Tricep Extension',
    'Rope Overhead Extension',
    'Skull Crusher',
    'Skull Crushers',
    'EZ-Bar Skull Crusher',
    'EZ-Bar Skull Crushers',
    'Dumbbell Skull Crusher',
    'Dumbbell Skull Crushers',
    'Close-Grip Bench Press',
    'Close Grip Bench Press',
    'Tricep Dip',
    'Tricep Dips',
    'Bench Dip',
    'Bench Dips',
    'Diamond Push-up',
    'Diamond Push-ups',
    'Kickback',
    'Kickbacks',
    'Dumbbell Kickback',
    'Dumbbell Kickbacks',
    'Tricep Kickback',
    'Tricep Kickbacks'
  ],
  core: [
    // Plank Variations
    'Plank',
    'Front Plank',
    'Side Plank',
    'Plank with Shoulder Taps',
    'Plank to Push-up',
    'Reverse Plank',
    // Crunch Variations
    'Crunch',
    'Crunches',
    'Bicycle Crunch',
    'Bicycle Crunches',
    'Reverse Crunch',
    'Reverse Crunches',
    'Oblique Crunch',
    'Oblique Crunches',
    'Cable Crunch',
    'Cable Crunches',
    'Rope Crunch',
    'Rope Crunches',
    'Decline Crunch',
    'Decline Crunches',
    // Leg Raise Variations
    'Leg Raise',
    'Leg Raises',
    'Lying Leg Raise',
    'Lying Leg Raises',
    'Hanging Leg Raise',
    'Hanging Leg Raises',
    'Hanging Knee Raise',
    'Hanging Knee Raises',
    'Captain\'s Chair Leg Raise',
    'Captain\'s Chair Leg Raises',
    // Other Core Exercises
    'Russian Twist',
    'Russian Twists',
    'Weighted Russian Twist',
    'Weighted Russian Twists',
    'Ab Wheel',
    'Ab Wheel Rollout',
    'Mountain Climber',
    'Mountain Climbers',
    'Dead Bug',
    'Bird Dog',
    'Pallof Press',
    'Wood Chopper',
    'Wood Choppers',
    'Cable Wood Chopper',
    'Cable Wood Choppers',
    'Sit-up',
    'Sit-ups',
    'V-up',
    'V-ups',
    'Toe Touch',
    'Toe Touches',
    'Abs Workout'
  ],
  cardio: [
    // Running Variations
    'Running',
    'Treadmill',
    'Treadmill Running',
    'Incline Treadmill',
    'Sprint Intervals',
    'HIIT Running',
    // Cycling Variations
    'Cycling',
    'Stationary Bike',
    'Spin Bike',
    'Air Bike',
    'Assault Bike',
    // Rowing
    'Rowing',
    'Rowing Machine',
    'Concept2 Rowing',
    // Other Cardio
    'Elliptical',
    'Stair Climber',
    'StairMaster',
    'Jump Rope',
    'Double Unders',
    'Swimming',
    'Burpees',
    'High Knees',
    'Jumping Jacks',
    'Box Jumps',
    'Battle Ropes'
  ],
  forearms: [
    // Wrist Curl Variations (Flexors)
    'Wrist Curl',
    'Wrist Curls',
    'Barbell Wrist Curl',
    'Barbell Wrist Curls',
    'Dumbbell Wrist Curl',
    'Dumbbell Wrist Curls',
    'Cable Wrist Curl',
    'Cable Wrist Curls',
    'Behind-the-Back Wrist Curl',
    'Behind-the-Back Barbell Wrist Curl',
    'Seated Wrist Curl',
    'Seated Barbell Wrist Curl',
    // Reverse Curl Variations (Extensors)
    'Reverse Curl',
    'Reverse Curls',
    'Barbell Reverse Curl',
    'Barbell Reverse Curls',
    'Dumbbell Reverse Curl',
    'Dumbbell Reverse Curls',
    'Cable Reverse Curl',
    'Cable Reverse Curls',
    'EZ-Bar Reverse Curl',
    'EZ-Bar Reverse Curls',
    'Reverse Wrist Curl',
    'Reverse Wrist Curls',
    // Hammer Curl Variations (Brachioradialis)
    'Hammer Curl',
    'Hammer Curls',
    'Dumbbell Hammer Curl',
    'Dumbbell Hammer Curls',
    'Cable Hammer Curl',
    'Cable Hammer Curls',
    'Rope Hammer Curl',
    'Rope Hammer Curls',
    'Cross-Body Hammer Curl',
    'Cross-Body Hammer Curls',
    // Grip & Pinch Training
    'Farmer\'s Walk',
    'Farmers Walk',
    'Single-Arm Farmer\'s Walk',
    'Plate Pinch',
    'Plate Pinches',
    'Towel Pull-up',
    'Towel Pull-ups',
    'Fat Bar Curl',
    'Fat Bar Curls',
    'Thick Bar Curl',
    'Thick Bar Curls',
    'Dead Hang',
    'Dead Hangs',
    'Weighted Dead Hang',
    'Grip Trainer',
    'Hand Gripper',
    // Rolling & Rotation
    'Wrist Roller',
    'Forearm Roller',
    'Pronation Curl',
    'Supination Curl',
    'Wrist Rotation',
    'Forearm Rotation',
    // Other Forearm Exercises
    'Zottman Curl',
    'Zottman Curls',
    'Forearm Curl',
    'Forearm Curls',
    'Forearm Extension',
    'Forearm Extensions',
  ],
  other: [
    'Farmers Walk',
    'Single-Arm Farmers Walk',
    'Battle Ropes',
    'Alternating Battle Ropes',
    'Box Jumps',
    'Kettlebell Swings',
    'Single-Arm Kettlebell Swing',
    'Sled Push',
    'Sled Pull',
    'Turkish Get-up',
    'Medicine Ball Slams',
    'Wall Balls',
    'Tire Flips',
    'Prowler Push',
    'Sandbag Carries'
  ]
};

// Flatten all exercises into a single array for search
export const allExercises = Object.values(exerciseLibrary).flat().sort();

// Get exercises by category
export const getExercisesByCategory = (category) => {
  return exerciseLibrary[category] || [];
};

// Search exercises - case insensitive with space handling
export const searchExercises = (query, category = null) => {
  if (!query || query.trim() === '') return [];

  const searchList = category ? getExercisesByCategory(category) : allExercises;
  const lowerQuery = query.toLowerCase().trim();

  // Filter exercises that contain the search query
  const results = searchList.filter(exercise => {
    const lowerExercise = exercise.toLowerCase();
    return lowerExercise.includes(lowerQuery);
  });

  // Sort results: exact matches first, then starts-with, then contains
  return results.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    // Exact match
    if (aLower === lowerQuery) return -1;
    if (bLower === lowerQuery) return 1;

    // Starts with query
    if (aLower.startsWith(lowerQuery) && !bLower.startsWith(lowerQuery)) return -1;
    if (bLower.startsWith(lowerQuery) && !aLower.startsWith(lowerQuery)) return 1;

    // Alphabetical for the rest
    return a.localeCompare(b);
  });
};

// Get category for a specific exercise
export const getCategoryForExercise = (exerciseName) => {
  for (const [category, exercises] of Object.entries(exerciseLibrary)) {
    if (exercises.some(ex => ex.toLowerCase() === exerciseName.toLowerCase())) {
      return category;
    }
  }
  return null; // Return null if not found
};

// ============================================
// BARBELL EQUIPMENT DETECTION
// ============================================

// The gym barbell/rod itself weighs 20 kg.
// These exercises are performed with that barbell — users log only the
// extra PLATE LOAD they added on top of the bar.
//
// Bench Press variants: any "bench press" / "barbell press" that is barbell-based
// (flat bench press, incline, decline barbell — but NOT dumbbell or machine)
//
// Deadlift variants: all deadlift forms (conventional, Romanian, sumo,
// stiff-leg, trap bar) — they all use the same standard barbell.

const BARBELL_BENCH_PRESS_PATTERNS = [
  'bench press',
  'barbell bench press',
  'flat bench press',
  'flat barbell press',
  'incline bench press',
  'incline barbell press',
  'decline bench press',
  'decline barbell press',
  'close-grip bench press',
  'wide-grip bench press',
];

const BARBELL_DEADLIFT_PATTERNS = [
  'deadlift',
  'romanian deadlift',
  'sumo deadlift',
  'stiff-leg deadlift',
  'stiff leg deadlift',
  'trap bar deadlift',
];

/**
 * Returns true when the named exercise uses the 20 kg gym barbell,
 * meaning the user's weight input is plate-load only (not total weight).
 *
 * Rules:
 *  - Barbell bench press family: name contains "bench press" but is NOT
 *    a dumbbell or machine variant.
 *  - Deadlift family: all deadlift forms use the standard barbell
 *    (matches header doc above; previously missing = doc/code drift).
 */
export const isBarbellExercise = (exerciseName) => {
  if (!exerciseName) return false;
  const lower = exerciseName.toLowerCase().trim();

  // Check bench press patterns — but exclude dumbbell / machine / incline variants
  const isExcludedVariant =
    lower.includes('dumbbell') ||
    lower.includes('machine') ||
    lower.startsWith('db ');

  if (!isExcludedVariant && BARBELL_BENCH_PRESS_PATTERNS.some(p => lower.includes(p))) {
    return true;
  }

  if (!isExcludedVariant && BARBELL_DEADLIFT_PATTERNS.some(p => lower.includes(p))) {
    return true;
  }

  return false;
};

/**
 * Returns the TRUE total weight lifted (in kg) for a set of a given exercise.
 *
 * - For barbell exercises: plateLoad + 20 kg barbell
 * - For everything else:   the weight as entered
 *
 * @param {number} plateWeight  - The weight the user logged (plates only for barbell moves)
 * @param {string} exerciseName - Name of the exercise
 * @param {number} barbellKg    - Weight of the barbell (default 20 kg)
 * @returns {number} The effective / total lifted weight
 */
export const getEffectiveWeight = (plateWeightPerSide, exerciseName, barbellKg = 20) => {
  const platePerSide = parseFloat(plateWeightPerSide) || 0;
  if (isBarbellExercise(exerciseName)) {
    return (platePerSide * 2) + barbellKg;
  }
  return platePerSide;
};

/**
 * Returns true if the exercise is an isometric hold (e.g. Plank, Wall Sit),
 * where duration is tracked instead of reps.
 */
export const isIsometricExercise = (exerciseName) => {
  if (!exerciseName) return false;
  const lower = exerciseName.toLowerCase().trim();
  return lower.includes('plank') || lower.includes('wall sit') || lower.includes('l-sit') || lower.includes('hold');
};
