-- Migration: Add treadmill-specific fields to sets table
-- This adds incline (percentage) and speed (km/hr) fields for treadmill tracking

-- Add new columns to sets table
ALTER TABLE sets
ADD COLUMN IF NOT EXISTS duration INTEGER, -- Duration in minutes (for cardio exercises)
ADD COLUMN IF NOT EXISTS incline NUMERIC(4, 1), -- Incline percentage (e.g., 2.0, 4.5, 10.0)
ADD COLUMN IF NOT EXISTS speed NUMERIC(4, 1); -- Speed in km/hr (e.g., 5.0, 6.5, 12.0)

-- Add comments for documentation
COMMENT ON COLUMN sets.duration IS 'Duration in minutes for cardio exercises';
COMMENT ON COLUMN sets.incline IS 'Incline percentage for treadmill exercises (e.g., 2.0, 4.5, 10.0)';
COMMENT ON COLUMN sets.speed IS 'Speed in km/hr for treadmill exercises (e.g., 5.0, 6.5, 12.0)';

-- Create index for better query performance on cardio exercises
CREATE INDEX IF NOT EXISTS idx_sets_duration ON sets(duration) WHERE duration IS NOT NULL;
