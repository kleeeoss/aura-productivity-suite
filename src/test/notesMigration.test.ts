import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryVaultDriver } from '../storage/MemoryVaultDriver';
import {
  sanitizeFilename,
  resolveUniquePath,
  migrateLegacyNotes,
  importMarkdownFile,
} from '../utils/notesMigration';
import { parseFrontmatter } from '../storage/frontmatter';

describe('Deterministic Notes Migration & Collision Prevention Engine', () => {
  let driver: MemoryVaultDriver;

  beforeEach(async () => {
    driver = new MemoryVaultDriver();
    await driver.init('/test/vault');
    window.localStorage.clear();
  });

  describe('sanitizeFilename', () => {
    it('cleans invalid OS filesystem characters', () => {
      expect(sanitizeFilename('Math: 101 / Intro * ? "test" <file> | doc')).toBe(
        'Math- 101 - Intro - - -test- -file- - doc'
      );
    });

    it('handles empty and whitespace-only titles safely', () => {
      expect(sanitizeFilename('')).toBe('Untitled Note');
      expect(sanitizeFilename('   ')).toBe('Untitled Note');
      expect(sanitizeFilename('...')).toBe('Untitled Note');
    });

    it('preserves valid unicode characters and spaces', () => {
      expect(sanitizeFilename('Deep Learning & Neural Networks')).toBe(
        'Deep Learning & Neural Networks'
      );
      expect(sanitizeFilename('Notes 2026-09-24')).toBe('Notes 2026-09-24');
    });
  });

  describe('resolveUniquePath & Collision Prevention', () => {
    it('returns clean path when no file collision exists', async () => {
      const { path, isCollision, isExactDuplicate } = await resolveUniquePath(
        driver,
        'College/ML',
        'CNN Notes',
        '# Content'
      );

      expect(path).toBe('College/ML/CNN Notes.md');
      expect(isCollision).toBe(false);
      expect(isExactDuplicate).toBe(false);
    });

    it('identifies exact duplicates without writing duplicate files', async () => {
      await driver.writeFile('Notes/Lecture1.md', '# Lecture 1 Exact Content');

      const { path, isCollision, isExactDuplicate } = await resolveUniquePath(
        driver,
        'Notes',
        'Lecture1',
        '# Lecture 1 Exact Content'
      );

      expect(path).toBe('Notes/Lecture1.md');
      expect(isCollision).toBe(false);
      expect(isExactDuplicate).toBe(true);
    });

    it('deterministically appends (AURA Migrated) on content collision without overwriting', async () => {
      await driver.writeFile('Notes/Lecture1.md', '# Existing Content on Disk');

      const result1 = await resolveUniquePath(
        driver,
        'Notes',
        'Lecture1',
        '# Different Migrated Content 1'
      );

      expect(result1.path).toBe('Notes/Lecture1 (AURA Migrated).md');
      expect(result1.isCollision).toBe(true);
      expect(result1.isExactDuplicate).toBe(false);

      // Write the first migrated file
      await driver.writeFile(result1.path, '# Different Migrated Content 1');

      // Second collision should increment suffix
      const result2 = await resolveUniquePath(
        driver,
        'Notes',
        'Lecture1',
        '# Different Migrated Content 2'
      );

      expect(result2.path).toBe('Notes/Lecture1 (AURA Migrated 2).md');
      expect(result2.isCollision).toBe(true);
      expect(result2.isExactDuplicate).toBe(false);
    });
  });

  describe('migrateLegacyNotes from localStorage', () => {
    it('migrates legacy v1.1.1 localStorage note-storage into physical markdown files', async () => {
      const legacyStorage = {
        state: {
          folders: [
            { id: 'f-1', name: 'Computer Science', color: '#6366f1' },
          ],
          notes: [
            {
              id: 'n-1',
              title: 'Convolutional Networks',
              content: '### Convolutions and Stride\nStride reduces dimension.',
              tags: ['deep-learning', 'cs'],
              folderId: 'f-1',
              updatedAt: '2026-09-24T10:00:00.000Z',
              isFavorite: true,
              isPinned: false,
              aliases: ['CNN', 'ConvNets'], // Custom Obsidian key
            },
            {
              id: 'n-2',
              title: 'Root Note',
              content: 'Standalone root note.',
              tags: [],
              folderId: null,
              updatedAt: '2026-09-24T11:00:00.000Z',
              isPinned: true,
            },
          ],
        },
      };

      window.localStorage.setItem('note-storage', JSON.stringify(legacyStorage));

      const result = await migrateLegacyNotes(driver);
      expect(result.migratedCount).toBe(2);
      expect(result.collisionCount).toBe(0);

      // Verify files in vault
      const files = await driver.scanVault();
      expect(files.some((f) => f.path.includes('Convolutional Networks.md'))).toBe(true);
      expect(files.some((f) => f.path.includes('Root Note.md'))).toBe(true);

      // Read migrated file and verify frontmatter & content
      const cnnPath = result.migratedPaths.find((p) => p.includes('Convolutional Networks.md'))!;
      const cnnRaw = await driver.readFile(cnnPath);
      const parsed = parseFrontmatter(cnnRaw);

      expect(parsed.frontmatter.title).toBe('Convolutional Networks');
      expect(parsed.frontmatter.tags).toEqual(['deep-learning', 'cs']);
      expect(parsed.frontmatter.favorite).toBe(true);
      expect(parsed.frontmatter.aliases).toEqual(['CNN', 'ConvNets']);
      expect(parsed.content.trim()).toContain('Stride reduces dimension.');

      // Invariant: Legacy localStorage is preserved intact as read-only safety backup
      expect(window.localStorage.getItem('note-storage')).not.toBeNull();
      expect(window.localStorage.getItem('aura_notes_migrated_v12')).toBe('true');
    });

    it('safely handles empty legacy storage without error', async () => {
      const result = await migrateLegacyNotes(driver);
      expect(result.migratedCount).toBe(0);
      expect(result.collisionCount).toBe(0);
    });

    it('does not re-migrate if aura_notes_migrated_v12 is already true unless force is specified', async () => {
      const legacyStorage = {
        state: {
          folders: [],
          notes: [{ id: 'n-test', title: 'Test Note', content: 'Content' }],
        },
      };
      window.localStorage.setItem('note-storage', JSON.stringify(legacyStorage));
      window.localStorage.setItem('aura_notes_migrated_v12', 'true');

      // Without force: should skip migration
      const skipResult = await migrateLegacyNotes(driver);
      expect(skipResult.migratedCount).toBe(0);
      expect(skipResult.migratedPaths).toEqual([]);

      // With force: true, should re-run migration
      const forceResult = await migrateLegacyNotes(driver, { force: true });
      expect(forceResult.migratedCount).toBe(1);
    });
  });

  describe('importMarkdownFile', () => {
    it('imports external markdown files and synthesizes frontmatter if absent', async () => {
      const externalMarkdown = '# External Syllabus\n1. Week 1\n2. Week 2';
      const path = await importMarkdownFile(
        driver,
        'University',
        'CourseSyllabus.md',
        externalMarkdown
      );

      expect(path).toBe('University/CourseSyllabus.md');
      const content = await driver.readFile(path);
      const parsed = parseFrontmatter(content);

      expect(parsed.frontmatter.title).toBe('CourseSyllabus');
      expect(parsed.frontmatter.id).toBeDefined();
      expect(parsed.content.trim()).toContain('1. Week 1');
    });

    it('retains existing frontmatter when importing an Obsidian note', async () => {
      const obsidianNote = `---
title: "Existing Title"
tags:
  - imported
aliases:
  - ExtRef
---
Content from external vault.`;

      const path = await importMarkdownFile(driver, '', 'Test.md', obsidianNote);
      const content = await driver.readFile(path);
      const parsed = parseFrontmatter(content);

      expect(parsed.frontmatter.title).toBe('Existing Title');
      expect(parsed.frontmatter.tags).toEqual(['imported']);
      expect(parsed.frontmatter.aliases).toEqual(['ExtRef']);
    });
  });
});
