import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { useNoteStore } from '../store/useNoteStore';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { CodeMirrorEditor } from '../components/CodeMirrorEditor';
import { MindMapCanvas } from '../extensions/mindmap';
import {
  Plus,
  Search,
  Trash2,
  Tag as TagIcon,
  FileText,
  FolderPlus,
  Folder as FolderIcon,
  BookOpen,
  Code,
  Columns,
  Upload,
  FolderOpen,
  Link as LinkIcon,
  Clock,
  AlertTriangle,
  Network,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Notes: React.FC = () => {
  const {
    vaultRoot,
    notes,
    folders,
    activeNoteId,
    activeNoteContent,
    activeNoteTitle,
    editorMode,
    isDirty,
    backlinks,
    isExternalConflict,
    initVault,
    setVaultRoot,
    setEditorMode,
    cycleEditorMode,
    setActiveNote,
    setLocalContent,
    setLocalTitle,
    saveActiveNote,
    updateActiveNoteLayout,
    addNote,
    updateNote,
    deleteNote,
    addFolder,
    deleteFolder,
    importFile,
    resolveConflict,
  } = useNoteStore();

  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false);
  const [workspaceInput, setWorkspaceInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const activeNote = notes.find((n) => n.id === activeNoteId);

  // Initialize vault on component mount
  useEffect(() => {
    initVault();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global Ctrl+E keyboard shortcut to cycle editor modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        cycleEditorMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleEditorMode]);

  // Debounced auto-save (500ms)
  useEffect(() => {
    if (!isDirty || !activeNoteId) return;

    const timer = setTimeout(() => {
      saveActiveNote();
    }, 500);

    return () => clearTimeout(timer);
  }, [activeNoteContent, activeNoteTitle, isDirty, activeNoteId, saveActiveNote]);

  // Telemetry
  const wordCount = useMemo(() => {
    const words = activeNoteContent.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [activeNoteContent]);

  const charCount = activeNoteContent.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Breadcrumbs (e.g. Vault / Folder / Subfolder / Note.md)
  const breadcrumbSegments = useMemo(() => {
    if (!activeNote) return [];
    const segments = [vaultRoot || 'Vault'];
    if (activeNote.path) {
      const parts = activeNote.path.split('/');
      segments.push(...parts);
    } else {
      segments.push(activeNote.title);
    }
    return segments;
  }, [activeNote, vaultRoot]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeFolder) {
      result = result.filter(
        (n) => n.folderId === activeFolder || n.path.startsWith(`${activeFolder}/`)
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [notes, activeFolder, searchQuery]);

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName.trim(), activeFolder || '');
    setNewFolderName('');
    setIsAddingFolder(false);
    toast('Folder created', 'success');
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim() && activeNoteId && activeNote) {
      const tag = e.currentTarget.value.trim().toLowerCase();
      if (!activeNote.tags.includes(tag)) {
        updateNote(activeNoteId, { tags: [...activeNote.tags, tag] });
      }
      e.currentTarget.value = '';
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (activeNoteId && activeNote) {
      updateNote(activeNoteId, { tags: activeNote.tags.filter((t) => t !== tagToRemove) });
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      await importFile(file.name, text, activeFolder || '');
    }
    toast(`Imported ${files.length} file(s)`, 'success');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSwitchWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceInput.trim()) return;
    await setVaultRoot(workspaceInput.trim());
    setIsSwitchingWorkspace(false);
    setWorkspaceInput('');
    toast('Workspace opened', 'success');
  };

  const handleNavigateWikiLink = async (targetName: string) => {
    const clean = targetName.toLowerCase().replace(/\.md$/, '');
    const matched = notes.find(
      (n) =>
        n.title.toLowerCase() === clean ||
        n.path.toLowerCase().endsWith(`${clean}.md`) ||
        n.id.toLowerCase() === clean
    );
    if (matched) {
      await setActiveNote(matched.id);
    } else {
      // Create new note with this title if it doesn't exist yet
      const newId = await addNote(targetName, activeFolder);
      toast(`Created linked note: ${targetName}`, 'info');
      await setActiveNote(newId);
    }
  };

  return (
    <div className="notes-container" style={{ display: 'flex', gap: '24px', height: '100%', minWidth: 0 }}>
      {/* Hidden file input for importing markdown files */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".md,.markdown,.txt"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />

      {/* Folders Sidebar */}
      <GlassPanel style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderIcon size={18} /> Vault Folders
          </h3>
          <button
            className="glass-button"
            style={{ padding: '6px', border: 'none' }}
            onClick={() => setIsAddingFolder(true)}
            title="Add Folder"
          >
            <FolderPlus size={16} />
          </button>
        </div>

        {/* Workspace indicator & switcher */}
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            background: 'var(--glass-hover)',
            padding: '6px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={vaultRoot}>
            📁 {vaultRoot}
          </span>
          <button
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0 }}
            onClick={() => {
              setWorkspaceInput(vaultRoot);
              setIsSwitchingWorkspace(!isSwitchingWorkspace);
            }}
            title="Open / Switch Markdown Workspace"
          >
            <FolderOpen size={14} />
          </button>
        </div>

        {isSwitchingWorkspace && (
          <form onSubmit={handleSwitchWorkspaceSubmit}>
            <input
              type="text"
              className="glass-input"
              style={{ fontSize: '0.82rem', padding: '6px 8px' }}
              placeholder="Vault Directory Path..."
              value={workspaceInput}
              onChange={(e) => setWorkspaceInput(e.target.value)}
              autoFocus
              onBlur={() => setIsSwitchingWorkspace(false)}
            />
          </form>
        )}

        {isAddingFolder && (
          <form onSubmit={handleAddFolder}>
            <input
              type="text"
              className="glass-input"
              placeholder="Folder Name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              onBlur={() => setIsAddingFolder(false)}
            />
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1, minWidth: 0 }}>
          <button
            className="glass-button"
            style={{
              justifyContent: 'flex-start',
              background: activeFolder === null ? 'var(--glass-hover)' : 'transparent',
              border: 'none',
              width: '100%',
            }}
            onClick={() => setActiveFolder(null)}
          >
            All Notes
          </button>
          {folders.map((folder) => (
            <div
              key={folder.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
            >
              <button
                className="glass-button"
                style={{
                  justifyContent: 'flex-start',
                  background: activeFolder === folder.id ? 'var(--glass-hover)' : 'transparent',
                  border: 'none',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => setActiveFolder(folder.id)}
                title={folder.path}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', marginRight: '8px', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
              </button>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
                onClick={() => {
                  deleteFolder(folder.id);
                  toast('Folder deleted', 'info');
                }}
                title="Delete Folder"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Import file button */}
        <button
          className="glass-button"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
          onClick={() => fileInputRef.current?.click()}
          title="Import Markdown files into current folder"
        >
          <Upload size={14} /> Import File
        </button>
      </GlassPanel>

      {/* Notes List */}
      <GlassPanel style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Notes</h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="glass-button"
              style={{ padding: '8px' }}
              onClick={async () => {
                const id = await addNote(
                  'Untitled Mind Map',
                  activeFolder,
                  '# Central Idea\n\n## Subtopic 1\n- Idea 1\n- Idea 2\n\n## Subtopic 2\n- Idea 3\n- Idea 4\n'
                );
                toast('New mind map created', 'success');
                await setActiveNote(id);
                setEditorMode('mindmap');
              }}
              title="Create Blank Mind Map"
            >
              <Network size={18} />
            </button>
            <button
              className="glass-button primary"
              style={{ padding: '8px' }}
              onClick={async () => {
                const id = await addNote('Untitled Note', activeFolder);
                toast('New note created', 'success');
                setActiveNote(id);
              }}
              title="Create New Note"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="glass-input"
            placeholder="Search notes..."
            style={{ paddingLeft: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, minWidth: 0 }}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="glass-button"
              style={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '4px',
                padding: '12px',
                background: activeNoteId === note.id ? 'var(--glass-hover)' : '',
                minWidth: 0,
                width: '100%',
              }}
              onClick={() => setActiveNote(note.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', minWidth: 0 }}>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {note.isPinned && <span title="Pinned" style={{ fontSize: '0.8rem' }}>📌</span>}
                  {note.title || 'Untitled'}
                </span>
                <button
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                    toast('Note moved to .trash', 'info');
                  }}
                  title="Move to trash"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                {note.isFavorite && <span title="Favorite" style={{ color: 'var(--warning)' }}>⭐</span>}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Editor & Reading Panel */}
      <GlassPanel
        className="notes-editor-panel"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0, height: '100%', overflow: 'hidden' }}
      >
        {activeNoteId && activeNote ? (
          <>
            {/* External Edit Conflict Banner */}
            {isExternalConflict && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid var(--danger)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                  <AlertTriangle size={18} />
                  <span><strong>Note modified externally!</strong> Unsaved changes exist.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="glass-button"
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    onClick={() => resolveConflict('keep-local')}
                  >
                    Keep Local
                  </button>
                  <button
                    className="glass-button"
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    onClick={() => resolveConflict('load-external')}
                  >
                    Load External
                  </button>
                  <button
                    className="glass-button primary"
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    onClick={() => resolveConflict('save-copy')}
                  >
                    Save Copy
                  </button>
                </div>
              </div>
            )}

            {/* Note Header: Breadcrumbs, Title & Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              {/* Breadcrumb Navigation Bar */}
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {breadcrumbSegments.map((seg, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span style={{ opacity: 0.5 }}>/</span>}
                    <span style={{ fontWeight: idx === breadcrumbSegments.length - 1 ? '600' : 'normal', color: idx === breadcrumbSegments.length - 1 ? 'var(--text-primary)' : 'inherit' }}>
                      {seg}
                    </span>
                  </React.Fragment>
                ))}
              </div>

              {/* Title & Top Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <input
                  type="text"
                  className="glass-input"
                  style={{
                    flex: 1,
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    minWidth: 0,
                  }}
                  value={activeNoteTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="Note Title"
                />

                {/* Tri-Mode Toggle Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    background: 'var(--glass-bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    padding: '2px',
                    gap: '2px',
                  }}
                >
                  <button
                    className="glass-button"
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      background: editorMode === 'reading' ? 'var(--glass-hover)' : 'transparent',
                    }}
                    onClick={() => setEditorMode('reading')}
                    title="Reading Mode (Ctrl+E)"
                  >
                    <BookOpen size={16} />
                  </button>
                  <button
                    className="glass-button"
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      background: editorMode === 'source' ? 'var(--glass-hover)' : 'transparent',
                    }}
                    onClick={() => setEditorMode('source')}
                    title="Source Mode (CodeMirror 6) (Ctrl+E)"
                  >
                    <Code size={16} />
                  </button>
                  <button
                    className="glass-button"
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      background: editorMode === 'split' ? 'var(--glass-hover)' : 'transparent',
                    }}
                    onClick={() => setEditorMode('split')}
                    title="Split Mode (Ctrl+E)"
                  >
                    <Columns size={16} />
                  </button>
                  <button
                    className="glass-button"
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      background: editorMode === 'mindmap' ? 'var(--glass-hover)' : 'transparent',
                      color: editorMode === 'mindmap' ? 'var(--accent-primary)' : 'inherit',
                    }}
                    onClick={() => setEditorMode('mindmap')}
                    title="Mind Map Extension View"
                  >
                    <Network size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className="glass-button"
                    style={{
                      padding: '6px 8px',
                      opacity: activeNote.isPinned ? 1 : 0.5,
                      background: activeNote.isPinned ? 'var(--glass-hover)' : 'transparent',
                    }}
                    onClick={() => updateNote(activeNoteId, { isPinned: !activeNote.isPinned })}
                    title={activeNote.isPinned ? 'Unpin Note' : 'Pin Note'}
                  >
                    📌
                  </button>
                  <button
                    className="glass-button"
                    style={{
                      padding: '6px 8px',
                      opacity: activeNote.isFavorite ? 1 : 0.5,
                      background: activeNote.isFavorite ? 'var(--glass-hover)' : 'transparent',
                    }}
                    onClick={() => updateNote(activeNoteId, { isFavorite: !activeNote.isFavorite })}
                    title={activeNote.isFavorite ? 'Remove Favorite' : 'Mark as Favorite'}
                  >
                    ⭐
                  </button>
                </div>

                <select
                  className="glass-input"
                  style={{ width: '140px', padding: '6px 10px', fontSize: '0.85rem' }}
                  value={activeNote.folderId || ''}
                  onChange={(e) => updateNote(activeNoteId, { folderId: e.target.value || null })}
                >
                  <option value="">Vault Root</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags & Metadata Row */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', minWidth: 0 }}>
              <TagIcon size={15} style={{ color: 'var(--text-secondary)' }} />
              {activeNote.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: 'var(--glass-hover)',
                    padding: '3px 8px',
                    borderRadius: '16px',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  #{tag}
                  <button
                    style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="glass-input"
                style={{ width: '110px', padding: '3px 8px', borderRadius: '16px', fontSize: '0.78rem' }}
                placeholder="Add tag..."
                onKeyDown={handleAddTag}
              />
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: '14px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
                <span>
                  <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  {readingTime} min read
                </span>
                <span>
                  <LinkIcon size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  {backlinks.length} backlink{backlinks.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Tri-Mode Editor Body */}
            <div className="editor-split-container" style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
              {editorMode === 'reading' && (
                <MarkdownRenderer
                  content={activeNoteContent}
                  vaultRoot={vaultRoot}
                  onNavigateWikiLink={handleNavigateWikiLink}
                  onContentChange={setLocalContent}
                  className="editor-pane"
                />
              )}

              {editorMode === 'source' && (
                <CodeMirrorEditor
                  key={activeNoteId}
                  value={activeNoteContent}
                  onChange={(val) => setLocalContent(val)}
                  placeholder="Write your note here in Markdown..."
                  className="editor-pane"
                />
              )}

              {editorMode === 'split' && (
                <>
                  <CodeMirrorEditor
                    key={activeNoteId}
                    value={activeNoteContent}
                    onChange={(val) => setLocalContent(val)}
                    placeholder="Write your note here in Markdown..."
                    className="editor-pane"
                  />
                  <MarkdownRenderer
                    content={activeNoteContent}
                    vaultRoot={vaultRoot}
                    onNavigateWikiLink={handleNavigateWikiLink}
                    onContentChange={setLocalContent}
                    className="editor-pane"
                  />
                </>
              )}

              {editorMode === 'mindmap' && (
                <MindMapCanvas
                  key={activeNoteId}
                  content={activeNoteContent}
                  noteTitle={activeNoteTitle}
                  frontmatter={activeNote.frontmatter}
                  onContentChange={setLocalContent}
                  onLayoutChange={(layout) => {
                    updateActiveNoteLayout(layout as unknown as Record<string, unknown>);
                  }}
                  onNavigateWikiLink={handleNavigateWikiLink}
                  className="editor-pane"
                />
              )}
            </div>

            {/* Backlinks Footer ("Linked Mentions") */}
            {backlinks.length > 0 && (
              <div
                style={{
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.82rem',
                }}
              >
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LinkIcon size={14} /> Linked Mentions ({backlinks.length}):
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {backlinks.map((linkPath) => {
                    const title = linkPath.split('/').pop()?.replace(/\.md$/, '') || linkPath;
                    return (
                      <button
                        key={linkPath}
                        className="glass-button"
                        style={{ padding: '3px 8px', fontSize: '0.78rem' }}
                        onClick={() => handleNavigateWikiLink(title)}
                      >
                        [[{title}]]
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-secondary)',
              gap: '16px',
            }}
          >
            <div style={{ background: 'var(--glass-bg)', padding: '32px', borderRadius: '50%', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
              <FileText size={64} style={{ color: 'var(--accent-primary)', opacity: 0.8 }} />
            </div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>No Note Selected</h3>
            <p>Select a note from the sidebar or create a new one to begin editing.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                className="glass-button primary"
                onClick={async () => {
                  const id = await addNote('Untitled Note', activeFolder);
                  setActiveNote(id);
                }}
              >
                <Plus size={18} /> Create New Note
              </button>
              <button
                className="glass-button"
                onClick={async () => {
                  const id = await addNote(
                    'Untitled Mind Map',
                    activeFolder,
                    '# Central Idea\n\n## Subtopic 1\n- Idea 1\n- Idea 2\n\n## Subtopic 2\n- Idea 3\n- Idea 4\n'
                  );
                  toast('New mind map created', 'success');
                  await setActiveNote(id);
                  setEditorMode('mindmap');
                }}
              >
                <Network size={18} /> Create Blank Mind Map
              </button>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};

export default Notes;
