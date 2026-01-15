-- Migration: Add duration column to sets table for cardio exercises
-- This allows tracking duration (in minutes) for cardio exercises

-- Add duration column to sets table
ALTER TABLE sets 
ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN sets.duration IS 'Duration in minutes for cardio exercises. NULL for weight training exercises.';
