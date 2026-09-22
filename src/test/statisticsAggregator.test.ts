import { describe, it, expect } from 'vitest';
import { getTrendData, getHeatmapData, getCategoryDistribution } from '../utils/statisticsAggregator';

describe('Statistics Aggregator', () => {
  const refDate = new Date('2026-09-22T12:00:00Z');

  describe('getTrendData', () => {
    it('returns exactly 7 data points for week view', () => {
      const result = getTrendData([], [], 'week', refDate);
      expect(result).toHaveLength(7);
      expect(result[6].date).toBe('2026-09-22');
      expect(result[0].date).toBe('2026-09-16');
    });

    it('accurately aggregates sessions and tasks to their respective dates', () => {
      const mockSessions = [
        { duration: 25, timestamp: '2026-09-22T10:00:00Z' },
        { duration: 50, timestamp: '2026-09-22T14:00:00Z' },
        { duration: 30, timestamp: '2026-09-21T09:00:00Z' },
      ];
      const mockTasks = [
        { status: 'done', completedAt: '2026-09-22T15:00:00Z' },
        { status: 'done', completedAt: '2026-09-22T16:00:00Z' },
        { status: 'done', completedAt: '2026-09-20T11:00:00Z' },
        { status: 'in-progress' }, // should be ignored
      ];

      const result = getTrendData(mockSessions, mockTasks, 'week', refDate);
      const today = result.find((d) => d.date === '2026-09-22');
      const yesterday = result.find((d) => d.date === '2026-09-21');
      const twoDaysAgo = result.find((d) => d.date === '2026-09-20');

      expect(today?.pomodoros).toBe(2);
      expect(today?.focusTime).toBe(75);
      expect(today?.tasks).toBe(2);

      expect(yesterday?.pomodoros).toBe(1);
      expect(yesterday?.focusTime).toBe(30);
      expect(yesterday?.tasks).toBe(0);

      expect(twoDaysAgo?.tasks).toBe(1);
    });
  });

  describe('getHeatmapData', () => {
    it('returns exactly 90 days of heatmap entries ending on referenceDate', () => {
      const result = getHeatmapData({}, [], [], refDate);
      expect(result).toHaveLength(90);
      expect(result[89].date).toBe('2026-09-22');
    });

    it('calculates total activity correctly from focus minutes, habits, and tasks', () => {
      const dailyHours = { '2026-09-22': 50 }; // 2 units (50 / 25)
      const habits = ['2026-09-22', '2026-09-22']; // 2 habit completions
      const tasks = ['2026-09-22T10:00:00Z']; // 1 task completion

      const result = getHeatmapData(dailyHours, habits, tasks, refDate);
      const todayEntry = result.find((e) => e.date === '2026-09-22');

      // 2 focus units + 2 habits + 1 task = 5 total activity count
      expect(todayEntry?.count).toBe(5);
      expect(todayEntry?.focusMinutes).toBe(50);
    });
  });

  describe('getCategoryDistribution', () => {
    it('groups sessions by category and sums durations', () => {
      const mockSessions = [
        { category: 'Coding', duration: 45 },
        { category: 'Coding', duration: 45 },
        { category: 'Writing', duration: 30 },
      ];

      const result = getCategoryDistribution(mockSessions);
      const coding = result.find((c) => c.name === 'Coding');
      const writing = result.find((c) => c.name === 'Writing');

      expect(coding?.value).toBe(2);
      expect(coding?.minutes).toBe(90);

      expect(writing?.value).toBe(1);
      expect(writing?.minutes).toBe(30);
    });
  });
});
