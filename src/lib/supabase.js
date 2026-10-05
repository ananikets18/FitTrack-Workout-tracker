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

// Custom storage adapter with error handling
const createSafeStorage = () => {
  try {
    // Test if localStorage is available and working
    const testKey = '__supabase_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (error) {
    console.warn('localStorage not available, using in-memory storage:', error);
    // Fallback to in-memory storage
    const memoryStorage = new Map();
    return {
      getItem: (key) => memoryStorage.get(key) || null,
      setItem: (key, value) => memoryStorage.set(key, value),
      removeItem: (key) => memoryStorage.delete(key),
    };
  }
};

// Create Supabase client with safe storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: createSafeStorage(),
    // Add storage key to avoid conflicts
    storageKey: 'fittrack-auth',
    // Disable flow type detection to avoid potential issues
    flowType: 'pkce',
  },
  // Add global options for better error handling
  global: {
    headers: {
      'X-Client-Info': 'fittrack-web',
    },
  },
  db: {
    schema: 'public',
  },
  // Disable realtime if it causes issues
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
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

    try {
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
                  reps: set.reps || 0,
                  weight: set.weight || 0,
                  duration: set.duration !== undefined && set.duration !== null && set.duration !== '' ? set.duration : null,
                  incline: set.incline !== undefined && set.incline !== null && set.incline !== '' ? set.incline : null,
                  speed: set.speed !== undefined && set.speed !== null && set.speed !== '' ? set.speed : null,
                  completed: set.completed || false,
                  order: setIndex,
                }))
              );

            if (setsError) throw setsError;
          }
        }
      }
    } catch (error) {
      const { error: rollbackError } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutData.id)
        .eq('user_id', userId);

      if (rollbackError) {
        console.error('Workout rollback failed after create error:', rollbackError);
      }

      throw error;
    }

    const { data: fullWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select(`
        *,
        exercises (
          *,
          sets (*)
        ),
        rest_day_activities (*)
      `)
      .eq('id', workoutData.id)
      .single();

    if (!fetchError && fullWorkout) {
      return fullWorkout;
    }

    return workoutData;
  },

  async createBulkRestDays(restDays, userId) {
    if (!restDays || restDays.length === 0) return [];

    const workoutsToInsert = restDays.map(rd => ({
      user_id: userId,
      type: 'rest_day',
      name: null,
      date: rd.date,
      duration: null,
      notes: (rd.notes || '').trim().slice(0, 1000) || null,
    }));

    const { data: createdWorkouts, error: workoutsError } = await supabase
      .from('workouts')
      .insert(workoutsToInsert)
      .select();

    if (workoutsError) throw workoutsError;

    // Handle rest_day_activities for all rest days that have activities
    const activitiesToInsert = [];
    createdWorkouts.forEach((workoutData, idx) => {
      const originalRd = restDays[idx];
      if (originalRd.activities && originalRd.activities.length > 0) {
        originalRd.activities.forEach(activity => {
          activitiesToInsert.push({
            workout_id: workoutData.id,
            activity,
            recovery_quality: Math.max(1, Math.min(5, parseInt(originalRd.recoveryQuality) || 3)),
          });
        });
      }
    });

    if (activitiesToInsert.length > 0) {
      const { error: activitiesError } = await supabase
        .from('rest_day_activities')
        .insert(activitiesToInsert);

      if (activitiesError) {
        console.error('Failed to insert rest day activities in bulk:', activitiesError);
      }
    }

    return createdWorkouts.map((w, idx) => {
      const originalRd = restDays[idx];
      return {
        id: w.id,
        type: 'rest_day',
        date: w.date,
        notes: w.notes,
        recoveryQuality: Math.max(1, Math.min(5, parseInt(originalRd.recoveryQuality) || 3)),
        activities: Array.isArray(originalRd.activities) ? originalRd.activities : [],
        createdAt: w.created_at,
      };
    });
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

    const normalizeNullable = (v) =>
      v !== undefined && v !== null && v !== '' ? v : null;

    // Fetch existing exercises + sets to diff (preserves stable IDs)
    const { data: existingExercises, error: fetchError } = await supabase
      .from('exercises')
      .select('id, sets (id)')
      .eq('workout_id', workoutId);

    if (fetchError) throw fetchError;

    const existingById = new Map((existingExercises || []).map((e) => [e.id, e]));
    const incomingExercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    const incomingIds = new Set(incomingExercises.map((e) => e.id).filter(Boolean));

    // Delete exercises removed on the client (cascade deletes their sets)
    const toDelete = (existingExercises || []).filter((e) => !incomingIds.has(e.id));
    for (const ex of toDelete) {
      const { error: delError } = await supabase.from('exercises').delete().eq('id', ex.id);
      if (delError) throw delError;
    }

    // Upsert exercises + sets
    for (let i = 0; i < incomingExercises.length; i++) {
      const exercise = incomingExercises[i];
      let exerciseId = exercise.id && existingById.has(exercise.id) ? exercise.id : null;

      if (exerciseId) {
        const { error: exUpdateError } = await supabase
          .from('exercises')
          .update({
            name: exercise.name,
            category: exercise.category,
            notes: exercise.notes,
            order: i,
          })
          .eq('id', exerciseId);
        if (exUpdateError) throw exUpdateError;
      } else {
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
        exerciseId = exerciseData.id;
      }

      const incomingSets = Array.isArray(exercise.sets) ? exercise.sets : [];
      const existingSetIds = new Set(
        (existingById.get(exerciseId)?.sets || []).map((s) => s.id)
      );
      const incomingSetIds = new Set(incomingSets.map((s) => s.id).filter(Boolean));

      // Delete removed sets
      for (const setId of existingSetIds) {
        if (!incomingSetIds.has(setId)) {
          const { error: delSetError } = await supabase.from('sets').delete().eq('id', setId);
          if (delSetError) throw delSetError;
        }
      }

      // Update existing sets, insert new ones
      for (let setIndex = 0; setIndex < incomingSets.length; setIndex++) {
        const set = incomingSets[setIndex];
        const payload = {
          reps: set.reps || 0,
          weight: set.weight || 0,
          duration: normalizeNullable(set.duration),
          incline: normalizeNullable(set.incline),
          speed: normalizeNullable(set.speed),
          completed: set.completed || false,
          order: setIndex,
        };
        if (set.id && existingSetIds.has(set.id)) {
          const { error: setUpdateError } = await supabase
            .from('sets')
            .update(payload)
            .eq('id', set.id);
          if (setUpdateError) throw setUpdateError;
        } else {
          const { error: setInsertError } = await supabase.from('sets').insert({
            exercise_id: exerciseId,
            ...payload,
          });
          if (setInsertError) throw setInsertError;
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

  async updateTemplate(templateId, userId, updates) {
    const payload = {
      name: updates.name,
      duration: updates.duration,
      exercises: updates.exercises,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('templates')
      .update(payload)
      .eq('id', templateId)
      .eq('user_id', userId)
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

  // User Preferences
  async getUserPreferences(userId) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist yet, return null (not an error)
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async upsertUserPreferences(userId, preferences) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        split: preferences.split,
        weekly_frequency: preferences.weeklyFrequency,
        volume_targets: preferences.volumeTargets,
        has_completed_setup: preferences.hasCompletedSetup,
        setup_completed_at: preferences.setupCompletedAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Feature availability cache
  _waterIntakeAvailable: null,

  // Check if water intake feature is available
  async checkWaterIntakeAvailable(userId) {
    // Return cached result if we've already checked
    if (this._waterIntakeAvailable !== null) {
      return this._waterIntakeAvailable;
    }

    try {
      // Try a simple query to check if table exists and is accessible
      const { error } = await supabase
        .from('water_intake')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      // If no error or just "no rows" error, table is available
      this._waterIntakeAvailable = !error || error.code === 'PGRST116';
      return this._waterIntakeAvailable;
    } catch {
      // Table doesn't exist or not accessible
      this._waterIntakeAvailable = false;
      return false;
    }
  },

  // Water Intake
  async getWaterIntake(userId, date) {
    // Check if feature is available first
    const isAvailable = await this.checkWaterIntakeAvailable(userId);
    if (!isAvailable) {
      return null;
    }

    const { data, error } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    if (error) {
      // If no record exists yet, return null (not an error)
      if (error.code === 'PGRST116') return null;
      // If table access error, mark as unavailable
      if (error.code === 'PGRST301' || error.code === '42P01') {
        this._waterIntakeAvailable = false;
      }
      throw error;
    }
    return data;
  },

  async upsertWaterIntake(userId, date, amount) {
    // Check if feature is available first
    const isAvailable = await this.checkWaterIntakeAvailable(userId);
    if (!isAvailable) {
      return null;
    }

    const { data, error } = await supabase
      .from('water_intake')
      .upsert({
        user_id: userId,
        date: date,
        amount: amount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();

    if (error) {
      // If table access error, mark as unavailable
      if (error.code === 'PGRST301' || error.code === '42P01') {
        this._waterIntakeAvailable = false;
      }
      throw error;
    }
    return data;
  },

  async getWaterIntakeHistory(userId, limit = 30) {
    // Check if feature is available first
    const isAvailable = await this.checkWaterIntakeAvailable(userId);
    if (!isAvailable) {
      return [];
    }

    const { data, error } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      // If table access error, mark as unavailable
      if (error.code === 'PGRST301' || error.code === '42P01') {
        this._waterIntakeAvailable = false;
      }
      throw error;
    }
    return data || [];
  },

  // Gym Sessions (1h 45m Gym Timer & Post-Gym Gameplan)
  _gymSessionsAvailable: null,

  async checkGymSessionsAvailable(userId) {
    if (this._gymSessionsAvailable !== null) {
      return this._gymSessionsAvailable;
    }
    try {
      const { error } = await supabase
        .from('gym_sessions')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      const isMissing =
        error &&
        (error.code === 'PGRST205' ||
          error.code === 'PGRST301' ||
          error.code === '42P01' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('schema cache'));

      this._gymSessionsAvailable = !isMissing;
      return this._gymSessionsAvailable;
    } catch {
      this._gymSessionsAvailable = false;
      return false;
    }
  },

  async getActiveOrTodayGymSession(userId, date) {
    const isAvailable = await this.checkGymSessionsAvailable(userId);
    if (!isAvailable) return null;

    const { data, error } = await supabase
      .from('gym_sessions')
      .select('*')
      .eq('user_id', userId)
      .or(`status.eq.active,date.eq.${date}`)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST301' || error.code === '42P01') {
        this._gymSessionsAvailable = false;
      }
      return null;
    }
    return data || null;
  },

  async createGymSession(userId, sessionPayload) {
    const isAvailable = await this.checkGymSessionsAvailable(userId);
    if (!isAvailable) return null;

    const { data, error } = await supabase
      .from('gym_sessions')
      .insert({
        user_id: userId,
        date: sessionPayload.date,
        start_time: sessionPayload.startTime,
        end_time: sessionPayload.endTime || null,
        target_minutes: sessionPayload.targetMinutes || 105,
        duration_minutes: sessionPayload.sessionDurationMinutes ?? null,
        extensions_used: sessionPayload.extensionsUsed || 0,
        status: sessionPayload.status || 'active',
        workout_logged: !!sessionPayload.workoutLogged,
        checked_tips: Array.isArray(sessionPayload.checkedTips) ? sessionPayload.checkedTips : [],
      })
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST301' || error.code === '42P01') {
        this._gymSessionsAvailable = false;
      }
      return null;
    }
    return data;
  },

  async updateGymSession(sessionId, userId, updates) {
    if (!sessionId) return null;
    const isAvailable = await this.checkGymSessionsAvailable(userId);
    if (!isAvailable) return null;

    const payload = {
      updated_at: new Date().toISOString(),
    };
    if (updates.endTime !== undefined) payload.end_time = updates.endTime;
    if (updates.targetMinutes !== undefined) payload.target_minutes = updates.targetMinutes;
    if (updates.sessionDurationMinutes !== undefined) payload.duration_minutes = updates.sessionDurationMinutes;
    if (updates.extensionsUsed !== undefined) payload.extensions_used = updates.extensionsUsed;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.workoutLogged !== undefined) payload.workout_logged = updates.workoutLogged;
    if (updates.checkedTips !== undefined) payload.checked_tips = updates.checkedTips;

    const { data, error } = await supabase
      .from('gym_sessions')
      .update(payload)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST301' || error.code === '42P01') {
        this._gymSessionsAvailable = false;
      }
      return null;
    }
    return data;
  },

  async getGymSessionHistory(userId, limit = 30) {
    const isAvailable = await this.checkGymSessionsAvailable(userId);
    if (!isAvailable) return [];

    const { data, error } = await supabase
      .from('gym_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }
    return data || [];
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
            id: set.id,
            reps: set.reps || 0,
            weight: set.weight || 0,
            duration: set.duration, // Include duration for cardio exercises
            incline: set.incline, // Include incline for treadmill
            speed: set.speed, // Include speed for treadmill
            completed: set.completed,
          })) || [],
      })) || [],
    createdAt: workout.created_at,
  };
};


