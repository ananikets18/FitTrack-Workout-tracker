-- ============================================
-- ML TRAINING DATA TABLES
-- ============================================
-- These tables collect data for training ML models
-- Run this migration in Supabase SQL Editor

-- Table 1: Workout Completion Data (for Workout Success Predictor)
CREATE TABLE IF NOT EXISTS ml_training_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_id UUID,
    
    -- Features (inputs to ML model)
    sleep_hours DECIMAL(3,1),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    calories INTEGER,
    protein DECIMAL(5,1),
    fatigue_score INTEGER CHECK (fatigue_score >= 0 AND fatigue_score <= 100),
    days_since_rest INTEGER,
    planned_volume INTEGER,
    readiness_score INTEGER CHECK (readiness_score >= 0 AND readiness_score <= 100),
    injury_risk_score INTEGER CHECK (injury_risk_score >= 0 AND injury_risk_score <= 100),
    
    -- Targets (what we want to predict)
    workout_completed BOOLEAN NOT NULL,
    completion_percentage INTEGER CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    perceived_difficulty INTEGER CHECK (perceived_difficulty >= 1 AND perceived_difficulty <= 10),
    
    -- Metadata
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    data_version VARCHAR(10) DEFAULT '1.0',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Recovery Time Data (for Personalized Recovery Predictor)
CREATE TABLE IF NOT EXISTS ml_recovery_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Features
    muscle_group VARCHAR(50) NOT NULL,
    workout_volume INTEGER,
    workout_intensity DECIMAL(3,1),
    sleep_quality DECIMAL(3,1),
    nutrition_quality DECIMAL(3,1),
    
    -- Target
    actual_recovery_days DECIMAL(3,1) NOT NULL,
    perceived_recovery INTEGER CHECK (perceived_recovery >= 1 AND perceived_recovery <= 10),
    
    -- Metadata
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Weight Progression Data (for Optimal Increment Predictor)
CREATE TABLE IF NOT EXISTS ml_progression_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Features
    exercise_name VARCHAR(255) NOT NULL,
    previous_weight DECIMAL(5,1),
    new_weight DECIMAL(5,1),
    weight_increase DECIMAL(5,1),
    reps_achieved INTEGER,
    target_reps INTEGER,
    
    -- Target
    successful BOOLEAN NOT NULL,
    form_quality INTEGER CHECK (form_quality >= 1 AND form_quality <= 10),
    
    -- Metadata
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ml_training_user ON ml_training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_timestamp ON ml_training_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_ml_recovery_user ON ml_recovery_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_recovery_muscle ON ml_recovery_data(muscle_group);
CREATE INDEX IF NOT EXISTS idx_ml_progression_user ON ml_progression_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_progression_exercise ON ml_progression_data(exercise_name);

-- Row Level Security (RLS)
ALTER TABLE ml_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_recovery_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_progression_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can insert their own ML training data"
    ON ml_training_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own ML training data"
    ON ml_training_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recovery data"
    ON ml_recovery_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own recovery data"
    ON ml_recovery_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progression data"
    ON ml_progression_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own progression data"
    ON ml_progression_data FOR SELECT
    USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON ml_training_data TO authenticated;
GRANT ALL ON ml_recovery_data TO authenticated;
GRANT ALL ON ml_progression_data TO authenticated;

-- Comments for documentation
COMMENT ON TABLE ml_training_data IS 'Training data for workout completion prediction ML model';
COMMENT ON TABLE ml_recovery_data IS 'Training data for personalized recovery time prediction';
COMMENT ON TABLE ml_progression_data IS 'Training data for optimal weight progression prediction';
