import React, { useState, useEffect, useMemo } from 'react';
import { GlassPanel } from '../components/GlassPanel';
import { useNoteStore } from '../store/useNoteStore';
import { Plus, Search, Trash2, Tag as TagIcon, FileText, FolderPlus, Folder as FolderIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useToast } from '../contexts/ToastContext';

const Notes = () => {
  const { notes, folders, activeNoteId, addNote, updateNote, deleteNote, setActiveNote, addFolder } = useNoteStore();
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [localContent, setLocalContent] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const { toast } = useToast();
  
  const activeNote = notes.find(n => n.id === activeNoteId);

  const wordCount = useMemo(() => localContent.trim().split(/\s+/).filter(Boolean).length, [localContent]);
  const readingTime = Math.ceil(wordCount / 200);

  useEffect(() => {
    if (activeNote) {
      setLocalContent(activeNote.content);
      setLocalTitle(activeNote.title);
    } else {
      setLocalContent('');
      setLocalTitle('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNoteId, activeNote?.content, activeNote?.title]);

  // Handle auto-save (debounced)
  useEffect(() => {
    if (activeNoteId && (localContent !== activeNote?.content || localTitle !== activeNote?.title)) {
      const timer = setTimeout(() => {
        updateNote(activeNoteId, { content: localContent, title: localTitle });
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localContent, localTitle, activeNoteId, updateNote]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeFolder) {
      result = result.filter(n => n.folderId === activeFolder);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    
    // Sort logic
    return result.sort((a, b) => {
      // Pinned notes always at top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then Favorites
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      // Then by updatedAt
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, activeFolder, searchQuery]);

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim(), '#6366f1');
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim() && activeNoteId) {
      const tag = e.currentTarget.value.trim().toLowerCase();
      if (activeNote && !activeNote.tags.includes(tag)) {
        updateNote(activeNoteId, { tags: [...activeNote.tags, tag] });
      }
      e.currentTarget.value = '';
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (activeNoteId && activeNote) {
      updateNote(activeNoteId, { tags: activeNote.tags.filter(t => t !== tagToRemove) });
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localContent.substring(start, end);
    const newText = localContent.substring(0, start) + prefix + selectedText + suffix + localContent.substring(end);
    
    setLocalContent(newText);
    
    // Focus and restore selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
      
      {/* Folders Sidebar */}
      <GlassPanel style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FolderIcon size={18} /> Folders</h3>
          <button className="glass-button" style={{ padding: '6px', border: 'none' }} onClick={() => setIsAddingFolder(true)}><FolderPlus size={16} /></button>
        </div>
        
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <button 
            className="glass-button" 
            style={{ justifyContent: 'flex-start', background: activeFolder === null ? 'var(--glass-hover)' : 'transparent', border: 'none' }}
            onClick={() => setActiveFolder(null)}
          >
            All Notes
          </button>
          {folders.map(folder => (
            <button 
              key={folder.id} 
              className="glass-button" 
              style={{ justifyContent: 'flex-start', background: activeFolder === folder.id ? 'var(--glass-hover)' : 'transparent', border: 'none' }}
              onClick={() => setActiveFolder(folder.id)}
            >
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: folder.color, marginRight: '8px' }} />
              {folder.name}
            </button>
          ))}
        </div>
      </GlassPanel>

      {/* Notes List */}
      <GlassPanel style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Notes</h2>
          <button className="glass-button primary" style={{ padding: '8px' }} onClick={() => { addNote('Untitled Note', activeFolder); toast('New note created', 'success'); }}><Plus size={20} /></button>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
          {filteredNotes.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          }).map(note => (
            <div 
              key={note.id} 
              className="glass-button" 
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: '12px', background: activeNoteId === note.id ? 'var(--glass-hover)' : '' }}
              onClick={() => setActiveNote(note.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {note.isPinned && <span title="Pinned" style={{ fontSize: '0.8rem' }}>📌</span>}
                  {note.title || 'Untitled'}
                </span>
                <button 
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); toast('Note deleted', 'info'); }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                {note.isFavorite && <span title="Favorite" style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>⭐</span>}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Editor */}
      <GlassPanel style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeNoteId && activeNote ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input 
                type="text" 
                className="glass-input" 
                style={{ flex: 1, fontSize: '2rem', fontWeight: 'bold', background: 'transparent', border: 'none', padding: 0 }}
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Note Title"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="glass-button" 
                  style={{ padding: '6px', opacity: activeNote.isPinned ? 1 : 0.5, background: activeNote.isPinned ? 'var(--glass-hover)' : 'transparent' }} 
                  onClick={() => updateNote(activeNoteId, { isPinned: !activeNote.isPinned })}
                  title={activeNote.isPinned ? "Unpin Note" : "Pin Note"}
                >
                  📌
                </button>
                <button 
                  className="glass-button" 
                  style={{ padding: '6px', opacity: activeNote.isFavorite ? 1 : 0.5, background: activeNote.isFavorite ? 'var(--glass-hover)' : 'transparent' }} 
                  onClick={() => updateNote(activeNoteId, { isFavorite: !activeNote.isFavorite })}
                  title={activeNote.isFavorite ? "Remove Favorite" : "Mark as Favorite"}
                >
                  ⭐
                </button>
              </div>
              <select 
                className="glass-input" 
                style={{ width: '150px' }} 
                value={activeNote.folderId || ''} 
                onChange={(e) => updateNote(activeNoteId, { folderId: e.target.value || null })}
              >
                <option value="">No Folder</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <TagIcon size={16} style={{ color: 'var(--text-secondary)' }} />
              {activeNote.tags.map(tag => (
                <span key={tag} style={{ background: 'var(--glass-hover)', padding: '4px 10px', borderRadius: '16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {tag}
                  <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }} onClick={() => handleRemoveTag(tag)}>×</button>
                </span>
              ))}
              <input 
                type="text" 
                className="glass-input" 
                style={{ width: '120px', padding: '4px 8px', borderRadius: '16px', fontSize: '0.8rem' }}
                placeholder="Add tag..."
                onKeyDown={handleAddTag}
              />
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <span>{wordCount} words</span>
                <span>{readingTime} min read</span>
                <span>Last edited: {new Date(activeNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', background: 'var(--glass-bg)', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('**', '**')} title="Bold"><strong>B</strong></button>
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('*', '*')} title="Italic"><em>I</em></button>
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('~~', '~~')} title="Strikethrough"><del>S</del></button>
              <div style={{ width: '1px', background: 'var(--glass-border)', margin: '0 4px' }} />
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('# ', '')} title="Heading 1">H1</button>
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('## ', '')} title="Heading 2">H2</button>
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('### ', '')} title="Heading 3">H3</button>
              <div style={{ width: '1px', background: 'var(--glass-border)', margin: '0 4px' }} />
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('- ', '')} title="Bullet List">•</button>
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('1. ', '')} title="Numbered List">1.</button>
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('> ', '')} title="Blockquote">"</button>
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('`', '`')} title="Inline Code">{'</>'}</button>
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('```\n', '\n```')} title="Code Block">{'[  ]'}</button>
              <div style={{ width: '1px', background: 'var(--glass-border)', margin: '0 4px' }} />
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('[', '](url)')} title="Link">🔗</button>
              <button className="glass-button" style={{ padding: '6px' }} onClick={() => insertMarkdown('![alt](', ')')} title="Image">🖼️</button>
            </div>

            <div style={{ display: 'flex', gap: '24px', flex: 1, height: '100%', minHeight: '400px' }}>
              <textarea
                id="markdown-textarea"
                className="glass-input"
                style={{ flex: 1, height: '100%', resize: 'none', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '16px', fontFamily: 'monospace', lineHeight: '1.6' }}
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                placeholder="Write your note here in Markdown..."
              />
              <div 
                className="markdown-preview"
                style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
              >
                {localContent.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {localContent}
                  </ReactMarkdown>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', opacity: 0.5 }}>
                    <FileText size={48} style={{ marginBottom: '16px' }} />
                    <p>Preview will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '16px' }}>
            <div style={{ background: 'var(--glass-bg)', padding: '32px', borderRadius: '50%', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
              <FileText size={64} style={{ color: 'var(--accent-primary)', opacity: 0.8 }} />
            </div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>No Note Selected</h3>
            <p>Select a note from the sidebar or create a new one to get started.</p>
            <button className="glass-button primary" onClick={() => addNote('Untitled Note', activeFolder)} style={{ marginTop: '8px' }}>
              <Plus size={18} /> Create New Note
            </button>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};

export default Notes;
