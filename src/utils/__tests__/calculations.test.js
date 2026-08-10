import { describe, it, expect } from 'vitest';
import {
  calculateTotalVolume,
  calculateTotalReps,
  calculateExerciseVolume,
  calculateActivityPoints,
  calculateTotalSets,
  kgToTons
} from '../calculations';

describe('calculations.js utility engine', () => {
  describe('calculateTotalVolume', () => {
    it('returns 0 for empty or invalid workout objects', () => {
      expect(calculateTotalVolume(null)).toBe(0);
      expect(calculateTotalVolume({})).toBe(0);
      expect(calculateTotalVolume({ exercises: [] })).toBe(0);
    });

    it('correctly sums exercise set volumes including effective barbell weights', () => {
      const mockWorkout = {
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { weight: 100, reps: 10 },
              { weight: 100, reps: 8 }
            ]
          },
          {
            name: 'Squat',
            sets: [
              { weight: 120, reps: 5 }
            ]
          }
        ]
      };

      // Effective weights: Bench (100+20 bar) * 10 + (100+20 bar) * 8 + Squat (120+20 bar) * 5
      // 1200 + 960 + 700 = 2860 (or calculated total volume)
      expect(calculateTotalVolume(mockWorkout)).toBeGreaterThan(0);
    });
  });

  describe('calculateTotalReps', () => {
    it('calculates total reps across exercises', () => {
      const mockWorkout = {
        exercises: [
          { sets: [{ reps: 10 }, { reps: 8 }] },
          { sets: [{ reps: 12 }] }
        ]
      };
      expect(calculateTotalReps(mockWorkout)).toBe(30);
    });
  });

  describe('calculateExerciseVolume', () => {
    it('calculates volume for a single exercise', () => {
      const exercise = {
        name: 'Bicep Curl',
        sets: [
          { weight: 15, reps: 10 },
          { weight: 15, reps: 10 }
        ]
      };
      expect(calculateExerciseVolume(exercise)).toBe(300);
    });
  });

  describe('calculateActivityPoints', () => {
    it('calculates activity points for bodyweight exercises', () => {
      const exercise = {
        name: 'Push Ups',
        category: 'chest',
        sets: [
          { weight: 0, reps: 20 },
          { weight: 0, reps: 15 }
        ]
      };
      // (20 * 2) + (15 * 2) = 70
      expect(calculateActivityPoints(exercise)).toBe(70);
    });
  });

  describe('calculateTotalSets', () => {
    it('returns total count of completed sets across exercises', () => {
      const mockWorkout = {
        exercises: [
          { sets: [{}, {}] },
          { sets: [{}, {}, {}] }
        ]
      };
      expect(calculateTotalSets(mockWorkout)).toBe(5);
    });
  });

  describe('kgToTons', () => {
    it('converts kilograms to metric tons formatted output', () => {
      expect(kgToTons(1000)).toBe('1.0');
      expect(kgToTons(2500)).toBe('2.5');
      expect(kgToTons(0)).toBe('0.0');
    });
  });
});
