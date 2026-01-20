-- ============================================
-- SIMPLE FIX: Just add the ai_coach_settings column
-- ============================================

-- Add ai_coach_settings column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_preferences' 
        AND column_name = 'ai_coach_settings'
    ) THEN
        ALTER TABLE user_preferences 
        ADD COLUMN ai_coach_settings JSONB DEFAULT '{
            "analyzeDays": 10,
            "recoveryDays": 2,
            "autoGenerate": false,
            "useGroqAI": true,
            "model": "llama-3.3-70b-versatile"
        }'::jsonb;
        
        RAISE NOTICE 'Column ai_coach_settings added successfully';
    ELSE
        RAISE NOTICE 'Column ai_coach_settings already exists';
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN user_preferences.ai_coach_settings IS 'AI Workout Coach settings and preferences';
