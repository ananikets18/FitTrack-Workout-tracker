export const exerciseLibrary = {
  chest: [
    'Barbell Bench Press',
    'Dumbbell Bench Press',
    'Incline Barbell Press',
    'Incline Dumbbell Press',
    'Decline Bench Press',
    'Chest Fly',
    'Cable Crossover',
    'Push-ups',
    'Dips',
    'Machine Chest Press',
    'Pec Deck Fly'
  ],
  back: [
    'Deadlift',
    'Pull-ups',
    'Chin-ups',
    'Barbell Row',
    'Dumbbell Row',
    'T-Bar Row',
    'Lat Pulldown',
    'Cable Row',
    'Face Pulls',
    'Shrugs',
    'Hyperextensions'
  ],
  shoulders: [
    'Overhead Press',
    'Military Press',
    'Dumbbell Shoulder Press',
    'Arnold Press',
    'Lateral Raise',
    'Front Raise',
    'Rear Delt Fly',
    'Upright Row',
    'Face Pulls',
    'Machine Shoulder Press'
  ],
  legs: [
    'Squat',
    'Front Squat',
    'Leg Press',
    'Romanian Deadlift',
    'Lunges',
    'Bulgarian Split Squat',
    'Leg Extension',
    'Leg Curl',
    'Hamstring Curls',
    'Calf Raises',
    'Seated Calf Raise',
    'Leg Press Calf Raise',
    'Hack Squat',
    'Goblet Squat'
  ],
  arms: [
    'Barbell Curl',
    'Dumbbell Curl',
    'Hammer Curl',
    'Preacher Curl',
    'Cable Curl',
    'Tricep Pushdown',
    'Overhead Tricep Extension',
    'Skull Crushers',
    'Dumbbell Tricep Extension',
    'Close-Grip Bench Press',
    'Concentration Curl',
    'Cable Tricep Extension'
  ],
  core: [
    'Plank',
    'Side Plank',
    'Crunches',
    'Bicycle Crunches',
    'Russian Twists',
    'Leg Raises',
    'Hanging Leg Raises',
    'Ab Wheel Rollout',
    'Cable Crunches',
    'Mountain Climbers',
    'Abs Workout',
    'Oblique Crunches'
  ],
  cardio: [
    'Running',
    'Treadmill',
    'Cycling',
    'Rowing',
    'Elliptical',
    'Jump Rope',
    'Stair Climber',
    'Swimming',
    'Burpees',
    'High Knees',
    'Cardio - Treadmill',
    'Cardio - Bike'
  ],
  other: [
    'Farmers Walk',
    'Battle Ropes',
    'Box Jumps',
    'Kettlebell Swings',
    'Sled Push',
    'Sled Pull',
    'Turkish Get-up'
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

