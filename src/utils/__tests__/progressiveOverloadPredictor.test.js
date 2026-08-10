import { describe, it, expect } from 'vitest';
import {
  shouldDeload,
  analyzeExerciseProgression
} from '../progressiveOverloadPredictor';

describe('progressiveOverloadPredictor.js utility engine', () => {
  describe('shouldDeload', () => {
    it('returns false for insufficient data when workouts array is empty', () => {
      const result = shouldDeload('Bench Press', []);
      expect(result).toBe(false);
    });
  });

  describe('analyzeExerciseProgression', () => {
    it('returns status insufficient_data when no workouts exist for exercise', () => {
      const analysis = analyzeExerciseProgression('Squat', []);
      expect(analysis.status).toBe('insufficient_data');
    });
  });
});
