import { describe, it, expect } from 'vitest';
import { calculateProductivityScore } from '../utils/productivityMath';

describe('Productivity Score Calculator', () => {
  it('returns 0 when no activities have been performed today', () => {
    const score = calculateProductivityScore({
      todayCompletedTasksCount: 0,
      todayPomodorosCount: 0,
      todayCompletedHabitsCount: 0,
      hasJournalToday: false,
    });
    expect(score).toBe(0);
  });

  it('calculates points correctly according to weighted formula', () => {
    // 2 tasks * 5 = 10
    // 3 pomodoros * 10 = 30
    // 2 habits * 10 = 20
    // journal = 15
    // Total = 75
    const score = calculateProductivityScore({
      todayCompletedTasksCount: 2,
      todayPomodorosCount: 3,
      todayCompletedHabitsCount: 2,
      hasJournalToday: true,
    });
    expect(score).toBe(75);
  });

  it('caps productivity score at 100 when high activity is logged', () => {
    const score = calculateProductivityScore({
      todayCompletedTasksCount: 15, // 75 pts
      todayPomodorosCount: 5,       // 50 pts
      todayCompletedHabitsCount: 5, // 50 pts
      hasJournalToday: true,        // 15 pts
    });
    expect(score).toBe(100);
  });

  it('handles negative inputs gracefully by clamping to 0', () => {
    const score = calculateProductivityScore({
      todayCompletedTasksCount: -5,
      todayPomodorosCount: -2,
      todayCompletedHabitsCount: -1,
      hasJournalToday: false,
    });
    expect(score).toBe(0);
  });
});
