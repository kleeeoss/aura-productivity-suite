import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';

export interface TrendDataPoint {
  name: string;
  date: string;
  pomodoros: number;
  tasks: number;
  focusTime: number; // in minutes
}

export interface HeatmapDataPoint {
  date: string;
  count: number;
  focusMinutes: number;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  minutes: number;
}

/**
 * Aggregates focus sessions and completed tasks into day-by-day trends.
 */
export const getTrendData = (
  sessions: { duration: number; timestamp: string }[],
  tasks: { status: string; completedAt?: string }[],
  timeRange: 'week' | 'month' | 'year' = 'week',
  referenceDate: Date = new Date()
): TrendDataPoint[] => {
  const daysCount = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
  const endDate = startOfDay(referenceDate);
  const startDate = subDays(endDate, daysCount - 1);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Map of dateStr (YYYY-MM-DD) -> { pomodoros, focusTime }
  const sessionMap = new Map<string, { count: number; minutes: number }>();
  for (const session of sessions) {
    if (!session.timestamp) continue;
    const dateStr = session.timestamp.split('T')[0];
    const existing = sessionMap.get(dateStr) || { count: 0, minutes: 0 };
    sessionMap.set(dateStr, {
      count: existing.count + 1,
      minutes: existing.minutes + (session.duration || 0),
    });
  }

  // Map of dateStr -> completed tasks count
  const taskMap = new Map<string, number>();
  for (const task of tasks) {
    if (task.status === 'done' && task.completedAt) {
      const dateStr = task.completedAt.split('T')[0];
      taskMap.set(dateStr, (taskMap.get(dateStr) || 0) + 1);
    }
  }

  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayLabel = daysCount <= 7 ? format(day, 'EEE') : format(day, 'MMM d');
    const sessionData = sessionMap.get(dateStr) || { count: 0, minutes: 0 };
    const taskCount = taskMap.get(dateStr) || 0;

    return {
      name: dayLabel,
      date: dateStr,
      pomodoros: sessionData.count,
      tasks: taskCount,
      focusTime: sessionData.minutes,
    };
  });
};

/**
 * Generates an accurate 90-day activity heatmap data array.
 * Activity count is derived from real focus sessions, habit completions, and completed tasks.
 */
export const getHeatmapData = (
  dailyFocusHours: Record<string, number> = {},
  habitCompletedDates: string[] = [],
  completedTaskDates: string[] = [],
  referenceDate: Date = new Date()
): HeatmapDataPoint[] => {
  const endDate = startOfDay(referenceDate);
  const startDate = subDays(endDate, 89);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const habitCountMap = new Map<string, number>();
  for (const dateStr of habitCompletedDates) {
    if (!dateStr) continue;
    habitCountMap.set(dateStr, (habitCountMap.get(dateStr) || 0) + 1);
  }

  const taskCountMap = new Map<string, number>();
  for (const dateStr of completedTaskDates) {
    if (!dateStr) continue;
    const dayStr = dateStr.split('T')[0];
    taskCountMap.set(dayStr, (taskCountMap.get(dayStr) || 0) + 1);
  }

  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const focusMinutes = dailyFocusHours[dateStr] || 0;
    const habitCount = habitCountMap.get(dateStr) || 0;
    const taskCount = taskCountMap.get(dateStr) || 0;

    // Convert focus minutes to activity units (every 25m = 1 unit)
    const focusUnits = Math.floor(focusMinutes / 25);
    const totalActivity = focusUnits + habitCount + taskCount;

    return {
      date: dateStr,
      count: totalActivity,
      focusMinutes,
    };
  });
};

/**
 * Groups session history by category for real distribution metrics.
 */
export const getCategoryDistribution = (
  sessions: { category: string; duration: number }[]
): CategoryDataPoint[] => {
  if (!sessions || sessions.length === 0) {
    return [{ name: 'Deep Work', value: 0, minutes: 0 }];
  }

  const map = new Map<string, { count: number; minutes: number }>();

  for (const s of sessions) {
    const category = s.category || 'General';
    const existing = map.get(category) || { count: 0, minutes: 0 };
    map.set(category, {
      count: existing.count + 1,
      minutes: existing.minutes + (s.duration || 0),
    });
  }

  return Array.from(map.entries()).map(([name, data]) => ({
    name,
    value: data.count,
    minutes: data.minutes,
  }));
};
