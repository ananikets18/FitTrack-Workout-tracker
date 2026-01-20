-- ============================================
-- AI WORKOUT COACH TABLES
-- ============================================
-- Tables for storing AI predictions, favorites, and settings

-- AI Predictions Table
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prediction JSONB NOT NULL,
    explanation TEXT,
    analysis JSONB,
    settings_used JSONB,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_predictions_user_id ON ai_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_is_favorite ON ai_predictions(is_favorite) WHERE is_favorite = TRUE;

-- Add RLS policies
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own predictions
CREATE POLICY "Users can view own predictions"
    ON ai_predictions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own predictions
CREATE POLICY "Users can insert own predictions"
    ON ai_predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own predictions
CREATE POLICY "Users can update own predictions"
    ON ai_predictions FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own predictions
CREATE POLICY "Users can delete own predictions"
    ON ai_predictions FOR DELETE
    USING (auth.uid() = user_id);

-- Add AI coach settings to user_preferences table
-- (If user_preferences table doesn't exist, create it)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_coach_settings JSONB DEFAULT '{
        "analyzeDays": 10,
        "recoveryDays": 2,
        "autoGenerate": false,
        "useGroqAI": true,
        "model": "llama-3.3-70b-versatile"
    }'::jsonb,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add RLS policies for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_ai_predictions_updated_at ON ai_predictions;
CREATE TRIGGER update_ai_predictions_updated_at
    BEFORE UPDATE ON ai_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE ai_predictions IS 'Stores AI-generated workout predictions and their explanations';
COMMENT ON TABLE user_preferences IS 'Stores user preferences including AI coach settings';
COMMENT ON COLUMN ai_predictions.prediction IS 'The predicted workout structure (exercises, sets, reps, weights)';
COMMENT ON COLUMN ai_predictions.explanation IS 'AI-generated explanation for the prediction';
COMMENT ON COLUMN ai_predictions.analysis IS 'Analysis data used to generate the prediction';
COMMENT ON COLUMN ai_predictions.settings_used IS 'Settings that were used when generating this prediction';
COMMENT ON COLUMN ai_predictions.is_favorite IS 'Whether this prediction is marked as favorite';
