import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryDriver } from '../storage/MemoryDriver';
import { TauriSqliteDriver, type SqlExecutor } from '../storage/TauriSqliteDriver';

describe('Storage Drivers Contract Specification', () => {
  describe('MemoryDriver', () => {
    let driver: MemoryDriver;

    beforeEach(async () => {
      driver = new MemoryDriver();
      await driver.init();
    });

    it('has correct driver name', () => {
      expect(driver.name).toBe('MemoryDriver');
    });

    it('returns null for nonexistent keys', async () => {
      const val = await driver.getItem('nonexistent');
      expect(val).toBeNull();
    });

    it('sets and retrieves item correctly', async () => {
      await driver.setItem('key1', 'value1');
      const val = await driver.getItem('key1');
      expect(val).toBe('value1');
    });

    it('overwrites item on repeated setItem', async () => {
      await driver.setItem('key1', 'value1');
      await driver.setItem('key1', 'value2');
      const val = await driver.getItem('key1');
      expect(val).toBe('value2');
    });

    it('removes item properly', async () => {
      await driver.setItem('key1', 'value1');
      await driver.removeItem('key1');
      const val = await driver.getItem('key1');
      expect(val).toBeNull();
    });

    it('returns all keys in sorted order', async () => {
      await driver.setItem('c', '3');
      await driver.setItem('a', '1');
      await driver.setItem('b', '2');

      const keys = await driver.getAllKeys();
      expect(keys).toEqual(['a', 'b', 'c']);
    });

    it('performs batchSet correctly', async () => {
      await driver.batchSet({
        task_1: JSON.stringify({ title: 'Task 1' }),
        task_2: JSON.stringify({ title: 'Task 2' }),
      });

      const keys = await driver.getAllKeys();
      expect(keys).toEqual(['task_1', 'task_2']);
      expect(await driver.getItem('task_1')).toContain('Task 1');
    });

    it('dumps all entries into an object snapshot', async () => {
      await driver.setItem('k1', 'v1');
      await driver.setItem('k2', 'v2');

      const dump = await driver.dumpAll();
      expect(dump).toEqual({ k1: 'v1', k2: 'v2' });
    });

    it('restores all entries from an object snapshot, wiping prior state', async () => {
      await driver.setItem('old_key', 'old_val');
      await driver.restoreAll({ new_k1: 'new_v1', new_k2: 'new_v2' });

      expect(await driver.getItem('old_key')).toBeNull();
      expect(await driver.getItem('new_k1')).toBe('new_v1');
      expect(await driver.getItem('new_k2')).toBe('new_v2');
      expect(await driver.getAllKeys()).toEqual(['new_k1', 'new_k2']);
    });

    it('handles null and empty data in batchSet and restoreAll gracefully', async () => {
      await driver.batchSet(null as any);
      await driver.batchSet(undefined as any);
      expect(await driver.getAllKeys()).toEqual([]);
      await driver.restoreAll(null as any);
      expect(await driver.getAllKeys()).toEqual([]);
    });

    it('closes and resets driver cleanly', async () => {
      await driver.setItem('key', 'val');
      await driver.close();
      expect(driver.size).toBe(0);
    });
  });

  describe('TauriSqliteDriver', () => {
    let driver: TauriSqliteDriver;

    beforeEach(async () => {
      // Initialize with default in-memory fallback executor for headless testing
      driver = new TauriSqliteDriver('sqlite:test.db');
      await driver.init();
    });

    it('has correct driver name and dbPath', () => {
      expect(driver.name).toBe('TauriSqliteDriver');
      expect(driver.dbPath).toBe('sqlite:test.db');
    });

    it('returns null for nonexistent keys', async () => {
      const val = await driver.getItem('absent_key');
      expect(val).toBeNull();
    });

    it('sets and retrieves item with SQLite KV schema', async () => {
      await driver.setItem('settings', JSON.stringify({ theme: 'obsidian' }));
      const val = await driver.getItem('settings');
      expect(val).not.toBeNull();
      expect(JSON.parse(val!)).toEqual({ theme: 'obsidian' });
    });

    it('removes item via DELETE query', async () => {
      await driver.setItem('to_delete', '123');
      await driver.removeItem('to_delete');
      expect(await driver.getItem('to_delete')).toBeNull();
    });

    it('returns all keys correctly', async () => {
      await driver.setItem('beta', '2');
      await driver.setItem('alpha', '1');
      const keys = await driver.getAllKeys();
      expect(keys).toEqual(['alpha', 'beta']);
    });

    it('handles batchSet, dumpAll, and restoreAll', async () => {
      await driver.batchSet({
        habit_1: 'Meditation',
        habit_2: 'Coding',
      });

      const dump = await driver.dumpAll();
      expect(dump).toEqual({
        habit_1: 'Meditation',
        habit_2: 'Coding',
      });

      await driver.restoreAll({
        restored_item: 'Clean state',
      });

      expect(await driver.getItem('habit_1')).toBeNull();
      expect(await driver.getItem('restored_item')).toBe('Clean state');
    });

    it('interacts correctly with a custom SQL executor', async () => {
      const executedQueries: { sql: string; values?: unknown[] }[] = [];
      const mockExecutor: SqlExecutor = {
        execute: vi.fn(async (sql: string, values?: unknown[]) => {
          executedQueries.push({ sql, values });
          return { rowsAffected: 1 };
        }),
        select: vi.fn(async (sql: string, values?: unknown[]) => {
          executedQueries.push({ sql, values });
          if (sql.includes('SELECT value')) {
            return [{ value: 'mocked_value' }] as any;
          }
          if (sql.includes('SELECT key FROM')) {
            return [{ key: 'k1' }, { key: 'k2' }] as any;
          }
          return [];
        }),
      };

      const customDriver = new TauriSqliteDriver('sqlite:custom.db', mockExecutor);
      await customDriver.init();

      expect(mockExecutor.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS aura_kv_store')
      );

      await customDriver.setItem('myKey', 'myVal');
      expect(mockExecutor.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO aura_kv_store'),
        expect.arrayContaining(['myKey', 'myVal'])
      );

      const retrieved = await customDriver.getItem('myKey');
      expect(retrieved).toBe('mocked_value');

      const allKeys = await customDriver.getAllKeys();
      expect(allKeys).toEqual(['k1', 'k2']);

      await customDriver.removeItem('myKey');
      expect(mockExecutor.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM aura_kv_store WHERE key = ?;'),
        ['myKey']
      );
    });

    it('wraps batchSet in a transaction and rolls back on failure', async () => {
      let callCount = 0;
      const failingExecutor: SqlExecutor = {
        execute: vi.fn(async (sql: string) => {
          if (sql.includes('INSERT INTO')) {
            callCount++;
            if (callCount > 1) {
              throw new Error('Disk full');
            }
          }
          return { rowsAffected: 1 };
        }),
        select: vi.fn(async () => []),
      };

      const txDriver = new TauriSqliteDriver('sqlite:tx.db', failingExecutor);
      await txDriver.init();

      await expect(
        txDriver.batchSet({ k1: 'v1', k2: 'v2' })
      ).rejects.toThrow('Disk full');

      expect(failingExecutor.execute).toHaveBeenCalledWith(
        expect.stringContaining('BEGIN TRANSACTION;')
      );
      expect(failingExecutor.execute).toHaveBeenCalledWith(
        expect.stringContaining('ROLLBACK;')
      );
    });

    it('falls back to memory store when Tauri IPC execution fails', async () => {
      const { TauriIpcSqlExecutor } = await import('../storage/TauriSqliteDriver');
      const ipcExecutor = new TauriIpcSqlExecutor('sqlite:ipc-test.db');

      await ipcExecutor.execute('INSERT INTO aura_kv_store (key, value, updated_at) VALUES (?, ?, ?)', ['k1', 'val1', Date.now()]);
      const res = await ipcExecutor.select<{ key: string; value: string }>('SELECT key, value FROM aura_kv_store WHERE key = ?', ['k1']);
      expect(res.length).toBe(1);
      expect(res[0].value).toBe('val1');
    });
  });
});
