-- ============================================
-- FIX: Add ai_coach_settings to existing user_preferences table
-- ============================================

-- Check if user_preferences table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences') THEN
        CREATE TABLE user_preferences (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
            theme VARCHAR(20) DEFAULT 'light',
            notifications_enabled BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add RLS policies
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
    END IF;
END $$;

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
            "model": "llama3-70b-8192"
        }'::jsonb;
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_preferences_updated_at'
    ) THEN
        CREATE TRIGGER update_user_preferences_updated_at
            BEFORE UPDATE ON user_preferences
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN user_preferences.ai_coach_settings IS 'AI Workout Coach settings and preferences';
