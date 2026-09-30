import { describe, it, expect } from 'vitest';
import {
  computeSleepDuration,
  formatSleepDuration,
  formatSleepDate,
  isValidTimeInput,
  toTimeInputValue,
} from '../sleep';

describe('sleep duration utils', () => {
  it('computes overnight sleep (23:00 -> 07:00 = 8h)', () => {
    const d = computeSleepDuration('23:00', '07:00');
    expect(d).toMatchObject({ hours: 8, minutes: 0, totalHours: 8, overnight: true });
  });

  it('computes same-night sleep (01:00 -> 06:30 = 5.5h)', () => {
    const d = computeSleepDuration('01:00', '06:30');
    expect(d).toMatchObject({ hours: 5, minutes: 30, totalHours: 5.5, overnight: false });
  });

  it('accepts HH:MM:SS from the database', () => {
    const d = computeSleepDuration('22:30:00', '06:30:00');
    expect(d.totalHours).toBe(8);
  });

  it('returns null for empty or invalid inputs', () => {
    expect(computeSleepDuration('', '07:00')).toBeNull();
    expect(computeSleepDuration('23:00', '')).toBeNull();
    expect(computeSleepDuration('25:00', '07:00')).toBeNull();
    expect(computeSleepDuration('23:00', '23:00')).toBeNull();
  });

  it('formats durations', () => {
    expect(formatSleepDuration({ hours: 8, minutes: 0 })).toBe('8h');
    expect(formatSleepDuration({ hours: 7, minutes: 30 })).toBe('7h 30m');
    expect(formatSleepDuration(null)).toBe('—');
  });

  it('keeps date on the right day regardless of timezone', () => {
    // Noon-anchored, so it must contain Sep 30, not Sep 29 / Oct 1.
    expect(formatSleepDate('2026-09-30')).toContain('Sep 30');
  });

  it('validates time inputs', () => {
    expect(isValidTimeInput('23:59')).toBe(true);
    expect(isValidTimeInput('24:00')).toBe(false);
    expect(toTimeInputValue('22:30:00')).toBe('22:30');
  });
});
