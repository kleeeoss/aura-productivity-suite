import type { IVaultDriver } from '../storage/IVaultDriver';
import { parseFrontmatter, serializeFrontmatter } from '../storage/frontmatter';

export interface LegacyNote {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  folderId?: string | null;
  updatedAt?: string;
  createdAt?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  [key: string]: unknown;
}

export interface LegacyFolder {
  id: string;
  name: string;
  color?: string;
}

export interface MigrationResult {
  migratedCount: number;
  collisionCount: number;
  migratedPaths: string[];
}

export function sanitizeFilename(title: string): string {
  const cleaned = title
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '');
  return cleaned || 'Untitled Note';
}

export async function resolveUniquePath(
  driver: IVaultDriver,
  folder: string,
  title: string,
  contentToSave: string
): Promise<{ path: string; isCollision: boolean; isExactDuplicate: boolean }> {
  const baseName = sanitizeFilename(title);
  const cleanFolder = folder.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  const folderPrefix = cleanFolder ? `${cleanFolder}/` : '';
  const initialPath = `${folderPrefix}${baseName}.md`;

  try {
    const existingContent = await driver.readFile(initialPath);
    if (existingContent.trim() === contentToSave.trim()) {
      return { path: initialPath, isCollision: false, isExactDuplicate: true };
    }
  } catch {
    // File does not exist, safe to use initialPath
    return { path: initialPath, isCollision: false, isExactDuplicate: false };
  }

  // File exists and content differs: append (AURA Migrated)
  let counter = 1;
  while (true) {
    const suffix = counter === 1 ? ' (AURA Migrated)' : ` (AURA Migrated ${counter})`;
    const candidatePath = `${folderPrefix}${baseName}${suffix}.md`;

    try {
      const existing = await driver.readFile(candidatePath);
      if (existing.trim() === contentToSave.trim()) {
        return { path: candidatePath, isCollision: true, isExactDuplicate: true };
      }
      counter++;
    } catch {
      // Free slot found
      return { path: candidatePath, isCollision: true, isExactDuplicate: false };
    }
  }
}

export async function migrateLegacyNotes(
  driver: IVaultDriver,
  options: {
    targetDir?: string;
    storageKey?: string;
    force?: boolean;
  } = {}
): Promise<MigrationResult> {
  const storageKey = options.storageKey || 'note-storage';
  const targetDir = options.targetDir ?? 'AURA Notes (Migrated)';

  if (typeof window === 'undefined' || !window.localStorage) {
    return { migratedCount: 0, collisionCount: 0, migratedPaths: [] };
  }

  if (!options.force && window.localStorage.getItem('aura_notes_migrated_v12') === 'true') {
    return { migratedCount: 0, collisionCount: 0, migratedPaths: [] };
  }

  const rawStorage = window.localStorage.getItem(storageKey);
  if (!rawStorage) {
    return { migratedCount: 0, collisionCount: 0, migratedPaths: [] };
  }

  let notes: LegacyNote[] = [];
  let folders: LegacyFolder[] = [];

  try {
    const parsed = JSON.parse(rawStorage);
    notes = parsed.state?.notes || parsed.notes || [];
    folders = parsed.state?.folders || parsed.folders || [];
  } catch (err) {
    console.error('Failed to parse legacy note-storage:', err);
    return { migratedCount: 0, collisionCount: 0, migratedPaths: [] };
  }

  if (notes.length === 0) {
    return { migratedCount: 0, collisionCount: 0, migratedPaths: [] };
  }

  const folderMap = new Map<string, string>();
  for (const f of folders) {
    folderMap.set(f.id, sanitizeFilename(f.name));
  }

  let migratedCount = 0;
  let collisionCount = 0;
  const migratedPaths: string[] = [];

  // Check if vault has existing files; if empty, we can write directly to root or targetDir
  const existingFiles = await driver.scanVault();
  const effectiveBaseDir = existingFiles.length === 0 ? '' : targetDir;

  for (const note of notes) {
    const folderName = note.folderId ? folderMap.get(note.folderId) : undefined;
    const subFolder = [effectiveBaseDir, folderName].filter(Boolean).join('/');

    if (subFolder) {
      await driver.createFolder(subFolder);
    }

    const now = new Date().toISOString();
    const frontmatter: Record<string, unknown> = {
      id: note.id,
      title: note.title || 'Untitled Note',
      tags: note.tags || [],
      created: note.createdAt || note.updatedAt || now,
      updated: note.updatedAt || now,
      pinned: !!note.isPinned,
      favorite: !!note.isFavorite,
    };

    // Preserve any custom keys from legacy note
    for (const [k, v] of Object.entries(note)) {
      if (
        ![
          'id',
          'title',
          'content',
          'tags',
          'folderId',
          'updatedAt',
          'createdAt',
          'isFavorite',
          'isPinned',
        ].includes(k)
      ) {
        frontmatter[k] = v;
      }
    }

    const fullMarkdown = serializeFrontmatter(frontmatter, note.content || '');
    const { path, isCollision, isExactDuplicate } = await resolveUniquePath(
      driver,
      subFolder,
      note.title || 'Untitled Note',
      fullMarkdown
    );

    if (!isExactDuplicate) {
      await driver.writeFile(path, fullMarkdown);
      migratedCount++;
      if (isCollision) {
        collisionCount++;
      }
    }
    migratedPaths.push(path);
  }

  window.localStorage.setItem('aura_notes_migrated_v12', 'true');
  return { migratedCount, collisionCount, migratedPaths };
}

export async function importMarkdownFile(
  driver: IVaultDriver,
  targetFolder: string,
  filename: string,
  rawContent: string
): Promise<string> {
  const { frontmatter, content } = parseFrontmatter(rawContent);
  const now = new Date().toISOString();

  const title =
    (frontmatter.title as string) ||
    filename.replace(/\.md$/i, '') ||
    'Untitled Import';

  const mergedFrontmatter: Record<string, unknown> = {
    id: frontmatter.id || crypto.randomUUID(),
    title,
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    created: frontmatter.created || now,
    updated: frontmatter.updated || now,
    pinned: !!frontmatter.pinned,
    favorite: !!frontmatter.favorite,
    ...frontmatter,
  };

  const finalizedContent = serializeFrontmatter(mergedFrontmatter, content);
  const { path } = await resolveUniquePath(
    driver,
    targetFolder,
    title,
    finalizedContent
  );

  await driver.writeFile(path, finalizedContent);
  return path;
}
