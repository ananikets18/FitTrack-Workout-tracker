import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeNumber,
  validateWorkoutName,
  validateExerciseName,
  validateSet
} from '../validation';

describe('validation.js utility engine', () => {
  describe('sanitizeString', () => {
    it('returns empty string for non-string input', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });

    it('removes HTML tags and dangerous scripts', () => {
      const input = '<script>alert("xss")</script>Push Ups';
      expect(sanitizeString(input)).toBe('scriptalert("xss")/scriptPush Ups');
    });

    it('respects maxLength parameter', () => {
      expect(sanitizeString('Hello World', 5)).toBe('Hello');
    });
  });

  describe('sanitizeNumber', () => {
    it('returns min value when input is NaN', () => {
      expect(sanitizeNumber('invalid', 0, 100)).toBe(0);
    });

    it('clamps numbers within min and max boundaries', () => {
      expect(sanitizeNumber(50, 0, 100)).toBe(50);
      expect(sanitizeNumber(-10, 0, 100)).toBe(0);
      expect(sanitizeNumber(500, 0, 100)).toBe(100);
    });
  });

  describe('validateWorkoutName', () => {
    it('rejects empty workout names', () => {
      const res = validateWorkoutName('');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Workout name is required');
    });

    it('accepts valid workout names', () => {
      const res = validateWorkoutName('Leg Day Blast');
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('Leg Day Blast');
    });
  });

  describe('validateExerciseName', () => {
    it('rejects empty exercise names', () => {
      const res = validateExerciseName('');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Exercise name is required');
    });

    it('accepts valid exercise names', () => {
      const res = validateExerciseName('Barbell Bench Press');
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('Barbell Bench Press');
    });
  });

  describe('validateSet', () => {
    it('sanitizes reps and weight numbers correctly', () => {
      const result = validateSet({ reps: '10', weight: '80.5' });
      expect(result.isValid).toBe(true);
      expect(result.value.reps).toBe(10);
      expect(result.value.weight).toBe(80);
    });
  });
});
