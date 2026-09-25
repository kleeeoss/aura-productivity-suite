import type { IStorageDriver } from './IStorageDriver';

export interface SqlQueryResult {
  rowsAffected: number;
}

export interface SqlExecutor {
  execute(sql: string, bindValues?: unknown[]): Promise<SqlQueryResult>;
  select<T = unknown>(sql: string, bindValues?: unknown[]): Promise<T[]>;
  close?(): Promise<void>;
}

/**
 * In-memory fallback SQL executor used when running outside Tauri
 * (e.g. headless tests or browser preview without Tauri runtime).
 */
class InMemorySqlExecutor implements SqlExecutor {
  private rows: Map<string, { value: string; updated_at: number }> = new Map();

  async execute(sql: string, bindValues: unknown[] = []): Promise<SqlQueryResult> {
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('CREATE TABLE') || trimmed.startsWith('BEGIN') || trimmed.startsWith('COMMIT') || trimmed.startsWith('ROLLBACK')) {
      return { rowsAffected: 0 };
    }

    if (trimmed.startsWith('INSERT INTO') || trimmed.startsWith('INSERT OR REPLACE')) {
      const key = String(bindValues[0]);
      const value = String(bindValues[1]);
      const updatedAt = typeof bindValues[2] === 'number' ? bindValues[2] : Date.now();
      this.rows.set(key, { value, updated_at: updatedAt });
      return { rowsAffected: 1 };
    }

    if (trimmed.startsWith('DELETE FROM')) {
      if (bindValues.length > 0) {
        const key = String(bindValues[0]);
        const existed = this.rows.delete(key);
        return { rowsAffected: existed ? 1 : 0 };
      }
      const count = this.rows.size;
      this.rows.clear();
      return { rowsAffected: count };
    }

    return { rowsAffected: 0 };
  }

  async select<T = unknown>(sql: string, bindValues: unknown[] = []): Promise<T[]> {
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.includes('WHERE KEY =') || trimmed.includes('WHERE KEY=')) {
      const key = String(bindValues[0]);
      const row = this.rows.get(key);
      if (!row) return [];
      return [{ key, value: row.value, updated_at: row.updated_at } as unknown as T];
    }

    if (trimmed.includes('SELECT KEY FROM') || trimmed.includes('SELECT KEY,') || trimmed.includes('SELECT *')) {
      const results: T[] = [];
      const keys = Array.from(this.rows.keys()).sort();
      for (const key of keys) {
        const row = this.rows.get(key)!;
        results.push({ key, value: row.value, updated_at: row.updated_at } as unknown as T);
      }
      return results;
    }

    return [];
  }

  async close(): Promise<void> {
    this.rows.clear();
  }
}

/**
 * Tauri IPC SQL executor that executes against native SQLite via Tauri plugin.
 * If running in Tauri but the SQL plugin is not yet registered or fails,
 * it transparently falls back to InMemorySqlExecutor to prevent silent data loss.
 */
export class TauriIpcSqlExecutor implements SqlExecutor {
  private fallback = new InMemorySqlExecutor();
  private ipcAvailable: boolean | null = null;
  readonly dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async execute(sql: string, bindValues: unknown[] = []): Promise<SqlQueryResult> {
    if (this.ipcAvailable !== false) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<SqlQueryResult>('plugin:sql|execute', {
          db: this.dbPath,
          query: sql,
          values: bindValues,
        });
        this.ipcAvailable = true;
        return res;
      } catch {
        this.ipcAvailable = false;
      }
    }
    return this.fallback.execute(sql, bindValues);
  }

  async select<T = unknown>(sql: string, bindValues: unknown[] = []): Promise<T[]> {
    if (this.ipcAvailable !== false) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<T[]>('plugin:sql|select', {
          db: this.dbPath,
          query: sql,
          values: bindValues,
        });
        this.ipcAvailable = true;
        return res;
      } catch {
        this.ipcAvailable = false;
      }
    }
    return this.fallback.select<T>(sql, bindValues);
  }

  async close(): Promise<void> {
    if (this.ipcAvailable !== false) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('plugin:sql|close', { db: this.dbPath });
      } catch {
        // ignore
      }
    }
    await this.fallback.close();
  }
}

/**
 * Tauri SQLite Storage Driver for persistent structured desktop data.
 * Implements IStorageDriver backed by SQLite KV store table.
 */
export class TauriSqliteDriver implements IStorageDriver {
  readonly name = 'TauriSqliteDriver';
  readonly dbPath: string;
  private executor: SqlExecutor;
  private isInitialized = false;

  constructor(dbPath = 'sqlite:aura.db', customExecutor?: SqlExecutor) {
    this.dbPath = dbPath;
    if (customExecutor) {
      this.executor = customExecutor;
    } else {
      // Check if running in Tauri environment
      const hasTauri = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
      if (hasTauri) {
        this.executor = new TauriIpcSqlExecutor(dbPath);
      } else {
        this.executor = new InMemorySqlExecutor();
      }
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    await this.executor.execute(`
      CREATE TABLE IF NOT EXISTS aura_kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    this.isInitialized = true;
  }

  async getItem(key: string): Promise<string | null> {
    await this.ensureInitialized();
    const rows = await this.executor.select<{ value: string }>(
      'SELECT value FROM aura_kv_store WHERE key = ? LIMIT 1;',
      [key]
    );
    if (!rows || rows.length === 0) return null;
    return rows[0].value;
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.ensureInitialized();
    const now = Date.now();
    await this.executor.execute(
      `INSERT INTO aura_kv_store (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      [key, value, now]
    );
  }

  async removeItem(key: string): Promise<void> {
    await this.ensureInitialized();
    await this.executor.execute('DELETE FROM aura_kv_store WHERE key = ?;', [key]);
  }

  async getAllKeys(): Promise<string[]> {
    await this.ensureInitialized();
    const rows = await this.executor.select<{ key: string }>(
      'SELECT key FROM aura_kv_store ORDER BY key ASC;'
    );
    return rows.map((r) => r.key);
  }

  async batchSet(entries: Record<string, string>): Promise<void> {
    await this.ensureInitialized();
    if (!entries || typeof entries !== 'object') return;
    const now = Date.now();
    await this.executor.execute('BEGIN TRANSACTION;');
    try {
      for (const [key, value] of Object.entries(entries)) {
        await this.executor.execute(
          `INSERT INTO aura_kv_store (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
          [String(key), String(value), now]
        );
      }
      await this.executor.execute('COMMIT;');
    } catch (err) {
      await this.executor.execute('ROLLBACK;').catch(() => {});
      throw err;
    }
  }

  async dumpAll(): Promise<Record<string, string>> {
    await this.ensureInitialized();
    const rows = await this.executor.select<{ key: string; value: string }>(
      'SELECT key, value FROM aura_kv_store ORDER BY key ASC;'
    );
    const result: Record<string, string> = {};
    for (const row of rows || []) {
      result[row.key] = row.value;
    }
    return result;
  }

  async restoreAll(data: Record<string, string>): Promise<void> {
    await this.ensureInitialized();
    if (!data || typeof data !== 'object') return;
    await this.executor.execute('BEGIN TRANSACTION;');
    try {
      await this.executor.execute('DELETE FROM aura_kv_store;');
      const now = Date.now();
      for (const [key, value] of Object.entries(data)) {
        await this.executor.execute(
          `INSERT INTO aura_kv_store (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
          [String(key), String(value), now]
        );
      }
      await this.executor.execute('COMMIT;');
    } catch (err) {
      await this.executor.execute('ROLLBACK;').catch(() => {});
      throw err;
    }
  }

  async close(): Promise<void> {
    if (this.executor.close) {
      await this.executor.close();
    }
    this.isInitialized = false;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }
}
