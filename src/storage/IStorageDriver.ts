export interface IStorageDriver {
  readonly name: string;
  init(): Promise<void>;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
  batchSet(entries: Record<string, string>): Promise<void>;
  dumpAll(): Promise<Record<string, string>>;
  restoreAll(data: Record<string, string>): Promise<void>;
  close(): Promise<void>;
}
