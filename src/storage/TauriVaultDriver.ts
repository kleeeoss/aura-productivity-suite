import type {
  IVaultDriver,
  VaultFileInfo,
  VaultSearchResult,
  VaultWatchEvent,
} from './IVaultDriver';
import { MemoryVaultDriver } from './MemoryVaultDriver';

export class TauriVaultDriver implements IVaultDriver {
  readonly name = 'TauriVaultDriver';
  private vaultRoot = '';
  private memoryFallback: MemoryVaultDriver | null = null;
  private watchCallbacks = new Set<(event: VaultWatchEvent) => void>();
  private unlistenTauriEvent: (() => void) | null = null;

  constructor() {
    if (!this.isTauriAvailable()) {
      this.memoryFallback = new MemoryVaultDriver();
    }
  }

  private isTauriAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
  }

  private async getInvoke() {
    if (!this.isTauriAvailable()) {
      return null;
    }
    try {
      const core = await import('@tauri-apps/api/core');
      return core.invoke;
    } catch {
      return null;
    }
  }

  async init(vaultRoot: string): Promise<void> {
    this.vaultRoot = vaultRoot;
    if (this.memoryFallback) {
      await this.memoryFallback.init(vaultRoot);
      return;
    }

    const invoke = await this.getInvoke();
    if (!invoke) {
      this.memoryFallback = new MemoryVaultDriver();
      await this.memoryFallback.init(vaultRoot);
      return;
    }

    try {
      // Start background watcher on the vault root
      await invoke('vault_watch_start', { vaultRoot: this.vaultRoot });

      // Listen to vault:changed
      const eventModule = await import('@tauri-apps/api/event');
      const unlisten = await eventModule.listen<VaultWatchEvent>(
        'vault:changed',
        (event) => {
          for (const cb of this.watchCallbacks) {
            cb(event.payload);
          }
        }
      );
      this.unlistenTauriEvent = unlisten;
    } catch (err) {
      console.warn('Tauri vault watch initialization fallback to memory:', err);
      if (!this.memoryFallback) {
        this.memoryFallback = new MemoryVaultDriver();
        await this.memoryFallback.init(vaultRoot);
      }
    }
  }

  private async ensureFallback(): Promise<MemoryVaultDriver> {
    if (!this.memoryFallback) {
      this.memoryFallback = new MemoryVaultDriver();
      if (this.vaultRoot) {
        await this.memoryFallback.init(this.vaultRoot);
      }
    }
    return this.memoryFallback;
  }

  async scanVault(): Promise<VaultFileInfo[]> {
    if (this.memoryFallback) {
      return this.memoryFallback.scanVault();
    }
    const invoke = await this.getInvoke();
    if (!invoke) {
      const fallback = await this.ensureFallback();
      return fallback.scanVault();
    }

    try {
      return await invoke<VaultFileInfo[]>('vault_scan', {
        vaultRoot: this.vaultRoot,
      });
    } catch (err) {
      console.warn('vault_scan failed, falling back to memory:', err);
      const fallback = await this.ensureFallback();
      return fallback.scanVault();
    }
  }

  async readFile(relativePath: string): Promise<string> {
    if (this.memoryFallback) {
      return this.memoryFallback.readFile(relativePath);
    }
    const invoke = await this.getInvoke();
    if (!invoke) {
      const fallback = await this.ensureFallback();
      return fallback.readFile(relativePath);
    }

    return await invoke<string>('vault_read', {
      vaultRoot: this.vaultRoot,
      relativePath,
    });
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    if (this.memoryFallback) {
      return this.memoryFallback.writeFile(relativePath, content);
    }
    const invoke = await this.getInvoke();
    if (!invoke) {
      const fallback = await this.ensureFallback();
      return fallback.writeFile(relativePath, content);
    }

    await invoke('vault_write_atomic', {
      vaultRoot: this.vaultRoot,
      relativePath,
      content,
    });
  }

  async createFile(relativePath: string, initialContent = ''): Promise<void> {
    await this.writeFile(relativePath, initialContent);
  }

  async deleteFile(relativePath: string): Promise<void> {
    if (this.memoryFallback) {
      return this.memoryFallback.deleteFile(relativePath);
    }
    const invoke = await this.getInvoke();
    if (!invoke) {
      const fallback = await this.ensureFallback();
      return fallback.deleteFile(relativePath);
    }

    await invoke('vault_delete', {
      vaultRoot: this.vaultRoot,
      relativePath,
    });
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (this.memoryFallback) {
      return this.memoryFallback.renameFile(oldPath, newPath);
    }
    const invoke = await this.getInvoke();
    if (!invoke) {
      const fallback = await this.ensureFallback();
      return fallback.renameFile(oldPath, newPath);
    }

    await invoke('vault_rename', {
      vaultRoot: this.vaultRoot,
      oldPath,
      newPath,
    });
  }

  async createFolder(relativePath: string): Promise<void> {
    if (this.memoryFallback) {
      return this.memoryFallback.createFolder(relativePath);
    }
    const invoke = await this.getInvoke();
    if (!invoke) {
      const fallback = await this.ensureFallback();
      return fallback.createFolder(relativePath);
    }

    await invoke('vault_create_folder', {
      vaultRoot: this.vaultRoot,
      relativePath,
    });
  }

  async deleteFolder(relativePath: string): Promise<void> {
    if (this.memoryFallback) {
      return this.memoryFallback.deleteFolder(relativePath);
    }
    const invoke = await this.getInvoke();
    if (!invoke) {
      const fallback = await this.ensureFallback();
      return fallback.deleteFolder(relativePath);
    }

    await invoke('vault_delete_folder', {
      vaultRoot: this.vaultRoot,
      relativePath,
    });
  }

  async search(query: string): Promise<VaultSearchResult[]> {
    if (this.memoryFallback) {
      return this.memoryFallback.search(query);
    }
    const invoke = await this.getInvoke();
    if (!invoke) {
      const fallback = await this.ensureFallback();
      return fallback.search(query);
    }

    return await invoke<VaultSearchResult[]>('vault_search', {
      vaultRoot: this.vaultRoot,
      query,
    });
  }

  async getBacklinks(targetName: string): Promise<string[]> {
    if (this.memoryFallback) {
      return this.memoryFallback.getBacklinks(targetName);
    }
    // Search for [[targetName]] across notes
    const baseTarget = targetName.endsWith('.md')
      ? targetName.slice(0, -3)
      : targetName;
    const results = await this.search(`[[${baseTarget}`);
    return results.map((r) => r.path);
  }

  onWatchEvent(callback: (event: VaultWatchEvent) => void): () => void {
    if (this.memoryFallback) {
      return this.memoryFallback.onWatchEvent(callback);
    }
    this.watchCallbacks.add(callback);
    return () => {
      this.watchCallbacks.delete(callback);
    };
  }

  async destroy(): Promise<void> {
    if (this.unlistenTauriEvent) {
      this.unlistenTauriEvent();
      this.unlistenTauriEvent = null;
    }
    const invoke = await this.getInvoke();
    if (invoke) {
      try {
        await invoke('vault_watch_stop');
      } catch {
        // Ignored
      }
    }
  }
}
