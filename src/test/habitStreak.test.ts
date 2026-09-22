import { describe, it, expect } from 'vitest';
import { calculateStreak } from '../utils/productivityMath';

describe('Habit Streak Calculator', () => {
  it('returns 0 for empty completion dates', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 1 if habit was completed only today', () => {
    const today = new Date('2026-09-22T14:00:00Z');
    const dates = ['2026-09-22'];
    expect(calculateStreak(dates, today)).toBe(1);
  });

  it('returns 1 if habit was completed only yesterday (streak still alive until end of today)', () => {
    const today = new Date('2026-09-22T14:00:00Z');
    const dates = ['2026-09-21'];
    expect(calculateStreak(dates, today)).toBe(1);
  });

  it('returns 0 if last completion was 2 days ago (streak broken)', () => {
    const today = new Date('2026-09-22T14:00:00Z');
    const dates = ['2026-09-20', '2026-09-19', '2026-09-18'];
    expect(calculateStreak(dates, today)).toBe(0);
  });

  it('correctly calculates consecutive days streak', () => {
    const today = new Date('2026-09-22T10:00:00Z');
    const dates = ['2026-09-22', '2026-09-21', '2026-09-20', '2026-09-19', '2026-09-18'];
    expect(calculateStreak(dates, today)).toBe(5);
  });

  it('handles month crossings correctly without losing streak', () => {
    const today = new Date('2026-04-02T10:00:00Z');
    // March has 31 days. April 2, April 1, March 31, March 30
    const dates = ['2026-04-02', '2026-04-01', '2026-03-31', '2026-03-30'];
    expect(calculateStreak(dates, today)).toBe(4);
  });

  it('handles leap year boundaries correctly (Feb 28/29 to March 1)', () => {
    const leapYearToday = new Date('2024-03-01T12:00:00Z');
    const dates = ['2024-03-01', '2024-02-29', '2024-02-28'];
    expect(calculateStreak(dates, leapYearToday)).toBe(3);
  });

  it('ignores duplicate dates on the same day without inflating streak', () => {
    const today = new Date('2026-09-22T10:00:00Z');
    const dates = ['2026-09-22', '2026-09-22', '2026-09-21', '2026-09-21'];
    expect(calculateStreak(dates, today)).toBe(2);
  });

  it('stops counting streak at the first gap', () => {
    const today = new Date('2026-09-22T10:00:00Z');
    // 22 and 21 are consecutive, gap at 20, then 19, 18
    const dates = ['2026-09-22', '2026-09-21', '2026-09-19', '2026-09-18'];
    expect(calculateStreak(dates, today)).toBe(2);
  });
});
