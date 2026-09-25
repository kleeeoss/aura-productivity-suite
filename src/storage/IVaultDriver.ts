export interface VaultFileInfo {
  path: string;           // Relative to vault root (e.g. "College/ML/CNN.md")
  name: string;           // e.g. "CNN.md"
  isDirectory: boolean;
  size: number;
  updatedAt: string;
  frontmatter?: Record<string, unknown>;
}

export interface VaultWatchEvent {
  event: 'create' | 'modify' | 'remove' | 'rename';
  path: string;
}

export interface VaultSearchResult {
  path: string;
  matches: string[];
}

export interface IVaultDriver {
  readonly name: string;
  init(vaultRoot: string): Promise<void>;
  scanVault(): Promise<VaultFileInfo[]>;
  readFile(relativePath: string): Promise<string>;
  writeFile(relativePath: string, content: string): Promise<void>;
  createFile(relativePath: string, initialContent?: string): Promise<void>;
  deleteFile(relativePath: string): Promise<void>; // Moves to .trash/
  renameFile(oldPath: string, newPath: string): Promise<void>;
  createFolder(relativePath: string): Promise<void>;
  deleteFolder(relativePath: string): Promise<void>;
  search(query: string): Promise<VaultSearchResult[]>;
  getBacklinks(targetName: string): Promise<string[]>;
  onWatchEvent(callback: (event: VaultWatchEvent) => void): () => void;
}
