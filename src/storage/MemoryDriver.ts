import type { IStorageDriver } from './IStorageDriver';

/**
 * In-memory storage driver implementation for headless testing, unit tests,
 * and ephemeral environments.
 */
export class MemoryDriver implements IStorageDriver {
  readonly name = 'MemoryDriver';
  private store: Map<string, string> = new Map();
  private isInitialized = false;

  async init(): Promise<void> {
    this.isInitialized = true;
  }

  async getItem(key: string): Promise<string | null> {
    this.ensureInitialized();
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.ensureInitialized();
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.ensureInitialized();
    this.store.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    this.ensureInitialized();
    return Array.from(this.store.keys()).sort();
  }

  async batchSet(entries: Record<string, string>): Promise<void> {
    this.ensureInitialized();
    if (!entries || typeof entries !== 'object') return;
    for (const [key, val] of Object.entries(entries)) {
      this.store.set(String(key), String(val));
    }
  }

  async dumpAll(): Promise<Record<string, string>> {
    this.ensureInitialized();
    const result: Record<string, string> = {};
    for (const [key, val] of this.store.entries()) {
      result[key] = val;
    }
    return result;
  }

  async restoreAll(data: Record<string, string>): Promise<void> {
    this.ensureInitialized();
    this.store.clear();
    if (!data || typeof data !== 'object') return;
    for (const [key, val] of Object.entries(data)) {
      this.store.set(String(key), String(val));
    }
  }

  async close(): Promise<void> {
    this.store.clear();
    this.isInitialized = false;
  }

  /**
   * Helper for unit test assertions.
   */
  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      // Auto-initialize if not explicitly called to prevent accidental friction
      this.isInitialized = true;
    }
  }
}
