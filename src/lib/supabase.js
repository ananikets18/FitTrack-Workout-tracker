import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.MODE === 'production') {
    // In production, throw error - app cannot function without credentials
    throw new Error('Missing Supabase configuration. Please contact support.');
  } else {
    // In development, log warning
    console.error('⚠️ Missing Supabase environment variables. Check your .env file.');
  }
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  throw new Error('Invalid Supabase URL format');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

// Database helper functions
export const db = {
  // Workouts
  async getWorkouts(userId) {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        exercises (
          *,
          sets (*)
        ),
        rest_day_activities (*)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createWorkout(workout, userId) {
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        type: workout.type || 'workout',
        name: workout.name,
        date: workout.date,
        duration: workout.duration,
        notes: workout.notes,
      })
      .select()
      .single();

    if (workoutError) throw workoutError;

    // Handle rest day activities
    if (workout.type === 'rest_day' && workout.activities?.length > 0) {
      const { error: activitiesError } = await supabase
        .from('rest_day_activities')
        .insert(
          workout.activities.map((activity) => ({
            workout_id: workoutData.id,
            activity,
            recovery_quality: workout.recoveryQuality || 3,
          }))
        );

      if (activitiesError) throw activitiesError;
    }

    // Handle exercises for regular workouts
    if (workout.exercises?.length > 0) {
      for (let i = 0; i < workout.exercises.length; i++) {
        const exercise = workout.exercises[i];
        
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercises')
          .insert({
            workout_id: workoutData.id,
            name: exercise.name,
            category: exercise.category,
            notes: exercise.notes,
            order: i,
          })
          .select()
          .single();

        if (exerciseError) throw exerciseError;

        // Insert sets
        if (exercise.sets?.length > 0) {
          const { error: setsError } = await supabase
            .from('sets')
            .insert(
              exercise.sets.map((set, setIndex) => ({
                exercise_id: exerciseData.id,
                reps: set.reps,
                weight: set.weight,
                completed: set.completed || false,
                order: setIndex,
              }))
            );

          if (setsError) throw setsError;
        }
      }
    }

    return workoutData;
  },

  async updateWorkout(workoutId, workout, userId) {
    // Update main workout
    const { error: workoutError } = await supabase
      .from('workouts')
      .update({
        name: workout.name,
        date: workout.date,
        duration: workout.duration,
        notes: workout.notes,
      })
      .eq('id', workoutId)
      .eq('user_id', userId);

    if (workoutError) throw workoutError;

    // Delete existing exercises and sets (cascade will handle sets)
    await supabase.from('exercises').delete().eq('workout_id', workoutId);

    // Re-insert exercises and sets
    if (workout.exercises?.length > 0) {
      for (let i = 0; i < workout.exercises.length; i++) {
        const exercise = workout.exercises[i];
        
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercises')
          .insert({
            workout_id: workoutId,
            name: exercise.name,
            category: exercise.category,
            notes: exercise.notes,
            order: i,
          })
          .select()
          .single();

        if (exerciseError) throw exerciseError;

        if (exercise.sets?.length > 0) {
          const { error: setsError } = await supabase
            .from('sets')
            .insert(
              exercise.sets.map((set, setIndex) => ({
                exercise_id: exerciseData.id,
                reps: set.reps,
                weight: set.weight,
                completed: set.completed || false,
                order: setIndex,
              }))
            );

          if (setsError) throw setsError;
        }
      }
    }

    return { id: workoutId };
  },

  async deleteWorkout(workoutId, userId) {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId)
      .eq('user_id', userId);

    if (error) throw error;
    return { id: workoutId };
  },

  // Templates
  async getTemplates(userId) {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTemplate(template, userId) {
    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: userId,
        name: template.name,
        duration: template.duration,
        exercises: template.exercises, // Store as JSONB
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTemplate(templateId, userId) {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId);

    if (error) throw error;
    return { id: templateId };
  },

  // Real-time subscriptions
  subscribeToWorkouts(userId, callback) {
    const subscription = supabase
      .channel('workouts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workouts',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    return subscription;
  },
};

// Helper to transform Supabase data to app format
export const transformWorkoutFromDB = (workout) => {
  if (!workout) return null;

  // Handle rest days
  if (workout.type === 'rest_day') {
    return {
      id: workout.id,
      type: 'rest_day',
      date: workout.date,
      notes: workout.notes,
      recoveryQuality: workout.rest_day_activities?.[0]?.recovery_quality || 3,
      activities: workout.rest_day_activities?.map((a) => a.activity) || [],
      createdAt: workout.created_at,
    };
  }

  // Handle regular workouts
  return {
    id: workout.id,
    name: workout.name,
    date: workout.date,
    duration: workout.duration,
    notes: workout.notes,
    exercises: workout.exercises
      ?.sort((a, b) => a.order - b.order)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        notes: exercise.notes,
        sets: exercise.sets
          ?.sort((a, b) => a.order - b.order)
          .map((set) => ({
            reps: set.reps,
            weight: set.weight,
            completed: set.completed,
          })) || [],
      })) || [],
    createdAt: workout.created_at,
  };
};
