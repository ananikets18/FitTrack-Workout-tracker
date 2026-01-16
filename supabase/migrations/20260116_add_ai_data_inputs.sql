-- Migration: Add AI/ML Data Inputs (Sleep, Nutrition, Body Measurements, User Profile)
-- This enables advanced AI features like sleep-based recovery, nutrition insights, and body composition tracking

-- ============================================
-- 1. SLEEP TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_slept NUMERIC(3, 1) NOT NULL, -- e.g., 7.5 hours
  quality INTEGER NOT NULL CHECK (quality >= 1 AND quality <= 5), -- 1-5 scale
  sleep_start_time TIME, -- Optional: when went to bed
  sleep_end_time TIME, -- Optional: when woke up
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- 2. NUTRITION TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  calories INTEGER, -- Total daily calories
  protein NUMERIC(5, 1), -- grams
  carbs NUMERIC(5, 1), -- grams
  fats NUMERIC(5, 1), -- grams
  meal_type TEXT, -- breakfast, lunch, dinner, snack, or NULL for daily total
  meal_name TEXT, -- Optional: name of the meal
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. BODY MEASUREMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC(5, 2), -- kg
  body_fat_percentage NUMERIC(4, 2), -- Optional, e.g., 15.5%
  -- Body measurements in cm
  chest NUMERIC(5, 2),
  waist NUMERIC(5, 2),
  hips NUMERIC(5, 2),
  left_arm NUMERIC(5, 2),
  right_arm NUMERIC(5, 2),
  left_thigh NUMERIC(5, 2),
  right_thigh NUMERIC(5, 2),
  -- Progress tracking
  progress_photo_url TEXT, -- Optional: URL to progress photo
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- 4. EXTEND USER PROFILE
-- ============================================
-- Add critical user data for personalization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height NUMERIC(5, 2); -- cm
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_weight NUMERIC(5, 2); -- kg (current weight for quick reference)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fitness_goal TEXT CHECK (fitness_goal IN ('strength', 'hypertrophy', 'endurance', 'weight_loss', 'general_fitness', 'athletic_performance'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'elite'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_frequency INTEGER; -- days per week
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_split TEXT; -- ppl, upper_lower, full_body, custom
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment_access TEXT CHECK (equipment_access IN ('full_gym', 'home_gym', 'minimal', 'bodyweight'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS injuries JSONB DEFAULT '[]'; -- Array of current/past injuries
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_weight NUMERIC(5, 2); -- kg (goal weight)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_calories INTEGER; -- Daily calorie goal
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_protein NUMERIC(5, 1); -- Daily protein goal (g)

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_id ON sleep_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_date ON sleep_logs(date);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date);

CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id ON nutrition_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_date ON nutrition_logs(date);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, date);

CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON body_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(date);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Sleep Logs RLS
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sleep logs"
  ON sleep_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sleep logs"
  ON sleep_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sleep logs"
  ON sleep_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sleep logs"
  ON sleep_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Nutrition Logs RLS
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own nutrition logs"
  ON nutrition_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs"
  ON nutrition_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs"
  ON nutrition_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs"
  ON nutrition_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Body Measurements RLS
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own body measurements"
  ON body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body measurements"
  ON body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body measurements"
  ON body_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body measurements"
  ON body_measurements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON sleep_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON nutrition_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON body_measurements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE sleep_logs IS 'Tracks daily sleep data for recovery prediction and readiness scoring';
COMMENT ON TABLE nutrition_logs IS 'Tracks daily nutrition intake for performance and body composition insights';
COMMENT ON TABLE body_measurements IS 'Tracks body weight and measurements for progress tracking and body composition predictions';

COMMENT ON COLUMN sleep_logs.quality IS '1=Very Poor, 2=Poor, 3=Average, 4=Good, 5=Excellent';
COMMENT ON COLUMN nutrition_logs.meal_type IS 'breakfast, lunch, dinner, snack, or NULL for daily total';
COMMENT ON COLUMN profiles.fitness_goal IS 'Primary training goal for personalized recommendations';
COMMENT ON COLUMN profiles.experience_level IS 'Training experience level for volume/intensity adjustments';
