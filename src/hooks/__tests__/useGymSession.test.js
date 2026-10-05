import { describe, it, expect } from 'vitest';
import { formatHMS, formatClockTime } from '../useGymSession';
import { GYM_SESSION } from '../../constants/session';
import { getSmartPostGymGameplan } from '../../data/postGymTips';

describe('GymSession constants and time formatting', () => {
  it('sets strict gym session target to 1h 45m (105 minutes / 6300 seconds)', () => {
    expect(GYM_SESSION.TARGET_MINUTES).toBe(105);
    expect(GYM_SESSION.TARGET_SECONDS).toBe(6300);
    expect(GYM_SESSION.ALERT_THRESHOLDS).toEqual([30, 15, 5, 0]);
  });

  it('formats 1h 45m (6300 seconds) as 1:45:00', () => {
    expect(formatHMS(6300)).toBe('1:45:00');
  });

  it('formats durations under 1 hour as MM:SS', () => {
    expect(formatHMS(1800)).toBe('30:00'); // 30m alert threshold
    expect(formatHMS(900)).toBe('15:00');  // 15m alert threshold
    expect(formatHMS(300)).toBe('05:00');  // 5m alert threshold
    expect(formatHMS(0)).toBe('00:00');
  });

  it('handles negative or invalid seconds gracefully', () => {
    expect(formatHMS(-45)).toBe('00:00');
    expect(formatHMS(null)).toBe('00:00');
  });

  it('formats valid ISO strings into readable clock time and handles invalid input', () => {
    expect(formatClockTime(null)).toBe('--:--');
    expect(formatClockTime('invalid-date')).toBe('--:--');
    const formatted = formatClockTime('2026-10-05T09:15:00.000Z');
    expect(typeof formatted).toBe('string');
    expect(formatted).not.toBe('--:--');
  });

  it('returns 4 categorized post-gym tips (diet, hygiene, recovery, motivation) and shuffles cleanly', () => {
    const plan0 = getSmartPostGymGameplan({ hour: 9, durationMinutes: 105, waterAmountMl: 1000, seed: 0 });
    expect(plan0).toHaveLength(4);
    expect(plan0.map((t) => t.category)).toEqual(['diet', 'hygiene', 'recovery', 'motivation']);

    const plan1 = getSmartPostGymGameplan({ hour: 9, durationMinutes: 105, waterAmountMl: 1000, seed: 1 });
    expect(plan1).toHaveLength(4);
    expect(plan1[0].id).not.toBe(plan0[0].id);
  });
});
