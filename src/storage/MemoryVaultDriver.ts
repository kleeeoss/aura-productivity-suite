import type { IVaultDriver, VaultFileInfo, VaultSearchResult, VaultWatchEvent } from './IVaultDriver';
import { parseFrontmatter } from './frontmatter';

interface MemoryNode {
  content: string;
  updatedAt: string;
  isDirectory: boolean;
  size: number;
}

export class MemoryVaultDriver implements IVaultDriver {
  readonly name = 'MemoryVaultDriver';
  private vaultRoot = '/virtual/vault';
  private files = new Map<string, MemoryNode>();
  private watchCallbacks = new Set<(event: VaultWatchEvent) => void>();

  getVaultRoot(): string {
    return this.vaultRoot;
  }

  private normalize(path: string): string {
    return path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  }

  async init(vaultRoot: string): Promise<void> {
    this.vaultRoot = vaultRoot;
  }

  private emit(event: 'create' | 'modify' | 'remove' | 'rename', path: string) {
    const payload: VaultWatchEvent = { event, path };
    for (const cb of this.watchCallbacks) {
      try {
        cb(payload);
      } catch (err) {
        console.error('Error in watch callback', err);
      }
    }
  }

  async scanVault(): Promise<VaultFileInfo[]> {
    const results: VaultFileInfo[] = [];

    for (const [normPath, node] of this.files.entries()) {
      if (normPath.startsWith('.trash') || normPath.startsWith('.git')) {
        continue;
      }

      const parts = normPath.split('/');
      const name = parts[parts.length - 1];

      let frontmatter: Record<string, unknown> | undefined;
      if (!node.isDirectory && name.endsWith('.md')) {
        frontmatter = parseFrontmatter(node.content).frontmatter;
      }

      results.push({
        path: normPath,
        name,
        isDirectory: node.isDirectory,
        size: node.size,
        updatedAt: node.updatedAt,
        frontmatter,
      });
    }

    // Sort folders first, then alphabetically
    return results.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.path.localeCompare(b.path);
    });
  }

  async readFile(relativePath: string): Promise<string> {
    const norm = this.normalize(relativePath);
    const node = this.files.get(norm);
    if (!node || node.isDirectory) {
      throw new Error(`File not found: ${relativePath}`);
    }
    return node.content;
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const norm = this.normalize(relativePath);
    const exists = this.files.has(norm);
    const now = new Date().toISOString();

    // Ensure parent folders exist
    const parts = norm.split('/');
    for (let i = 1; i < parts.length; i++) {
      const parent = parts.slice(0, i).join('/');
      if (!this.files.has(parent)) {
        this.files.set(parent, {
          content: '',
          updatedAt: now,
          isDirectory: true,
          size: 0,
        });
      }
    }

    this.files.set(norm, {
      content,
      updatedAt: now,
      isDirectory: false,
      size: new TextEncoder().encode(content).length,
    });

    this.emit(exists ? 'modify' : 'create', norm);
  }

  async createFile(relativePath: string, initialContent = ''): Promise<void> {
    await this.writeFile(relativePath, initialContent);
  }

  async deleteFile(relativePath: string): Promise<void> {
    const norm = this.normalize(relativePath);
    const node = this.files.get(norm);
    if (!node) {
      return;
    }

    this.files.delete(norm);
    const trashPath = `.trash/${norm}`;
    this.files.set(trashPath, {
      ...node,
      updatedAt: new Date().toISOString(),
    });

    this.emit('remove', norm);
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    const oldNorm = this.normalize(oldPath);
    const newNorm = this.normalize(newPath);
    const node = this.files.get(oldNorm);
    if (!node) {
      throw new Error(`File not found: ${oldPath}`);
    }

    this.files.delete(oldNorm);
    this.files.set(newNorm, {
      ...node,
      updatedAt: new Date().toISOString(),
    });

    this.emit('rename', newNorm);
  }

  async createFolder(relativePath: string): Promise<void> {
    const norm = this.normalize(relativePath);
    if (this.files.has(norm)) return;

    this.files.set(norm, {
      content: '',
      updatedAt: new Date().toISOString(),
      isDirectory: true,
      size: 0,
    });
    this.emit('create', norm);
  }

  async deleteFolder(relativePath: string): Promise<void> {
    const norm = this.normalize(relativePath);
    const prefix = `${norm}/`;
    const toDelete: string[] = [];

    for (const key of this.files.keys()) {
      if (key === norm || key.startsWith(prefix)) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      const node = this.files.get(key)!;
      this.files.delete(key);
      this.files.set(`.trash/${key}`, node);
    }

    this.emit('remove', norm);
  }

  async search(query: string): Promise<VaultSearchResult[]> {
    const q = query.toLowerCase();
    if (!q) return [];
    const results: VaultSearchResult[] = [];

    for (const [path, node] of this.files.entries()) {
      if (node.isDirectory || path.startsWith('.trash') || !path.endsWith('.md')) {
        continue;
      }

      const lines = node.content.split('\n');
      const matches: string[] = [];
      for (const line of lines) {
        if (line.toLowerCase().includes(q)) {
          matches.push(line.trim());
          if (matches.length >= 10) break;
        }
      }

      if (matches.length > 0) {
        results.push({ path, matches });
      }
    }

    return results;
  }

  async getBacklinks(targetName: string): Promise<string[]> {
    // Looks for [[targetName]] or [[targetName|alias]]
    // Clean targetName from .md extension if present
    const baseTarget = targetName.endsWith('.md')
      ? targetName.slice(0, -3)
      : targetName;
    const regex = new RegExp(`\\[\\[${escapeRegex(baseTarget)}(\\|[^\\]]+)?\\]\\]`, 'i');

    const backlinks: string[] = [];
    for (const [path, node] of this.files.entries()) {
      if (node.isDirectory || path.startsWith('.trash') || !path.endsWith('.md')) {
        continue;
      }
      if (regex.test(node.content)) {
        backlinks.push(path);
      }
    }

    return backlinks;
  }

  onWatchEvent(callback: (event: VaultWatchEvent) => void): () => void {
    this.watchCallbacks.add(callback);
    return () => {
      this.watchCallbacks.delete(callback);
    };
  }

  // Testing helpers
  dumpVirtualFiles(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [p, n] of this.files.entries()) {
      if (!n.isDirectory) {
        out[p] = n.content;
      }
    }
    return out;
  }

  clear(): void {
    this.files.clear();
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
