/**
 * Client-side rate limiter to prevent brute force attacks
 * This is a basic implementation - server-side rate limiting is still needed
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

class RateLimiter {
  constructor() {
    this.attempts = new Map();
  }

  // Check if action is allowed
  isAllowed(key) {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      return { allowed: true };
    }

    // Check if locked out
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingTime = Math.ceil((record.lockedUntil - now) / 1000 / 60);
      return {
        allowed: false,
        reason: `Too many attempts. Try again in ${remainingTime} minutes.`,
        lockedUntil: record.lockedUntil,
      };
    }

    // Reset if outside attempt window
    if (now - record.firstAttempt > ATTEMPT_WINDOW) {
      this.attempts.delete(key);
      return { allowed: true };
    }

    // Check attempt count
    if (record.count >= MAX_ATTEMPTS) {
      const lockedUntil = now + LOCKOUT_DURATION;
      this.attempts.set(key, { ...record, lockedUntil });
      return {
        allowed: false,
        reason: `Too many failed attempts. Locked for ${LOCKOUT_DURATION / 1000 / 60} minutes.`,
        lockedUntil,
      };
    }

    return { allowed: true };
  }

  // Record an attempt
  recordAttempt(key, success = false) {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (success) {
      // Clear attempts on success
      this.attempts.delete(key);
      return;
    }

    if (!record) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
      });
    } else {
      this.attempts.set(key, {
        ...record,
        count: record.count + 1,
      });
    }
  }

  // Get remaining attempts
  getRemainingAttempts(key) {
    const record = this.attempts.get(key);
    if (!record) return MAX_ATTEMPTS;
    return Math.max(0, MAX_ATTEMPTS - record.count);
  }

  // Clear all attempts (admin/debug only)
  clear() {
    this.attempts.clear();
  }
}

// Export singleton instance
export const loginRateLimiter = new RateLimiter();
export const signupRateLimiter = new RateLimiter();

