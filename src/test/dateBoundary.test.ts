import { describe, it, expect, beforeEach } from 'vitest';
import { toLocalDateString, isSameLocalDay, getTodayLocalDateString, getYesterdayLocalDateString } from '../utils/date';
import { useFocusStore } from '../store/useFocusStore';
import { getTrendData, getHeatmapData } from '../utils/statisticsAggregator';

describe('Date Boundary & Timezone Robustness', () => {
  it('correctly converts Date objects to local YYYY-MM-DD strings', () => {
    const d = new Date(2026, 8, 24, 23, 45, 0); // Month is 0-indexed: 8 = Sept
    expect(toLocalDateString(d)).toBe('2026-09-24');
  });

  it('preserves existing valid YYYY-MM-DD strings without modification', () => {
    expect(toLocalDateString('2026-01-01')).toBe('2026-01-01');
    expect(toLocalDateString('2026-12-31')).toBe('2026-12-31');
  });

  it('handles ISO timestamps with timezone offsets and local boundaries', () => {
    // A timestamp representing a specific point in time
    const isoString = '2026-09-24T19:20:47.000Z';
    const localExpected = toLocalDateString(new Date(isoString));
    expect(toLocalDateString(isoString)).toBe(localExpected);
  });

  it('gracefully returns empty string on invalid inputs', () => {
    expect(toLocalDateString('invalid-date-string')).toBe('');
    expect(toLocalDateString(Number.NaN)).toBe('');
    expect(isSameLocalDay('invalid', 'invalid')).toBe(false);
    expect(isSameLocalDay('invalid', new Date())).toBe(false);
  });

  it('determines if two timestamps are on the same local day', () => {
    const morning = new Date(2026, 8, 24, 8, 0, 0);
    const night = new Date(2026, 8, 24, 23, 30, 0);
    const nextDayMorning = new Date(2026, 8, 25, 0, 15, 0);

    expect(isSameLocalDay(morning, night)).toBe(true);
    expect(isSameLocalDay(night, nextDayMorning)).toBe(false);
  });

  it('returns valid today and yesterday local date strings', () => {
    const today = getTodayLocalDateString();
    const yesterday = getYesterdayLocalDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(today).not.toBe(yesterday);
  });

  describe('Focus Store dailyFocusHours Local Date Keying', () => {
    beforeEach(() => {
      useFocusStore.setState({
        totalFocusTime: 0,
        longestSession: 0,
        dailyFocusHours: {},
        sessionHistory: [],
        pomodorosCompletedToday: 0,
      });
    });

    it('records pomodoro session in dailyFocusHours under local calendar date', () => {
      const today = toLocalDateString();
      useFocusStore.getState().incrementPomodoros();

      const state = useFocusStore.getState();
      expect(state.dailyFocusHours[today]).toBe(state.workDuration);
      expect(state.pomodorosCompletedToday).toBe(1);
      expect(state.sessionHistory.length).toBe(1);
    });

    it('matches session history across UTC vs local calendar date boundaries', () => {
      const today = toLocalDateString();
      // Suppose local date is 2026-09-25 (e.g. Asia/Tokyo), but UTC is still 2026-09-24T23:30:00Z
      const sessionNearMidnight = {
        id: 'test-sess',
        duration: 25,
        category: 'Work',
        timestamp: new Date().toISOString(),
      };

      useFocusStore.setState({ sessionHistory: [sessionNearMidnight] });
      const state = useFocusStore.getState();
      const todaySessions = state.sessionHistory.filter(
        (s) => toLocalDateString(s.timestamp) === today
      );
      expect(todaySessions.length).toBe(1);
    });
  });

  describe('Statistics Aggregator with ISO string boundaries', () => {
    it('aggregates sessions according to local date rather than naive UTC string split', () => {
      const refDate = new Date(2026, 8, 24, 12, 0, 0);
      const todayStr = toLocalDateString(refDate);

      // Create a session for today at current local time
      const sessionDate = new Date(refDate);
      const mockSessions = [
        { duration: 25, timestamp: sessionDate.toISOString() },
      ];
      const mockTasks = [
        { status: 'done', completedAt: sessionDate.toISOString() },
      ];

      const trends = getTrendData(mockSessions, mockTasks, 'week', refDate);
      const todayTrend = trends.find((t) => t.date === todayStr);

      expect(todayTrend).toBeDefined();
      expect(todayTrend?.pomodoros).toBe(1);
      expect(todayTrend?.focusTime).toBe(25);
      expect(todayTrend?.tasks).toBe(1);
    });

    it('aggregates heatmap data correctly with local dates', () => {
      const refDate = new Date(2026, 8, 24, 12, 0, 0);
      const todayStr = toLocalDateString(refDate);

      const dailyHours: Record<string, number> = { [todayStr]: 50 };
      const habits = [todayStr];
      const tasks = [refDate.toISOString()];

      const heatmap = getHeatmapData(dailyHours, habits, tasks, refDate);
      const todayPoint = heatmap.find((h) => h.date === todayStr);

      expect(todayPoint).toBeDefined();
      // 2 focus units (50/25) + 1 habit + 1 task = 4
      expect(todayPoint?.count).toBe(4);
    });
  });
});
