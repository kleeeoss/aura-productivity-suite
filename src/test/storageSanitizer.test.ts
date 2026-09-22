import { describe, it, expect } from 'vitest';
import { validateBackupData } from '../utils/productivityMath';

describe('Storage Backup Sanitizer', () => {
  it('rejects null or non-object input', () => {
    expect(validateBackupData(null).valid).toBe(false);
    expect(validateBackupData([]).valid).toBe(false);
    expect(validateBackupData('invalid string').valid).toBe(false);
  });

  it('rejects empty object input', () => {
    const res = validateBackupData({});
    expect(res.valid).toBe(false);
    expect(res.error).toContain('contains no data');
  });

  it('rejects objects with no recognized store keys', () => {
    const res = validateBackupData({ malicious_key: 'hacked', random_data: 123 });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('not contain any recognized AURA data');
  });

  it('validates and accepts recognized stores with JSON strings', () => {
    const rawBackup = {
      'task-storage': JSON.stringify({ state: { tasks: [] }, version: 0 }),
      'habit-storage': JSON.stringify({ state: { habits: [] }, version: 0 }),
    };

    const res = validateBackupData(rawBackup);
    expect(res.valid).toBe(true);
    expect(res.sanitizedData?.['task-storage']).toBeDefined();
    expect(res.sanitizedData?.['habit-storage']).toBeDefined();
  });

  it('migrates legacy storage keys to v2 versions', () => {
    const rawBackup = {
      'focus-storage': JSON.stringify({ state: { timeLeft: 1500 }, version: 0 }),
      'journal-storage': JSON.stringify({ state: { entries: {} }, version: 0 }),
    };

    const res = validateBackupData(rawBackup);
    expect(res.valid).toBe(true);
    expect(res.sanitizedData?.['focus-storage-v2']).toBeDefined();
    expect(res.sanitizedData?.['journal-storage-v2']).toBeDefined();
    expect(res.sanitizedData?.['focus-storage']).toBeUndefined();
  });

  it('rejects invalid JSON content within a store key', () => {
    const rawBackup = {
      'task-storage': '{ corrupt json ...',
    };

    const res = validateBackupData(rawBackup);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Invalid JSON content');
  });
});
