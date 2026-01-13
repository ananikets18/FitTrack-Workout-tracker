-- Migration: Add water intake tracking
-- Created: 2026-01-13

-- Create water_intake table
CREATE TABLE IF NOT EXISTS water_intake (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0, -- in milliliters
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_water_intake_user_id ON water_intake(user_id);
CREATE INDEX IF NOT EXISTS idx_water_intake_user_date ON water_intake(user_id, date);

-- Enable Row Level Security
ALTER TABLE water_intake ENABLE ROW LEVEL SECURITY;

-- Water Intake RLS Policies
CREATE POLICY "Users can view their own water intake"
  ON water_intake FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water intake"
  ON water_intake FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water intake"
  ON water_intake FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water intake"
  ON water_intake FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON water_intake
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions (if needed)
GRANT ALL ON water_intake TO authenticated;
GRANT ALL ON water_intake TO service_role;
