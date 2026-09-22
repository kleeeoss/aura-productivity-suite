import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';

/**
 * Calculates the current daily streak for a habit.
 * Streak is active if the habit was completed today or yesterday.
 * Consecutive completions must differ by exactly 1 calendar day.
 */
export const calculateStreak = (
  completedDates: string[],
  referenceDate: Date = new Date()
): number => {
  if (!completedDates || completedDates.length === 0) return 0;

  // Deduplicate and filter valid date strings
  const uniqueDates = Array.from(new Set(completedDates.filter(Boolean)));
  if (uniqueDates.length === 0) return 0;

  // Sort descending (latest date first)
  const sortedDates = uniqueDates.sort((a, b) => {
    return parseISO(b).getTime() - parseISO(a).getTime();
  });

  const refDay = startOfDay(referenceDate);
  const latestCompletedDay = startOfDay(parseISO(sortedDates[0]));

  const diffToLatest = differenceInCalendarDays(refDay, latestCompletedDay);

  // If the last completion was more than 1 calendar day ago, streak is broken
  if (diffToLatest > 1) {
    return 0;
  }

  let streak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const current = startOfDay(parseISO(sortedDates[i]));
    const previous = startOfDay(parseISO(sortedDates[i - 1]));

    const dayDiff = differenceInCalendarDays(previous, current);

    if (dayDiff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

export interface ProductivityScoreParams {
  todayCompletedTasksCount: number;
  todayPomodorosCount: number;
  todayCompletedHabitsCount: number;
  hasJournalToday: boolean;
}

/**
 * Computes a standardized daily productivity score (0 - 100).
 * Only activities completed TODAY contribute to the score.
 */
export const calculateProductivityScore = ({
  todayCompletedTasksCount,
  todayPomodorosCount,
  todayCompletedHabitsCount,
  hasJournalToday,
}: ProductivityScoreParams): number => {
  const taskPoints = Math.max(0, todayCompletedTasksCount) * 5;
  const pomodoroPoints = Math.max(0, todayPomodorosCount) * 10;
  const habitPoints = Math.max(0, todayCompletedHabitsCount) * 10;
  const journalPoints = hasJournalToday ? 15 : 0;

  const rawScore = taskPoints + pomodoroPoints + habitPoints + journalPoints;
  return Math.min(100, Math.max(0, Math.round(rawScore)));
};

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  sanitizedData?: Record<string, string>;
}

const ALLOWED_STORAGE_KEYS = new Set([
  'task-storage',
  'habit-storage',
  'note-storage',
  'journal-storage-v2',
  'focus-storage-v2',
  'activity-storage',
  'settings-storage',
  // legacy backward compatibility keys that we can migrate
  'focus-storage',
  'journal-storage',
]);

/**
 * Validates and sanitizes a JSON backup prior to writing to localStorage.
 */
export const validateBackupData = (rawInput: unknown): BackupValidationResult => {
  if (!rawInput || typeof rawInput !== 'object' || Array.isArray(rawInput)) {
    return { valid: false, error: 'Backup data must be a valid JSON object.' };
  }

  const rawObj = rawInput as Record<string, unknown>;
  const keys = Object.keys(rawObj);

  if (keys.length === 0) {
    return { valid: false, error: 'Backup file contains no data.' };
  }

  const sanitized: Record<string, string> = {};
  let validKeyCount = 0;

  for (const [key, value] of Object.entries(rawObj)) {
    if (!ALLOWED_STORAGE_KEYS.has(key)) {
      continue; // Skip unrecognized keys safely
    }

    // Value should be a JSON string or an object that can be serialized
    let stringVal: string;
    if (typeof value === 'string') {
      try {
        JSON.parse(value); // ensure it's valid JSON
        stringVal = value;
      } catch {
        return { valid: false, error: `Invalid JSON content in key: ${key}` };
      }
    } else if (typeof value === 'object' && value !== null) {
      stringVal = JSON.stringify(value);
    } else {
      return { valid: false, error: `Unexpected data type in key: ${key}` };
    }

    // Map legacy keys to v2
    const targetKey = key === 'focus-storage' ? 'focus-storage-v2' 
      : key === 'journal-storage' ? 'journal-storage-v2' 
      : key;

    sanitized[targetKey] = stringVal;
    validKeyCount++;
  }

  if (validKeyCount === 0) {
    return { valid: false, error: 'Backup does not contain any recognized AURA data stores.' };
  }

  return { valid: true, sanitizedData: sanitized };
};
