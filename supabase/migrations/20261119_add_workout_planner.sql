-- Daily checklists. Run once in the Supabase SQL Editor after schema.sql.
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload->'exercises') = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_date ON public.workout_plans(user_id, date);
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own workout plans" ON public.workout_plans;
CREATE POLICY "Own workout plans" ON public.workout_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plans TO authenticated;

-- One plan always writes the same workout ID. All child writes and the saved
-- checklist commit together, so retries never create a second history entry.
CREATE OR REPLACE FUNCTION public.save_planned_workout(p_plan_id UUID, p_payload JSONB, p_workout JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  owner_id UUID := auth.uid();
  exercise_row RECORD;
  set_row RECORD;
  exercise_id UUID;
BEGIN
  IF owner_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF jsonb_array_length(p_workout->'exercises') IS NULL OR jsonb_array_length(p_workout->'exercises') = 0 THEN
    RAISE EXCEPTION 'Complete at least one exercise';
  END IF;
  -- Use the workout's date rather than the server timezone's CURRENT_DATE.
  IF (p_workout->>'date')::timestamptz > now() + interval '1 day' THEN RAISE EXCEPTION 'Cannot finish a future workout'; END IF;

  -- The upsert locks this plan, serializing saves from multiple tabs/devices.
  INSERT INTO public.workout_plans(id, user_id, date, title, payload)
  VALUES (p_plan_id, owner_id, (p_payload->>'date')::date, left(p_payload->>'title', 100), p_payload)
  ON CONFLICT (id) DO UPDATE SET date = EXCLUDED.date, title = EXCLUDED.title, payload = EXCLUDED.payload;

  INSERT INTO public.workouts(id, user_id, type, name, date, duration, notes)
  VALUES (p_plan_id, owner_id, 'workout', left(p_workout->>'name', 100), (p_workout->>'date')::timestamptz,
    (p_workout->>'duration')::integer, left(p_workout->>'notes', 1000))
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, date = EXCLUDED.date, duration = EXCLUDED.duration, notes = EXCLUDED.notes;

  DELETE FROM public.exercises WHERE workout_id = p_plan_id;
  FOR exercise_row IN SELECT value, ordinality FROM jsonb_array_elements(p_workout->'exercises') WITH ORDINALITY LOOP
    INSERT INTO public.exercises(workout_id, name, category, notes, "order")
    VALUES (p_plan_id, left(exercise_row.value->>'name', 150), exercise_row.value->>'category', left(exercise_row.value->>'notes', 500), exercise_row.ordinality - 1)
    RETURNING id INTO exercise_id;
    FOR set_row IN SELECT value, ordinality FROM jsonb_array_elements(exercise_row.value->'sets') WITH ORDINALITY LOOP
      INSERT INTO public.sets(exercise_id, reps, weight, duration, speed, incline, completed, "order")
      VALUES (exercise_id, (set_row.value->>'reps')::integer, (set_row.value->>'weight')::numeric,
        (set_row.value->>'duration')::integer, (set_row.value->>'speed')::numeric, (set_row.value->>'incline')::numeric,
        true, set_row.ordinality - 1);
    END LOOP;
  END LOOP;
  RETURN p_plan_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_planned_workout(UUID, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_planned_workout(UUID, JSONB, JSONB) TO authenticated;
