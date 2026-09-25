import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryVaultDriver } from '../storage/MemoryVaultDriver';
import { TauriVaultDriver } from '../storage/TauriVaultDriver';
import { parseFrontmatter, serializeFrontmatter } from '../storage/frontmatter';
import { useNoteStore } from '../store/useNoteStore';

describe('VaultDriver Abstraction & Frontmatter Engine', () => {
  let memoryDriver: MemoryVaultDriver;
  let tauriDriver: TauriVaultDriver;

  beforeEach(async () => {
    memoryDriver = new MemoryVaultDriver();
    await memoryDriver.init('/test/vault');

    tauriDriver = new TauriVaultDriver();
    await tauriDriver.init('/test/tauri-vault');
  });

  describe('Frontmatter Parsing & Serialization', () => {
    it('parses standard YAML frontmatter accurately', () => {
      const markdown = `---
id: "note-123"
title: "CNN Architecture"
tags:
  - machine-learning
  - vision
created: "2026-09-24T12:00:00.000Z"
pinned: true
favorite: false
---
# Main Content
This is the note body.`;

      const { frontmatter, content } = parseFrontmatter(markdown);
      expect(frontmatter.id).toBe('note-123');
      expect(frontmatter.title).toBe('CNN Architecture');
      expect(frontmatter.tags).toEqual(['machine-learning', 'vision']);
      expect(frontmatter.pinned).toBe(true);
      expect(frontmatter.favorite).toBe(false);
      expect(content.trim()).toBe('# Main Content\nThis is the note body.');
    });

    it('preserves 100% of custom arbitrary Obsidian frontmatter keys', () => {
      const customMarkdown = `---
aliases: [Convolutional Networks, ConvNets]
author: "Yann LeCun"
difficulty: 4
cssclasses: [wide-table, dark-canvas]
status: "in-progress"
---
Lecture notes content`;

      const { frontmatter, content } = parseFrontmatter(customMarkdown);
      expect(frontmatter.aliases).toEqual(['Convolutional Networks', 'ConvNets']);
      expect(frontmatter.author).toBe('Yann LeCun');
      expect(frontmatter.difficulty).toBe(4);
      expect(frontmatter.cssclasses).toEqual(['wide-table', 'dark-canvas']);
      expect(frontmatter.status).toBe('in-progress');

      // Update title, re-serialize, and verify custom keys are preserved
      frontmatter.title = 'Updated Title';
      const serialized = serializeFrontmatter(frontmatter, content);

      const reparsed = parseFrontmatter(serialized);
      expect(reparsed.frontmatter.title).toBe('Updated Title');
      expect(reparsed.frontmatter.author).toBe('Yann LeCun');
      expect(reparsed.frontmatter.difficulty).toBe(4);
      expect(reparsed.frontmatter.aliases).toEqual(['Convolutional Networks', 'ConvNets']);
      expect(reparsed.content.trim()).toBe('Lecture notes content');
    });

    it('handles documents without frontmatter safely', () => {
      const rawText = '# Plain Markdown Document\nNo frontmatter here.';
      const { frontmatter, content } = parseFrontmatter(rawText);
      expect(frontmatter).toEqual({});
      expect(content).toBe(rawText);

      const serialized = serializeFrontmatter({}, content);
      expect(serialized).toBe(rawText);
    });

    it('strips leading UTF-8 BOM and parses frontmatter safely', () => {
      const bomMarkdown = '\uFEFF---\ntitle: "BOM Title"\n---\n# Content with BOM';
      const { frontmatter, content } = parseFrontmatter(bomMarkdown);
      expect(frontmatter.title).toBe('BOM Title');
      expect(content.trim()).toBe('# Content with BOM');
    });

    it('handles frontmatter blocks without trailing newline after closing dashes', () => {
      const markdown = '---\ntitle: "No Newline"\n---';
      const { frontmatter, content } = parseFrontmatter(markdown);
      expect(frontmatter.title).toBe('No Newline');
      expect(content).toBe('');
    });
  });

  describe('MemoryVaultDriver Operations', () => {
    it('creates, reads, and updates files with atomic guarantees', async () => {
      await memoryDriver.createFile('College/ML/CNN.md', '# CNN Notes');
      const content = await memoryDriver.readFile('College/ML/CNN.md');
      expect(content).toBe('# CNN Notes');

      await memoryDriver.writeFile('College/ML/CNN.md', '# CNN Notes Updated');
      const updated = await memoryDriver.readFile('College/ML/CNN.md');
      expect(updated).toBe('# CNN Notes Updated');
    });

    it('scans vault recursively and extracts frontmatter metadata', async () => {
      await memoryDriver.writeFile(
        'Note1.md',
        '---\ntitle: "First Note"\ntags: [tag1]\npinned: true\n---\nBody'
      );
      await memoryDriver.writeFile('Folder/Note2.md', '# Note 2');

      const files = await memoryDriver.scanVault();
      expect(files.some((f) => f.path === 'Note1.md')).toBe(true);
      expect(files.some((f) => f.path === 'Folder/Note2.md')).toBe(true);

      const note1 = files.find((f) => f.path === 'Note1.md')!;
      expect(note1.frontmatter?.title).toBe('First Note');
      expect(note1.frontmatter?.pinned).toBe(true);
    });

    it('moves deleted files safely into .trash/ instead of permanent deletion', async () => {
      await memoryDriver.writeFile('Important.md', 'Crucial information');
      await memoryDriver.deleteFile('Important.md');

      // Original path should not be found
      await expect(memoryDriver.readFile('Important.md')).rejects.toThrow();

      // File should exist safely inside .trash/
      const trashContent = await memoryDriver.readFile('.trash/Important.md');
      expect(trashContent).toBe('Crucial information');

      // ScanVault excludes .trash files from normal view
      const scan = await memoryDriver.scanVault();
      expect(scan.some((f) => f.path.startsWith('.trash'))).toBe(false);
    });

    it('renames files correctly', async () => {
      await memoryDriver.writeFile('Draft.md', 'Draft Content');
      await memoryDriver.renameFile('Draft.md', 'Published.md');

      await expect(memoryDriver.readFile('Draft.md')).rejects.toThrow();
      const content = await memoryDriver.readFile('Published.md');
      expect(content).toBe('Draft Content');
    });

    it('creates and deletes folders safely', async () => {
      await memoryDriver.createFolder('Projects/Aura');
      await memoryDriver.writeFile('Projects/Aura/Roadmap.md', 'Roadmap 1.2');

      const filesBefore = await memoryDriver.scanVault();
      expect(filesBefore.some((f) => f.path === 'Projects/Aura/Roadmap.md')).toBe(true);

      await memoryDriver.deleteFolder('Projects/Aura');
      const filesAfter = await memoryDriver.scanVault();
      expect(filesAfter.some((f) => f.path === 'Projects/Aura/Roadmap.md')).toBe(false);

      const trashed = await memoryDriver.readFile('.trash/Projects/Aura/Roadmap.md');
      expect(trashed).toBe('Roadmap 1.2');
    });

    it('searches across vault notes with case-insensitive matching', async () => {
      await memoryDriver.writeFile('ML.md', 'Convolutional layers extract feature maps.\nPooling reduces dimensions.');
      await memoryDriver.writeFile('Math.md', 'Linear algebra eigenvalues and eigenvectors.');

      const results = await memoryDriver.search('convolutional');
      expect(results.length).toBe(1);
      expect(results[0].path).toBe('ML.md');
      expect(results[0].matches[0]).toContain('Convolutional layers');

      const multiResults = await memoryDriver.search('dimension');
      expect(multiResults.length).toBe(1);
      expect(multiResults[0].matches[0]).toContain('Pooling reduces dimensions');
    });

    it('indexes and resolves backlinks accurately', async () => {
      await memoryDriver.writeFile('Source1.md', 'Reference to [[CNN Architecture]] in unit 3.');
      await memoryDriver.writeFile('Source2.md', 'Check out [[CNN Architecture|ConvNet Guide]] here.');
      await memoryDriver.writeFile('Unrelated.md', 'No links here.');

      const backlinks = await memoryDriver.getBacklinks('CNN Architecture');
      expect(backlinks).toContain('Source1.md');
      expect(backlinks).toContain('Source2.md');
      expect(backlinks).not.toContain('Unrelated.md');
    });

    it('emits watch events to registered callbacks', async () => {
      const events: string[] = [];
      const unlisten = memoryDriver.onWatchEvent((evt) => {
        events.push(`${evt.event}:${evt.path}`);
      });

      await memoryDriver.writeFile('EventTest.md', 'Content');
      await memoryDriver.renameFile('EventTest.md', 'RenamedTest.md');
      await memoryDriver.deleteFile('RenamedTest.md');

      expect(events).toContain('create:EventTest.md');
      expect(events).toContain('rename:RenamedTest.md');
      expect(events).toContain('remove:RenamedTest.md');

      unlisten();
      await memoryDriver.writeFile('Ignored.md', 'Content');
      expect(events).not.toContain('create:Ignored.md');
    });
  });

  describe('TauriVaultDriver Transparent Fallback', () => {
    it('transparently falls back to MemoryVaultDriver in headless test environments', async () => {
      expect(tauriDriver.name).toBe('TauriVaultDriver');
      await tauriDriver.writeFile('FallbackTest.md', 'Fallback content');
      const content = await tauriDriver.readFile('FallbackTest.md');
      expect(content).toBe('Fallback content');

      const scan = await tauriDriver.scanVault();
      expect(scan.some((f) => f.path === 'FallbackTest.md')).toBe(true);

      const backlinks = await tauriDriver.getBacklinks('Target');
      expect(Array.isArray(backlinks)).toBe(true);
    });
  });

  describe('useNoteStore Conflict Resolution & Auto-save Guard', () => {
    it('preserves unsaved edits when resolving conflict as save-copy', async () => {
      const testDriver = new MemoryVaultDriver();
      await testDriver.init('/test/vault-store');
      useNoteStore.getState().setDriver(testDriver);
      await useNoteStore.getState().initVault('/test/vault-store');

      const noteId = await useNoteStore.getState().addNote('Original Note', null, 'Initial Text');
      expect(useNoteStore.getState().activeNoteId).toBe(noteId);

      // User types local unsaved draft
      useNoteStore.getState().setLocalContent('Locally modified unsaved draft');
      expect(useNoteStore.getState().isDirty).toBe(true);

      // Simulate conflict and resolve as save-copy
      await useNoteStore.getState().resolveConflict('save-copy');

      // The vault should now have the copy containing the unsaved text
      const files = await testDriver.scanVault();
      const copyFile = files.find((f) => f.path.includes('Original Note (Local Copy)'));
      expect(copyFile).toBeDefined();

      const copyContent = await testDriver.readFile(copyFile!.path);
      const parsedCopy = parseFrontmatter(copyContent);
      expect(parsedCopy.content.trim()).toBe('Locally modified unsaved draft');
    });

    it('automatically saves dirty active note before switching to another note', async () => {
      const testDriver = new MemoryVaultDriver();
      await testDriver.init('/test/autosave-vault');
      useNoteStore.getState().setDriver(testDriver);
      await useNoteStore.getState().initVault('/test/autosave-vault');

      const id1 = await useNoteStore.getState().addNote('Note 1', null, 'Content 1');
      const id2 = await useNoteStore.getState().addNote('Note 2', null, 'Content 2');

      await useNoteStore.getState().setActiveNote(id1);
      useNoteStore.getState().setLocalContent('Content 1 with unsaved edits');
      expect(useNoteStore.getState().isDirty).toBe(true);

      // Switch to Note 2 without waiting for 500ms auto-save
      await useNoteStore.getState().setActiveNote(id2);

      // Verify Note 1 was automatically saved to disk before switching
      const note1OnDisk = await testDriver.readFile('Note 1.md');
      expect(parseFrontmatter(note1OnDisk).content.trim()).toBe('Content 1 with unsaved edits');
    });
  });
});
