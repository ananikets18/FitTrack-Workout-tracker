import { describe, it, expect } from 'vitest';
import { validateExportSchema } from '../exportUtils';

describe('exportUtils.js schema validation', () => {
  it('returns invalid status for null or undefined input', () => {
    expect(validateExportSchema(null)).toEqual({
      isValid: false,
      reason: 'Empty data payload',
      workouts: []
    });
  });

  it('validates direct arrays of workouts correctly', () => {
    const rawData = [
      { id: '1', name: 'Upper Body', date: '2026-08-10' },
      { id: '2', type: 'rest_day', date: '2026-08-11' }
    ];

    const result = validateExportSchema(rawData);
    expect(result.isValid).toBe(true);
    expect(result.validCount).toBe(2);
    expect(result.workouts.length).toBe(2);
  });

  it('validates wrapped workout export objects with metadata', () => {
    const rawData = {
      version: '1.0',
      exportedAt: '2026-08-10T12:00:00Z',
      workouts: [
        { id: '1', name: 'Leg Day', date: '2026-08-10' }
      ]
    };

    const result = validateExportSchema(rawData);
    expect(result.isValid).toBe(true);
    expect(result.validCount).toBe(1);
  });
});
