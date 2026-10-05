// ============================================
// GYM SESSION TIMER CONSTANTS
// ============================================

export const GYM_SESSION = {
  TARGET_MINUTES: 105, // 1 hr 45 mins strict goal
  TARGET_SECONDS: 105 * 60, // 6300 seconds
  ALERT_THRESHOLDS: [30, 15, 5, 0], // Minutes remaining for progressive alerts
  EXTENSION_MINUTES: 15, // +15m extension option
  MAX_EXTENSIONS: 2, // Max extensions allowed per session
  STORAGE_KEY: 'fittrack_active_gym_session',
  HISTORY_KEY: 'fittrack_gym_session_history',
  DISMISSED_DATE_KEY: 'fittrack_gym_prompt_dismissed_date',
};

export default GYM_SESSION;
