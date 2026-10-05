-- Migration: Add gym_sessions table for 1h 45m Gym Session Timer & Post-Gym Gameplan tracking
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS gym_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  target_minutes INTEGER NOT NULL DEFAULT 105,
  duration_minutes INTEGER,
  extensions_used INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  workout_logged BOOLEAN NOT NULL DEFAULT false,
  checked_tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookup by user and date/status
CREATE INDEX IF NOT EXISTS idx_gym_sessions_user_id ON gym_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_sessions_user_date ON gym_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_gym_sessions_user_status ON gym_sessions(user_id, status);

-- Enable Row Level Security (RLS)
ALTER TABLE gym_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gym_sessions' AND policyname = 'Users can view their own gym sessions'
  ) THEN
    CREATE POLICY "Users can view their own gym sessions"
      ON gym_sessions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gym_sessions' AND policyname = 'Users can insert their own gym sessions'
  ) THEN
    CREATE POLICY "Users can insert their own gym sessions"
      ON gym_sessions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gym_sessions' AND policyname = 'Users can update their own gym sessions'
  ) THEN
    CREATE POLICY "Users can update their own gym sessions"
      ON gym_sessions FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'gym_sessions' AND policyname = 'Users can delete their own gym sessions'
  ) THEN
    CREATE POLICY "Users can delete their own gym sessions"
      ON gym_sessions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON gym_sessions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON gym_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
