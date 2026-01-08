-- Update has_completed_setup to true for your user
-- Replace 'YOUR_USER_ID' with your actual user_id from the table

UPDATE user_preferences
SET has_completed_setup = true,
    setup_completed_at = NOW()
WHERE user_id = 'd3906fae-27c6-4003-b028-3c60bc4ff95';

-- Or update for all users if needed:
-- UPDATE user_preferences SET has_completed_setup = true, setup_completed_at = NOW();
