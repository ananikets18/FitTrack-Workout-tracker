/**
 * Haptic feedback utility for mobile-first experience
 * Uses the Vibration API for tactile feedback on touch interactions
 */

/**
 * Check if vibration is supported in the browser
 * @returns {boolean}
 */
export const isVibrationSupported = () => {
  return 'vibrate' in navigator;
};

/**
 * Trigger a light haptic feedback (for taps, selections)
 * @param {number} duration - Duration in milliseconds (default: 10ms)
 */
export const lightHaptic = (duration = 10) => {
  if (isVibrationSupported()) {
    navigator.vibrate(duration);
  }
};

/**
 * Trigger a medium haptic feedback (for button presses, confirmations)
 * @param {number} duration - Duration in milliseconds (default: 20ms)
 */
export const mediumHaptic = (duration = 20) => {
  if (isVibrationSupported()) {
    navigator.vibrate(duration);
  }
};

/**
 * Trigger a strong haptic feedback (for important actions, errors)
 * @param {number} duration - Duration in milliseconds (default: 40ms)
 */
export const strongHaptic = (duration = 40) => {
  if (isVibrationSupported()) {
    navigator.vibrate(duration);
  }
};

/**
 * Trigger a success haptic pattern (double tap feel)
 */
export const successHaptic = () => {
  if (isVibrationSupported()) {
    navigator.vibrate([20, 50, 20]);
  }
};

/**
 * Trigger an error haptic pattern (three short bursts)
 */
export const errorHaptic = () => {
  if (isVibrationSupported()) {
    navigator.vibrate([30, 40, 30, 40, 30]);
  }
};

/**
 * Trigger a warning haptic pattern (single medium burst)
 */
export const warningHaptic = () => {
  if (isVibrationSupported()) {
    navigator.vibrate([50, 100, 50]);
  }
};

/**
 * Cancel any ongoing vibration
 */
export const cancelHaptic = () => {
  if (isVibrationSupported()) {
    navigator.vibrate(0);
  }
};

// Export a convenience object with all haptic functions
export const haptics = {
  light: lightHaptic,
  medium: mediumHaptic,
  strong: strongHaptic,
  success: successHaptic,
  error: errorHaptic,
  warning: warningHaptic,
  cancel: cancelHaptic,
  isSupported: isVibrationSupported,
};

export default haptics;
