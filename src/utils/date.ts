/**
 * Date utility for timezone-safe local calendar date handling.
 *
 * Ensures consistent YYYY-MM-DD local representations across Dashboard, Focus,
 * Journal, Habits, and Statistics, eliminating UTC vs Local date boundary discrepancies.
 */

/**
 * Converts a Date object, ISO string, or epoch timestamp into a local 'YYYY-MM-DD' string.
 * If input is already in 'YYYY-MM-DD' format, it returns it directly.
 */
export const toLocalDateString = (input: Date | string | number = new Date()): string => {
  if (typeof input === 'string') {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
  }

  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Checks whether two dates or timestamps fall on the exact same local calendar day.
 */
export const isSameLocalDay = (
  a: Date | string | number,
  b: Date | string | number
): boolean => {
  const strA = toLocalDateString(a);
  const strB = toLocalDateString(b);
  if (!strA || !strB) return false;
  return strA === strB;
};

/**
 * Returns today's local date string formatted as YYYY-MM-DD.
 */
export const getTodayLocalDateString = (): string => {
  return toLocalDateString(new Date());
};

/**
 * Returns yesterday's local date string formatted as YYYY-MM-DD.
 */
export const getYesterdayLocalDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
};
